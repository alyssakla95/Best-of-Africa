// ═══════════════════════════════════════════════════════════════════════════════
// INTELLIGENCE ROUTER
// Premium paid APIs for governments, investors, partners
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, CountryReport, AudienceInsights } from '../types';
import { requireApiKey, rateLimit } from '../lib/auth';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';
import { validate, CountryCodeParamSchema, UuidParamSchema, AiChatSchema, AiReframeSchema, AiReformatSchema } from '../lib';
import { z } from 'zod';
import { diversifyCoverageRows } from '../lib/source-quality';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply API key auth and rate limiting to premium intelligence routes
// Excludes /audience, which is public
router.use('/country/*', requireApiKey);
router.use('/country/*', rateLimit);

router.use('/sector/*', requireApiKey);
router.use('/sector/*', rateLimit);

router.use('/campaigns', requireApiKey);
router.use('/campaigns', rateLimit);
router.use('/campaigns/*', requireApiKey);
router.use('/campaigns/*', rateLimit);

// Rate-limit -heavy public endpoints to prevent quota exhaustion
router.use('/reframe', rateLimit);
router.use('/reformat', rateLimit);
router.use('/synthesize-unified', rateLimit);
router.use('/analyst', rateLimit);

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/country/:code/report - Deep country analysis (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code/report', validate('param', CountryCodeParamSchema), async (c) => {
  const { code } = (c.req as any).valid('param');

  // Get country first (quick lookup, no cache needed)
  const country = await c.env.DB.prepare(
    `SELECT code, name, region, COALESCE(flag_emoji, '') AS flag_emoji,
            COALESCE(NULLIF(description, ''), name || ' country reporting evidence from BOA-Story.') AS description
     FROM countries WHERE code = ?`
  ).bind(code).first();

  if (!country) {
    return c.json({ error: 'not_found', message: 'Country not found' }, 404);
  }

  // Cache the comprehensive report for 30 minutes
  const report = await getCached(
    c.env,
    `${CACHE_KEYS.intelCountryReport(code)}:source-v2`,
    async () => {
      // Gather comprehensive data
      const [
        articleCount,
        topSectors,
        recentArticles,
      ] = await Promise.all([
        c.env.DB.prepare(
          "SELECT COUNT(*) as total FROM articles WHERE country_code = ? AND status = 'published'"
        ).bind(code).first<{ total: number }>(),

        c.env.DB.prepare(`
          SELECT s.id, s.name, COALESCE(s.icon, 'bar-chart') AS icon, COUNT(a.id) as count
          FROM sectors s
          JOIN articles a ON a.sector_id = s.id
          WHERE a.country_code = ? AND a.status = 'published'
          GROUP BY s.id
          ORDER BY count DESC
          LIMIT 5
        `).bind(code).all(),

        c.env.DB.prepare(`
          SELECT id, slug, title, COALESCE(summary, title) AS summary,
                 COALESCE(sector_id, 'general') AS sector_id,
                 COALESCE(published_at, updated_at, created_at) AS published_at,
                 COALESCE(engagement_score, 0) AS engagement_score,
                 country_code, source_title, source_quality_tier
          FROM articles
          WHERE country_code = ? AND status = 'published'
          ORDER BY published_at DESC
          LIMIT 80
        `).bind(code).all(),
      ]);
      const balancedRecentArticles = diversifyCoverageRows(recentArticles.results || [], 10, 10, 1);

      // Identify narrative gaps
      const gaps = await c.env.DB.prepare(`
        SELECT s.name
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ?
        WHERE a.id IS NULL
      `).bind(code).all<{ name: string }>();

      const recommendationKey = `intel:country:${code}:recommendations:v2`;
      const cachedRecommendations = await getCachedValue<string[]>(c.env, recommendationKey);
      const recommendationFallback = (balancedRecentArticles as any[]).slice(0, 3).map((article, index) =>
        `${index + 1}. Verify the institutions, dates and primary documents behind “${article.title}”. The BOA-Story record was published ${article.published_at || 'on an unrecorded date'} and should be checked against current official, regulatory and financial evidence before a decision.`
      );
      if (!cachedRecommendations && balancedRecentArticles.length) {
        c.executionCtx.waitUntil(
          getCached(c.env, recommendationKey, () => generateAIRecommendations(c.env, (country as Record<string, any>).name, balancedRecentArticles), { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
      }

      return {
        country: country as any,
        article_count: articleCount?.total || 0,
        top_sectors: (topSectors.results || []).map((s: any) => ({
          sector: { id: s.id, name: s.name, icon: s.icon } as any,
          count: s.count,
        })),
        recent_articles: balancedRecentArticles as any,
        evidence_profile: {
          published_articles: Number(articleCount?.total || 0),
          sectors_represented: (topSectors.results || []).length,
          source_records_reviewed: balancedRecentArticles.length,
          latest_reported_at: (balancedRecentArticles[0] as Record<string, any> | undefined)?.published_at || 'No published country record',
        },
        methodology: 'BOA-Story does not infer sentiment, investment readiness or tourism appeal from article count, engagement or sector mentions. Use the source-linked recommendations and primary evidence instead.',
        narrative_gaps: (gaps.results || []).map((g: any) => g.name),
        recommendations: cachedRecommendations || recommendationFallback,
      } as CountryReport;
    },
    { ttl: CACHE_TTL.INTEL } // 30 minutes
  );

  return c.json(report);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/sector/:id/trends - Sector intelligence (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id/trends', validate('param', UuidParamSchema), async (c) => {
  const { id: sectorId } = (c.req as any).valid('param');

  const sector = await c.env.DB.prepare(
    'SELECT * FROM sectors WHERE id = ?'
  ).bind(sectorId).first();

  if (!sector) {
    return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
  }

  // Cache sector trends for 30 minutes
  const trends = await getCached(
    c.env,
    CACHE_KEYS.intelSectorTrends(sectorId),
    async () => {
      const [
        countryBreakdown,
        monthlyTrend,
        topArticles,
        regionBreakdown,
      ] = await Promise.all([
        c.env.DB.prepare(`
          SELECT c.code, c.name, c.flag_emoji, COUNT(a.id) as count, SUM(a.view_count) as views
          FROM countries c
          JOIN articles a ON a.country_code = c.code
          WHERE a.sector_id = ? AND a.status = 'published'
          GROUP BY c.code
          ORDER BY views DESC
          LIMIT 15
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
          SELECT 
            strftime('%Y-%m', published_at) as month,
            COUNT(*) as articles,
            SUM(view_count) as views
          FROM articles
          WHERE sector_id = ? AND status = 'published'
          GROUP BY month
          ORDER BY month DESC
          LIMIT 12
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
          SELECT a.id, a.slug, a.title, a.summary, a.source_url, a.country_code, c.name as country_name,
                 a.view_count, a.engagement_score, a.published_at,
                 a.source_title, a.source_quality_tier
          FROM articles a
          JOIN countries c ON a.country_code = c.code
          WHERE a.sector_id = ? AND a.status = 'published'
          ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
          LIMIT 80
        `).bind(sectorId).all(),

        c.env.DB.prepare(`
          SELECT c.region, COUNT(a.id) as count, SUM(a.view_count) as views
          FROM countries c
          JOIN articles a ON a.country_code = c.code
          WHERE a.sector_id = ? AND a.status = 'published'
          GROUP BY c.region
          ORDER BY views DESC
        `).bind(sectorId).all(),
      ]);

      const balancedTopArticles = diversifyCoverageRows(topArticles.results || [], 10);
      const sectorAnalysisKey = `${CACHE_KEYS.intelSectorAnalysis(sectorId)}:source-v2`;
      const generateSectorReport = async () => {
          const evidence = (balancedTopArticles as any[]).slice(0, 10).map((article, index) =>
            `[${index + 1}] ${article.title}\nCountry: ${article.country_name}\nPublished: ${article.published_at || 'date unavailable'}\nSource URL: ${article.source_url || 'unavailable'}\nCoverage engagement: ${article.engagement_score ?? 'unavailable'}\nEvidence: ${(article.summary || '').slice(0, 1200)}`
          ).join('\n---\n');
          if (!evidence) return "Insufficient evidence for deep analysis.";

          try {
            const prompt = `System: You are BOA-Story's sector evidence desk. Use only the numbered reporting records. Cite records inline, distinguish facts from analysis, and treat engagement as audience activity rather than market performance. Do not call a development a growth signal or regulatory risk unless the record supports that classification.\nUser: Produce a sector evidence analysis with chronology, named actors, cross-country differences, operational and policy implications, counter-signals, limitations, and next diligence steps.\n\nRecords:\n${evidence}`;
            const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });
            return aiResponse?.trim();
          } catch (e) {
            return "Analysis currently unavailable.";
          }
      };
      const aiReport = await getCachedValue<string>(c.env, sectorAnalysisKey);
      if (!aiReport && balancedTopArticles.length) {
        c.executionCtx.waitUntil(
          getCached(c.env, sectorAnalysisKey, generateSectorReport, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
      }
      const immediateSectorReport = (balancedTopArticles as any[]).slice(0, 6).map((article, index) =>
        `${index + 1}. ${article.title} (${article.country_name}, ${article.published_at || 'date not recorded'}). ${(article.summary || '').slice(0, 420)}`
      ).join('\n\n') || `The sector report is grounded in the country, regional and monthly coverage records returned with this response.`;

      return {
        by_country: countryBreakdown.results || [],
        by_region: regionBreakdown.results || [],
        monthly_trend: monthlyTrend.results || [],
        top_articles: balancedTopArticles,
        ai_analyst_report: aiReport || immediateSectorReport
      };
    },
    { ttl: CACHE_TTL.INTEL } // 30 minutes
  );

  return c.json({
    sector,
    ...trends,
  });
});


// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/audience - Audience insights
// ───────────────────────────────────────────────────────────────────────────────
router.get('/audience', async (c) => {
  const { period = '30d' } = c.req.query();

  // Fetch data for audience insights
  const [
    viewStats,
    topCountryInterest,
    topSectorInterest,
  ] = await Promise.all([
    c.env.DB.prepare(`
      SELECT 
        SUM(view_count) as total_views,
        COUNT(DISTINCT country_code) as countries_covered,
        AVG(avg_read_time_seconds) as avg_read_time
      FROM articles
      WHERE status = 'published'
    `).first(),

    c.env.DB.prepare(`
      SELECT c.region as name, ROUND(SUM(a.view_count) * 100.0 / (
        SELECT SUM(view_count) FROM articles WHERE status = 'published'
      )) as percentage
      FROM articles a
      JOIN countries c ON a.country_code = c.code
      WHERE a.status = 'published'
      GROUP BY c.region
      ORDER BY percentage DESC
    `).all<{ name: string; percentage: number }>(),

    c.env.DB.prepare(`
      SELECT s.name as topic, ROUND(AVG(a.engagement_score) * 100) as score
      FROM articles a
      JOIN sectors s ON a.sector_id = s.id
      WHERE a.status = 'published'
      GROUP BY s.id
      ORDER BY score DESC
      LIMIT 10
    `).all<{ topic: string; score: number }>(),
  ]);


  // Real demographics data pending analytics integration
  const demographics: any[] = [];


  // Get real engagement trends based on content publication
  const trendData = await c.env.DB.prepare(`
    SELECT 
      date(published_at) as date,
      SUM(view_count) as views
    FROM articles
    WHERE status = 'published' AND published_at > datetime('now', '-7 days')
    GROUP BY date(published_at)
    ORDER BY date ASC
  `).all();

  const engagement_trends = (trendData.results || []).map((d: any) => ({
    date: d.date,
    views: d.views || 0
  }));

  // Return in format expected by AudienceInsightsPage.tsx
  return c.json({
    demographics,
    regions: topCountryInterest.results || [],
    interests: topSectorInterest.results || [],
    engagement_trends
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/campaigns - Campaign management
// ───────────────────────────────────────────────────────────────────────────────
router.get('/campaigns', async (c) => {
  const clientId = c.get('clientId') as string;

  const campaigns = await c.env.DB.prepare(`
    SELECT * FROM campaigns
    WHERE client_id = ?
    ORDER BY created_at DESC
  `).bind(clientId).all();

  return c.json({ data: campaigns.results || [] });
});

router.get('/campaigns/:id', async (c) => {
  const clientId = c.get('clientId') as string;
  const campaignId = c.req.param('id');

  const campaign = await c.env.DB.prepare(`
    SELECT * FROM campaigns
    WHERE id = ? AND client_id = ?
  `).bind(campaignId, clientId).first();

  if (!campaign) {
    return c.json({ error: 'not_found', message: 'Campaign not found' }, 404);
  }

  // Get campaign articles
  const articles = await c.env.DB.prepare(`
    SELECT id, slug, title, view_count, published_at
    FROM articles
    WHERE sponsor_id = ? AND is_sponsored = 1
    ORDER BY published_at DESC
  `).bind(campaignId).all();

  return c.json({
    campaign: {
      ...campaign,
      delivery_methodology: 'Campaign impressions, clicks and article records are first-party observations. No ROI or impact projection is inferred from those delivery events.'
    },
    articles: articles.results || [],
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// Helper: Generate recommendations
// ───────────────────────────────────────────────────────────────────────────────


// ───────────────────────────────────────────────────────────────────────────────
// GET /intel/audience/reach - Aggregated platform reach metrics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/audience/reach', async (c) => {
  const [totalViews, uniqueArticles, countryReach] = await Promise.all([
    c.env.DB.prepare(`
      SELECT SUM(view_count) as total FROM articles WHERE status = 'published'
    `).first<{ total: number }>(),

    c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM articles WHERE status = 'published'
    `).first<{ total: number }>(),

    c.env.DB.prepare(`
      SELECT COUNT(DISTINCT country_code) as total FROM articles WHERE status = 'published'
    `).first<{ total: number }>()
  ]);

  const baseViews = totalViews?.total || 0;

  return c.json({
    total_views: baseViews,
    total_articles: uniqueArticles?.total || 0,
    countries_reached: countryReach?.total || 0,
    methodology: 'First-party article views only. No social multiplier, inferred reach or directional trend is applied.',
    updated_at: new Date().toISOString()
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/-chat - RAG-powered Consultant
// ───────────────────────────────────────────────────────────────────────────────
router.post('/analyst', validate('json', AiChatSchema), async (c) => {
  const { message } = (c.req as any).valid('json');
  if (!message) return c.json({ error: 'Message required' }, 400);

  try {
    // 1. Generate Embedding for Query
    const embeddingResponse = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [message]
    });
    const queryVector = (embeddingResponse as Record<string, any>).data[0];

    // 2. Search Vector Database (RAG)
    // Query best-of-africa-content index
    const vectorResults = await c.env.VECTORS.query(queryVector, {
      topK: 10,
      returnMetadata: true
    });

    // 3. Retrieve Context
    const matches = vectorResults.matches || [];
    const contextDocs = matches.map(m => {
      const meta = m.metadata as Record<string, any>;
      return `[Source ${m.id}]\nTitle: ${meta.title || 'Unknown'}\nSnippet: ${meta.text || ''}\nPublished: ${meta.published_at || 'date unavailable'}\nURL: ${meta.source_url || meta.url || 'URL unavailable'}`;
    }).join('\n---\n');

    // 4. Generate the evidence response with the enforced information model.
    const systemPrompt = `You are the research synthesis layer for BOA-Story. Current date: ${new Date().toISOString().slice(0, 10)}.

Write a detailed, decision-useful answer using ONLY the supplied evidence. Never fill gaps with general knowledge, invented figures, assumed market conditions, or generic claims such as "the outlook remains stable". Cite claims inline as [Source ID]. Distinguish reported facts from your synthesis.

Use this structure when the evidence supports it:
1. Direct answer — a precise 2-4 sentence conclusion.
2. Evidence — dated facts, actors, amounts and locations, each with citations.
3. Context and chronology — what changed and when.
4. Implications — separately for investors/operators and government/policy users; label these as analysis.
5. Counter-evidence and uncertainty — contradictions, missing records and source limitations.
6. What to verify next — concrete primary documents or data needed for diligence.

Aim for 3,200-4,800 words when evidence is sufficiently rich. Include an evidence boundary, full chronology, documented mechanisms, implementation status, named stakeholders, first-, second- and conditional-order implications, alternative explanations, counter-evidence, source limitations, a full claim ledger and prioritized verification steps. If the retrieved record is thin, do not pad the response: explain exactly what is missing and provide a shorter answer. Never issue an investment recommendation, country-risk score, forecast, safety rating or probability unless the supplied evidence contains a dated methodology supporting it.
    
    REAL-TIME CONTEXT FROM DATABASE:
    ${contextDocs}`;

    const prompt = `System: ${systemPrompt}\nUser: ${message}`;
    const llmResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' });

    return c.json({
      response: llmResponse,
      sources: matches.map(m => (m.metadata as Record<string, any>).title)
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return c.json({ error: 'Editorial analysis service failed', details: String(error) }, 500);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/reframe - Rewrite article for specific audience (Analyst Lens)
// DEEP PERSONALIZATION: Now injects country/sector context
// ───────────────────────────────────────────────────────────────────────────────
router.post('/reframe', validate('json', AiReframeSchema), async (c) => {
  const { articleId, lens: rawLens, targetAudience } = (c.req as any).valid('json');
  const lens = rawLens || targetAudience;

  // 1. Fetch Article with Context (Country + Sector)
  const article = await c.env.DB.prepare(`
    SELECT 
      a.content, 
      a.title,
      c.name as country_name,
      c.gdp_growth,
      c.investment_score,
      s.name as sector_name
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.id = ?
  `).bind(articleId).first();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  // 2. Build Context Object for Deep Personalization
  const contextData = {
    countryName: (article as Record<string, any>).country_name || undefined,
    sectorName: (article as Record<string, any>).sector_name || undefined,
    gdp: (article as Record<string, any>).gdp_growth ? `${(article as Record<string, any>).gdp_growth}% YoY` : undefined,
    stability: (article as Record<string, any>).investment_score
      ? `${(article as Record<string, any>).investment_score}/100 (Investment Score)`
      : undefined
  };

  try {
    const { optimizeForAudience } = await import('../lib/ai');
    const rewrittenContent = await optimizeForAudience(
      c.env,
      (article as Record<string, any>).content,
      lens as any,
      contextData
    );

    return c.json({
      original_id: articleId,
      lens,
      context: contextData,
      content: rewrittenContent
    });
  } catch (e) {
    console.error('Reframe Error:', e);
    return c.json({ error: 'Failed to reframe content' }, 500);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/reformat - Adapt content format (Briefing Mode)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/reformat', validate('json', AiReformatSchema), async (c) => {
  const { articleId, format } = (c.req as any).valid('json');

  const article = await c.env.DB.prepare(
    'SELECT content FROM articles WHERE id = ?'
  ).bind(articleId).first();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  try {
    const { adaptContentFormat } = await import('../lib/ai');
    const reformattedContent = await adaptContentFormat(
      c.env,
      (article as Record<string, any>).content,
      format as any
    );

    return c.json({
      original_id: articleId,
      format: format,
      content: reformattedContent
    });
  } catch (e) {
    console.error('Reformat Error:', e);
    return c.json({ error: 'Failed to reformat content' }, 500);
  }
});


// ───────────────────────────────────────────────────────────────────────────────
// Helper: Strategic Recommendations
// ───────────────────────────────────────────────────────────────────────────────
async function generateAIRecommendations(env: Env, countryName: string, articles: any[]): Promise<string[]> {
  try {
    const evidence = articles.slice(0, 12).map((article, index) =>
      `[${index + 1}] ${article.published_at || 'date unavailable'} — ${article.title}\n${article.summary || 'Summary unavailable.'}`
    ).join('\n\n');
    if (!evidence) return [];

    const prompt = `System: You are BOA-Story's country evidence desk. Use only the numbered records. Do not infer market growth, investment readiness, political stability or tourism appeal from article volume or engagement. Distinguish reported facts from analysis and cite record numbers inline.

User: Produce exactly three substantive next-step recommendations for a reader researching ${countryName}. Each recommendation must be 500-700 words and contain: the supported finding, named actors and dates, documented mechanism, affected stakeholders, immediate and conditional implications, a counter-signal or alternative explanation, evidence limitations, and concrete primary-source verification steps. If a recommendation cannot be supported, explain the missing evidence instead. Return ONLY a valid JSON array of three strings.

RECORDS:
${evidence}`;
    const text = await callConfiguredAI(env, { prompt, max_tokens: 4200, temperature: 0.2, response_profile: 'structured-analysis', structured_output: true });

    const jsonMatch = (text || '').match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string' && item.trim()).slice(0, 3) : [];

  } catch (e) {
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /intel/synthesize-unified - Generate all perspectives in one call
// ZERO-FRICTION: No user selection needed - delivers complete analysis
// ───────────────────────────────────────────────────────────────────────────────
router.post('/synthesize-unified', validate('json', z.object({ articleId: z.string().uuid() })), async (c) => {
  const { articleId } = (c.req as any).valid('json');

  if (!articleId) {
    return c.json({ error: 'Missing articleId' }, 400);
  }

  // Fetch article with context
  const article = await c.env.DB.prepare(`
    SELECT 
      a.content, 
      a.title,
      c.name as country_name,
      c.gdp_growth,
      s.name as sector_name
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.id = ?
  `).bind(articleId).first();

  if (!article) {
    return c.json({ error: 'Article not found' }, 404);
  }

  try {
    const { synthesizeUnifiedBriefing } = await import('../lib/ai');

    const briefing = await synthesizeUnifiedBriefing(
      c.env,
      (article as Record<string, any>).content,
      {
        countryName: (article as Record<string, any>).country_name || undefined,
        sectorName: (article as Record<string, any>).sector_name || undefined,
        gdp: (article as Record<string, any>).gdp_growth ? `${(article as Record<string, any>).gdp_growth}%` : undefined
      }
    );

    return c.json({
      article_id: articleId,
      title: (article as Record<string, any>).title,
      briefing
    });
  } catch (e) {
    console.error('Unified Synthesis Error:', e);
    return c.json({ error: 'Failed to synthesize briefing' }, 500);
  }
});

export { router as intelligenceRouter };
