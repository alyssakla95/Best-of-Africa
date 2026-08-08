// ═══════════════════════════════════════════════════════════════════════════════
// ARTICLES ROUTER
// Public endpoints for article content
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Article, ArticleListItem, PaginatedResponse, Variables } from '../types';
import { trackEvent } from '../lib/analytics';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { validate, ArticleQuerySchema, SlugParamSchema, CountryCodeParamSchema, UuidParamSchema } from '../lib';
import { callConfiguredAI } from '../lib/ai';
import { generateAudioNarration } from '../lib/audio';
import { verifyJWT } from '../lib/auth';
import { publisherNameForStoredArticle } from '../lib/source-attribution';
import { getMedia, putMedia } from '../lib/media';
import { normalisePortuguesePortugal1945, portugueseCountryName, portugueseSectorName } from '../lib/portuguese';
import { diversifyCoverageRows } from '../lib/source-quality';

// Temporary read-only stakeholder review mode. Keep authenticated actions
// (including paid TTS generation) protected; only article truncation is lifted.
const PAYWALL_DISABLED_FOR_REVIEW = true;

// ───────────────────────────────────────────────────────────────────────────────
// Helper: resolve the ACTIVE member behind a Bearer JWT (or null)
// ───────────────────────────────────────────────────────────────────────────────
// A signed JWT alone must not unlock member content: tokens live 30 days, so a
// cancelled or expired membership would otherwise keep full access until the
// token ran out. Validate the client row is still active and unexpired.
// datetime(expires_at) normalizes the stored ISO 'T'/'Z' format to SQLite's
// space format before comparing — a raw string compare would treat any
// membership as active for its entire expiry DAY ('T' > ' ' at position 10).
async function activeMemberId(env: Env, authHeader: string | undefined): Promise<string | null> {
    if (!authHeader?.startsWith('Bearer ')) return null;
    const payload = await verifyJWT(authHeader.slice(7), env.JWT_SECRET);
    if (!payload?.sub) return null;
    const row = await env.DB.prepare(`
        SELECT 1 AS ok FROM clients
        WHERE id = ? AND is_active = 1
          AND (expires_at IS NULL OR datetime(expires_at) > datetime('now'))
    `).bind(payload.sub).first();
    return row ? payload.sub : null;
}

const router = new Hono<{ Bindings: Env; Variables: Variables }>();
const READER_LANGUAGES = new Set(['fr', 'ar', 'pt', 'de', 'hi', 'zh']);
const SOURCE_IMAGE_MAX_BYTES = 12 * 1024 * 1024;
const SOURCE_IMAGE_TYPES = new Set(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']);

function isEligiblePublisherUrl(url: URL): boolean {
    const hostname = url.hostname.toLowerCase();
    return url.protocol === 'https:'
        && hostname.includes('.')
        && hostname !== 'localhost'
        && !hostname.endsWith('.local')
        && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
        && !hostname.includes(':');
}

function sourceImageResponse(body: ReadableStream | ArrayBuffer, contentType: string, etag: string): Response {
    return new Response(body, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000',
            ETag: etag,
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}

function sourceImageFailure(status: 404 | 502, message: string): Response {
    return Response.json(
        { error: status === 404 ? 'not_found' : 'image_unavailable', message },
        { status, headers: { 'Cache-Control': 'no-store' } },
    );
}

export async function localizeArticleList<T extends { id?: string; country_code?: string | null; country_name?: string | null; sector_name?: string | null }>(env: Env, rows: T[], language: string | undefined): Promise<T[]> {
    if (!language || !READER_LANGUAGES.has(language) || !rows.length) return rows;
    const ids = rows.map(row => row.id).filter((id): id is string => !!id);
    if (!ids.length) return rows;
    const placeholders = ids.map(() => '?').join(',');
    const translations = await env.DB.prepare(`
        SELECT article_id, title, subtitle, summary
        FROM article_translations
        WHERE language = ? AND quality >= 0 AND article_id IN (${placeholders})
    `).bind(language, ...ids).all<{ article_id: string; title: string; subtitle: string | null; summary: string | null }>();
    const byId = new Map((translations.results || []).map(translation => [translation.article_id, translation]));
    return rows.flatMap(row => {
        const translation = row.id ? byId.get(row.id) : undefined;
        if (!translation) return language === 'pt' ? [] : [row];
        return [{
            ...row,
            title: language === 'pt' ? normalisePortuguesePortugal1945(translation.title) : translation.title,
            ...(translation.subtitle ? { subtitle: language === 'pt' ? normalisePortuguesePortugal1945(translation.subtitle) : translation.subtitle } : {}),
            ...(translation.summary ? { summary: language === 'pt' ? normalisePortuguesePortugal1945(translation.summary) : translation.summary } : {}),
            ...(language === 'pt' && row.country_name ? { country_name: portugueseCountryName(row.country_code, row.country_name) } : {}),
            ...(language === 'pt' && row.sector_name ? { sector_name: portugueseSectorName(row.sector_name) } : {}),
            title_language: language,
        }];
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles - List articles with pagination and filters
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', validate('query', ArticleQuerySchema), async (c) => {
    const query = (c.req as any).valid('query') as z.infer<typeof ArticleQuerySchema>;
    const {
        page,
        limit,
        country,
        sector,
        region,
        sort,
        order,
        urgency,
        lens
    } = query;

    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, Math.min(100, limit));
    const offset = (pageNum - 1) * limitNum;

    // Build query
    const reqLang = c.req.query('lang')?.toLowerCase();
    let whereClause = "WHERE a.status = 'published'";
    const params: unknown[] = [];

    if (reqLang === 'pt') {
        whereClause += " AND EXISTS (SELECT 1 FROM article_translations pt WHERE pt.article_id = a.id AND pt.language = 'pt' AND pt.quality >= 0 AND length(trim(pt.title)) > 0)";
    }

    if (country) {
        whereClause += ' AND a.country_code = ?';
        params.push(country.toUpperCase());
    }

    if (sector) {
        whereClause += ' AND a.sector_id = ?';
        params.push(sector);
    }

    if (region) {
        whereClause += ' AND a.country_code IN (SELECT code FROM countries WHERE region = ?)';
        params.push(region);
    }

    // Add urgency filter
    if (urgency && urgency !== 'Normal') {
        whereClause += ' AND a.urgency = ?';
        params.push(urgency);
    }

    // Use a whitelist map — never interpolate user input directly into SQL
    const SORT_COLUMN_MAP: Record<string, string> = {
        published_at: 'a.published_at',
        engagement_score: 'a.engagement_score',
        view_count: 'a.view_count',
        created_at: 'a.created_at',
    };
    const sortCol = SORT_COLUMN_MAP[sort] ?? 'a.published_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    let total = 0;
    let articleResults: ArticleListItem[] = [];

    try {
        const countResult = await c.env.DB.prepare(
            `SELECT COUNT(*) as total FROM articles a ${whereClause}`
        ).bind(...params).first<{ total: number }>();

        total = countResult?.total || 0;

        // Get articles with country and sector names
        const articles = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.subtitle, a.summary,
      a.country_code, c.name as country_name, c.flag_emoji as country_flag,
      a.sector_id, s.name as sector_name,
      a.hero_image_url, a.image_credit, a.image_source_url, a.reading_time_minutes,
      a.published_at, a.engagement_score, a.is_sponsored,
      a.audio_url, a.audio_duration_seconds, a.source_title, a.source_quality_tier
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    ${whereClause}
    ORDER BY a.is_sponsored DESC, ${sortCol} ${sortOrder}, a.id DESC
    LIMIT ? OFFSET ?
  `).bind(...params, Math.min(200, limitNum * 6), offset).all<ArticleListItem & { source_title?: string | null }>();

        articleResults = await localizeArticleList(
            c.env,
            diversifyCoverageRows(articles.results || [], limitNum, country ? limitNum : 2, 1),
            reqLang,
        );
    } catch (err) {
        console.error('[articles] list query failed:', err);
        return c.json({ error: 'internal_error', message: 'Failed to load articles' }, 500);
    }

    const response: PaginatedResponse<ArticleListItem> = {
        data: articleResults,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            total_pages: Math.ceil(total / limitNum),
        },
    };

    c.header('X-Total-Count', total.toString());
    c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
    return c.json(response);
});

// ───────────────────────────────────────────────────────────────────────────────
// Reader-facing headline lists apply hard country and publisher caps through
// diversifyCoverageRows. They may deliberately return fewer records instead
// of filling the tail with one dominant market or source.
// GET /articles/featured - Get featured/trending articles (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/featured', validate('query', ArticleQuerySchema.pick({ limit: true, lens: true })), async (c) => {
    const { limit, lens } = (c.req as any).valid('query') as { limit: number; lens?: string };
    const limitNum = limit;
    const reqLang = c.req.query('lang')?.toLowerCase();
    const portugueseOnly = reqLang === 'pt'
        ? " AND EXISTS (SELECT 1 FROM article_translations pt WHERE pt.article_id = a.id AND pt.language = 'pt' AND pt.quality >= 0 AND length(trim(pt.title)) > 0)"
        : '';

    // Build where clause for lens
    let lensWhereClause = '';
    const lensParams: unknown[] = [];
    if (lens) {
        lensWhereClause = ' AND a.lens = ?';
        lensParams.push(lens);
    }

    // Cache featured articles for 5 minutes
    const articles = await getCached(
        c.env,
        `${CACHE_KEYS.ARTICLES_FEATURED}:coverage-v3:${limitNum}:${lens || 'all'}:${reqLang || 'en'}`,
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT 
                  a.id, a.slug, a.title, a.subtitle, a.summary,
                  a.country_code, c.name as country_name, c.flag_emoji,
                  a.sector_id, s.name as sector_name,
                  a.hero_image_url, a.image_credit, a.image_source_url, a.reading_time_minutes,
                  a.published_at, a.engagement_score,
                  a.ai_investor_brief, a.ai_push_message, a.ai_social_post,
                  a.audio_url, a.audio_duration_seconds, a.source_title, a.source_quality_tier
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published' ${lensWhereClause} ${portugueseOnly}
                ORDER BY a.curated DESC, ((a.engagement_score + 3.0) / pow((julianday('now') - julianday(a.published_at)) + 2, 1.3)) DESC, a.published_at DESC, a.id DESC
                LIMIT ?
            `).bind(...lensParams, Math.min(200, limitNum * 8)).all();
            return diversifyCoverageRows((result.results || []) as Array<{ country_code?: string | null; source_title?: string | null }>, limitNum);
        },
        { ttl: CACHE_TTL.FREQUENT }
    );

    // Global Briefing (The "World View")
    const evidenceArticles = (articles as unknown as ArticleListItem[]).slice(0, 12);
    const evidence = evidenceArticles.map((article, index) =>
                `[${index + 1}] ${article.published_at || 'date unavailable'} — ${article.title}\n${article.summary || 'Summary unavailable.'}`
    ).join('\n\n');
    const generateGlobalBriefing = async () => {
            if (!evidence) return "No source-linked briefing is currently available.";

            try {
                const prompt = `System: You are BOA-Story's front-page evidence editor. Use only the numbered records, cite them inline and distinguish facts from synthesis. Coverage volume is editorial activity, not a market indicator.\nUser: Write a substantive briefing that connects the leading records across countries and sectors. Cover chronology, named actors, mechanisms, practical implications, counter-signals, source limitations and what readers should verify next.\n\nRecords:\n${evidence}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' });
                return aiResponse?.trim();
            } catch (e) {
                return "The source-linked briefing is temporarily unavailable.";
            }
    };
    const globalBriefing = await getCachedValue<string>(c.env, CACHE_KEYS.globalBriefing);
    if (!globalBriefing && evidence) {
        c.executionCtx.waitUntil(
            getCached(c.env, CACHE_KEYS.globalBriefing, generateGlobalBriefing, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
    }
    const recordBriefing = evidenceArticles.slice(0, 5).map((article, index) =>
        `${index + 1}. ${article.title}. ${(article.summary || '').slice(0, 320)}`
    ).join('\n\n');

    const localizedArticles = await localizeArticleList(c.env, articles as ArticleListItem[], reqLang);
    const portugueseBriefing = localizedArticles.slice(0, 5).map((article, index) =>
        `${index + 1}. ${article.title}. ${(article.summary || '').slice(0, 320)}`
    ).join('\n\n');
    return c.json({
        data: localizedArticles,
        ai_global_briefing: reqLang === 'pt'
            ? `Informação actual sustentada por fontes\n\n${portugueseBriefing}`
            : globalBriefing || `Current source-linked reporting\n\n${recordBriefing}`,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/latest - Get latest articles (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/latest', validate('query', ArticleQuerySchema.pick({ limit: true })), async (c) => {
    const { limit } = (c.req as any).valid('query') as { limit: number };
    const limitNum = limit;
    const reqLang = c.req.query('lang')?.toLowerCase();
    const portugueseOnly = reqLang === 'pt'
        ? " AND EXISTS (SELECT 1 FROM article_translations pt WHERE pt.article_id = a.id AND pt.language = 'pt' AND pt.quality >= 0 AND length(trim(pt.title)) > 0)"
        : '';

    // Cache latest articles for 2 minutes
    const articles = await getCached(
        c.env,
        `${CACHE_KEYS.ARTICLES_LATEST}:coverage-v3:${limitNum}:${reqLang || 'en'}`,
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT 
                  a.id, a.slug, a.title, a.subtitle, a.summary,
                  a.country_code, c.name as country_name, c.flag_emoji,
                  a.sector_id, s.name as sector_name,
                  a.hero_image_url, a.image_credit, a.image_source_url, a.reading_time_minutes,
                  a.published_at, a.audio_url, a.audio_duration_seconds, a.source_title, a.source_quality_tier
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                 WHERE a.status = 'published' ${portugueseOnly}
                ORDER BY a.published_at DESC
                LIMIT ?
            `).bind(Math.min(200, limitNum * 8)).all();
            return diversifyCoverageRows((result.results || []) as Array<{ country_code?: string | null; source_title?: string | null }>, limitNum);
        },
        { ttl: CACHE_TTL.DYNAMIC }
    );

    return c.json({ data: await localizeArticleList(c.env, articles as ArticleListItem[], reqLang) });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/country/:code - Articles by country
// ───────────────────────────────────────────────────────────────────────────────
router.get('/country/:code', validate('param', CountryCodeParamSchema), validate('query', ArticleQuerySchema.pick({ page: true, limit: true })), async (c) => {
    const { code } = (c.req as any).valid('param') as { code: string };
    const { page, limit } = (c.req as any).valid('query') as { page: number; limit: number };

    const pageNum = page;
    const limitNum = limit;
    const offset = (pageNum - 1) * limitNum;
    const reqLang = c.req.query('lang')?.toLowerCase();
    const portugueseOnly = reqLang === 'pt'
        ? " AND EXISTS (SELECT 1 FROM article_translations pt WHERE pt.article_id = a.id AND pt.language = 'pt' AND pt.quality >= 0 AND length(trim(pt.title)) > 0)"
        : '';

    // Get country info
    const country = await c.env.DB.prepare(
        'SELECT * FROM countries WHERE code = ?'
    ).bind(code).first();

    if (!country) {
        return c.json({ error: 'not_found', message: 'Country not found' }, 404);
    }

    // Get articles
    const countResult = await c.env.DB.prepare(
        `SELECT COUNT(*) as total FROM articles a WHERE a.country_code = ? AND a.status = 'published' ${portugueseOnly}`
    ).bind(code).first<{ total: number }>();

    const total = countResult?.total || 0;

    const articles = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.subtitle, a.summary,
      a.sector_id, s.name as sector_name,
      a.hero_image_url, a.image_credit, a.image_source_url, a.reading_time_minutes,
      a.published_at, a.engagement_score, a.country_code, a.source_title, a.source_quality_tier
    FROM articles a
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.country_code = ? AND a.status = 'published' ${portugueseOnly}
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).bind(code, Math.min(200, limitNum * 6), offset).all();

    const countryArticles = diversifyCoverageRows(articles.results || [], limitNum, limitNum, 1);

    c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
    return c.json({
        country,
        articles: {
            data: await localizeArticleList(c.env, countryArticles, reqLang),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                total_pages: Math.ceil(total / limitNum),
            },
        },
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/sector/:id - Articles by sector
// ───────────────────────────────────────────────────────────────────────────────
router.get('/sector/:id', validate('param', UuidParamSchema), validate('query', ArticleQuerySchema.pick({ page: true, limit: true })), async (c) => {
    const { id: sectorId } = (c.req as any).valid('param') as { id: string };
    const { page, limit } = (c.req as any).valid('query') as { page: number; limit: number };

    const pageNum = page;
    const limitNum = limit;
    const offset = (pageNum - 1) * limitNum;
    const reqLang = c.req.query('lang')?.toLowerCase();
    const portugueseOnly = reqLang === 'pt'
        ? " AND EXISTS (SELECT 1 FROM article_translations pt WHERE pt.article_id = a.id AND pt.language = 'pt' AND pt.quality >= 0 AND length(trim(pt.title)) > 0)"
        : '';

    // Get sector info
    const sector = await c.env.DB.prepare(
        'SELECT * FROM sectors WHERE id = ?'
    ).bind(sectorId).first();

    if (!sector) {
        return c.json({ error: 'not_found', message: 'Sector not found' }, 404);
    }

    // Get articles
    const countResult = await c.env.DB.prepare(
        `SELECT COUNT(*) as total FROM articles a WHERE a.sector_id = ? AND a.status = 'published' ${portugueseOnly}`
    ).bind(sectorId).first<{ total: number }>();

    const total = countResult?.total || 0;

    const articles = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.subtitle, a.summary,
      a.country_code, c.name as country_name, c.flag_emoji,
      a.hero_image_url, a.image_credit, a.image_source_url, a.reading_time_minutes,
      a.published_at, a.engagement_score, a.source_title, a.source_quality_tier
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    WHERE a.sector_id = ? AND a.status = 'published' ${portugueseOnly}
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).bind(sectorId, Math.min(200, limitNum * 8), offset).all();

    const sectorArticles = diversifyCoverageRows(articles.results || [], limitNum);

    const sectorEvidenceRows = (sectorArticles as any[]).slice(0, 10);
    const sectorEvidence = sectorEvidenceRows.map((article, index) =>
                `[${index + 1}] ${article.published_at || 'date unavailable'} — ${article.title}\n${article.summary || 'Summary unavailable.'}`
    ).join('\n\n');
    const generateSectorOutlook = async () => {
            if (!sectorEvidence) return "The sector record currently contains no published reporting.";

            try {
                const prompt = `System: You are BOA-Story's sector evidence editor. Use only the numbered records and cite them inline. Do not infer growth, stability or investability from coverage or engagement.\nUser: Produce a detailed sector outlook covering the direct finding, chronology, named actors, cross-country differences, mechanisms, operating and policy implications, counter-signals, limitations and next diligence steps.\n\nRecords:\n${sectorEvidence}`;
                const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' });
                return aiResponse?.trim();
            } catch (e) {
                return sectorEvidenceRows.map(article => `${article.title}. ${article.summary || ''}`).join('\n\n');
            }
    };
    const sectorOutlookKey = CACHE_KEYS.sectorOutlook(sectorId);
    const aiOutlook = await getCachedValue<string>(c.env, sectorOutlookKey);
    if (!aiOutlook && sectorEvidence) {
        c.executionCtx.waitUntil(
            getCached(c.env, sectorOutlookKey, generateSectorOutlook, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
    }
    const immediateSectorOutlook = sectorEvidenceRows.slice(0, 5).map((article, index) =>
        `${index + 1}. ${article.title}. ${(article.summary || '').slice(0, 320)}`
    ).join('\n\n');

    c.header('Cache-Control', 'public, max-age=60, s-maxage=300');
    return c.json({
        sector: {
            ...sector,
            ai_outlook: aiOutlook || immediateSectorOutlook
        },
        articles: {
            data: await localizeArticleList(c.env, sectorArticles, reqLang),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                total_pages: Math.ceil(total / limitNum),
            },
        },
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/:id/image - Cached publisher-sourced editorial image
router.get('/:id/image', validate('param', z.object({ id: z.string().uuid() })), async (c) => {
    const { id } = (c.req as any).valid('param') as { id: string };
    const mediaKey = `source-images/${id}`;
    const cached = await getMedia(c.env, mediaKey);
    if (cached) return sourceImageResponse(cached.body, cached.contentType, cached.etag);

    const article = await c.env.DB.prepare(`
        SELECT hero_image_url, image_source_url
        FROM articles
        WHERE id = ? AND status = 'published'
        LIMIT 1
    `).bind(id).first<{ hero_image_url: string | null; image_source_url: string | null }>();
    if (!article?.hero_image_url) {
        return sourceImageFailure(404, 'No sourced image is attached to this article');
    }

    let imageUrl: URL;
    try {
        imageUrl = new URL(article.hero_image_url);
        if (!isEligiblePublisherUrl(imageUrl)) {
            return sourceImageFailure(404, 'No eligible sourced image is attached to this article');
        }
    } catch {
        return sourceImageFailure(404, 'No eligible sourced image is attached to this article');
    }

    const headers = new Headers({
        Accept: 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8',
        'User-Agent': 'BOA-Story/1.0 editorial image cache',
    });
    if (article.image_source_url) {
        try {
            const source = new URL(article.image_source_url);
            if (source.protocol === 'https:') headers.set('Referer', source.href);
        } catch { /* fetch without a referrer */ }
    }

    try {
        const upstream = await fetch(imageUrl, { headers, redirect: 'follow' });
        const contentType = (upstream.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
        const declaredSize = Number(upstream.headers.get('content-length') || 0);
        if (!upstream.ok || !SOURCE_IMAGE_TYPES.has(contentType) || declaredSize > SOURCE_IMAGE_MAX_BYTES) {
            return sourceImageFailure(502, 'The publisher image could not be retrieved');
        }
        const bytes = await upstream.arrayBuffer();
        if (!bytes.byteLength || bytes.byteLength > SOURCE_IMAGE_MAX_BYTES) {
            return sourceImageFailure(502, 'The publisher image could not be retrieved');
        }
        await putMedia(c.env, mediaKey, bytes, contentType);
        const stored = await getMedia(c.env, mediaKey);
        if (!stored) return sourceImageFailure(502, 'The publisher image could not be stored');
        return sourceImageResponse(stored.body, stored.contentType, stored.etag);
    } catch {
        return sourceImageFailure(502, 'The publisher image could not be retrieved');
    }
});

// GET /articles/:slug - Single article by slug (OPTIMIZED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:slug', validate('param', SlugParamSchema), async (c) => {
    const { slug } = (c.req as any).valid('param') as { slug: string };

    const article = await c.env.DB.prepare(`
    SELECT 
      a.*,
      c.name as country_name, c.flag_emoji, c.region,
      s.name as sector_name, s.icon as sector_icon
    FROM articles a
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE a.slug = ? AND a.status = 'published'
  `).bind(slug).first<Article & { country_name: string; sector_name: string }>();

    if (!article) {
        return c.json({ error: 'not_found', message: 'Article not found' }, 404);
    }

    // Two-tier byline: only human-reviewed (curated) stories carry the personal
    // byline; automated briefing coverage is attributed to the desk.
    const a = article as unknown as Record<string, unknown>;
    a.author_name = a.curated ? 'Mailles Cortes' : 'BOA Briefing Desk';
    a.source_title = publisherNameForStoredArticle(article);

    // Serve a quality-approved stored translation for every reader language
    // one exists (the pipeline auto-translates by country). ONLY the short
    // fields (title/subtitle/summary) are overlaid: m2m100 translates those
    // acceptably, but its BODY translations are truncated stumps and
    // repetition loops — serving them would be worse than English. The body
    // stays English until long-form translations are regenerated properly.
    // title_language / content_language tell the client what each block is in
    // so it can set text direction per block.
    const reqLang = (c.req.query('lang') || 'en').toLowerCase();
    a.title_language = 'en';
    a.content_language = 'en';
    if (['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(reqLang)) {
        const { enqueueArticleTranslation, getTranslation } = await import('../lib/translate');
        const targetLanguage = reqLang as 'fr' | 'ar' | 'pt' | 'de' | 'hi' | 'zh';
        const tr = await getTranslation(c.env, article.id, targetLanguage);
        // Shorts serve at any quality (even -1 rows keep usable m2m100 shorts —
        // -1 only means the BODY regeneration failed its gate).
        if (tr) {
            a.title = reqLang === 'pt' ? normalisePortuguesePortugal1945(tr.title) : tr.title;
            if (tr.subtitle) a.subtitle = reqLang === 'pt' ? normalisePortuguesePortugal1945(tr.subtitle) : tr.subtitle;
            if (tr.summary) a.summary = reqLang === 'pt' ? normalisePortuguesePortugal1945(tr.summary) : tr.summary;
            a.title_language = reqLang;
            // The body is served only once regenerated by the large model and
            // past the degeneracy gate (quality=1); legacy m2m100 bodies are
            // truncated garbage and stay unserved.
            if (tr.quality === 1 && tr.content) {
                a.content = reqLang === 'pt' ? normalisePortuguesePortugal1945(tr.content) : tr.content;
                a.content_language = reqLang;
            }
        }
        if (!tr || tr.quality !== 1 || !tr.content) {
            const queueTranslation = enqueueArticleTranslation(
                c.env,
                article.id,
                targetLanguage,
            );
            try {
                c.executionCtx.waitUntil(queueTranslation);
            } catch {
                void queueTranslation;
            }
        }
    }
    if (reqLang === 'pt') {
        a.country_name = portugueseCountryName(article.country_code, article.country_name);
        a.sector_name = portugueseSectorName(article.sector_name);
    }

    // Increment view count asynchronously
    c.executionCtx.waitUntil(
        c.env.DB.prepare(
            'UPDATE articles SET view_count = view_count + 1 WHERE id = ?'
        ).bind(article.id).run()
    );

    // Track analytics event
    c.executionCtx.waitUntil(
        trackEvent(c.env, {
            type: 'article_read',
            article_id: article.id,
            country_code: article.country_code || undefined,
            sector_id: article.sector_id || undefined,
        })
    );

    // Get related articles (CACHED by article ID)
    const related = await getCached(
        c.env,
        CACHE_KEYS.articleRelated(article.id),
        async () => {
            const result = await c.env.DB.prepare(`
                SELECT id, slug, title, summary, country_code, source_title, source_quality_tier,
                       hero_image_url, image_credit, image_source_url, reading_time_minutes
                FROM articles
                WHERE status = 'published'
                  AND id != ?
                  AND (country_code = ? OR sector_id = ?)
                ORDER BY ((engagement_score + 3.0) / pow((julianday('now') - julianday(published_at)) + 2, 1.3)) DESC, published_at DESC
                LIMIT 24
            `).bind(article.id, article.country_code, article.sector_id).all();
            return diversifyCoverageRows(result.results || [], 4);
        },
        { ttl: CACHE_TTL.FREQUENT } // 5 minutes
    );
    const localizedRelated = await localizeArticleList(
        c.env,
        related,
        reqLang,
    );

    type ArticleDecisionBrief = {
        key_takeaways: string[];
        strategic_implication: string;
        limitations?: string[];
        diligence_questions?: string[];
        claim_ledger?: string[];
    };

    const normaliseDecisionBrief = (brief: ArticleDecisionBrief): ArticleDecisionBrief => reqLang === 'pt'
        ? {
            key_takeaways: brief.key_takeaways.map(item => normalisePortuguesePortugal1945(item) || item),
            strategic_implication: normalisePortuguesePortugal1945(brief.strategic_implication) || brief.strategic_implication,
            ...(brief.limitations ? { limitations: brief.limitations.map(item => normalisePortuguesePortugal1945(item) || item) } : {}),
            ...(brief.diligence_questions ? { diligence_questions: brief.diligence_questions.map(item => normalisePortuguesePortugal1945(item) || item) } : {}),
            ...(brief.claim_ledger ? { claim_ledger: brief.claim_ledger.map(item => normalisePortuguesePortugal1945(item) || item) } : {}),
        }
        : brief;

    // Generate Executive Brief (Key Takeaways & Strategic Implications)
    const generateAiContext = async () => {
            const outputLanguage = reqLang === 'pt'
                ? `Write every human-readable JSON value in natural European Portuguese from Portugal, using the orthography preceding the 1990 Orthographic Agreement. Do not use Brazilian vocabulary or post-1990 spellings. Preserve proper names, source names, dates, figures and currencies.`
                : 'Write every human-readable JSON value in English.';
            const prompt = `
                Article Title: ${article.title}
                Summary: ${article.summary}
                Published: ${article.published_at || 'date unavailable'}
                Source: ${article.source_title || 'source unavailable'} — ${article.source_url || 'URL unavailable'}
                Article evidence:
                ${(article.content || '').slice(0, 9000)}
                
                Task: Generate a source-disciplined executive brief. Do not turn one article into a continent-wide conclusion or investment recommendation.
                1. Six detailed key takeaways, each identifying the supported fact, actor, date or figure, mechanism, affected stakeholder and why it matters.
                2. A 350-500 word strategic implication explicitly labeled as analysis and separated into immediate, medium-term and conditional implications.
                3. Four to six evidence limitations, counter-signals or alternative explanations.
                4. Five concrete diligence questions ordered by decision importance.
                5. A claim ledger linking each major conclusion to a passage or supplied fact.

                Language requirement: ${outputLanguage}
                
                Output JSON format:
                { "key_takeaways": ["..."], "strategic_implication": "...", "limitations": ["..."], "diligence_questions": ["..."], "claim_ledger": ["..."] }
             `;

            try {
                const aiPrompt = `System: You are BOA-Story's evidence editor. Use only the supplied article, distinguish facts from analysis and preserve the requested JSON schema.\nUser: ${prompt}`;
                const parseCandidate = (raw: string | null): ArticleDecisionBrief | null => {
                    const match = (raw || '').match(/\{.*\}/s);
                    if (!match) return null;
                    try { return JSON.parse(match[0]) as ArticleDecisionBrief; }
                    catch { return null; }
                };
                const hasRequiredDepth = (candidate: ArticleDecisionBrief | null): candidate is ArticleDecisionBrief => {
                    const strategicWords = typeof candidate?.strategic_implication === 'string'
                        ? candidate.strategic_implication.trim().split(/\s+/).filter(Boolean).length
                        : 0;
                    return !!candidate
                        && Array.isArray(candidate.key_takeaways) && candidate.key_takeaways.length >= 6
                        && strategicWords >= 300
                        && Array.isArray(candidate.limitations) && candidate.limitations.length >= 4
                        && Array.isArray(candidate.diligence_questions) && candidate.diligence_questions.length >= 5
                        && Array.isArray(candidate.claim_ledger) && candidate.claim_ledger.length >= 4;
                };
                let rawResponse = await callConfiguredAI(c.env, { prompt: aiPrompt, max_tokens: 6000, temperature: 0.2, response_profile: 'structured-analysis', structured_output: true });
                let parsed = parseCandidate(rawResponse);
                if (!hasRequiredDepth(parsed)) {
                    rawResponse = await callConfiguredAI(c.env, {
                        prompt: `${aiPrompt}\n\nSTRICT CORRECTION: The previous response was incomplete. Return one valid JSON object only, with exactly six detailed key_takeaways, a 350-500 word strategic_implication, at least four limitations, exactly five diligence_questions and at least four claim_ledger entries. Preserve the requested language and do not add unsupported facts.`,
                        max_tokens: 6000,
                        temperature: 0.1,
                        response_profile: 'structured-analysis',
                        structured_output: true,
                    });
                    parsed = parseCandidate(rawResponse);
                }
                if (!hasRequiredDepth(parsed)) throw new Error('Decision brief failed the required depth structure');
                return normaliseDecisionBrief(parsed);
            } catch (e) {
                console.error('AI Context Failed', e);
                throw e;
            }
    };

    // Never hold the article body behind an AI call. Serve a previously
    // generated brief when available and warm a missing brief after the
    // response has been released to the reader.
    const aiContextKey = reqLang === 'pt'
        ? `${CACHE_KEYS.articleContext(article.id)}:pt-PT-1945:v1`
        : CACHE_KEYS.articleContext(article.id);
    const aiContext = await getCachedValue<ArticleDecisionBrief>(c.env, aiContextKey);
    if (!aiContext) {
        c.executionCtx.waitUntil(
            getCached(c.env, aiContextKey, generateAiContext, { ttl: CACHE_TTL.ARCHIVE })
                .then(() => undefined)
                .catch(error => console.error('Decision brief warm failed', error))
        );
    }

    // ── Server-side paywall ────────────────────────────────────────────────────
    // Validate any Bearer JWT. Any authenticated client (basic/premium/enterprise)
    // gets full content. Anonymous visitors receive a truncated preview + paywall flag.
    const clientId = PAYWALL_DISABLED_FOR_REVIEW
        ? 'member-preview'
        : await activeMemberId(c.env, c.req.header('Authorization'));

    let articleContent = article.content || '';
    let paywallActive = false;
    let paragraphsVisible = 0;

    if (!clientId) {
        // Truncate to first 50% of paragraphs (minimum 2)
        const paragraphs = articleContent.split(/\n\n+/).filter((p: string) => p.trim());
        const freeCount = Math.max(2, Math.ceil(paragraphs.length * 0.5));
        if (paragraphs.length > freeCount) {
            articleContent = paragraphs.slice(0, freeCount).join('\n\n');
            paywallActive = true;
            paragraphsVisible = freeCount;
        }
    }

    // Stored articles are already fast to read from D1, while translations and
    // editorial corrections can change independently of the article slug.
    // Revalidate on every open so returning browsers never retain obsolete copy.
    c.header('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
    return c.json({
        article: {
            ...article,
            content: articleContent,
            ...(aiContext ? { ai_context: aiContext } : {}),
            ...(paywallActive && {
                paywall: true,
                paragraphs_visible: paragraphsVisible,
            }),
        },
        related: localizedRelated,
        member: !!clientId,
    });
});


// ───────────────────────────────────────────────────────────────────────────────
// POST /articles/:slug/audio - Generate TTS audio for article
// ───────────────────────────────────────────────────────────────────────────────
router.post('/:slug/audio', validate('param', SlugParamSchema), async (c) => {
    // Require authentication — audio generation calls ElevenLabs and incurs cost
    const authHeader = c.req.header('Authorization');
    const apiKey = c.req.header('X-API-Key');
    const clientId = await activeMemberId(c.env, authHeader);
    if (!clientId && !apiKey) {
        return c.json({ success: false, error: 'unauthorized', message: 'Authentication required to generate audio' }, 401);
    }

    const { slug } = (c.req as any).valid('param') as { slug: string };

    // Get article
    const article = await c.env.DB.prepare(`
        SELECT id, slug, title, summary, content, audio_url, audio_duration_seconds
        FROM articles WHERE slug = ?
    `).bind(slug).first() as Record<string, any>;

    if (!article) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Article not found'
        }, 404);
    }

    // If audio already exists, return it
    if (article.audio_url) {
        return c.json({
            success: true,
            audio_url: article.audio_url,
            duration_seconds: article.audio_duration_seconds,
            message: 'Audio already generated'
        });
    }

    // Generate Real TTS 
    const script = `${article.title}. ${article.summary}`;

    const result = await generateAudioNarration(c.env, article.id, article.title, script);

    if (result) {
        return c.json({
            success: true,
            audio_url: result.audioUrl,
            duration_seconds: result.durationSeconds,
            message: 'Audio successfully synthesized.',
            note: c.env.ELEVENLABS_API_KEY ? 'Powered by ElevenLabs' : 'Powered by Cloudflare Workers AI'
        });
    } else {
        return c.json({
            success: false,
            error: 'tts_failed',
            message: 'Audio generation failed'
        }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /articles/:slug/audio - Get article audio status
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:slug/audio', validate('param', SlugParamSchema), async (c) => {
    const { slug } = (c.req as any).valid('param') as { slug: string };

    const article = await c.env.DB.prepare(`
        SELECT audio_url, audio_duration_seconds
        FROM articles WHERE slug = ?
    `).bind(slug).first() as Record<string, any>;

    if (!article) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Article not found'
        }, 404);
    }

    if (!article.audio_url) {
        return c.json({
            success: true,
            available: false,
            message: 'No audio available for this article'
        });
    }

    return c.json({
        success: true,
        available: true,
        audio_url: article.audio_url,
        duration_seconds: article.audio_duration_seconds
    });
});

export { router as articlesRouter };

