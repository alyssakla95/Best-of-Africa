import { Hono } from 'hono';
import type { Env, Variables, MarketIntelligence } from '../../types';
import { requireApiKey, rateLimit } from '../../lib/auth';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../../lib/cache';
import { callConfiguredAI } from '../../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();


// GET /market-intel/performance - -Powered Sector Performance (for MarketIntelPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/performance', async (c) => {
    // Parse lens (defaults to investor)
    const lens = (c.req.query('lens') || 'investor') as string;
    const validLenses = ['investor', 'government', 'explorer'];
    const activeLens = validLenses.includes(lens) ? lens : 'investor';
    // 1. Get base sector data with article stats
    const sectors = await c.env.DB.prepare(`
        SELECT s.id, s.name,
               COUNT(a.id) as article_count,
               SUM(a.view_count) as total_views,
               AVG(a.engagement_score) as avg_engagement
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
        GROUP BY s.id
    `).all();

    // 2. Get financial metrics for data-grounded scoring
    const metrics = await c.env.DB.prepare(`
        SELECT sector_id, growth_rate, regulatory_outlook 
        FROM market_metrics 
        WHERE year = 2026
    `).all();

    const metricMap = new Map();
    (metrics.results || []).forEach((m: any) => {
        metricMap.set(m.sector_id, m);
    });

    // 3. Generate -powered performance metrics per sector (RAG-enhanced)
    const performance = await Promise.all((sectors.results || []).map(async (s: any) => {
        const metric = metricMap.get(s.id);

        // --- RAG-Enhanced Sector Analysis (cached 6h per sector) ---
        const aiResult = await getCached(
            c.env,
            `perf:rag:${s.id}:${activeLens}:v3`,
            async () => {
                // 1. Get recent articles with titles + summaries for context depth
                const recentArticles = await c.env.DB.prepare(`
                    SELECT title, summary, engagement_score, published_at FROM articles
                    WHERE sector_id = ? AND status = 'published'
                    ORDER BY published_at DESC
                    LIMIT 8
                `).bind(s.id).all();

                const articles = (recentArticles.results || []) as any[];
                if (articles.length === 0) {
                    return { score: null, volatility: null, insight: null };
                }

                // 2. RAG: Vector search for the most investment-relevant content in this sector
                let ragContext = '';
                try {
                    const lensQueries: Record<string, string> = {
                        investor: `${s.name} Africa intrinsic value earnings stability margin of safety investment outlook`,
                        government: `${s.name} Africa governance regulatory policy development impact trade integration`,
                        explorer: `${s.name} Africa tourism hospitality destinations safety cultural experiences`
                    };
                    const query = lensQueries[activeLens];
                    const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
                    const vector = (embedding as Record<string, any>).data[0];
                    const relevant = await c.env.VECTORS.query(vector, {
                        topK: 5,
                        returnMetadata: 'all',
                        filter: { sector_id: s.id }
                    });
                    ragContext = relevant.matches
                        .map(m => (m.metadata as Record<string, any>)?.text || (m.metadata as Record<string, any>)?.title || '')
                        .filter(Boolean)
                        .join('\n---\n')
                        .slice(0, 2000);
                } catch (e) { /* RAG unavailable, proceed with DB data */ }

                // 3. Calculate engagement variance for volatility signal
                const scores = articles.map(a => a.engagement_score || 0).filter(s => s > 0);
                const avgEng = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                const variance = scores.length > 1
                    ? Math.sqrt(scores.reduce((sum, sc) => sum + Math.pow(sc - avgEng, 2), 0) / scores.length)
                    : 0;

                // 4. Build rich context for 
                const articleContext = articles.map((a, i) =>
                    `${i + 1}. "${a.title}" — ${(a.summary || '').slice(0, 150)} [Engagement: ${a.engagement_score || 'N/A'}]`
                ).join('\n');

                const financialContext = metric
                    ? `Growth Rate: ${metric.growth_rate}%, Regulatory Outlook: ${metric.regulatory_outlook}`
                    : 'No financial data available';

                try {
                    let systemContent = '';
                    if (activeLens === 'investor') {
                        systemContent = `You are a VALUE INVESTMENT STRATEGIST trained in the Benjamin Graham school. You analyze African sector performance through the lens of intrinsic value, margin of safety, earnings stability, and financial strength.\n\nAnalyze the "${s.name}" sector using ALL provided data:\n- Recent article headlines and summaries (signal quality)\n- Engagement variance (${variance.toFixed(1)} stddev — high variance = volatile sentiment)\n- Financial metrics when available\n- RAG-retrieved deep context from the knowledge base\n\nProduce a GRAHAM-STYLE assessment:\n\n1. **Score (0-100)**: Based on VALUE INVESTMENT thesis. Consider:\n   - Does the sector exhibit stable, predictable earnings patterns?\n   - Is the sector trading below intrinsic value (margin of safety)?\n   - Are financial fundamentals strong (low debt, high dividends)?\n   - Is there defensive value (pension-grade) or enterprising value?\n   Score guide: 80+ = Strong intrinsic value with margin of safety. 60-79 = Enterprising value, requires monitoring. 40-59 = Speculative, insufficient margin. <40 = Overvalued or deteriorating.\n\n2. **Volatility ("Low"/"Med"/"High")**: Based on earnings consistency, NOT price momentum.\n   - Stable earnings across articles = Low. Mixed signals = Med. Erratic/conflicting = High.\n\n3. **Insight**: One precise sentence (max 15 words) stating the Graham-style value assessment.\n\nRespond ONLY with valid JSON:\n{"score": <number>, "volatility": "<Low|Med|High>", "insight": "<string>"}`;
                    } else if (activeLens === 'government') {
                        systemContent = `You are a CHIEF POLICY STRATEGIST advising African heads of state. You analyze sector performance through governance quality, fiscal sustainability, development impact, and regulatory frameworks.\n\nAnalyze the "${s.name}" sector using ALL provided data:\n- Recent article headlines and summaries\n- Engagement variance (${variance.toFixed(1)} stddev)\n- Financial metrics when available\n- RAG-retrieved deep context\n\nProduce a GOVERNANCE ASSESSMENT:\n\n1. **Score (0-100)**: Based on GOVERNANCE & POLICY outlook. Consider:\n   - Is the regulatory environment supportive or restrictive?\n   - What is the development impact (jobs, GDP contribution, SDG alignment)?\n   - Is there political stability and policy continuity in this sector?\n   Score guide: 80+ = Priority sector, strong governance support. 60-79 = Strategic potential, some regulatory gaps. 40-59 = Monitor, governance risks present. <40 = Diplomatic caution, significant policy risk.\n\n2. **Volatility ("Low"/"Med"/"High")**: Based on regulatory certainty and political stability.\n\n3. **Insight**: One precise sentence (max 15 words) summarizing the governance/policy take.\n\nRespond ONLY with valid JSON:\n{"score": <number>, "volatility": "<Low|Med|High>", "insight": "<string>"}`;
                    } else {
                        systemContent = `You are a PREMIER AFRICA TRAVEL STRATEGIST for discerning global travelers. You analyze sector relevance through the lens of tourism potential, hospitality infrastructure, cultural richness, and travel safety.\n\nAnalyze the "${s.name}" sector using ALL provided data:\n- Recent article headlines and summaries\n- Engagement variance (${variance.toFixed(1)} stddev)\n- Financial metrics when available\n- RAG-retrieved deep context\n\nProduce an EXPLORER ASSESSMENT:\n\n1. **Score (0-100)**: Based on TOURISM & EXPLORER appeal. Consider:\n   - Does this sector enhance travel experiences (hospitality, infrastructure, culture)?\n   - Is there visitor-relevant safety and accessibility?\n   - Are there unique, world-class experiences in this sector?\n   Score guide: 80+ = Unmissable, world-class tourism relevance. 60-79 = Highly recommended for travelers. 40-59 = Worth exploring if combined with other sectors. <40 = Limited traveler relevance.\n\n2. **Volatility ("Low"/"Med"/"High")**: Based on travel safety consistency and seasonal variations.\n\n3. **Insight**: One precise sentence (max 15 words) summarizing the explorer/tourism take.\n\nRespond ONLY with valid JSON:\n{"score": <number>, "volatility": "<Low|Med|High>", "insight": "<string>"}`;
                    }

                    const userContent = `SECTOR: ${s.name}\nARTICLES (${articles.length} recent):\n                            ${articleContext}\n\nFINANCIAL DATA: ${financialContext}\nARTICLE COUNT: ${s.article_count} total | AVG ENGAGEMENT: ${Math.round(avgEng)} / 100 | ENGAGEMENT STDDEV: ${variance.toFixed(1)}\nTOTAL VIEWS: ${s.total_views || 0}\n\n${ragContext ? `DEEP CONTEXT (from knowledge base):\n${ragContext}` : ''}`;
                    const prompt = `System: ${systemContent}\nUser: ${userContent}`;
                    const rawText = await callConfiguredAI(c.env, { prompt, max_tokens: 300, temperature: 0.2 });

                    const raw = rawText || '';
                    const match = raw.match(/\{.*\}/s);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        const score = typeof parsed.score === 'number' ? Math.min(98, Math.max(5, parsed.score)) : null;
                        const vol = ['Low', 'Med', 'High'].includes(parsed.volatility) ? parsed.volatility : null;
                        const insight = typeof parsed.insight === 'string' ? parsed.insight.slice(0, 100) : null;
                        return { score, volatility: vol, insight };
                    }
                    return { score: null, volatility: null, insight: null };
                } catch (e) {
                    return { score: null, volatility: null, insight: null };
                }
            },
            { ttl: 3600 * 6 } // Cache results for 6 hours
        );

        // --- Blend score with data-grounded score (70% , 30% data) ---
        let dataScore = 50;
        if (metric?.growth_rate) {
            dataScore = Math.min(98, Math.max(40, 40 + (metric.growth_rate * 5)));
        } else if (s.avg_engagement) {
            dataScore = Math.round(s.avg_engagement);
        }

        let finalScore: number;
        if (aiResult.score !== null) {
            finalScore = Math.round(aiResult.score * 0.7 + dataScore * 0.3);
        } else {
            finalScore = dataScore;
        }

        // --- Volatility: prefer , fallback to data ---
        let volatility = aiResult.volatility || 'Med';
        if (!aiResult.volatility) {
            if (metric?.regulatory_outlook) {
                volatility = metric.regulatory_outlook === 'Positive' ? 'Low' :
                    metric.regulatory_outlook === 'Volatile' ? 'High' : 'Med';
            } else {
                volatility = s.article_count > 20 ? 'Low' : s.article_count > 5 ? 'Med' : 'High';
            }
        }

        return {
            sector_id: s.id,
            sector_name: s.name,
            growth_yoy: finalScore,
            volatility,
            article_count: s.article_count || 0,
            total_views: s.total_views || 0,
            ai_insight: aiResult.insight || null
        };
    }));

    return c.json({
        data: performance,
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/leading-sector - Top performing sector (for MarketIntelPage header)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/leading-sector', async (c) => {
    const result = await c.env.DB.prepare(`
        SELECT s.name,
                        SUM(a.view_count) as total_views,
                        COUNT(a.id) as article_count
        FROM sectors s
        INNER JOIN articles a ON a.sector_id = s.id 
        WHERE a.status = 'published' 
          AND a.published_at > datetime('now', '-7 days')
        GROUP BY s.id
        ORDER BY total_views DESC
        LIMIT 1
                        `).first();

    if (!result) {
        return c.json({
            name: 'General Market',
            growth: 0,
            trend: 'flat'
        });
    }

    const data = result as Record<string, any>;
    const growth = Math.min(5 + (data.article_count * 0.8), 20);

    return c.json({
        name: data.name,
        growth: parseFloat(growth.toFixed(1)),
        trend: 'up',
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sentiment-divergence - Country reality vs perception (for NarrativesPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sentiment-divergence', async (c) => {
    const countries = await c.env.DB.prepare(`
        SELECT c.code, c.name,
                        c.diplomacy_score,
                        c.image_strength_score,
                        COUNT(a.id) as article_count,
                        AVG(a.engagement_score) as avg_engagement
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
        GROUP BY c.code
        ORDER BY article_count DESC
        LIMIT 5
                        `).all();

    const divergence = await Promise.all((countries.results || []).map(async (c: any) => {
        // Reality Check (RAG)
        const reality = await getCached(
            c.env,
            CACHE_KEYS.marketSentiment(c.code),
            async () => {
                const query = `political stability economic outlook ${c.name}`;
                try {
                    const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
                    const vector = (embedding as Record<string, any>).data[0];
                    const relevant = await c.env.VECTORS.query(vector, { topK: 3, returnMetadata: true });
                    const context = relevant.matches.map((m: any) => (m.metadata as Record<string, any>).title).join('\n');

                    const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: Country: ${c.name}.Recent News: \n${context}`;
                    const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 50, temperature: 0.2 });
                    const score = parseInt((aiResponse || '').replace(/[^0-9]/g, ''));
                    return isNaN(score) ? 50 : score;
                } catch (e) { return 50; }
            },
            { ttl: CACHE_TTL.DASHBOARD }
        );

        // Perception is purely the engagement score (media attention), scaled
        const perception = Math.round((c.avg_engagement || 0) * 1.2);
        const gap = reality - perception;

        return {
            country_code: c.code,
            country_name: c.name,
            reality_score: reality,
            perception_score: perception,
            gap: gap
        };
    }));

    const avgGap = divergence.length > 0
        ? Math.round(divergence.reduce((sum, d) => sum + d.gap, 0) / divergence.length)
        : 25;

    return c.json({
        average_divergence: avgGap,
        countries: divergence,
        updated_at: new Date().toISOString()
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

    const [articleStats, recentArticles] = await Promise.all([
        c.env.DB.prepare(`
            SELECT COUNT(*) as count, AVG(engagement_score) as avg_engagement
            FROM articles 
            WHERE sector_id = ? AND status = 'published'
                        `).bind(sectorId).first(),

        c.env.DB.prepare(`
            SELECT engagement_score FROM articles 
            WHERE sector_id = ? AND status = 'published' 
            AND published_at > datetime('now', '-30 days')
            ORDER BY published_at DESC
            LIMIT 20
                        `).bind(sectorId).all()
    ]);

    const stats = articleStats as Record<string, any>;
    const articles = (recentArticles.results || []) as any[];

    // Calculate volatility from engagement variance
    const scores = articles.map(a => a.engagement_score || 50);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
    const variance = scores.length > 0
        ? scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length
        : 0;
    const volatilityScore = Math.sqrt(variance);

    const volatilityIndex = volatilityScore > 20 ? 'HIGH'
        : volatilityScore > 10 ? 'MODERATE'
            : 'LOW';

    // Supply chain status based on article count and engagement
    // Supply Chain Analysis
    const supplyChain = await getCached(
        c.env,
        CACHE_KEYS.sectorSupplyChain(sectorId),
        async () => {
            const query = `supply chain logistics disruption shortage ${sectorId}`; // simplified query using sectorId as keyword proxy
            try {
                const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [query] });
                const vector = (embedding as Record<string, any>).data[0];
                const relevant = await c.env.VECTORS.query(vector, { topK: 3, returnMetadata: true });
                const context = relevant.matches.map(m => (m.metadata as Record<string, any>).title).join('\n');

                const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: Sector Context: \n${context}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 150, temperature: 0.2 });

                const raw = aiResponse || '';
                const match = raw.match(/\{.*\}/s);
                return match ? JSON.parse(match[0]) : { upstream: 'Stable', midstream: 'Strain', downstream: 'Stable' };
            } catch (e) {
                return { upstream: 'Stable', midstream: 'Strain', downstream: 'Stable' };
            }
        },
        { ttl: CACHE_TTL.DASHBOARD }
    );

    const upstream = supplyChain.upstream;
    const midstream = supplyChain.midstream;
    const downstream = supplyChain.downstream;

    // Confidence score based on data quality
    const articleCount = articles.length;
    const confidence = Math.min(95, 70 + (articleCount / 5) + (scores.length / 2));

    return c.json({
        sector_id: sectorId,
        volatility_index: volatilityIndex,
        volatility_score: Math.round(volatilityScore),
        supply_chain: { upstream, midstream, downstream },
        confidence: Number(confidence.toFixed(1)),
        data_points: articleCount,
        updated_at: new Date().toISOString()
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
                        COUNT(*) as count,
                        AVG(engagement_score) as avg_engagement
        FROM articles 
        WHERE sector_id = ? AND status = 'published' 
        AND published_at > datetime('now', '-35 days')
        GROUP BY week
        ORDER BY week ASC
        LIMIT 5
                        `).bind(sectorId).all();

    const data = (weeklyData.results || []) as any[];

    // Generate 5-point trend from data
    let trend: number[];
    if (data.length >= 2) {
        trend = data.map(d => Math.round(d.avg_engagement || d.count * 5));
    } else {
        // Not enough data for a trend - return empty
        trend = [];
    }

    // Ensure values are in 0-30 range for sparkline
    const normalizedTrend = trend.map(v => Math.min(30, Math.max(5, v / 3)));

    return c.json({
        sector_id: sectorId,
        trend: normalizedTrend,
        direction: normalizedTrend[4] > normalizedTrend[0] ? 'up' : 'down',
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/sector/:id/velocity - Sector velocity metrics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/velocity', async (c) => {
    const sectorId = c.req.param('id');

    // Get sector metrics from market_metrics table
    const metrics = await c.env.DB.prepare(`
        SELECT growth_rate, investment_volume_usd, market_size_usd
        FROM market_metrics
        WHERE sector_id = ?
                        ORDER BY year DESC
        LIMIT 1
                        `).bind(sectorId).first() as Record<string, any>;

    // Get article count for "active projects"
    const articleStats = await c.env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM articles
        WHERE sector_id = ? AND status = 'published'
        AND published_at > datetime('now', '-30 days')
                        `).bind(sectorId).first() as Record<string, any>;

    // Calculate 5-year CAGR from available data or use growth rate
    const cagr = metrics?.growth_rate || 8.5;
    const dealFlow = metrics?.investment_volume_usd || metrics?.market_size_usd || 0;
    const activeProjects = articleStats?.count || 0;

    return c.json({
        sector_id: sectorId,
        cagr_5yr: Number(cagr.toFixed(1)),
        deal_flow_usd: dealFlow,
        active_projects: activeProjects,
        updated_at: new Date().toISOString()
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /market-intel/opportunities - High-growth intersections
// ───────────────────────────────────────────────────────────────────────────────
router.get('/opportunities', async (c) => {
    const opportunities = await c.env.DB.prepare(`
        SELECT 
            c.code as country_code,
                        c.name as country_name,
                        s.id as sector_id,
                        s.name as sector_name,
                        COUNT(a.id) as article_count,
                        AVG(a.engagement_score) as avg_score,
                        (SELECT title FROM articles a2 WHERE a2.country_code = a.country_code AND a2.sector_id = a.sector_id ORDER BY (a2.engagement_score * 1.0 / ((julianday('now') - julianday(a2.published_at)) + 1)) DESC LIMIT 1) as top_title,
                    (SELECT summary FROM articles a2 WHERE a2.country_code = a.country_code AND a2.sector_id = a.sector_id ORDER BY (a2.engagement_score * 1.0 / ((julianday('now') - julianday(a2.published_at)) + 1)) DESC LIMIT 1) as top_summary
        FROM articles a
        JOIN countries c ON a.country_code = c.code
        JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'published'
        GROUP BY c.code, s.id
        ORDER BY avg_score DESC
        LIMIT 6
    `).all();

    const formatted = (opportunities.results || []).map((o: any) => ({
        country_code: o.country_code,
        country_name: o.country_name,
        sector_id: o.sector_id,
        sector_name: o.sector_name,
        title: o.top_title || `${o.sector_name} Activity`,
        summary: o.top_summary || `Analysis pending for ${o.country_name}.`,
        score: Math.round(o.avg_score || 0)
    }));

    // If no real data, fallback to generated examples based on real countries
    if (formatted.length === 0) {
        return c.json({ data: [] });
    }

    return c.json({ data: formatted });
});

export { router as marketIntelRouter };


export { router as analyticsRouter };
