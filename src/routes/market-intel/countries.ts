import { Hono } from 'hono';
import type { Env, Variables, MarketIntelligence } from '../../types';
import { requireApiKey, rateLimit } from '../../lib/auth';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../../lib/cache';
import { callConfiguredAI } from '../../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();


// GET /market-intel/country/:code/outlook - Country investment outlook (public summary)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/outlook', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, region, flag_emoji, description,
               diplomacy_score, image_strength_score, gdp_usd, population
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    const [sectorOpportunities, articleStats, narrativeStrength, recentHeadlines] = await Promise.all([
        c.env.DB.prepare(`
            SELECT s.id, s.name, s.icon, COUNT(a.id) as articles,
                   AVG(a.engagement_score) as avg_engagement
            FROM sectors s
            JOIN articles a ON a.sector_id = s.id
            WHERE a.country_code = ? AND a.status = 'published'
            GROUP BY s.id
            ORDER BY articles DESC
        `).bind(code).all(),

        c.env.DB.prepare(`
            SELECT 
                COUNT(*) as total_articles,
                SUM(view_count) as total_views,
                AVG(engagement_score) as avg_engagement
            FROM articles
            WHERE country_code = ? AND status = 'published'
        `).bind(code).first(),

        c.env.DB.prepare(`
            SELECT COUNT(*) as strategies, AVG(effectiveness_score) as avg_effectiveness
            FROM narrative_strategies
            WHERE country_code = ? AND status = 'active'
        `).bind(code).first(),
        c.env.DB.prepare(`
            SELECT title, published_at FROM articles
            WHERE country_code = ? AND status = 'published'
            ORDER BY published_at DESC LIMIT 5
        `).bind(code).all(),
    ]);

    const countryData = country as Record<string, any>;

    const context = (recentHeadlines.results as Array<{ title: string; published_at?: string }> || [])
        .map(row => `${row.published_at || 'date not recorded'}: ${row.title}`).join('; ');
    const evidenceFallback = context
        ? `The latest BOA records for ${countryData.name} cover ${context}. These are reporting signals, not a measure of market performance.`
        : `${countryData.name} is represented by the published-article and sector evidence totals shown in this record.`;
    const outlookKey = CACHE_KEYS.countryOutlook(code);
    const investmentCommentary = await getCachedValue<string>(c.env, outlookKey);
    if (!investmentCommentary) {
        c.executionCtx.waitUntil(getCached(c.env, outlookKey, async () => {
            try {
                const prompt = `System: You are BOA-Story's country evidence editor. Use only the dated headlines. Do not infer investability or economic performance from coverage.\nUser: Country: ${countryData.name}\nHeadlines: ${context}`;
                const response = await callConfiguredAI(c.env, { prompt, max_tokens: 1200, temperature: 0.2, response_profile: 'reader-explainer' });
                return response?.trim() || evidenceFallback;
            } catch { return evidenceFallback; }
        }, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined));
    }

    return c.json({
        country: countryData,
        outlook: {
            investment_readiness: Math.round((countryData.image_strength_score || 50) * 2),
            narrative_strength: (narrativeStrength as Record<string, any>)?.avg_effectiveness || 0,
            media_presence: (articleStats as Record<string, any>)?.total_articles || 0,
            engagement_level: (articleStats as Record<string, any>)?.avg_engagement || 0,
            investment_commentary: investmentCommentary || evidenceFallback
        },
        sector_opportunities: sectorOpportunities.results || [],
        stats: articleStats,
    });
});


export { router as countriesRouter };
