// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS ROUTER
// Event tracking and dashboard metrics
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables, AnalyticsEvent } from '../types';
import { trackEvent } from '../lib/analytics';
import { requireAdmin, requireAuth } from '../lib/auth';
import { validate } from '../lib/validation';
import { throttle } from '../lib/ratelimit';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

export const ReaderAnalyticsEventSchema = z.object({
    type: z.enum(['page_view', 'briefing_open', 'article_read', 'article_share', 'audio_start', 'audio_complete', 'search', 'click']),
    article_id: z.string().uuid().optional(),
    resource_id: z.string().trim().min(1).max(200).optional(),
    path: z.string().trim().startsWith('/').max(300).optional(),
    search_query: z.string().trim().max(300).optional(),
    duration_seconds: z.number().finite().min(0).max(3600).optional(),
    scroll_depth: z.number().finite().min(0).max(100).optional(),
});

async function sha256(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function readerIdentity(c: {
    req: { header(name: string): string | undefined };
}) {
    const sessionId = c.req.header('X-Session-ID');
    if (!sessionId || sessionId.length < 8 || sessionId.length > 200) return null;
    const ipAddress = (c.req.header('CF-Connecting-IP') || 'unknown').slice(0, 64);
    const userAgent = (c.req.header('User-Agent') || 'unknown').trim().toLowerCase().slice(0, 1000);
    return {
        sessionHash: await sha256(sessionId),
        ipAddress,
        userAgentFingerprint: await sha256(userAgent),
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /analytics/events - Track user events (public)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/events', validate('json', ReaderAnalyticsEventSchema), async (c) => {
    const limited = await throttle(c, 'reader-event');
    if (limited) return limited;
    const identity = await readerIdentity(c);
    if (!identity) return c.json({ error: 'session_required', message: 'A valid reader session is required' }, 400);
    const event = (c.req as any).valid('json') as AnalyticsEvent;
    c.executionCtx.waitUntil(trackEvent(c.env, event, identity));
    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /analytics/events/batch - Batch event tracking
// ───────────────────────────────────────────────────────────────────────────────
router.post('/events/batch', validate('json', z.object({
    events: z.array(ReaderAnalyticsEventSchema).min(1).max(100),
})), async (c) => {
    const limited = await throttle(c, 'reader-event-batch');
    if (limited) return limited;
    const identity = await readerIdentity(c);
    if (!identity) return c.json({ error: 'session_required', message: 'A valid reader session is required' }, 400);
    const { events } = (c.req as any).valid('json') as { events: AnalyticsEvent[] };
    c.executionCtx.waitUntil(Promise.all(events.map(event => trackEvent(c.env, event, identity))));
    return c.json({ success: true, count: events.length });
});

router.get('/audience', requireAdmin, async (c) => {
    const [activity, returning, trend, subscribers, saved] = await Promise.all([
        c.env.DB.prepare(`
            SELECT
                COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-30 days') THEN session_hash END) AS monthly_active_readers,
                COUNT(DISTINCT CASE WHEN created_at >= datetime('now', '-7 days') THEN session_hash END) AS weekly_active_readers,
                SUM(CASE WHEN event_type = 'page_view' AND created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS page_views_30d,
                SUM(CASE WHEN event_type = 'briefing_open' AND created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS briefing_opens_30d,
                SUM(CASE WHEN event_type = 'article_read' AND created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS article_reads_30d,
                SUM(CASE WHEN event_type = 'article_read' AND progress_pct >= 75 AND created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS high_progress_reads_30d,
                SUM(CASE WHEN event_type = 'audio_start' AND created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS audio_starts_30d,
                SUM(CASE WHEN event_type = 'audio_complete' AND created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS audio_completions_30d
            FROM reader_engagement_events
        `).first<Record<string, number>>(),
        c.env.DB.prepare(`
            SELECT COUNT(*) AS returning_readers_30d
            FROM (
                SELECT session_hash
                FROM reader_engagement_events
                WHERE created_at >= datetime('now', '-30 days')
                GROUP BY session_hash
                HAVING COUNT(DISTINCT date(created_at)) >= 2
            )
        `).first<{ returning_readers_30d: number }>(),
        c.env.DB.prepare(`
            SELECT date(created_at) AS date,
                   COUNT(DISTINCT session_hash) AS active_readers,
                   SUM(CASE WHEN event_type = 'briefing_open' THEN 1 ELSE 0 END) AS briefing_opens,
                   SUM(CASE WHEN event_type = 'article_read' THEN 1 ELSE 0 END) AS article_reads,
                   SUM(CASE WHEN event_type = 'audio_complete' THEN 1 ELSE 0 END) AS audio_completions
            FROM reader_engagement_events
            WHERE created_at >= datetime('now', '-30 days')
            GROUP BY date(created_at)
            ORDER BY date ASC
        `).all(),
        c.env.DB.prepare(`
            SELECT
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS added_30d
            FROM digest_subscriptions
        `).first<{ active: number; added_30d: number }>(),
        c.env.DB.prepare(`
            SELECT COUNT(*) AS saves_30d, COUNT(DISTINCT session_id) AS saving_readers_30d
            FROM bookmarks WHERE created_at >= datetime('now', '-30 days')
        `).first<{ saves_30d: number; saving_readers_30d: number }>(),
    ]);

    const metric = (key: string) => Number(activity?.[key] || 0);
    const monthly = metric('monthly_active_readers');
    const reads = metric('article_reads_30d');
    const audioStarts = metric('audio_starts_30d');
    const returningReaders = Number(returning?.returning_readers_30d || 0);

    return c.json({
        period: '30d',
        updated_at: new Date().toISOString(),
        audience: {
            monthly_active_readers: monthly,
            weekly_active_readers: metric('weekly_active_readers'),
            returning_readers_30d: returningReaders,
            returning_reader_rate_pct: monthly ? Math.round(returningReaders / monthly * 1000) / 10 : 0,
            page_views_30d: metric('page_views_30d'),
        },
        habits: {
            briefing_opens_30d: metric('briefing_opens_30d'),
            article_reads_30d: reads,
            high_progress_reads_30d: metric('high_progress_reads_30d'),
            high_progress_rate_pct: reads ? Math.round(metric('high_progress_reads_30d') / reads * 1000) / 10 : 0,
            audio_starts_30d: audioStarts,
            audio_completions_30d: metric('audio_completions_30d'),
            audio_completion_rate_pct: audioStarts ? Math.round(metric('audio_completions_30d') / audioStarts * 1000) / 10 : 0,
            saves_30d: Number(saved?.saves_30d || 0),
            saving_readers_30d: Number(saved?.saving_readers_30d || 0),
        },
        distribution: {
            active_newsletter_subscribers: Number(subscribers?.active || 0),
            newsletter_subscribers_added_30d: Number(subscribers?.added_30d || 0),
            email_open_rate_pct: null,
            email_open_rate_note: 'Not measurable until verified email delivery and open tracking are active.',
        },
        daily: trend.results || [],
        definitions: {
            active_reader: 'Distinct hashed session with at least one recorded first-party event in the period.',
            returning_reader: 'Distinct hashed session recorded on at least two separate UTC dates in 30 days.',
            high_progress_read: 'Article read event with at least 75% maximum observed scroll depth.',
            audio_completion: 'Narration playback that reached the media ended event.',
            retention: 'Raw IP addresses and one-way user-agent fingerprints are retained with events for no more than 90 days.',
        },
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /analytics/live/:metric - Live counter via Durable Object
// ───────────────────────────────────────────────────────────────────────────────
router.get('/live/:metric', async (c) => {
    const metric = c.req.param('metric');
    const validMetrics = ['visitors', 'article_reads', 'searches'];

    if (!validMetrics.includes(metric)) {
        return c.json({ error: 'bad_request', message: 'Invalid metric' }, 400);
    }

    const id = c.env.LIVE_COUNTER.idFromName(metric);
    const counter = c.env.LIVE_COUNTER.get(id);

    const response = await counter.fetch(new Request('https://internal/get'));
    const data = await response.json();

    return c.json(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /analytics/insight - "Morning Report" (Why are numbers moving?)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/insight', requireAdmin, async (c) => {
    // 1. Get Traffic Overview (Last 24h)
    const [traffic, topArticles] = await Promise.all([
        c.env.DB.prepare(`
            SELECT COUNT(*) as views, COUNT(DISTINCT session_hash) as visitors
            FROM reader_engagement_events
            WHERE event_type = 'page_view' AND created_at > datetime('now', '-24 hours')
        `).first(),

        c.env.DB.prepare(`
            SELECT a.title, a.summary, COUNT(*) as views
            FROM articles a
            JOIN reader_engagement_events e ON e.resource_id = a.id
            WHERE e.created_at > datetime('now', '-24 hours')
              AND e.event_type IN ('article_read', 'page_view')
            GROUP BY a.id
            ORDER BY views DESC
            LIMIT 8
        `).all()
    ]);

    const observedViews = Number((traffic as Record<string, unknown>)?.views || 0);
    const observedVisitors = Number((traffic as Record<string, unknown>)?.visitors || 0);
    const insight = observedViews
        ? `${observedViews} page views from ${observedVisitors} distinct hashed reader sessions were recorded in the last 24 hours. This is observed product activity, not evidence of acquisition source, causation, retention or revenue.`
        : 'No first-party page views were recorded in the last 24 hours.';

    return c.json({
        period: '24h',
        traffic: traffic,
        top_drivers: topArticles.results,
        audience_summary: insight,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /analytics/dashboard - Admin dashboard metrics (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', requireAdmin, async (c) => {
    const { period = '7d' } = c.req.query();

    // Cache dashboard data for 2 minutes - doesn't need real-time updates
    const dashboardData = await getCached(
        c.env,
        CACHE_KEYS.analyticsDashboard(period),
        async () => {
            // Calculate date range
            const periodDays = period === '30d' ? 30 : period === '24h' ? 1 : 7;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - periodDays);
            const startDateStr = startDate.toISOString().split('T')[0];

            // Get overview stats
            const [
                totalArticles,
                publishedArticles,
                totalViews,
                recentArticles,
                topCountries,
                topSectors,
                engagementTrend,
            ] = await Promise.all([
                c.env.DB.prepare('SELECT COUNT(*) as total FROM articles').first<{ total: number }>(),
                c.env.DB.prepare("SELECT COUNT(*) as total FROM articles WHERE status = 'published'").first<{ total: number }>(),
                c.env.DB.prepare('SELECT SUM(view_count) as total FROM articles').first<{ total: number }>(),
                c.env.DB.prepare(`
                    SELECT id, slug, title, status, view_count, published_at, created_at
                    FROM articles
                    ORDER BY created_at DESC
                    LIMIT 10
                `).all(),
                c.env.DB.prepare(`
                    SELECT c.code, c.name, c.flag_emoji, COUNT(a.id) as article_count, SUM(a.view_count) as total_views
                    FROM countries c
                    LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
                    GROUP BY c.code
                    ORDER BY total_views DESC
                    LIMIT 10
                `).all(),
                c.env.DB.prepare(`
                    SELECT s.id, s.name, s.icon, COUNT(a.id) as article_count, SUM(a.view_count) as total_views
                    FROM sectors s
                    LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
                    GROUP BY s.id
                    ORDER BY total_views DESC
                `).all(),
                c.env.DB.prepare(`
                    SELECT 
                        DATE(published_at) as date,
                        COUNT(*) as articles,
                        SUM(view_count) as views
                    FROM articles
                    WHERE published_at >= ? AND status = 'published'
                    GROUP BY date
                    ORDER BY date ASC
                `).bind(startDateStr).all(),
            ]);

            return {
                overview: {
                    total_articles: totalArticles?.total || 0,
                    published_articles: publishedArticles?.total || 0,
                    total_views: totalViews?.total || 0,
                    period,
                },
                recent_articles: recentArticles.results || [],
                top_countries: topCountries.results || [],
                top_sectors: topSectors.results || [],
                engagement_trend: engagementTrend.results || [],
            };
        },
        { ttl: CACHE_TTL.DYNAMIC } // 2 minutes
    );

    return c.json(dashboardData);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /analytics/content-gaps - Identify narrative gaps (requires auth)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/content-gaps', requireAuth, async (c) => {
    // Find countries with low coverage
    const lowCoverageCountries = await c.env.DB.prepare(`
    SELECT 
      c.code, c.name, c.region, c.flag_emoji,
      COUNT(a.id) as article_count,
      COALESCE(SUM(a.view_count), 0) as total_views
    FROM countries c
    LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
    GROUP BY c.code
    HAVING article_count < 5
    ORDER BY article_count ASC, c.name ASC
  `).all();

    // Find sectors with low coverage per region
    const lowCoverageSectors = await c.env.DB.prepare(`
    SELECT 
      c.region,
      s.id as sector_id, s.name as sector_name,
      COUNT(a.id) as article_count
    FROM countries c
    CROSS JOIN sectors s
    LEFT JOIN articles a ON a.country_code = c.code AND a.sector_id = s.id AND a.status = 'published'
    GROUP BY c.region, s.id
    HAVING article_count < 3
    ORDER BY c.region, article_count ASC
  `).all();

    // Calculate overall coverage score
    const coverageStats = await c.env.DB.prepare(`
    SELECT 
      (SELECT COUNT(DISTINCT country_code) FROM articles WHERE status = 'published') as covered_countries,
      (SELECT COUNT(*) FROM countries) as total_countries,
      (SELECT COUNT(DISTINCT sector_id) FROM articles WHERE status = 'published') as covered_sectors,
      (SELECT COUNT(*) FROM sectors) as total_sectors
  `).first();

    return c.json({
        narrative_gaps: {
            countries_needing_content: lowCoverageCountries.results || [],
            sectors_needing_content: lowCoverageSectors.results || [],
        },
        coverage: coverageStats,
    });

    // Strategic Content Advice
    const advice = await getCached(
        c.env,
        CACHE_KEYS.analyticsContentStrategy,
        async () => {
            const gapContext = (lowCoverageCountries.results as any[]).slice(0, 3).map(c => c.name).join(', ');
            if (!gapContext) return "Coverage is balanced.";

            try {
                const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: We have low coverage in: ${gapContext}. Suggest 3 specific article titles to boost engagement in these regions.`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 200, temperature: 0.7 });
                return aiResponse?.trim();
            } catch { return "Focus on underserved regions."; }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    return c.json({
        narrative_gaps: {
            countries_needing_content: lowCoverageCountries.results || [],
            sectors_needing_content: lowCoverageSectors.results || [],
        },
        coverage: coverageStats,
        ai_strategy_advice: advice
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /analytics/intelligence - 3D Visualization Data Feed ("The Brain")
// Returns: Country Heat, Sentiment, Global Pulse for live 3D rendering
// ───────────────────────────────────────────────────────────────────────────────
router.get('/intelligence', async (c) => {
    const data = await getCached(
        c.env,
        'intelligence-feed',
        async () => {
            // 1. Articles per country (last 7 days) - for Map Pillar Height
            const countryHeat = await c.env.DB.prepare(`
                SELECT 
                    country_code,
                    COUNT(*) as article_count,
                    AVG(ai_sentiment_score) as avg_sentiment,
                    MAX(published_at) as last_article_at
                FROM articles
                WHERE status = 'published' 
                  AND published_at > datetime('now', '-7 days')
                  AND country_code IS NOT NULL
                GROUP BY country_code
            `).all();

            // 2. Global Pulse - articles per hour (last 24h) - for GoldenPulse speed
            const pulseData = await c.env.DB.prepare(`
                SELECT COUNT(*) as article_count
                FROM articles
                WHERE status = 'published' 
                  AND published_at > datetime('now', '-24 hours')
            `).first() as Record<string, any>;

            const articlesLast24h = pulseData?.article_count || 0;
            const articlesPerHour = articlesLast24h / 24;

            // 3. Sector Distribution (for potential future use)
            const sectorDist = await c.env.DB.prepare(`
                SELECT 
                    sector_id,
                    COUNT(*) as count,
                    AVG(ai_sentiment_score) as avg_sentiment
                FROM articles
                WHERE status = 'published' 
                  AND published_at > datetime('now', '-7 days')
                  AND sector_id IS NOT NULL
                GROUP BY sector_id
            `).all();

            // 4. Overall Sentiment Trend
            const sentimentTrend = await c.env.DB.prepare(`
                SELECT 
                    DATE(published_at) as date,
                    AVG(ai_sentiment_score) as avg_sentiment,
                    COUNT(*) as volume
                FROM articles
                WHERE status = 'published' 
                  AND published_at > datetime('now', '-7 days')
                GROUP BY date
                ORDER BY date ASC
            `).all();

            // Normalize country heat to 0-1 scale for 3D rendering
            const maxCount = Math.max(...(countryHeat.results as any[]).map(c => c.article_count), 1);
            const normalizedCountries = (countryHeat.results as any[]).map(country => ({
                code: country.country_code,
                heat: country.article_count / maxCount,
                sentiment: country.avg_sentiment || 0.5,
                volume: country.article_count,
                last_activity: country.last_article_at,
            }));

            return {
                countries: normalizedCountries,
                sectors: sectorDist.results || [],
                global_pulse: {
                    articles_24h: articlesLast24h,
                    rate_per_hour: parseFloat(articlesPerHour.toFixed(2)),
                    // Intensity: 0-1 scale, where 24+ articles/day = 1.0
                    intensity: Math.min(1, articlesLast24h / 24),
                },
                sentiment_trend: sentimentTrend.results || [],
                generated_at: new Date().toISOString(),
            };
        },
        { ttl: 60 } // Cache for 1 minute
    );

    return c.json(data);
});

export { router as analyticsRouter };
