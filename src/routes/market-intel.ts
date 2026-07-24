// ═══════════════════════════════════════════════════════════════════════════════
// MARKET INTELLIGENCE ROUTER
// Premium intelligence reports and sector analysis
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, MarketIntelligence } from '../types';
import { requireApiKey, rateLimit } from '../lib/auth';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';
import {
    getSectorPerformanceCache,
    refreshSectorPerformance,
    sectorPerformanceCacheIsFresh,
} from '../lib/sector-performance';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply API key auth to premium endpoints
// Reports routes have mixed access (catalog is public, details are premium)

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
        `SELECT id, name, COALESCE(icon, 'bar-chart') AS icon, COALESCE(color, '#0F1F3D') AS color,
                COALESCE(NULLIF(description, ''), 'BOA-Story reporting evidence for this sector across African countries.') AS description
         FROM sectors WHERE id = ?`
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
            SELECT a.id, a.slug, a.title, a.summary, a.source_url, a.country_code,
                   c.name as country_name, a.published_at
            FROM articles a
            JOIN countries c ON a.country_code = c.code
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT 10
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.engagement_score, a.country_code
            FROM articles a
            WHERE a.sector_id = ? AND a.status = 'published'
            ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
            LIMIT 5
        `).bind(sectorId).all(),
    ]);

    const evidence = (recentArticles.results as any[]).map((article, index) =>
        `[${index + 1}] ${article.title}\nCountry: ${article.country_name}\nPublished: ${article.published_at || 'date unavailable'}\nSource URL: ${article.source_url || 'unavailable'}\nEvidence: ${(article.summary || '').slice(0, 1200)}`
    ).join('\n---\n');
    const sectorAnalysisKey = `sector:${sectorId}:evidence-analysis:v5`;
    const generateSectorAnalysis = async () => {
            if (!evidence) return 'Insufficient evidence for a current sector analysis.';
            try {
                const prompt = `System: You are BOA-Story's sector evidence desk. Use only the numbered records, cite them inline, distinguish facts from analysis, and explain cross-country differences, chronology, actors, operational and policy implications, counter-signals, limitations and next diligence steps. Never infer market growth from reporting or engagement volume.\nUser: Produce a complete evidence analysis for Africa's ${(sector as Record<string, any>).name} sector.\n\nRecords:\n${evidence}`;
                return await callConfiguredAI(c.env, { prompt, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });
            } catch (error) {
                console.error('Sector evidence analysis failed', error);
                return null;
            }
    };
    const sectorAnalysis = await getCachedValue<string>(c.env, sectorAnalysisKey);
    if (!sectorAnalysis && evidence) {
        c.executionCtx.waitUntil(
            getCached(c.env, sectorAnalysisKey, generateSectorAnalysis, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
    }
    const immediateSectorAnalysis = (recentArticles.results as any[]).slice(0, 6).map((article, index) =>
        `${index + 1}. ${article.title} (${article.country_name}, ${article.published_at || 'date not recorded'}). ${(article.summary || '').slice(0, 420)}`
    ).join('\n\n') || `${(sector as Record<string, any>).name} is represented by the country, regional and published coverage records in this profile.`;

    return c.json({
        sector: { ...sector, ai_outlook: sectorAnalysis || immediateSectorAnalysis },
        by_country: countryBreakdown.results || [],
        by_region: regionBreakdown.results || [],
        recent_articles: recentArticles.results || [],
        top_performers: topPerformers.results || [],
        ai_trend_analysis: sectorAnalysis || immediateSectorAnalysis,
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

    const performanceSnapshot = await getSectorPerformanceCache(c.env) || await refreshSectorPerformance(c.env);
    const marketPerformance = performanceSnapshot?.data.find(item => item.sector_id === sectorId);
    if (!marketPerformance) {
        return c.json({
            error: 'official_series_refresh_failed',
            message: 'The official performance series for this sector has not been saved yet.',
            source_name: 'World Bank World Development Indicators',
            source_url: 'https://data.worldbank.org/indicator',
        }, 503);
    }

    return c.json({
        sector,
        market_performance: marketPerformance,
        methodology: performanceSnapshot?.methodology,
        updated_at: performanceSnapshot?.retrieved_at || new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/country/:code/outlook - Country investment outlook (public summary)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/outlook', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, region, COALESCE(flag_emoji, '') AS flag_emoji,
               COALESCE(NULLIF(description, ''), name || ' country reporting evidence from BOA-Story.') AS description
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    const [sectorOpportunities, articleStats, narrativeStrength, recentRecords] = await Promise.all([
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
            SELECT a.slug, a.title, COALESCE(a.summary, a.title) AS summary,
                   COALESCE(a.published_at, a.updated_at, a.created_at) AS published_at,
                   COALESCE(NULLIF(a.source_title, ''), a.title) AS source_title,
                   a.source_url,
                   s.name AS sector_name
            FROM articles a
            LEFT JOIN sectors s ON s.id = a.sector_id
            WHERE a.country_code = ? AND a.status = 'published'
            ORDER BY a.published_at DESC
            LIMIT 15
        `).bind(code).all<Record<string, any>>(),
    ]);

    const countryData = country as Record<string, any>;
    const sourceRecords = recentRecords.results || [];
    const evidenceContext = sourceRecords.map((record, index) =>
        `[${index + 1}] ${record.published_at} — ${record.title}\nSector: ${record.sector_name || 'General coverage'}\n${record.summary.slice(0, 1200)}\nSource: ${record.source_title} | ${record.source_url || `/stories/${record.slug}`}`
    ).join('\n\n');

    const evidenceBriefingKey = `${CACHE_KEYS.countryOutlook(code)}:evidence-contract-v3`;
    const generateEvidenceBriefing = async () => {
            if (!evidenceContext) return `The current BOA-Story evidence window contains zero published records for ${countryData.name}. That observed zero is the finding: no country-level inference can be supported from this dataset until reporting records enter the window.`;
            const prompt = `System: You are BOA-Story's country evidence editor. Use only the numbered records. This is not an investment rating. Do not infer economic performance, political stability, policy quality, tourism safety or investability from article volume, engagement or narrative fields. Cite records inline and distinguish reported fact, supported interpretation and unresolved question.

User: Produce a complete evidence briefing for ${countryData.name}. Cover the reporting window, dated chronology, named institutions and decision-makers, sector-by-sector developments, documented mechanisms, implementation status, affected stakeholders, cross-record connections, immediate and conditional implications, counter-signals, alternative explanations, source limitations, missing primary documents, a claim ledger and prioritized verification steps. Explain technical or policy details in plain language.

RECORDS:
${evidenceContext}`;
            return callConfiguredAI(c.env, { prompt, max_tokens: 6500, temperature: 0.15, response_profile: 'evidence-brief' });
    };
    const evidenceBriefing = await getCachedValue<string>(c.env, evidenceBriefingKey);
    if (!evidenceBriefing && evidenceContext) {
        c.executionCtx.waitUntil(
            getCached(c.env, evidenceBriefingKey, generateEvidenceBriefing, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
    }
    const immediateCountryBriefing = sourceRecords.slice(0, 6).map((record, index) =>
        `${index + 1}. ${record.title} (${record.published_at || 'date not recorded'}, ${record.sector_name || 'general coverage'}). ${(record.summary || '').slice(0, 420)}`
    ).join('\n\n') || `The current BOA-Story evidence window contains zero published records for ${countryData.name}. No country-level inference is supported from this dataset until reporting records enter the window.`;

    return c.json({
        country: countryData,
        outlook: {
            investment_commentary: evidenceBriefing || immediateCountryBriefing,
            methodology: 'This source-linked briefing analyzes BOA-Story reporting records. It does not infer investment readiness, stability, safety or economic performance from coverage or engagement.'
        },
        sector_opportunities: [],
        sector_coverage: sectorOpportunities.results || [],
        evidence: {
            published_articles: Number((articleStats as Record<string, any>)?.total_articles || 0),
            sectors_covered: (sectorOpportunities.results || []).length,
            active_narrative_strategies: Number((narrativeStrength as Record<string, any>)?.strategies || 0),
            status: sourceRecords.length > 0 ? 'source-linked' : 'zero published records in the evidence window',
            source_records: sourceRecords.map((record, index) => ({
                record: index + 1,
                title: record.title,
                published_at: record.published_at,
                source_title: record.source_title,
                source_url: record.source_url || `/stories/${record.slug}`,
            })),
            limitations: [
                'Article volume is reporting coverage, not market opportunity or country performance.',
                'The briefing is bounded by the latest 15 published records and can omit developments outside that window.',
                'Article summaries do not replace audited accounts, legal instruments, regulatory filings or implementation data.',
                'Every consequential conclusion requires verification against the primary documents identified in the briefing.',
            ]
        },
        stats: {
            total_articles: Number((articleStats as Record<string, any>)?.total_articles || 0),
            total_views: Number((articleStats as Record<string, any>)?.total_views || 0),
            average_audience_response: Number(Number((articleStats as Record<string, any>)?.avg_engagement || 0).toFixed(1)),
        },
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// Premium Reports (Requires API Key)
// ───────────────────────────────────────────────────────────────────────────────

// GET /market-intel/reports - List available reports
router.get('/generated-reports', async (c) => {
    const reports = await c.env.DB.prepare(`
        SELECT id, type, title, metadata, created_at
        FROM generated_reports
        ORDER BY created_at DESC
        LIMIT 20
    `).all();

    return c.json({
        data: (reports.results || []).map((r: any) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            metadata: JSON.parse(r.metadata as string),
            created_at: r.created_at
        }))
    });
});

// GET /market-intel/reports - List available reports
router.get('/reports', async (c) => {
    const clientTier = c.get('clientTier') as string;

    let query = 'SELECT * FROM market_intelligence WHERE 1=1';
    if (clientTier === 'basic') {
        query += ' AND is_premium = 0';
    }
    query += ' ORDER BY generated_at DESC LIMIT 50';

    const reports = await c.env.DB.prepare(query).all();

    return c.json({
        data: (reports.results || []).map((r: any) => ({
            id: r.id,
            report_type: r.report_type,
            title: r.title,
            country_code: r.country_code,
            sector_id: r.sector_id,
            executive_summary: r.executive_summary,
            generated_at: r.generated_at,
            is_premium: r.is_premium,
        }))
    });
});

// GET /market-intel/reports/:id - Full report (premium)
router.get('/reports/:id', requireApiKey, rateLimit, async (c) => {
    const reportId = c.req.param('id');
    const clientTier = c.get('clientTier') as string;

    const report = await c.env.DB.prepare(`
        SELECT * FROM market_intelligence WHERE id = ?
    `).bind(reportId).first();

    if (!report) {
        return c.json({ error: 'not_found', message: 'Report not found' }, 404);
    }

    const reportData = report as Record<string, any>;

    if (reportData.is_premium && clientTier === 'basic') {
        return c.json({
            error: 'forbidden',
            message: 'Premium tier required for this report'
        }, 403);
    }

    // Increment view count
    await c.env.DB.prepare(`
        UPDATE market_intelligence SET view_count = view_count + 1 WHERE id = ?
    `).bind(reportId).run();

    return c.json({
        ...reportData,
        key_findings: reportData.key_findings ? JSON.parse(reportData.key_findings) : [],
        opportunities: reportData.opportunities ? JSON.parse(reportData.opportunities) : [],
        risks: reportData.risks ? JSON.parse(reportData.risks) : [],
        data_sources: reportData.data_sources ? JSON.parse(reportData.data_sources) : [],
    });
});

// GET /market-intel/reports/sector/:id - Sector analysis report
router.get('/reports/sector/:id', requireApiKey, rateLimit, async (c) => {
    const sectorId = c.req.param('id');

    const report = await c.env.DB.prepare(`
        SELECT * FROM market_intelligence 
        WHERE sector_id = ? AND report_type = 'sector_analysis'
        ORDER BY generated_at DESC
        LIMIT 1
    `).bind(sectorId).first();

    if (!report) {
        return c.json({
            error: 'not_found',
            message: 'No sector analysis available. Request generation via admin.'
        }, 404);
    }

    const reportData = report as Record<string, any>;
    return c.json({
        ...reportData,
        key_findings: reportData.key_findings ? JSON.parse(reportData.key_findings) : [],
        opportunities: reportData.opportunities ? JSON.parse(reportData.opportunities) : [],
        risks: reportData.risks ? JSON.parse(reportData.risks) : [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/performance - -Powered Sector Performance (for MarketIntelPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/performance', async (c) => {
    const lens = c.req.query('lens') || 'investor';
    const cached = await getSectorPerformanceCache(c.env);
    if (cached) {
        if (!sectorPerformanceCacheIsFresh(cached)) {
            c.executionCtx.waitUntil(refreshSectorPerformance(c.env).then(() => undefined));
        }
        return c.json({ ...cached, lens });
    }

    const refreshed = await refreshSectorPerformance(c.env);
    if (!refreshed) {
        return c.json({
            error: 'official_series_refresh_failed',
            message: 'The official sector series could not be retrieved and no verified snapshot has been saved yet.',
            source_name: 'World Bank World Development Indicators',
            source_url: 'https://data.worldbank.org/indicator',
        }, 503);
    }
    return c.json({ ...refreshed, lens });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/founder-log - -Written Weekly Project Update
// ───────────────────────────────────────────────────────────────────────────────
router.get('/founder-log', async (c) => {
    return c.json(await getCached(
        c.env,
        'founder-log:weekly:depth-v6',
        async () => {
            // Fetch articles from the last 14 days
            const recentArticles = await c.env.DB.prepare(`
                SELECT a.title, c.name as country_name, s.name as sector_name 
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' AND a.published_at > datetime('now', '-14 days')
                ORDER BY a.published_at DESC
                LIMIT 15
            `).all();

            const articles = (recentArticles.results || []) as any[];
            const contextStr = articles.map(a => `- ${a.title} (${a.country_name}, ${a.sector_name})`).join('\n');
            const totalThisWeek = articles.length;

            const prompt = `System: You are the independent, solo founder and lead researcher of "BOA-Story", a platform dedicated to covering African business, economies, and culture beyond mainstream narratives.
You are writing a transparent, three-part "What I'm working on" update for your most dedicated supporters on Ko-fi.
Keep the tone grounded, authentic, slightly tired but passionate, and completely human. No corporate jargon. No AI-isms like "Ah," or "In conclusion".

User: Based on the fact that we published ${totalThisWeek} articles recently:
${contextStr || "Just general research this week."}

Write the update. Format it exactly as a JSON array of 3 objects, where each object has:
- date: "Month Year" (e.g., "${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}")
- tag: a short 1-2 word tag (e.g., "Research Log", "Platform Update", "Founder Note")
- title: A punchy, conversational title for the paragraph
- body: A developed 500-700 word entry explaining the reporting work, specific countries or sectors covered, source discoveries, what was learned, what remains uncertain, editorial tradeoffs, and what happens next. Do not pretend that publication volume proves market impact.

Return ONLY the raw JSON array.`;

            try {
                const text = await callConfiguredAI(c.env, { prompt, max_tokens: 3600, temperature: 0.35, response_profile: 'structured-analysis', structured_output: true });
                const match = text.match(/\[.*\]/s);
                if (match) {
                    return JSON.parse(match[0]);
                }
            } catch (e) {
                console.error("Founder log generation failed", e);
            }

            // Fallback if fails
            return [
                {
                    date: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date()),
                    tag: 'Research Log',
                    title: 'Deep in the data trenches.',
                    body: 'We are currently aggregating the latest round of stories. The data pipeline is running, but good research takes time. Thanks for sticking around.'
                }
            ];
        },
        { ttl: 3600 * 24 } // Cache for 24 hours
    ));
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/leading-sector - Top performing sector (for MarketIntelPage header)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/leading-sector', async (c) => {
    const snapshot = await getSectorPerformanceCache(c.env) || await refreshSectorPerformance(c.env);
    const comparable = (snapshot?.data || []).filter(item =>
        ['agriculture', 'energy', 'infrastructure', 'manufacturing'].includes(item.sector_id)
        && item.headline_unit === '%'
    );
    const leading = [...comparable].sort((a, b) => b.headline_value - a.headline_value)[0];
    if (!leading) {
        return c.json({ error: 'official_series_refresh_failed', message: 'No comparable real-growth sector series has been saved yet.' }, 503);
    }
    return c.json({
        name: leading.sector_name,
        sector_id: leading.sector_id,
        metric: leading.indicator_name,
        value: leading.headline_value,
        unit: leading.headline_unit,
        comparison_value: leading.comparison_value,
        comparison_unit: leading.comparison_unit,
        period_start: leading.period_start,
        period_end: leading.period_end,
        countries_reported: leading.countries_reported,
        methodology: 'Ranks only the directly comparable annual real-growth WDI proxies for agriculture, broad industry, fixed investment and manufacturing. It does not compare incompatible credit, digital-adoption, health-spending or travel-receipts series.',
        source_name: leading.source_name,
        source_url: leading.source_url,
        updated_at: snapshot?.retrieved_at || new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/coverage-pulse — the free-visitor intelligence view.
// Every number here is REAL coverage data. Its predecessor blended pseudo-
// metrics ("stability 100/moderate", identical perception/reality rows) that
// read as meaningless to visitors — because they were.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/coverage-pulse', async (c) => {
    const data = await getCached(c.env, 'coverage:pulse:evidence-contract-v2', async () => {
        const [totals, topSector, countries, thinnest] = await Promise.all([
            c.env.DB.prepare(`
                SELECT COUNT(*) AS stories, COUNT(DISTINCT country_code) AS countries
                FROM articles
                WHERE status = 'published' AND published_at > datetime('now', '-7 days')
            `).first<{ stories: number; countries: number }>(),
            c.env.DB.prepare(`
                SELECT s.name, COUNT(*) AS n
                FROM articles a JOIN sectors s ON s.id = a.sector_id
                WHERE a.status = 'published' AND a.published_at > datetime('now', '-7 days')
                  AND s.id != 'general'
                GROUP BY s.id ORDER BY n DESC LIMIT 1
            `).first<{ name: string; n: number }>(),
            c.env.DB.prepare(`
                SELECT c.code AS country_code, c.name AS country_name,
                       SUM(CASE WHEN a.published_at > datetime('now', '-7 days') THEN 1 ELSE 0 END) AS this_week,
                       SUM(CASE WHEN a.published_at <= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS last_week
                FROM countries c
                LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
                    AND a.published_at > datetime('now', '-14 days')
                GROUP BY c.code
                HAVING this_week > 0 OR last_week > 0
                ORDER BY this_week DESC, (this_week - last_week) DESC, c.name ASC
            `).all<{ country_code: string; country_name: string; this_week: number; last_week: number }>(),
            c.env.DB.prepare(`
                SELECT c.region, COUNT(a.id) AS n
                FROM countries c
                LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
                    AND a.published_at > datetime('now', '-7 days')
                GROUP BY c.region ORDER BY n ASC LIMIT 1
            `).first<{ region: string; n: number }>(),
        ]);

        return {
            stories_7d: totals?.stories || 0,
            countries_7d: totals?.countries || 0,
            most_reported_sector: topSector ? { name: topSector.name, stories: topSector.n } : { name: 'Zero qualifying sector stories', stories: 0 },
            // Compatibility alias. This is editorial volume, never performance.
            top_sector: topSector ? { name: topSector.name, stories: topSector.n } : { name: 'Zero qualifying sector stories', stories: 0 },
            countries: countries.results || [],
            thinnest_region: thinnest ? { region: thinnest.region, stories: thinnest.n } : { region: 'Zero configured regions', stories: 0 },
            updated_at: new Date().toISOString(),
        };
    }, { ttl: 600 });
    return c.json(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sentiment-divergence - Country reality vs perception (for NarrativesPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sentiment-divergence', async (c) => {
    const rows = await c.env.DB.prepare(`
        WITH coverage AS (
            SELECT c.code, c.name, c.region,
                   SUM(CASE WHEN a.published_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS this_week,
                   SUM(CASE WHEN a.published_at >= datetime('now', '-14 days')
                             AND a.published_at < datetime('now', '-7 days') THEN 1 ELSE 0 END) AS last_week,
                   AVG(CASE WHEN a.published_at >= datetime('now', '-7 days') THEN a.engagement_score END) AS audience_response,
                   MAX(a.published_at) AS latest_reported_at
            FROM countries c
            LEFT JOIN articles a
              ON a.country_code = c.code
             AND a.status = 'published'
             AND a.published_at >= datetime('now', '-14 days')
            GROUP BY c.code, c.name, c.region
        ),
        ranked AS (
            SELECT *,
                   ROW_NUMBER() OVER (
                       PARTITION BY region
                       ORDER BY this_week DESC, last_week DESC, name
                   ) AS rn
            FROM coverage
        )
        SELECT code, name, region, this_week, last_week, audience_response, latest_reported_at
        FROM ranked
        WHERE rn = 1 AND (this_week > 0 OR last_week > 0)
        ORDER BY region
    `).all<Record<string, any>>();

    const countries = (rows.results || []).map(row => ({
        country_code: row.code,
        country_name: row.name,
        region: row.region,
        coverage_this_week: Number(row.this_week || 0),
        coverage_last_week: Number(row.last_week || 0),
        coverage_change: Number(row.this_week || 0) - Number(row.last_week || 0),
        audience_response: row.audience_response === null ? 0 : Number(Number(row.audience_response).toFixed(1)),
        latest_reported_at: row.latest_reported_at || 'No published record in the fourteen-day comparison window',
    }));

    return c.json({
        evidence_scope: 'One highest-coverage country per configured region, using two consecutive seven-day windows',
        countries,
        methodology: 'BOA-Story does not calculate a reality-versus-perception score from headlines, engagement, diplomacy or image fields. The replacement fields report weekly editorial coverage and descriptive audience activity only.',
        updated_at: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /market-intel/metrics - Update market metrics (use only)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/metrics', requireApiKey, async (c) => {
    // Check for ADMIN key specifically to ensure only authorized agents update data
    const key = c.req.header('x-api-key');
    if (key !== c.env.ADMIN_API_KEY) {
        return c.json({ error: 'forbidden', message: 'Admin access required' }, 403);
    }

    try {
        const body = await c.req.json();
        const { sector_id, country_code, year, market_size_usd, growth_rate, investment_volume_usd, regulatory_outlook, top_companies, source_urls } = body;

        // Validate required fields
        if (!sector_id || !country_code || !year) {
            return c.json({ error: 'bad_request', message: 'Missing required fields: sector_id, country_code, year' }, 400);
        }

        const id = crypto.randomUUID();

        await c.env.DB.prepare(`
            INSERT INTO market_metrics (
                id, sector_id, country_code, year, market_size_usd, growth_rate, 
                investment_volume_usd, regulatory_outlook, top_companies_json, 
                source_urls, last_updated_by, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agent', datetime('now'))
            ON CONFLICT(sector_id, country_code, year) DO UPDATE SET
                market_size_usd = COALESCE(excluded.market_size_usd, market_metrics.market_size_usd),
                growth_rate = excluded.growth_rate,
                investment_volume_usd = COALESCE(excluded.investment_volume_usd, market_metrics.investment_volume_usd),
                regulatory_outlook = COALESCE(excluded.regulatory_outlook, market_metrics.regulatory_outlook),
                top_companies_json = COALESCE(excluded.top_companies_json, market_metrics.top_companies_json),
                source_urls = excluded.source_urls,
                last_updated_by = 'agent',
                updated_at = datetime('now')
        `).bind(
            id,
            sector_id, country_code, year,
            market_size_usd, growth_rate, investment_volume_usd,
            regulatory_outlook, JSON.stringify(top_companies || []),
            JSON.stringify(source_urls || [])
        ).run();

        return c.json({ success: true, message: `metrics updated for ${sector_id}-${country_code}` });
    } catch (e) {
        return c.json({ error: 'server_error', message: String(e) }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/analytics - Sector volatility and supply chain
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/analytics', async (c) => {
    const sectorId = c.req.param('id');
    const evidence = await c.env.DB.prepare(`
        SELECT COUNT(*) AS stories_30d,
               COUNT(DISTINCT country_code) AS countries_30d,
               COUNT(DISTINCT COALESCE(NULLIF(source_url, ''), NULLIF(source_title, ''), id)) AS source_records_30d,
               SUM(COALESCE(view_count, 0)) AS views_30d,
               AVG(engagement_score) AS audience_response,
               MAX(published_at) AS latest_reported_at
        FROM articles
        WHERE sector_id = ? AND status = 'published'
          AND published_at >= datetime('now', '-30 days')
    `).bind(sectorId).first<Record<string, any>>();

    return c.json({
        sector_id: sectorId,
        data_points: Number(evidence?.stories_30d || 0),
        coverage: {
            stories_30d: Number(evidence?.stories_30d || 0),
            countries_30d: Number(evidence?.countries_30d || 0),
            source_records_30d: Number(evidence?.source_records_30d || 0),
            views_30d: Number(evidence?.views_30d || 0),
            audience_response: evidence?.audience_response === null ? 0 : Number(Number(evidence?.audience_response || 0).toFixed(1)),
            latest_reported_at: evidence?.latest_reported_at || 'No story published in the current 30-day window',
        },
        methodology: 'BOA-Story does not infer market volatility, supply-chain health or confidence from article engagement or headline synthesis. Coverage fields describe platform reporting activity only.',
        updated_at: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/trend-history - Historical trend for sparklines
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/trend-history', async (c) => {
    const sectorId = c.req.param('id');

    // Get article counts by week for last 5 weeks
    const weeklyData = await c.env.DB.prepare(`
        SELECT 
            strftime('%W', published_at) as week,
                        COUNT(*) as count
        FROM articles 
        WHERE sector_id = ? AND status = 'published' 
        AND published_at > datetime('now', '-35 days')
        GROUP BY week
        ORDER BY week ASC
        LIMIT 5
                        `).bind(sectorId).all();

    const data = (weeklyData.results || []) as any[];

    const trend = data.map(d => Number(d.count || 0));
    const direction = trend.length < 2 ? 'flat' : trend[trend.length - 1] > trend[0] ? 'up' : trend[trend.length - 1] < trend[0] ? 'down' : 'flat';

    return c.json({
        sector_id: sectorId,
        trend,
        direction,
        methodology: 'Weekly points are published BOA-Story article counts. Direction describes coverage momentum, not market performance.',
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/velocity - Sector velocity metrics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/velocity', async (c) => {
    const sectorId = c.req.param('id');

    return c.json(await getCached(
        c.env,
        `sector-velocity:${sectorId}:evidence-contract-v2`,
        async () => {
            const articleStats = await c.env.DB.prepare(`
                SELECT SUM(CASE WHEN published_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS current_30d,
                       SUM(CASE WHEN published_at < datetime('now', '-30 days') THEN 1 ELSE 0 END) AS previous_30d,
                       COUNT(DISTINCT CASE WHEN published_at >= datetime('now', '-30 days') THEN country_code END) AS countries_30d,
                       COUNT(DISTINCT CASE WHEN published_at >= datetime('now', '-30 days') THEN COALESCE(NULLIF(source_url, ''), NULLIF(source_title, ''), id) END) AS source_records_30d
                FROM articles
                WHERE sector_id = ? AND status = 'published'
                AND published_at > datetime('now', '-60 days')
            `).bind(sectorId).first() as Record<string, any>;

            const current = Number(articleStats?.current_30d || 0);
            const previous = Number(articleStats?.previous_30d || 0);

            return {
                sector_id: sectorId,
                coverage_stories_30d: current,
                coverage_previous_30d: previous,
                coverage_change: current - previous,
                countries_covered_30d: Number(articleStats?.countries_30d || 0),
                source_records_30d: Number(articleStats?.source_records_30d || 0),
                reporting_window_days: 30,
                methodology: 'Velocity is the observed change in BOA-Story publishing volume between consecutive 30-day windows. It is not CAGR, deal flow, project count or sector performance.',
                updated_at: new Date().toISOString()
            };
        },
        { ttl: 3600 * 6 } // cache for 6 hours
    ));
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/opportunities - High-growth intersections
// ───────────────────────────────────────────────────────────────────────────────
router.get('/opportunities', async (c) => {
    const cacheKey = 'strategic-opportunities:depth-v8';
    const cached = await getCachedValue<{ data: any[]; updated_at?: string }>(c.env, cacheKey);
    if (cached) return c.json(cached);

    const generateOpportunities = async () => {
            const opportunities = await c.env.DB.prepare(`
                SELECT 
                    c.code as country_code,
                    c.name as country_name,
                    s.id as sector_id,
                    s.name as sector_name,
                    COUNT(a.id) as article_count,
                    AVG(a.engagement_score) as avg_score,
                    MAX(a.published_at) as latest_reported_at
                FROM articles a
                JOIN countries c ON a.country_code = c.code
                JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' AND a.published_at > datetime('now', '-30 days')
                GROUP BY c.code, s.id
                ORDER BY article_count DESC, latest_reported_at DESC
                LIMIT 6
            `).all();

            const items = opportunities.results || [];
            
            if (items.length === 0) return { data: [] };

            const formatOpportunity = async (o: any) => {
                const recentArticles = await c.env.DB.prepare(`
                    SELECT id, slug, title, summary, published_at, source_title, source_url FROM articles
                    WHERE country_code = ? AND sector_id = ? AND status = 'published'
                    ORDER BY published_at DESC LIMIT 12
                `).bind(o.country_code, o.sector_id).all();

                const sourceRecords = recentArticles.results || [];
                const evidence = sourceRecords.map((article: any, index: number) =>
                    `[${index + 1}] ${article.published_at || 'date unavailable'} — ${article.title}\n${article.summary || 'Summary unavailable.'}\nSource: ${article.source_title || 'source unavailable'} | ${article.source_url || 'URL unavailable'}`
                ).join('\n\n');
                
                let generatedTitle = `${o.country_name} ${o.sector_name} evidence brief`;
                let generatedSummary = sourceRecords.slice(0, 6).map((article: any, index: number) =>
                    `[${index + 1}] ${article.published_at || 'Date unavailable'}: ${article.title}. ${article.summary || 'The record does not include a usable summary.'}`
                ).join('\n\n') || 'No source-linked records are available for a substantive brief.';
                let whyItMatters = `This is a reporting-led watchlist, not an investment recommendation. BOA-Story recorded ${Number(o.article_count || 0)} published items at this country-sector intersection during the measured window. The records identify developments requiring primary-source verification, but coverage volume, recency and audience activity cannot establish market size, profitability, policy durability, investability or future returns. Readers should use the dated findings below to locate the responsible institutions, operating entities and original documents before drawing a decision.

The decision value lies in the record trail, not the ranking. A reader can compare announcement dates with later implementation evidence, identify which institution owns each obligation, distinguish a financing commitment from a disbursement, and test whether reported activity has reached affected businesses, workers or communities. The current window can reveal where scrutiny should begin, but it cannot show the full operating history or the developments that attracted little coverage. Before treating any pattern as durable, verify the legal instrument, funding source, delivery timetable, counterparties, audited performance and current regulatory position. Compare those primary materials with contrary records, delayed milestones and independent reporting. If the evidence remains announcement-led, the responsible conclusion is that the intersection requires further reporting rather than that it represents a validated opportunity.`;
                let evidencePoints: string[] = sourceRecords.slice(0, 8).map((article: any, index: number) =>
                    `[${index + 1}] ${article.published_at || 'Date unavailable'}: ${article.title}; source: ${article.source_title || article.source_url || 'not supplied'}.`
                );
                let counterSignals: string[] = [
                    'Coverage volume and audience activity do not establish market growth, profitability or investment readiness.',
                    'The records may repeat the same underlying announcement and therefore may not represent independent confirmation.',
                    'Article summaries do not replace audited financial statements, regulatory filings, contracts or implementation data.',
                    'The current reporting window can omit slower-moving constraints, failed projects and developments that received little coverage.',
                ];
                let diligenceQuestions: string[] = [
                    'Which primary financial statements, regulatory filings and official notices substantiate the reported developments?',
                    'Which named entity is legally responsible for delivery, financing, oversight and performance reporting?',
                    'What dated implementation milestones have been completed, delayed, revised or cancelled?',
                    'Which claims are independently corroborated rather than repeated from a single announcement or press release?',
                    'What evidence would contradict the apparent direction of the current reporting record?',
                ];
                let claimLedger: string[] = [`This intersection is prominent in BOA-Story's current reporting set; records [1-${Math.max(1, Math.min(sourceRecords.length, 8))}] support that coverage observation, which changes if deduplication or a wider reporting window materially alters the count.`];
                
                try {
                    const prompt = `System: You are BOA-Story's evidence desk. Assess a reporting-led watchlist item using only the numbered records. This is not a recommendation. Never infer growth, deal flow, stability, investability or future returns from coverage volume or audience engagement. Cite record numbers inline and separate reported facts from analysis.

User: Build a detailed watchlist brief for ${o.sector_name} in ${o.country_name}. Return ONLY valid JSON with this exact schema:
{
  "title": "specific 5-10 word evidence-led title",
  "executive_summary": "350-500 words covering chronology, actors, documented mechanisms, stakeholder effects and implications with inline [n] citations",
  "why_it_matters": "250-350 words clearly labeled as analysis, including immediate, medium-term and conditional implications",
  "evidence_points": ["6-10 specific dated, cited findings"],
  "counter_signals": ["4-7 contradictions, alternative explanations, constraints or source limitations"],
  "diligence_questions": ["5-8 concrete questions requiring primary-source verification"],
  "claim_ledger": ["major conclusion — supporting [n] records — evidence that would change the conclusion"]
}

RECORDS:
${evidence}`;
                    const text = await callConfiguredAI(c.env, { prompt, max_tokens: 4200, temperature: 0.2, response_profile: 'structured-analysis', structured_output: true });
                    const match = text.match(/\{.*\}/s);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        if (parsed.title) generatedTitle = parsed.title;
                        if (typeof parsed.executive_summary === 'string' && parsed.executive_summary.trim().split(/\s+/).length >= 250) generatedSummary = parsed.executive_summary;
                        if (typeof parsed.why_it_matters === 'string' && parsed.why_it_matters.trim().split(/\s+/).length >= 150) whyItMatters = parsed.why_it_matters;
                        if (Array.isArray(parsed.evidence_points) && parsed.evidence_points.length >= 4) evidencePoints = parsed.evidence_points.slice(0, 10);
                        if (Array.isArray(parsed.counter_signals) && parsed.counter_signals.length >= 3) counterSignals = parsed.counter_signals.slice(0, 7);
                        if (Array.isArray(parsed.diligence_questions) && parsed.diligence_questions.length >= 4) diligenceQuestions = parsed.diligence_questions.slice(0, 8);
                        if (Array.isArray(parsed.claim_ledger) && parsed.claim_ledger.length >= 1) claimLedger = parsed.claim_ledger.slice(0, 10);
                    }
                } catch (e) {
                    // Preserve the evidence-limited fallback rather than inventing a thesis.
                }

                return {
                    country_code: o.country_code,
                    country_name: o.country_name,
                    sector_id: o.sector_id,
                    sector_name: o.sector_name,
                    title: generatedTitle,
                    summary: generatedSummary,
                    why_it_matters: whyItMatters,
                    evidence_points: evidencePoints,
                    counter_signals: counterSignals,
                    diligence_questions: diligenceQuestions,
                    claim_ledger: claimLedger,
                    coverage_stories: Number(o.article_count || 0),
                    audience_response: Math.round(o.avg_score || 0),
                    latest_reported_at: o.latest_reported_at,
                    score: Math.round(o.avg_score || 0),
                    methodology: 'Ranked by BOA-Story reporting volume and recency. Audience response is descriptive platform activity, not an opportunity score.'
                };
            };

            // Keep long structured generations below the shared model's
            // concurrency pressure point so cards do not fall into fallback.
            const formatted: any[] = [];
            for (let index = 0; index < items.length; index += 2) {
                formatted.push(...await Promise.all(items.slice(index, index + 2).map(formatOpportunity)));
            }

            return { data: formatted, updated_at: new Date().toISOString() };
    };
    c.executionCtx.waitUntil(
        getCached(c.env, cacheKey, generateOpportunities, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
    );
    return c.json(await buildImmediateOpportunities(c.env));
});

async function buildImmediateOpportunities(env: Env) {
    const opportunities = await env.DB.prepare(`
        SELECT c.code AS country_code, c.name AS country_name,
               s.id AS sector_id, s.name AS sector_name,
               COUNT(a.id) AS article_count, AVG(a.engagement_score) AS avg_score,
               MAX(a.published_at) AS latest_reported_at
        FROM articles a
        JOIN countries c ON a.country_code = c.code
        JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'published' AND a.published_at > datetime('now', '-30 days')
        GROUP BY c.code, s.id
        ORDER BY article_count DESC, latest_reported_at DESC
        LIMIT 6
    `).all<Record<string, any>>();

    const data = await Promise.all((opportunities.results || []).map(async opportunity => {
        const recent = await env.DB.prepare(`
            SELECT title, summary, published_at, source_title, source_url
            FROM articles
            WHERE country_code = ? AND sector_id = ? AND status = 'published'
            ORDER BY published_at DESC LIMIT 8
        `).bind(opportunity.country_code, opportunity.sector_id).all<Record<string, any>>();
        const records = recent.results || [];
        const evidencePoints = records.slice(0, 8).map((article, index) =>
            `[${index + 1}] ${article.published_at || 'Date not recorded'}: ${article.title}; source: ${article.source_title || article.source_url || 'source not supplied'}.`
        );
        return {
            country_code: opportunity.country_code,
            country_name: opportunity.country_name,
            sector_id: opportunity.sector_id,
            sector_name: opportunity.sector_name,
            title: `${opportunity.country_name} ${opportunity.sector_name} evidence brief`,
            summary: records.slice(0, 6).map((article, index) =>
                `${index + 1}. ${article.title} (${article.published_at || 'date not recorded'}). ${(article.summary || '').slice(0, 420)}`
            ).join('\n\n'),
            why_it_matters: `BOA-Story recorded ${Number(opportunity.article_count || 0)} published reports at this country-sector intersection in the current 30-day window. That identifies a reporting-led watchlist for primary-source review; it does not establish growth, profitability, policy durability or investability. Verify the named institutions, legal instruments, financing, implementation milestones and contrary evidence behind the linked records before making a decision.`,
            evidence_points: evidencePoints,
            counter_signals: [
                'Reporting volume and audience activity are not measures of market growth or investment readiness.',
                'Several records may repeat the same announcement rather than provide independent confirmation.',
                'The 30-day window can omit older constraints, failed projects and developments receiving little coverage.',
            ],
            diligence_questions: [
                'Which primary filings, legal instruments and official notices substantiate these reports?',
                'Which named entity owns delivery, financing, oversight and performance reporting?',
                'Which milestones have been completed, delayed, revised or cancelled?',
                'What current evidence would contradict the apparent pattern in these records?',
            ],
            claim_ledger: [`The intersection is prominent in the current BOA-Story reporting set; records [1-${Math.max(1, evidencePoints.length)}] support that coverage observation.`],
            coverage_stories: Number(opportunity.article_count || 0),
            audience_response: Math.round(Number(opportunity.avg_score || 0)),
            latest_reported_at: opportunity.latest_reported_at,
            score: Math.round(Number(opportunity.avg_score || 0)),
            methodology: 'Ranked by BOA-Story reporting volume and recency. Audience response is descriptive platform activity, not an opportunity score.',
        };
    }));

    return { data, updated_at: new Date().toISOString() };
}

export { router as marketIntelRouter };
