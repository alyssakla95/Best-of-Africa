// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS ROUTER
// Event tracking and dashboard metrics
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, AnalyticsEvent } from '../types';
import { trackEvent } from '../lib/analytics';
import { requireAuth } from '../lib/auth';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// POST /analytics/events - Track user events (public)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/events', async (c) => {
    try {
        const event = await c.req.json<AnalyticsEvent>();

        // Validate event type
        const validTypes = ['page_view', 'article_read', 'article_share', 'search', 'click'];
        if (!validTypes.includes(event.type)) {
            return c.json({ error: 'bad_request', message: 'Invalid event type' }, 400);
        }

        // Track asynchronously
        c.executionCtx.waitUntil(trackEvent(c.env, event));

        return c.json({ success: true });
    } catch {
        return c.json({ error: 'bad_request', message: 'Invalid JSON body' }, 400);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /analytics/events/batch - Batch event tracking
// ───────────────────────────────────────────────────────────────────────────────
router.post('/events/batch', async (c) => {
    try {
        const { events } = await c.req.json<{ events: AnalyticsEvent[] }>();

        if (!Array.isArray(events) || events.length === 0) {
            return c.json({ error: 'bad_request', message: 'Events array required' }, 400);
        }

        if (events.length > 100) {
            return c.json({ error: 'bad_request', message: 'Max 100 events per batch' }, 400);
        }

        // Track all events asynchronously
        c.executionCtx.waitUntil(
            Promise.all(events.map(event => trackEvent(c.env, event)))
        );

        return c.json({ success: true, count: events.length });
    } catch {
        return c.json({ error: 'bad_request', message: 'Invalid JSON body' }, 400);
    }
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
router.get('/insight', requireAuth, async (c) => {
    // 1. Get Traffic Overview (Last 24h)
    const [traffic, topArticles] = await Promise.all([
        c.env.DB.prepare(`
            SELECT SUM(view_count) as views, COUNT(DISTINCT session_id) as visitors 
            FROM analytics_events 
            WHERE type = 'page_view' AND created_at > datetime('now', '-24 hours')
        `).first(),

        c.env.DB.prepare(`
            SELECT a.title, a.summary, SUM(e.view_count) as views
            FROM articles a
            JOIN analytics_events e ON e.resource_id = a.id
            WHERE e.created_at > datetime('now', '-24 hours')
            GROUP BY a.id
            ORDER BY views DESC
            LIMIT 8
        `).all()
    ]);

    // 2. Generate Explanation
    let insight = "No evidence-based audience briefing is currently available.";
    const topContext = (topArticles.results as any[]).map((article, index) =>
        `[${index + 1}] ${article.title}\nObserved page views: ${article.views || 0}\nArticle summary: ${(article.summary || '').slice(0, 900)}`
    ).join('\n---\n');

    try {
        const prompt = `System: You are BOA-Story's audience analyst. Explain only the observed 24-hour platform activity. Do not claim causation from page-view counts, do not call traffic stable without a comparison period, and clearly separate observations from hypotheses.\nUser: Total observed views: ${(traffic as Record<string, any>).views || 0}. Distinct visitors: ${(traffic as Record<string, any>).visitors || 0}.\n\nTop records:\n${topContext || 'No article-level traffic records.'}`;
        const response = await callConfiguredAI(c.env, { prompt, max_tokens: 5000, temperature: 0.2, response_profile: 'decision-brief' });
        insight = response?.trim() || insight;
    } catch (e) { /* Ignore */ }

    return c.json({
        period: '24h',
        traffic: traffic,
        top_drivers: topArticles.results,
        ai_narrative: insight
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /analytics/dashboard - Admin dashboard metrics (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, async (c) => {
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
