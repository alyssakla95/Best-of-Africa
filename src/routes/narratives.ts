// ═══════════════════════════════════════════════════════════════════════════════
// NARRATIVES ROUTER
// Strategic narrative management for narrative diplomacy
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, NarrativeStrategy, Country } from '../types';
import { requireAdmin } from '../lib/auth';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

import { processCountries } from './countries';

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives - List all active narrative strategies
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { country, sector, audience } = c.req.query();

    let query = `
        SELECT ns.*, c.name as country_name, s.name as sector_name
        FROM narrative_strategies ns
        LEFT JOIN countries c ON ns.country_code = c.code
        LEFT JOIN sectors s ON ns.sector_id = s.id
        WHERE ns.status = 'active'
    `;
    const params: string[] = [];

    if (country) {
        query += ' AND ns.country_code = ?';
        params.push(country);
    }
    if (sector) {
        query += ' AND ns.sector_id = ?';
        params.push(sector);
    }
    if (audience) {
        query += ' AND ns.target_audience = ?';
        params.push(audience);
    }

    query += ' ORDER BY ns.priority DESC, ns.effectiveness_score DESC';

    const narratives = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
        data: (narratives.results || []).map((n: any) => ({
            ...n,
            key_messages: n.key_messages ? JSON.parse(n.key_messages) : [],
        }))
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives/country/:code - Country-specific narrative positioning
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();

    // Get country details
    const country = await c.env.DB.prepare(`
        SELECT code, name, region, flag_emoji, description,
               diplomacy_score, image_strength_score, narrative_priority, key_narratives,
               investment_highlights, tourism_highlights
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get active narratives for this country
    const narratives = await c.env.DB.prepare(`
        SELECT * FROM narrative_strategies
        WHERE country_code = ? AND status = 'active'
        ORDER BY priority DESC
    `).bind(code).all();

    // Get articles aligned with narratives
    const articles = await c.env.DB.prepare(`
        SELECT a.id, a.slug, a.title, a.target_audience, a.tone,
               a.published_at, a.source_title, a.source_url,
               ns.narrative_theme
        FROM articles a
        LEFT JOIN narrative_strategies ns ON a.narrative_strategy_id = ns.id
        WHERE a.country_code = ? AND a.status = 'published'
        ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
        LIMIT 10
    `).bind(code).all();

    // Get coverage by sector
    const sectorCoverage = await c.env.DB.prepare(`
        SELECT s.id, s.name, s.icon, COUNT(a.id) as article_count
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ?
        GROUP BY s.id
    `).bind(code).all();

    const coverageSummary = await c.env.DB.prepare(`
        SELECT
            COUNT(*) AS published_articles,
            COUNT(DISTINCT sector_id) AS sectors_covered,
            COUNT(DISTINCT NULLIF(TRIM(source_url), '')) AS distinct_sources,
            COALESCE(MIN(published_at), '') AS earliest_record,
            COALESCE(MAX(published_at), '') AS latest_record
        FROM articles
        WHERE country_code = ? AND status = 'published'
    `).bind(code).first<{
        published_articles: number;
        sectors_covered: number;
        distinct_sources: number;
        earliest_record: string;
        latest_record: string;
    }>();

    const countryData = country as Record<string, any>;
    const articleRows = (articles.results || []) as Record<string, any>[];
    const sourceLedger = articleRows.slice(0, 6).map((article, index) =>
        `${index + 1}. ${article.title}${article.published_at ? ` (${article.published_at})` : ''}${article.source_title ? ` — source: ${article.source_title}` : ''}${article.narrative_theme ? ` — frame: ${article.narrative_theme}` : ''}.`
    ).join('\n\n') || `${countryData.name} currently has no published reporting record in this dataset. The active strategies and sector table below therefore define the evidence boundary rather than supporting a narrative conclusion.`;

    // Narrative Synthesis (The "Story So Far")
    const narrativeArcKey = CACHE_KEYS.narrativeSynthesis(code);
    const generateNarrativeArc = async () => {
            if (!articleRows.length) return sourceLedger;

            const context = articleRows.map(a =>
                `- ${a.title} | published ${a.published_at || 'date not recorded'} | source ${a.source_title || a.source_url || 'not recorded'} | tone ${a.tone || 'not classified'}`
            ).join('\n');

            try {
                const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: ${context}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt: `${prompt}\n\nProvide a full synthesis with dated evidence, named narrative sponsors and affected stakeholders, documented framing mechanisms, competing narratives, country differences, distribution channels when supplied, counter-evidence, alternative explanations, source limitations, claim ledger and what requires verification. Do not infer unsupported sentiment or impact.`, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });
                return aiResponse?.trim() || sourceLedger;
            } catch (e) {
                return sourceLedger;
            }
    };
    const narrativeArc = await getCachedValue<string>(c.env, narrativeArcKey);
    if (!narrativeArc && articles.results?.length) {
        c.executionCtx.waitUntil(
            getCached(c.env, narrativeArcKey, generateNarrativeArc, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
    }
    const immediateNarrativeArc = (articles.results as any[]).slice(0, 6).map((article, index) =>
        `${index + 1}. ${article.title}${article.narrative_theme ? ` — ${article.narrative_theme}` : ''}${article.tone ? ` (${article.tone})` : ''}.`
    ).join('\n\n') || `${countryData.name} is represented by its active strategies, aligned reporting and sector coverage in this record.`;

    const sectorRows = (sectorCoverage.results || []) as Array<{ name: string; article_count: number | string }>;
    const uncoveredSectors = sectorRows.filter(row => Number(row.article_count) === 0).map(row => row.name);
    const thinSectors = sectorRows
        .filter(row => Number(row.article_count) > 0 && Number(row.article_count) < 3)
        .sort((a, b) => Number(a.article_count) - Number(b.article_count))
        .map(row => `${row.name} (${Number(row.article_count)} published ${Number(row.article_count) === 1 ? 'record' : 'records'})`);
    const publishedCount = Number(coverageSummary?.published_articles || 0);
    const sourceCount = Number(coverageSummary?.distinct_sources || 0);
    const activeStrategyCount = narratives.results?.length || 0;
    const gapAnalysis = [
        `Evidence base: ${publishedCount} published ${publishedCount === 1 ? 'article' : 'articles'} across ${Number(coverageSummary?.sectors_covered || 0)} sectors, citing ${sourceCount} distinct source ${sourceCount === 1 ? 'record' : 'records'}.`,
        coverageSummary?.latest_record
            ? `Publication window: ${coverageSummary.earliest_record || coverageSummary.latest_record} to ${coverageSummary.latest_record}.`
            : 'Publication window: no published article has entered the country record.',
        `Narrative strategy record: ${activeStrategyCount} active ${activeStrategyCount === 1 ? 'strategy' : 'strategies'}.`,
        uncoveredSectors.length
            ? `Uncovered sectors requiring primary evidence: ${uncoveredSectors.join(', ')}.`
            : 'Every configured sector has at least one published record.',
        thinSectors.length
            ? `Thinly evidenced sectors: ${thinSectors.join(', ')}. These areas need additional independent sources before comparisons or causal claims are made.`
            : 'No covered sector is represented by fewer than three published records.',
        sourceCount < 3
            ? 'Source-diversity warning: fewer than three distinct cited sources support the current record; conclusions should remain provisional.'
            : `Source-diversity check: ${sourceCount} distinct cited sources are present, but each material claim still requires direct inspection of its linked evidence.`,
    ].join('\n\n');

    return c.json({
        country: {
            ...countryData,
            ...processCountries([country as unknown as Country])[0],
            narrative_arc: narrativeArc || immediateNarrativeArc
        },
        active_strategies: (narratives.results || []).map((n: any) => ({
            ...n,
            key_messages: n.key_messages ? JSON.parse(n.key_messages) : [],
        })),
        aligned_articles: articles.results || [],
        sector_coverage: sectorCoverage.results || [],
        ai_gap_analysis: gapAnalysis
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives/sectors - Narrative strategies by sector
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sectors', async (c) => {
    const sectorNarratives = await c.env.DB.prepare(`
        SELECT s.id, s.name, s.icon, s.color,
               COUNT(ns.id) as strategy_count,
               AVG(ns.effectiveness_score) as avg_effectiveness
        FROM sectors s
        LEFT JOIN narrative_strategies ns ON ns.sector_id = s.id AND ns.status = 'active'
        GROUP BY s.id
        ORDER BY strategy_count DESC
    `).all();

    return c.json({ data: sectorNarratives.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives/audiences - Breakdown by target audience
// ───────────────────────────────────────────────────────────────────────────────
router.get('/audiences', async (c) => {
    const audienceBreakdown = await c.env.DB.prepare(`
        SELECT 
            target_audience,
            COUNT(*) as count,
            AVG(effectiveness_score) as avg_effectiveness
        FROM narrative_strategies
        WHERE status = 'active'
        GROUP BY target_audience
    `).all();

    return c.json({ data: audienceBreakdown.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// Admin Routes - Narrative Management
// ───────────────────────────────────────────────────────────────────────────────

// POST /narratives - Create narrative strategy (admin)
router.post('/', requireAdmin, async (c) => {
    const body = await c.req.json();
    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
        INSERT INTO narrative_strategies (
            id, country_code, sector_id, narrative_theme, key_messages,
            target_audience, priority, tone, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        id,
        body.country_code || null,
        body.sector_id || null,
        body.narrative_theme,
        JSON.stringify(body.key_messages || []),
        body.target_audience || 'general',
        body.priority || 0,
        body.tone || 'authoritative',
        body.status || 'active'
    ).run();

    return c.json({ id }, 201);
});

// PUT /narratives/:id - Update narrative strategy (admin)
router.put('/:id', requireAdmin, async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    const fields = ['narrative_theme', 'target_audience', 'priority', 'tone', 'status'];
    for (const field of fields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(body[field]);
        }
    }

    if (body.key_messages) {
        updates.push('key_messages = ?');
        values.push(JSON.stringify(body.key_messages));
    }

    updates.push("updated_at = datetime('now')");

    await c.env.DB.prepare(
        `UPDATE narrative_strategies SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values, id).run();

    return c.json({ success: true });
});

// DELETE /narratives/:id - Archive narrative (admin)
router.delete('/:id', requireAdmin, async (c) => {
    const id = c.req.param('id');

    await c.env.DB.prepare(`
        UPDATE narrative_strategies SET status = 'archived', updated_at = datetime('now')
        WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /narratives/country/:code/index - Narrative alignment index score
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/index', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const [country, narrativeCount, alignedArticles] = await Promise.all([
        c.env.DB.prepare(`
            SELECT diplomacy_score, image_strength_score, narrative_priority
            FROM countries WHERE code = ?
        `).bind(code).first(),

        c.env.DB.prepare(`
            SELECT COUNT(*) as count FROM narrative_strategies
            WHERE country_code = ? AND status = 'active'
        `).bind(code).first<{ count: number }>(),

        c.env.DB.prepare(`
            SELECT COUNT(*) as count FROM articles
            WHERE country_code = ? AND status = 'published' AND engagement_score > 50
        `).bind(code).first<{ count: number }>()
    ]);

    if (!country) {
        return c.json({ error: 'not_found' }, 404);
    }

    const data = country as Record<string, any>;

    // Calculate narrative index from multiple factors
    const diplomacyScore = (data.diplomacy_score || 0.5) * 100;
    const imageScore = (data.image_strength_score || 0.5) * 100;
    const narrativesActive = narrativeCount?.count || 0;
    const highEngageArticles = alignedArticles?.count || 0;

    // Weighted calculation
    const narrativeIndex = Math.round(
        (diplomacyScore * 0.3) +
        (imageScore * 0.3) +
        (Math.min(narrativesActive * 10, 20)) +
        (Math.min(highEngageArticles * 2, 20))
    );

    return c.json({
        country_code: code,
        narrative_index: Math.min(narrativeIndex, 100),
        diplomacy_score: Math.round(diplomacyScore),
        image_strength: Math.round(imageScore),
        active_narratives: narrativesActive,
        aligned_articles: highEngageArticles,
        assessment: narrativeIndex > 70 ? 'Strong alignment with global investment themes.'
            : narrativeIndex > 50 ? 'Moderate narrative positioning.'
                : 'Narrative development opportunity.',
        updated_at: new Date().toISOString()
    });
});

export { router as narrativesRouter };
