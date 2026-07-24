// ═══════════════════════════════════════════════════════════════════════════════
// BOA-Story - MAIN APPLICATION
// Hono API on Cloudflare Workers
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';

import type { Env, Variables } from './types';
import {
    articlesRouter, countriesRouter, searchRouter, analyticsRouter,
    intelligenceRouter, adminRouter, dashboardsRouter, narrativesRouter,
    servicesRouter, marketIntelRouter, personalizationRouter, authRouter,
    eventsRouter, campaignsRouter, configRouter, devRouter,
    bookmarksRouter, systemRouter, openapiRouter, agentWebhooksRouter, auditRouter, selfImproveRouter,
    newsletterRouter, agentProvidersRouter, membersRouter, seoRouter, moonshotOAuthRouter, geminiOAuthRouter, translationRouter
} from './routes';
import worldCupRouter from './routes/worldcup';
import { MODELS } from './lib/ai';
import { refreshWorldCupTeams } from './lib/worldcup';
import { LiveCounter } from './durable-objects/live-counter';

// ───────────────────────────────────────────────────────────────────────────────
// App Initialization
// ───────────────────────────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// Global Middleware
// ───────────────────────────────────────────────────────────────────────────────
app.use('*', logger());
// /assets serves public images embedded by the Pages frontend (a different
// origin). secureHeaders() sets Cross-Origin-Resource-Policy: same-origin,
// which makes browsers hard-block those embeds (ERR_BLOCKED_BY_RESPONSE) — so
// every R2-served hero silently fell back. Registered BEFORE secureHeaders so
// this post-handler override runs after it and wins.
app.use('/assets/*', async (c, next) => {
    await next();
    c.res.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
});
app.use('*', secureHeaders());
app.use('*', prettyJSON());
// Production-safe allowed origins.
// For local frontend dev add to .dev.vars:
//   ADDITIONAL_ORIGINS=http://localhost:5173,http://localhost:5174
const BASE_ALLOWED_ORIGINS = new Set([
    'https://best-of-africa.pages.dev',
]);

app.use('*', cors({
    origin: (origin, c) => {
        const extra = c.env.ADDITIONAL_ORIGINS;
        const allowed = new Set(BASE_ALLOWED_ORIGINS);
        if (c.env.PUBLIC_SITE_URL) allowed.add(c.env.PUBLIC_SITE_URL.replace(/\/$/, ''));
        if (extra) extra.split(',').map((o: string) => o.trim()).filter(Boolean).forEach((o: string) => allowed.add(o));
        if (allowed.has(origin) || origin.endsWith('.pages.dev')) return origin;
        return c.env.PUBLIC_SITE_URL || 'https://best-of-africa.pages.dev';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Session-ID', 'X-Requested-With', 'X-Admin-Key'],
    exposeHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining', 'X-Request-ID'],
    maxAge: 86400,
    credentials: true,
}));

// Request ID middleware for tracing
app.use('*', async (c, next) => {
    const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
    c.set('requestId', requestId);
    c.header('X-Request-ID', requestId);
    await next();
});

// CSRF guard: state-changing requests must originate from our frontend.
// Browsers send Origin on cross-origin requests; same-origin requests send Referer.
// Non-browser clients (Workers, CLI) that omit both headers must supply X-Requested-With.
app.use('*', async (c, next) => {
    const method = c.req.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return next();
    }

    const origin = c.req.header('Origin');
    const referer = c.req.header('Referer');
    const xrw = c.req.header('X-Requested-With');

    const ALLOWED_ORIGINS = [c.env.PUBLIC_SITE_URL || 'https://best-of-africa.pages.dev'];

    if (origin && ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith('.pages.dev'))) {
        return next();
    }
    if (!origin && referer && ALLOWED_ORIGINS.some(o => referer.startsWith(o))) {
        return next();
    }
    if (xrw === 'XMLHttpRequest') {
        return next();
    }
    // Allow server-to-server calls that carry a valid admin key or API key header
    if (c.req.header('Authorization') || c.req.header('X-API-Key') || c.req.header('X-Admin-Key')) {
        return next();
    }

    return c.json({ error: 'forbidden', message: 'CSRF check failed' }, 403);
});

// ───────────────────────────────────────────────────────────────────────────────
// Health Check
// ───────────────────────────────────────────────────────────────────────────────
app.get('/', (c) => {
    return c.json({
        name: 'BOA-Story API',
        version: c.env.API_VERSION,
        status: 'healthy',
        environment: c.env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (c) => {
    return c.json({ status: 'ok' });
});

// ───────────────────────────────────────────────────────────────────────────────
// Media — serve uploaded assets (article hero images, etc.) from the R2 bucket.
// Article hero_image_url values point here; without this route they 404.
// ───────────────────────────────────────────────────────────────────────────────
app.get('/assets/*', async (c) => {
    const key = decodeURIComponent(c.req.path.replace(/^\/assets\//, ''));
    if (!key) return c.notFound();

    // ?w=768 → serve the pre-generated mobile variant when it exists (created
    // at generation time / by the variant backfill cron), else the original.
    let obj: R2ObjectBody | null = null;
    if (c.req.query('w') === '768') {
        const { heroVariantKey } = await import('./lib/media');
        obj = await c.env.MEDIA.get(heroVariantKey(key));
    }
    if (!obj) obj = await c.env.MEDIA.get(key);
    if (!obj) return c.notFound();
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set('etag', obj.httpEtag);
    // Article media lives at STABLE URLs but is mutable (hero regeneration,
    // audio re-narration overwrite in place) — a year of "immutable" caching
    // would hide every regenerated hero from returning visitors. One day is
    // plenty; other asset keys stay long-lived.
    headers.set('Cache-Control', key.startsWith('articles/') || key.startsWith('audio/')
        ? 'public, max-age=86400'
        : 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');

    // Correct the content-type from the actual bytes. Workers AI (SDXL) returns
    // JPEG, but thousands of heroes were stored as "hero.png" / image/png; with
    // the global nosniff header, browsers refuse to decode the mismatch and
    // every AI hero silently fell back. Sniffing magic bytes here fixes all
    // existing objects without re-uploading anything.
    const body = obj.body;
    if ((headers.get('content-type') || '').startsWith('image/') && body) {
        const [probe, rest] = body.tee();
        const reader = probe.getReader();
        const { value } = await reader.read();
        reader.cancel().catch(() => {});
        if (value && value.length >= 12) {
            if (value[0] === 0xff && value[1] === 0xd8) headers.set('content-type', 'image/jpeg');
            else if (value[0] === 0x89 && value[1] === 0x50) headers.set('content-type', 'image/png');
            else if (value[0] === 0x52 && value[1] === 0x49 && value[8] === 0x57 && value[9] === 0x45) headers.set('content-type', 'image/webp');
        }
        return new Response(rest, { headers });
    }
    return new Response(body, { headers });
});

// Public provider status — shows active model without exposing credentials
app.get('/api/v1/ai-status', async (c) => {
    const env = c.env as any;

    return c.json({
        provider: 'workers_ai',
        model: MODELS.TEXT_GENERATION,
        source: 'enforced_information_policy',
        gemini_key_configured: !!env.GOOGLE_AI_API_KEY,
        gemini_oauth_configured: !!(await env.CACHE?.get('gemini:oauth:refresh_token').catch(() => null)),
        anthropic_configured: !!env.ANTHROPIC_API_KEY,
        timestamp: new Date().toISOString(),
    });
});


// ───────────────────────────────────────────────────────────────────────────────
// SEO & Discoverability (Mounted at worker root)
// ───────────────────────────────────────────────────────────────────────────────
app.route('/', seoRouter);

// ───────────────────────────────────────────────────────────────────────────────
// API Routes (v1)
// ───────────────────────────────────────────────────────────────────────────────
const api = new Hono<{ Bindings: Env }>();

api.route('/articles', articlesRouter);
api.route('/countries', countriesRouter);
api.route('/search', searchRouter);
api.route('/analytics', analyticsRouter);
api.route('/intel', intelligenceRouter);
api.route('/admin', adminRouter);
api.route('/agent', agentWebhooksRouter);
api.route('/audit', auditRouter);
api.route('/self-improve', selfImproveRouter);

// Vision-aligned routes (narrative diplomacy & intelligence)
api.route('/dashboards', dashboardsRouter);
api.route('/narratives', narrativesRouter);
api.route('/services', servicesRouter);
api.route('/market-intel', marketIntelRouter);
api.route('/personalization', personalizationRouter);
api.route('/auth', authRouter);
api.route('/events', eventsRouter);
api.route('/campaigns', campaignsRouter);
api.route('/config', configRouter);

api.route('/newsletter', newsletterRouter);
api.route('/agent/providers', agentProvidersRouter);
api.route('/agent/moonshot/oauth', moonshotOAuthRouter);
api.route('/agent/gemini/oauth', geminiOAuthRouter);
api.route('/members', membersRouter);
api.route('/translate', translationRouter);
api.route('/dev', devRouter);
api.route('/bookmarks', bookmarksRouter);
api.route('/world-cup', worldCupRouter);
api.route('/', systemRouter);
api.route('/docs', openapiRouter);

app.route('/api/v1', api);

// Legacy routes (redirect to v1)
app.route('/api', api);

// ───────────────────────────────────────────────────────────────────────────────
// 404 Handler
// ───────────────────────────────────────────────────────────────────────────────
app.notFound((c) => {
    return c.json({
        error: 'not_found',
        message: `Route ${c.req.method} ${c.req.path} not found`,
        status: 404,
    }, 404);
});

// ───────────────────────────────────────────────────────────────────────────────
// Error Handler (with Analytics Engine logging)
// ───────────────────────────────────────────────────────────────────────────────
app.onError((err, c) => {
    const requestId = c.get('requestId') || 'unknown';
    const route = `${c.req.method} ${c.req.path}`;

    console.error(`[${requestId}] Unhandled error on ${route}:`, err);

    // Send structured error to Analytics Engine
    try {
        c.env.ANALYTICS.writeDataPoint({
            blobs: [
                'error',              // event_type
                route,                // route
                err.message || 'Unknown error',
                requestId,
            ],
            doubles: [500],           // status_code
            indexes: ['error'],       // for filtering
        });
    } catch (analyticsErr) {
        console.error('Failed to log error to Analytics:', analyticsErr);
    }

    return c.json({
        error: 'internal_error',
        message: c.env.ENVIRONMENT === 'development' ? err.message : 'An internal error occurred',
        status: 500,
        request_id: requestId,
    }, 500);
});

// ───────────────────────────────────────────────────────────────────────────────
// Scheduled Worker Handler (Cron)
// ───────────────────────────────────────────────────────────────────────────────
async function scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Running master cron worker...');

    // Isolate each job: a failure in one step (e.g. ingestion when NEWS_API_KEY
    // is unset or Workers AI is over quota) must not block the others —
    // especially the daily reporting and newsletter dispatch below.
    const safe = async (label: string, fn: () => Promise<unknown>) => {
        try {
            await fn();
        } catch (e) {
            console.error(`[cron] ${label} failed:`, e);
        }
    };

    const date = new Date(event.scheduledTime || Date.now());
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();

    // 0. Recover stranded 'pending' items FIRST — it is cheap (one query + a few
    // queue sends) and must not be starved by the heavier steps below, which can
    // exhaust the per-invocation subrequest budget. The actual generation happens
    // in the separate queue consumer (one item per invocation), so this only
    // re-feeds the backlog; it does not generate inline.
    await safe('recover-pending', async () => {
        const { recoverPendingItems } = await import('./workers/generator');
        await recoverPendingItems(env, 25);
    });

    // Complete the publication lifecycle. Generation remains quarantined until
    // a separate source-grounded audit passes every existing editorial gate.
    // One item per tick keeps verification quality ahead of throughput.
    await safe('editorial-audit', async () => {
        const { auditPendingArticles } = await import('./lib/moderation');
        const result = await auditPendingArticles(env, 1);
        if (result.reviewed) {
            console.log(`[cron] editorial audit: ${result.published}/${result.reviewed} published`);
        }
    });

    // Regenerate existing narration newest-first, then extend audio coverage.
    // This runs before expensive ingestion and image workloads so those jobs
    // cannot consume the invocation budget before TTS is reached.
    await safe('backfill-audio', async () => {
        const { backfillAudio, regenerateAudio } = await import('./workers/generator');
        const regenerated = await regenerateAudio(env, 3);
        if (regenerated === 0) await backfillAudio(env, 3);
    });

    // 1. Ingestion: every minute
    await safe('ingestion', () => runIngestion(env));

    // Keep official country evidence pre-saved. One country every two minutes
    // refreshes the continent in under two hours without putting provider
    // latency on a reader request or creating a 54-country network fan-out.
    if (minutes % 2 === 0) {
        await safe('country-evidence-refresh', async () => {
            const { refreshNextCountryEvidence } = await import('./lib/country-evidence');
            await refreshNextCountryEvidence(env);
        });
    }

    // Recover real publisher photography for existing stories. This is
    // source-only: no generated or generic fallback imagery is permitted.
    await safe('backfill-source-images', async () => {
        const { backfillSourceImages, backfillStoredSourceImages } = await import('./workers/source-images');
        const stored = await backfillStoredSourceImages(env, 40);
        const result = await backfillSourceImages(env, 8);
        if (stored || result.checked) {
            console.log(`[cron] source images: ${stored} stored + ${result.recovered}/${result.checked} fetched`);
        }
    });

    // Backfill 768w hero variants for articles whose heroes predate variant
    // generation (pure resize, no AI — CPU-cheap, so a bigger batch is fine).
    // Self-terminates when done.
    await safe('backfill-hero-variants', async () => {
        const { backfillHeroVariants } = await import('./workers/generator');
        await backfillHeroVariants(env, 12);
    });

    // Backfill audio narration (summary-length TTS), newest-first — the Listen
    // buttons promised audio that never existed. Self-terminates when done.
    // Aura regeneration takes priority: fixing the robotic MeloTTS voice on
    // articles readers can already play beats extending coverage to ones
    // nobody has reached yet. Once the regen queue drains, coverage resumes.
    // Regenerate SDXL-era heroes with FLUX (most-visible articles first).
    // Self-terminates once the whole archive is flux-era.

    // Regenerate legacy m2m100 translations with the large model (bodies were
    // degenerate stumps and are never served until quality=1). Newest-first,
    // degeneracy-gated, self-terminating.
    await safe('backfill-translations', async () => {
        const { backfillTranslations } = await import('./lib/translate');
        await backfillTranslations(env, 2);
    });

    // Classify the ~6k pre-taxonomy articles with no sector (invisible to
    // sector filters/trends/kickers). Newest-first, self-terminating.
    await safe('backfill-sectors', async () => {
        const { backfillSectors } = await import('./workers/generator');
        await backfillSectors(env, 8);
    });

    // 2. Optimization + stale task recovery: every 2 minutes
    if (minutes % 2 === 0) {
        await safe('optimization', () => runOptimization(env));
        await safe('stale-task-recovery', () => runStaleTaskRecovery(env));
    }

    // World Cup: refresh African teams still in the tournament every 30 minutes.
    if (minutes % 30 === 0) {
        await safe('world-cup-refresh', () => refreshWorldCupTeams(env));
    }

    // Roll recurring annual summits forward once a day so the events calendar
    // is perpetually current instead of a fixed list that ages into the past.
    if (hours === 4 && minutes === 0) {
        await safe('roll-events', () => rollRecurringEvents(env));
    }

    // Auto-discover new events from the live news feed every 6 hours, so the
    // calendar stays current continent-wide without manual seeding.
    if (hours % 6 === 0 && minutes === 30) {
        await safe('discover-events', async () => {
            const { discoverEvents } = await import('./workers/events-discovery');
            await discoverEvents(env);
        });
    }

    // 3. Reporting: Daily at 5am UTC
    if (hours === 5 && minutes === 0) {
        await safe('daily-reporting', () => runDailyReporting(env));
    }

    // 4. Newsletter Dispatch: Daily & Weekly at 6am UTC
    if (hours === 6 && minutes === 0) {
        await safe('newsletter-daily', () => runNewsletterDispatch(env, 'daily'));
        // Sunday is 0
        if (date.getUTCDay() === 0) {
            await safe('newsletter-weekly', () => runNewsletterDispatch(env, 'weekly'));
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Queue Consumer Handler
// ───────────────────────────────────────────────────────────────────────────────
async function queue(batch: MessageBatch, env: Env) {
    for (const message of batch.messages) {
        try {
            const data = message.body as Record<string, unknown>;

            if (data.type === 'generate_article') {
                await processContentGeneration(data, env);
            } else if (data.type === 'optimize_headline' || data.type === 'fill_narrative_gap') {
                await processOptimization(data, env);
            } else if (data.type === 'article_translation') {
                const articleId = typeof data.articleId === 'string' ? data.articleId : '';
                const language = typeof data.language === 'string' ? data.language : '';
                if (!articleId || !['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(language)) {
                    throw new Error('Invalid article translation queue message');
                }
                const { processArticleTranslationJob } = await import('./lib/translate');
                await processArticleTranslationJob(env, {
                    type: 'article_translation',
                    articleId,
                    language: language as 'fr' | 'ar' | 'pt' | 'de' | 'hi' | 'zh',
                });
            }

            message.ack();
        } catch (error) {
            console.error('Queue processing error:', error);
            message.retry();
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Worker Functions (Stubs - implemented in workers/)
// ───────────────────────────────────────────────────────────────────────────────
async function runIngestion(env: Env) {
    // Implemented in workers/ingestion.ts
    const { ingestNews } = await import('./workers/ingestion');
    await ingestNews(env);
}

// Roll any event whose date has fully passed forward by one year (these are
// annual, recurring pan-African summits). Also bumps the year embedded in the
// title (e.g. "GITEX Africa 2026" -> "2027"). SQLite evaluates all SET
// expressions against the pre-update row, so the title uses the old year.
async function rollRecurringEvents(env: Env) {
    await env.DB.prepare(`
        UPDATE events
        SET title = REPLACE(title, CAST(strftime('%Y', date_start) AS TEXT), CAST(strftime('%Y', date(date_start, '+1 year')) AS TEXT)),
            date_end = CASE WHEN date_end IS NOT NULL THEN date(date_end, '+1 year') ELSE NULL END,
            date_start = date(date_start, '+1 year')
        WHERE date(COALESCE(date_end, date_start)) < date('now')
    `).run();
}

async function runOptimization(env: Env) {
    // Implemented in workers/optimizer.ts
    const { optimizeContent } = await import('./workers/optimizer');
    await optimizeContent(env);
}

async function runStaleTaskRecovery(env: Env) {
    // Implemented in workers/generator.ts
    // Internal fallback: claims generate_article tasks that ZeroClaw hasn't
    // picked up after 15 minutes and runs the full generation pipeline locally.
    const { processStaleArticleTasks } = await import('./workers/generator');
    await processStaleArticleTasks(env);
}

async function processContentGeneration(data: Record<string, unknown>, env: Env) {
    // Implemented in workers/generator.ts
    const { generateArticle } = await import('./workers/generator');
    await generateArticle(data, env);
}

async function processOptimization(data: Record<string, unknown>, env: Env) {
    // Implemented in workers/optimizer.ts
    const { processOptimizationTask } = await import('./workers/optimizer');
    await processOptimizationTask(data, env);
}

async function runDailyReporting(env: Env) {
    // Implemented in workers/reporter.ts
    const { runDailyReporting } = await import('./workers/reporter');
    await runDailyReporting(env);
}

async function runNewsletterDispatch(env: Env, frequency: 'daily' | 'weekly') {
    // Implemented in workers/digest.ts
    const { processDigests } = await import('./workers/digest');
    await processDigests(env, frequency);
}

// ───────────────────────────────────────────────────────────────────────────────
// Exports
// ───────────────────────────────────────────────────────────────────────────────
export default {
    fetch: app.fetch,
    scheduled,
    queue,
};

export { LiveCounter };
