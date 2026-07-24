// ═══════════════════════════════════════════════════════════════════════════════
// MARKET INTELLIGENCE ROUTER
// Premium intelligence reports and sector analysis
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, MarketIntelligence } from '../../types';
import { requireApiKey, rateLimit } from '../../lib/auth';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../../lib/cache';
import { callConfiguredAI } from '../../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply API key auth to premium endpoints
export { router as sectorsRouter };

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sectors - All sector overviews (public)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sectors', async (c) => {
    const sectors = await c.env.DB.prepare(`
        SELECT s.*, 
               COUNT(a.id) as article_count,
               SUM(a.view_count) as total_views,
               AVG(a.engagement_score) as avg_engagement
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
        GROUP BY s.id
        ORDER BY total_views DESC
    `).all();

    return c.json({
        data: (sectors.results || []).map((s: any) => ({
            ...s,
            trend: s.article_count > 10 ? 'active' : 'emerging',
        }))
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id - Sector intelligence overview (public)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id', async (c) => {
    const sectorId = c.req.param('id');

    const sector = await c.env.DB.prepare(
        'SELECT * FROM sectors WHERE id = ?'
    ).bind(sectorId).first();

    if (!sector) {
        return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
    }

    const [
        countryBreakdown,
        regionBreakdown,
        recentArticles,
        topPerformers,
    ] = await Promise.all([
        c.env.DB.prepare(`
            SELECT c.code, c.name, c.flag_emoji, COUNT(a.id) as count
            FROM countries c
            JOIN articles a ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            GROUP BY c.code
            ORDER BY count DESC
            LIMIT 10
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT c.region, COUNT(a.id) as count, SUM(a.view_count) as views
            FROM countries c
            JOIN articles a ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            GROUP BY c.region
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.summary, a.country_code,
                   c.name as country_name, a.published_at
            FROM articles a
            JOIN countries c ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT 5
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.engagement_score, a.country_code
            FROM articles a
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
            LIMIT 5
        `).bind(sectorId).all(),
    ]);

    const headlines = (recentArticles.results as Array<{ title: string }> || []).map(row => row.title).join('; ');
    const sectorName = String((sector as Record<string, unknown>).name || 'This sector');
    const evidenceFallback = headlines
        ? `Recent BOA reporting for ${sectorName} includes: ${headlines}. Open the linked records for dates, actors, mechanisms and source limitations.`
        : `The ${sectorName} record is currently grounded in the country and regional coverage totals shown below.`;
    const outlookKey = CACHE_KEYS.intelSectorAnalysis(sectorId);
    const trendKey = `sector:${sectorId}:trend_analysis`;

    const generateOutlook = async () => {
        if (!headlines) return evidenceFallback;
        try {
            const prompt = `System: You are BOA-Story's sector evidence editor. Use only the supplied headlines and do not infer market performance from reporting volume.\nUser: Sector: ${sectorName}\nHeadlines: ${headlines}`;
            const response = await callConfiguredAI(c.env, { prompt: `${prompt}\n\nSynthesize only supported evidence in depth: dated developments, companies and institutions named, documented mechanisms, regulatory context, country differences, stakeholder effects, operational implications, dependencies, counter-evidence, alternative explanations, limitations, claim ledger and diligence questions.`, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });
            return response?.trim() || evidenceFallback;
        } catch { return evidenceFallback; }
    };

    const generateTrendAnalysis = async () => {
        try {
            const query = `${sectorName} Africa sector trends outlook`;
            const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
            const vector = (embedding as Record<string, any>).data[0];
            const relevant = await c.env.VECTORS.query(vector, { topK: 5, returnMetadata: true });
            const context = relevant.matches.map(match => (match.metadata as Record<string, any>).title).join('\n');
            if (!context) return evidenceFallback;
            const prompt = `System: You are BOA-Story's sector evidence editor. Use only the supplied context and distinguish reported facts from synthesis.\nUser: Sector: ${sectorName}. Recent context:\n${context}`;
            const response = await callConfiguredAI(c.env, { prompt: `${prompt}\n\nProvide chronology, actors, documented mechanisms, country differences, stakeholder effects, implications, contradictions, alternative explanations, limitations, source gaps, a claim ledger and verification priorities.`, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });
            return response?.trim() || evidenceFallback;
        } catch { return evidenceFallback; }
    };

    const [cachedOutlook, cachedTrend] = await Promise.all([
        getCachedValue<string>(c.env, outlookKey),
        getCachedValue<string>(c.env, trendKey),
    ]);
    if (!cachedOutlook || !cachedTrend) {
        c.executionCtx.waitUntil(Promise.all([
            cachedOutlook ? Promise.resolve(cachedOutlook) : getCached(c.env, outlookKey, generateOutlook, { ttl: CACHE_TTL.ARCHIVE }),
            cachedTrend ? Promise.resolve(cachedTrend) : getCached(c.env, trendKey, generateTrendAnalysis, { ttl: CACHE_TTL.ARCHIVE }),
        ]).then(() => undefined));
    }

    return c.json({
        sector: { ...sector, ai_outlook: cachedOutlook || evidenceFallback },
        by_country: countryBreakdown.results || [],
        by_region: regionBreakdown.results || [],
        recent_articles: recentArticles.results || [],
        top_performers: topPerformers.results || [],
        ai_trend_analysis: cachedTrend || evidenceFallback,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/trends - Sector financial trends (NEW)
// Powers the frontend "PremiumSectorTrends" page with market data
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/trends', async (c) => {
    const sectorId = c.req.param('id');

    // Get sector info
    const sector = await c.env.DB.prepare(
        'SELECT * FROM sectors WHERE id = ?'
    ).bind(sectorId).first();

    if (!sector) {
        return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
    }

    // Fetch market metrics from new table
    const metrics = await c.env.DB.prepare(`
        SELECT year, market_size_usd, growth_rate, 
               investment_volume_usd, regulatory_outlook, top_companies_json
        FROM market_metrics
        WHERE sector_id = ?
        ORDER BY year DESC
        LIMIT 5
    `).bind(sectorId).all();

    // Parse JSON fields and format response
    const trends = (metrics.results || []).map((m: any) => ({
        year: m.year,
        market_size: m.market_size_usd,
        growth_rate: m.growth_rate,
        investment_volume: m.investment_volume_usd,
        regulatory_outlook: m.regulatory_outlook
    }));

    // Extract top companies from most recent year
    let topCompanies: string[] = [];
    if (metrics.results && metrics.results.length > 0) {
        const latestMetric = metrics.results[0] as Record<string, any>;
        if (latestMetric.top_companies_json) {
            try {
                topCompanies = JSON.parse(latestMetric.top_companies_json);
            } catch (_e) {
                topCompanies = [];
            }
        }
    }

    // Calculate year-over-year change
    let yoyChange = null;
    if (trends.length >= 2) {
        const current = trends[0].market_size || 0;
        const previous = trends[1].market_size || 0;
        if (previous > 0) {
            yoyChange = Number((((current - previous) / previous) * 100).toFixed(1));
        }
    }

    return c.json({
        sector,
        trends,
        top_companies: topCompanies,
        summary: {
            latest_year: trends[0]?.year || null,
            current_market_size: trends[0]?.market_size || null,
            current_growth_rate: trends[0]?.growth_rate || null,
            yoy_change: yoyChange,
            regulatory_outlook: trends[0]?.regulatory_outlook || 'Unknown'
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/country/:code/outlook - Country investment outlook (public summary)
// ───────────────────────────────────────────────────────────────────────────────
