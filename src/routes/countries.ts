// ═══════════════════════════════════════════════════════════════════════════════
// COUNTRIES ROUTER
// Endpoints for African country data
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Country } from '../types';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';
import { isCountryEvidenceStale, readCountryEvidence, refreshCountryEvidence } from '../lib/country-evidence';
import { diversifyCoverageRows } from '../lib/source-quality';
import { authoritativeCountryResources, mergeOfficialResources, type CountryOfficialResource } from '../lib/country-resources';

const router = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries - List all countries (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { region } = c.req.query();

    // Use cache for unfiltered list (most common case)
    if (!region) {
        const cachedResult = await getCached(
            c.env,
            CACHE_KEYS.COUNTRIES_LIST,
            async () => {
                const result = await c.env.DB.prepare('SELECT * FROM countries ORDER BY name ASC').all<Country>();
                return processCountries(result.results || []);
            },
            { ttl: CACHE_TTL.STATIC }
        );

        // Group by region
        const grouped: Record<string, typeof cachedResult> = {
            North: [],
            West: [],
            East: [],
            Central: [],
            Southern: [],
        };

        for (const country of cachedResult) {
            if (grouped[country.region]) {
                grouped[country.region].push(country);
            }
        }

        // Refinement: Add Regional Insights (RAG)
        // We do this concurrently for all regions to be fast
        const regions = Object.keys(grouped);
        const insights: Record<string, string> = {};

        await Promise.all(regions.map(async (region) => {
            // Check cache for insight
            const cacheKey = `insight:region:v4:${region}`;
            const cachedInsight = await c.env.CACHE.get(cacheKey);

            if (cachedInsight) {
                insights[region] = cachedInsight;
                return;
            }

            try {
                const relevant = await c.env.DB.prepare(`
                    SELECT a.title, a.summary, a.published_at, a.source_url,
                           a.source_title, a.source_quality_tier, a.country_code,
                           c.name AS country_name
                    FROM articles a
                    JOIN countries c ON c.code = a.country_code
                    WHERE c.region = ? AND a.status = 'published'
                    ORDER BY a.published_at DESC
                    LIMIT 96
                `).bind(region).all();
                const balancedRelevant = diversifyCoverageRows(relevant.results || [], 12);
                const context = balancedRelevant.map((article: any, index) =>
                    `[${index + 1}] ${article.title}\nCountry: ${article.country_name}\nPublished: ${article.published_at || 'date unavailable'}\nSource URL: ${article.source_url || 'unavailable'}\nEvidence: ${(article.summary || '').slice(0, 1100)}`
                ).join('\n---\n');

                const immediateBrief = balancedRelevant.slice(0, 5).map((article: any, index) =>
                    `${index + 1}. ${article.title} (${article.country_name}, ${article.published_at || 'date not recorded'}). ${(article.summary || '').slice(0, 320)}`
                ).join('\n\n');
                insights[region] = immediateBrief || `${region} Africa is represented by the country records and published coverage totals in this index.`;

                if (context) {
                    const prompt = `System: You are BOA-Story's regional evidence desk. Use only the numbered reporting records. Describe reporting activity accurately; do not present coverage volume as proof of economic performance. Cite records inline and distinguish facts, supported interpretation, uncertainty and gaps.\nUser: Produce a full regional evidence brief for ${region} Africa covering chronology, actors, documented mechanisms, country and sector differences, stakeholder effects, practical implications, counter-signals, alternative explanations, source limitations, claim ledger and verification priorities.\n\nRecords:\n${context}`;
                    c.executionCtx.waitUntil(
                        callConfiguredAI(c.env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' })
                            .then(text => text?.trim() ? c.env.CACHE.put(cacheKey, text.trim(), { expirationTtl: CACHE_TTL.ARCHIVE }) : undefined)
                            .then(() => undefined)
                            .catch(error => console.error(`Regional brief refresh failed for ${region}`, error))
                    );
                }
            } catch (e) {
                insights[region] = `${region} Africa is represented by the country records and published coverage totals in this index.`;
            }
        }));

        return c.json({
            data: cachedResult,
            by_region: Object.fromEntries(
                Object.entries(grouped).map(([r, countries]) => [
                    r,
                    { countries, ai_insight: insights[r] || "No current source-linked regional briefing is available." }
                ])
            ),
            total: cachedResult.length,
        });
    }

    // Filtered query - no cache (less frequent)
    const result = await c.env.DB.prepare('SELECT * FROM countries WHERE region = ? ORDER BY name ASC').bind(region).all<Country>();
    return c.json({ data: processCountries(result.results || []) });
});

// Helper to process country JSON fields
export function processCountries(countries: Country[]) {
    const parseJsonField = (val: unknown): string[] => {
        if (!val) return [];
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return []; }
        }
        return Array.isArray(val) ? val : [];
    };

    return countries.map(country => {
        const record = { ...country } as Record<string, unknown> & Pick<Country, 'code' | 'name' | 'region'>;

        // These legacy columns were populated before evidence-bearing resource
        // verification existed. Do not expose an unchecked URL or a synthetic
        // narrative/score as an official country fact.
        for (const field of [
            'visa_portal_url', 'business_portal_url', 'tourism_portal_url',
            'investment_agency_url', 'history_baobab_content',
            'diplomacy_score', 'image_strength_score', 'narrative_priority',
        ]) delete record[field];
        for (const [key, value] of Object.entries(record)) {
            if (value === null) delete record[key];
        }

        return {
            ...record,
            languages: parseJsonField(country.languages),
            investment_highlights: parseJsonField(country.investment_highlights),
            tourism_highlights: parseJsonField(country.tourism_highlights),
            official_resources: authoritativeCountryResources(country.code, country.name),
            data_quality: {
                authoritative_country_profile: true,
                legacy_portals_exposed: false,
                metric_basis: 'Official observations retain their provider year and are not converted into country scores.',
            },
        };
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/regions - List regions with country counts
// ───────────────────────────────────────────────────────────────────────────────
router.get('/regions', async (c) => {
    const result = await c.env.DB.prepare(`
    SELECT region, COUNT(*) as country_count
    FROM countries
    GROUP BY region
    ORDER BY region
  `).all<{ region: string; country_count: number }>();

    return c.json({ data: result.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/stats - Overall statistics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats', async (c) => {
    const [countryCount, articleStats, regionCount] = await Promise.all([
        c.env.DB.prepare('SELECT COUNT(*) as total FROM countries').first<{ total: number }>(),
        c.env.DB.prepare(`
            SELECT COUNT(*) as total_articles, SUM(view_count) as total_views
            FROM articles WHERE status = 'published'
        `).first<{ total_articles: number; total_views: number }>(),
        c.env.DB.prepare(`
            SELECT COUNT(DISTINCT region) as regions FROM countries
        `).first<{ regions: number }>(),
    ]);

    return c.json({
        total_countries: countryCount?.total || 54,
        total_articles: (articleStats as Record<string, any>)?.total_articles || 0,
        total_views: (articleStats as Record<string, any>)?.total_views || 0,
        regions: regionCount?.regions || 5,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code - Single country details (OPTIMIZED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();

    // First, get the country (quick lookup)
    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first<Country>();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Cache the country stats (article count, sector breakdown, recent articles)
    const stats = await getCached(
        c.env,
        CACHE_KEYS.countryStats(code),
        async () => {
            // Combined query: get article count, sector breakdown, and recent articles in parallel
            const [articleCount, recentArticles, sectorBreakdown] = await Promise.all([
                c.env.DB.prepare(
                    "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
                ).bind(code).first<{ total: number }>(),
                c.env.DB.prepare(`
                    SELECT id, slug, title, summary, sector_id, published_at, source_url,
                           country_code, source_title, source_quality_tier
                    FROM articles
                    WHERE country_code = ? AND status = 'published'
                    ORDER BY published_at DESC
                    LIMIT 30
                `).bind(code).all(),
                c.env.DB.prepare(`
                    SELECT s.id, s.name, s.icon, COUNT(a.id) as article_count
                    FROM sectors s
                    LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ? AND a.status = 'published'
                    GROUP BY s.id
                    HAVING article_count > 0
                    ORDER BY article_count DESC
                `).bind(code).all(),
            ]);

            return {
                article_count: articleCount?.total || 0,
                top_sectors: (sectorBreakdown.results || []).map((s: any) => ({
                    sector: { name: s.name },
                    count: s.article_count
                })),
                recent_articles: diversifyCoverageRows(recentArticles.results || [], 5, 5, 1),
            };
        },
        { ttl: CACHE_TTL.DASHBOARD } // 10 minutes
    );

    const countrySituationKey = `${CACHE_KEYS.countrySituation(code)}:source-v2`;
    const countrySituation = await getCachedValue<string>(c.env, countrySituationKey);
    const situationEvidenceRows = stats.recent_articles as any[];
    const situationFallback = situationEvidenceRows.length
        ? situationEvidenceRows.map((article, index) => `${index + 1}. ${article.title} (${article.published_at || 'date not recorded'}). ${(article.summary || '').slice(0, 420)}`).join('\n\n')
        : `${country.name} is represented by its country profile and the published coverage totals in this record.`;
    if (!countrySituation && situationEvidenceRows.length) {
        c.executionCtx.waitUntil(
            getCached(c.env, countrySituationKey, async () => {
                const evidence = situationEvidenceRows.map((article, index) =>
                    `[${index + 1}] ${article.title}\nPublished: ${article.published_at || 'date unavailable'}\nSource URL: ${article.source_url || 'unavailable'}\nEvidence: ${(article.summary || '').slice(0, 1200)}`
                ).join('\n---\n');
                try {
                    const prompt = `System: You are BOA-Story's country evidence desk. Use only the numbered records, cite them inline, distinguish reported facts from supported interpretation, identify contradictions, alternative explanations and gaps, and do not infer country conditions from coverage volume.\nUser: Produce a complete current situation dossier for ${country.name}, including scope, chronology, actors, documented mechanisms, stakeholder impacts, sector interactions, policy and operating implications, counter-signals, source limitations, a claim ledger and prioritized verification steps.\n\nRecords:\n${evidence}`;
                    const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });
                    return aiResponse?.trim() || situationFallback;
                } catch { return situationFallback; }
            }, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
    }

    return c.json({
        country: processCountries([country])[0],
        stats: {
            article_count: stats.article_count,
            top_sectors: stats.top_sectors,
        },
        recent_articles: stats.recent_articles,
        ai_situation_report: countrySituation || situationFallback
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/dashboard - Country dashboard data
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/dashboard', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first<Country>();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get comprehensive dashboard data
    const [
        totalArticles,
        totalViews,
        recentArticles,
        topArticles,
        sectorBreakdown,
        monthlyTrend,
    ] = await Promise.all([
        c.env.DB.prepare(
            "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(
            "SELECT SUM(view_count) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(`
      SELECT id, slug, title, summary, sector_id, published_at, view_count
      FROM articles
      WHERE country_code = ? AND status = 'published'
      ORDER BY published_at DESC
      LIMIT 10
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT id, slug, title, view_count, engagement_score
      FROM articles
      WHERE country_code = ? AND status = 'published'
      ORDER BY (engagement_score * 1.0 / ((julianday('now') - julianday(published_at)) + 1)) DESC
      LIMIT 5
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT s.id, s.name, s.icon, s.color, COUNT(a.id) as count
      FROM sectors s
      LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ? AND a.status = 'published'
      GROUP BY s.id
      HAVING count > 0
      ORDER BY count DESC
    `).bind(code).all(),

        c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', published_at) as month,
        COUNT(*) as count
      FROM articles
      WHERE country_code = ? AND status = 'published'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).bind(code).all(),
    ]);

    return c.json({
        country,
        stats: {
            total_articles: totalArticles?.total || 0,
            total_views: totalViews?.total || 0,
        },
        recent_articles: recentArticles.results || [],
        top_articles: topArticles.results || [],
        sector_breakdown: sectorBreakdown.results || [],
        monthly_trend: monthlyTrend.results || [],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/economics - Economic indicators for ArticleDetailPage
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/economics', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, gdp_usd, population, diplomacy_score, image_strength_score
        FROM countries
        WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    const data = country as Record<string, any>;

    return c.json({
        code: data.code,
        name: data.name,
        recorded_gdp_usd: Number(data.gdp_usd || 0),
        recorded_population: Number(data.population || 0),
        evidence_fields_present: Number(data.gdp_usd != null) + Number(data.population != null),
        methodology: 'These are the country table observations currently recorded by BOA-Story. This endpoint does not infer GDP growth or stability from media, engagement or image fields.'
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /countries/:code/relationships - Diplomatic and trade relationships
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:code/relationships', async (c) => {
    const code = c.req.param('code').toUpperCase();

    const country = await c.env.DB.prepare(`
        SELECT code, name, region, diplomacy_score, image_strength_score
        FROM countries WHERE code = ?
    `).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found' }, 404);
    }

    const data = country as Record<string, any>;
    const diplomacyScore = data.diplomacy_score || 0.5;

    // Relationships: Removed mocked logic. In future, use real analysis.
    const relationships = await getCached(
        c.env,
        CACHE_KEYS.countryRelationships(code),
        async () => {
            // SEARCH: Find news about relationships
            const query = `diplomatic relations trade agreement partnership ${data.name}`;
            const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
            const vector = (embedding as Record<string, any>).data[0];
            const relevant = await c.env.VECTORS.query(vector, { topK: 8, returnMetadata: true });

            const context = relevant.matches.map((match, index) => {
                const metadata = match.metadata as Record<string, any>;
                return `[${index + 1}] ${metadata.published_at || 'date unavailable'} — ${metadata.title || 'Untitled record'}\n${metadata.text || metadata.summary || 'Evidence excerpt unavailable.'}\nURL: ${metadata.source_url || metadata.url || 'unavailable'}`;
            }).join('\n\n');
            if (!context) return [];

            // Extract only relationships actually evidenced in the records.
            try {
                const prompt = `System: You are BOA-Story's diplomatic and trade evidence desk. Use only the numbered records. Do not infer a formal relationship from co-mention, and do not assign partnership strength, sentiment or strategic importance without explicit evidence. Cite records inline.

User: Extract the documented relationships involving ${data.name}. Return ONLY a valid JSON array with this schema:
[{"partner":"named country, institution or bloc","type":"documented relationship type","context":"250-400 words covering the dated event, actors, terms, documented mechanism, stakeholder effects, immediate and conditional implications, counter-signals, alternative explanations, source limitations, verification priorities and [n] citations"}]

Exclude any relationship that cannot be supported. Return [] when evidence is insufficient.

RECORDS:
${context}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 4200, temperature: 0.2, response_profile: 'structured-analysis', structured_output: true });
                const jsonMatch = (aiResponse || '').match(/\[.*\]/s);
                return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            } catch (e) {
                return [];
            }
        },
        { ttl: CACHE_TTL.STATIC } // 6 hours
    );

    return c.json({
        country_code: code,
        country_name: data.name,
        relationships: relationships,
        updated_at: new Date().toISOString()
    });
});

// Detailed, source-explicit country dossier. External observations retain their
// source year and unit; forecasts are separated from historical observations.
router.get('/:code/dossier', async (c) => {
    const code = c.req.param('code').toUpperCase();
    const reqLang = c.req.query('lang')?.toLowerCase();
    const portugueseJoin = reqLang === 'pt'
        ? "LEFT JOIN article_translations pt ON pt.article_id = a.id AND pt.language = 'pt' AND pt.quality >= 0"
        : '';
    const dossierTitle = reqLang === 'pt' ? 'COALESCE(pt.title, a.title)' : 'a.title';
    const dossierSummary = reqLang === 'pt' ? 'COALESCE(pt.summary, a.summary)' : 'a.summary';
    const country = await c.env.DB.prepare('SELECT * FROM countries WHERE code = ?').bind(code).first<Record<string, any>>();
    if (!country) return c.json({ error: 'not_found', message: 'Country not found' }, 404);

    let [externalEvidence, events, sectors, evidence, verifiedResources] = await Promise.all([
        readCountryEvidence(c.env, code),
        c.env.DB.prepare(`SELECT id, title, category, date_start, date_end, location, registration_url AS source_url
            FROM events WHERE country_code = ? AND date_start >= date('now') ORDER BY date_start ASC LIMIT 12`).bind(code).all(),
        c.env.DB.prepare(`SELECT s.id, s.name, COUNT(a.id) article_count, MAX(a.published_at) latest_evidence_at
            FROM sectors s JOIN articles a ON a.sector_id=s.id
            WHERE a.country_code=? AND a.status='published' GROUP BY s.id ORDER BY article_count DESC, s.name ASC`).bind(code).all(),
        c.env.DB.prepare(`SELECT ${dossierTitle} AS title, a.slug, ${dossierSummary} AS summary,
                a.source_url, COALESCE(NULLIF(TRIM(a.source_title), ''), a.source_url) AS source_name,
                a.source_quality_tier, a.sector_id, s.name AS sector_name,
                a.published_at, a.updated_at, a.reviewed_at
            FROM articles a
            ${portugueseJoin}
            LEFT JOIN sectors s ON s.id = a.sector_id
            WHERE a.country_code=? AND a.status='published' AND a.source_url IS NOT NULL
            ORDER BY a.published_at DESC LIMIT 40`).bind(code).all(),
        c.env.DB.prepare(`SELECT label AS name, url, verified_at, verification_source_url
            FROM country_official_resources
            WHERE country_code = ? AND status = 'verified' AND verified_at IS NOT NULL
            ORDER BY resource_type ASC, label ASC`).bind(code).all<CountryOfficialResource>()
            .catch(() => ({ results: [] })),
    ]);

    if (!externalEvidence) {
        // This is only the first-ever cache fill. Scheduled rotation keeps all
        // country snapshots warm thereafter, so normal readers never wait on
        // World Bank, IMF or Comtrade network calls.
        externalEvidence = await refreshCountryEvidence(c.env, { code, name: String(country.name) }, { fast: true });
        if (externalEvidence) {
            const enrichment = refreshCountryEvidence(c.env, { code, name: String(country.name) }).catch((error) => {
                console.error(`Country evidence enrichment failed for ${code}:`, error);
            });
            try {
                c.executionCtx.waitUntil(enrichment);
            } catch {
                void enrichment;
            }
        }
    } else if (isCountryEvidenceStale(externalEvidence)) {
        const refresh = refreshCountryEvidence(c.env, { code, name: String(country.name) }).catch((error) => {
            console.error(`Country evidence background refresh failed for ${code}:`, error);
        });
        try {
            c.executionCtx.waitUntil(refresh);
        } catch {
            void refresh;
        }
    }

    if (!externalEvidence) {
        return c.json({
            error: 'evidence_refresh_in_progress',
            message: 'The first verified official-source snapshot is being assembled. Retry shortly.',
            country_code: code,
        }, 503);
    }

    const officialResources = mergeOfficialResources(
        authoritativeCountryResources(code, String(country.name)),
        (verifiedResources.results || []).map(resource => ({
            ...resource,
            source_type: 'verified official portal' as const,
        })),
    );

    c.header('Cache-Control', 'no-store, max-age=0');
    return c.json({
        country: processCountries([country as Country])[0],
        dossier: {
            macroeconomics: {
                ...externalEvidence.macroeconomics,
            },
            trade: externalEvidence.trade,
            sector_evidence: sectors.results || [],
            upcoming_events: events.results || [],
            recent_source_record: evidence.results || [],
            official_resources: officialResources,
            freshness: externalEvidence.freshness,
        },
        provenance: {
            sources: [
                { name: 'World Bank Open Data', section: 'macroeconomics', url: 'https://data.worldbank.org/' },
                { name: 'IMF DataMapper / World Economic Outlook', section: 'macroeconomics', url: 'https://www.imf.org/external/datamapper/' },
                { name: 'UN Comtrade', section: 'trade', url: 'https://comtradeplus.un.org/' },
                { name: 'BOA source-linked reporting', section: 'evidence', url: 'https://boa-story.com/stories' },
            ],
            generated_at: externalEvidence.retrieved_at,
            retrieved_at: externalEvidence.retrieved_at,
            methodology: 'Official observations retain their provider reporting period and unit. Retrieval time is shown separately and never changes an observation year. IMF projections are labelled separately from historical values. An empty provider response is never converted to a zero. The last verified snapshot is retained; World Bank goods-and-services totals can substitute for an unavailable UN Comtrade merchandise record, and an IMF current-account outlook is shown as external-sector evidence when neither provider returns verified trade totals.',
        },
    });
});

export { router as countriesRouter };
