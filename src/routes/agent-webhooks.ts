import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { z } from 'zod';
import { validate } from '../lib';
import { evaluateArticleDepth, identifyCountry, identifySector, ARTICLE_PROMPT_VERSION, MIN_PUBLISHABLE_ARTICLE_WORDS, MIN_PUBLISHABLE_INVESTOR_BRIEF_WORDS, MODELS } from '../lib/ai';
import { autoTranslateArticle } from '../lib/translate';
import { generateAudioNarration } from '../lib/audio';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip leading/trailing markdown asterisks, whitespace, and quotes from a string field. */
const sanitizeField = (s: string | undefined): string => {
    if (!s) return '';
    return s.replace(/^[*\s"']+/, '').replace(/[*\s"']+$/, '').trim();
};

/** Write a telemetry row to agent_metrics after each agent run. */
async function writeAgentMetric(
    db: Env['DB'],
    opts: {
        agentName: string;
        durationMs: number;
        tasksSeen: number;
        tasksDone: number;
        tasksFailed: number;
        modelUsed?: string;
        tokensUsed?: number;
        error?: string;
    }
) {
    try {
        await db.prepare(`
            INSERT INTO agent_metrics (id, agent_name, run_at, duration_ms, tasks_seen, tasks_done, tasks_failed, model_used, tokens_used, error)
            VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            crypto.randomUUID(),
            opts.agentName,
            opts.durationMs,
            opts.tasksSeen,
            opts.tasksDone,
            opts.tasksFailed,
            opts.modelUsed ?? null,
            opts.tokensUsed ?? null,
            opts.error ?? null,
        ).run();
    } catch (err) {
        console.error('[agent_metrics] Failed to write metric row:', err);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET //status — public summary of health and recent activity
// (no auth required — safe to display in beta frontend)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/status', async (c) => {
    const { limit = '5' } = c.req.query();
    const recentLimit = Math.max(1, Math.min(50, parseInt(limit) || 5));

    const [taskCounts, recentTasks, latestArticle, stalled, metricsRows] = await Promise.all([
        // Task counts by status (last 24h)
        c.env.DB.prepare(`
            SELECT status, COUNT(*) as count
            FROM agent_tasks
            WHERE created_at > datetime('now', '-24 hours')
            GROUP BY status
        `).all<{ status: string; count: number }>(),

        // Recent tasks — configurable via ?limit= (default 5, max 50)
        c.env.DB.prepare(`
            SELECT id, type, status, priority, retry_count, created_at, updated_at, completed_at,
                   CASE WHEN error_message IS NOT NULL THEN error_message ELSE NULL END as error
            FROM agent_tasks
            ORDER BY created_at DESC
            LIMIT ?
        `).bind(recentLimit).all<Record<string, unknown>>(),

        // Most recently published article
        c.env.DB.prepare(`
            SELECT title, slug, published_at, country_code
            FROM articles
            WHERE status = 'published'
            ORDER BY published_at DESC
            LIMIT 1
        `).first<{ title: string; slug: string; published_at: string; country_code: string }>(),

        // Stalled tasks: processing past their TTL
        c.env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM agent_tasks
            WHERE status = 'processing'
              AND expires_at IS NOT NULL
              AND expires_at < datetime('now')
        `).first<{ count: number }>(),

        // metrics: last 7 days rollup per skill
        c.env.DB.prepare(`
            SELECT agent_name,
                   COUNT(*) as runs,
                   SUM(tasks_done) as tasks_done,
                   SUM(tasks_failed) as tasks_failed,
                   ROUND(AVG(duration_ms)) as avg_duration_ms,
                   MAX(run_at) as last_run_at
            FROM agent_metrics
            WHERE run_at > datetime('now', '-7 days')
            GROUP BY agent_name
            ORDER BY last_run_at DESC
        `).all<Record<string, unknown>>(),
    ]);

    const counts = Object.fromEntries(
        (taskCounts.results || []).map(r => [r.status, r.count])
    );

    const pending    = (counts.pending    || 0);
    const processing = (counts.processing  || 0);
    const completed24h = (counts.completed || 0);
    const failed24h  = (counts.failed     || 0);
    const stalledCount = stalled?.count ?? 0;

    // BUSY = actively processing; DEGRADED = stalled tasks present; OPERATIONAL = clean idle
    const health = processing > 0
        ? 'BUSY'
        : stalledCount > 0
            ? 'DEGRADED'
            : 'OPERATIONAL';

    return c.json({
        health,
        tasks_24h: { pending, processing, completed: completed24h, failed: failed24h, stalled: stalledCount },
        recent_tasks: recentTasks.results || [],
        latest_article: latestArticle || null,
        active_provider: {
            provider: 'workers_ai',
            label: 'Cloudflare Workers AI',
            model: MODELS.TEXT_GENERATION,
        },
        metrics_7d: metricsRows.results || [],
        generated_at: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //stream — Server-Sent Events stream for real-time updates
// Sends a snapshot every 15 seconds; client reconnects automatically.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stream', async (c) => {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(payload));
    };

    // Send initial snapshot immediately, then close (CF Workers has no long-lived connections)
    c.executionCtx.waitUntil((async () => {
        try {
            const [taskCounts, recentTasks, latestArticle] = await Promise.all([
                c.env.DB.prepare(`
                    SELECT status, COUNT(*) as count
                    FROM agent_tasks
                    WHERE created_at > datetime('now', '-1 hour')
                    GROUP BY status
                `).all<{ status: string; count: number }>(),
                c.env.DB.prepare(`
                    SELECT id, type, status, priority, created_at, completed_at
                    FROM agent_tasks ORDER BY created_at DESC LIMIT 10
                `).all<Record<string, unknown>>(),
                c.env.DB.prepare(`
                    SELECT title, slug, published_at, country_code
                    FROM articles WHERE status = 'published'
                    ORDER BY published_at DESC LIMIT 3
                `).all<Record<string, unknown>>(),
            ]);

            const counts = Object.fromEntries(
                (taskCounts.results || []).map(r => [r.status, r.count])
            );

            await sendEvent('agent_status', {
                health: (counts.processing || 0) > 0 ? 'BUSY' : 'OPERATIONAL',
                tasks: counts,
                recent_tasks: recentTasks.results || [],
                latest_articles: latestArticle.results || [],
                timestamp: new Date().toISOString(),
            });

            await sendEvent('heartbeat', { timestamp: new Date().toISOString() });
        } finally {
            await writer.close();
        }
    })());

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        },
    });
});

// ─── Admin-only auth middleware for task management endpoints ──────────────────
router.use('/tasks/*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized', message: 'Agent authorization required' }, 401);
    }
    await next();
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //tasks/pending — Fetch and atomically lock the highest-priority task
//
// Uses migration 0027 columns:
//   - priority ASC (1=urgent, 5=normal, 10=low)
//   - expires_at: task TTL set to 10 minutes from lock time
//   - Expired processing tasks are reset to pending first (stall recovery)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/tasks/pending', async (c) => {
    const agentName = c.req.query('agent') || 'unknown';
    const agentVersion = c.req.query('version') || null;

    // Step 0: Reset stalled tasks (processing past TTL) back to pending so they can be retried.
    // Increment retry_count so a perpetually-stalling task eventually exhausts its retries.
    await c.env.DB.prepare(`
        UPDATE agent_tasks
        SET status        = 'pending',
            retry_count   = retry_count + 1,
            error_message = 'Stalled: TTL expired without completion',
            updated_at    = datetime('now'),
            expires_at    = NULL
        WHERE status = 'processing'
          AND expires_at IS NOT NULL
          AND expires_at < datetime('now')
          AND retry_count < max_retries
    `).run();

    // Mark permanently failed tasks that stalled and have no retries left
    await c.env.DB.prepare(`
        UPDATE agent_tasks
        SET status        = 'failed',
            error_message = 'Stalled: TTL expired, retries exhausted',
            updated_at    = datetime('now'),
            completed_at  = datetime('now'),
            expires_at    = NULL
        WHERE status = 'processing'
          AND expires_at IS NOT NULL
          AND expires_at < datetime('now')
          AND retry_count >= max_retries
    `).run();

    // Passive archival: prune old terminal tasks so the table doesn't grow unbounded.
    // Completed tasks older than 30 days and failed tasks older than 7 days are removed.
    await c.env.DB.prepare(`
        DELETE FROM agent_tasks
        WHERE (status = 'completed' AND completed_at < datetime('now', '-30 days'))
           OR (status = 'failed'    AND completed_at < datetime('now', '-7 days'))
    `).run();

    // Step 1: Find the highest-priority pending task that is ready to run.
    // expires_at is repurposed as a "not-before" gate for retried tasks.
    const pendingTask = await c.env.DB.prepare(`
        SELECT id, type, payload, priority, retry_count, max_retries
        FROM agent_tasks
        WHERE status = 'pending'
          AND (expires_at IS NULL OR expires_at <= datetime('now'))
        ORDER BY priority ASC, created_at ASC
        LIMIT 1
    `).first<{ id: string; type: string; payload: string; priority: number; retry_count: number; max_retries: number }>();

    if (!pendingTask) {
        return c.json({ data: null, message: 'No pending tasks' });
    }

    // Step 2: Atomically lock it and set a 10-minute TTL
    const updateResult = await c.env.DB.prepare(`
        UPDATE agent_tasks
        SET status       = 'processing',
            updated_at   = datetime('now'),
            expires_at   = datetime('now', '+10 minutes'),
            agent_version = ?
        WHERE id = ? AND status = 'pending'
    `).bind(agentVersion, pendingTask.id).run();

    if (updateResult.meta.changes === 0) {
        // Race: another grabbed it between SELECT and UPDATE
        return c.json({ data: null, message: 'Task already claimed, try again' });
    }

    let parsedPayload;
    try {
        parsedPayload = JSON.parse(pendingTask.payload);
    } catch {
        parsedPayload = { error: 'Invalid JSON payload in DB' };
    }

    return c.json({
        data: {
            id: pendingTask.id,
            type: pendingTask.type,
            payload: parsedPayload,
            priority: pendingTask.priority,
            attempt: pendingTask.retry_count + 1,
            max_retries: pendingTask.max_retries,
        },
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //tasks/complete — Submit a completed or failed task
//
// Uses migration 0027 columns:
//   - retry_count: incremented on failure
//   - max_retries: if retry_count < max_retries, re-queue as pending instead of failing
//   - Writes a row to agent_metrics for every call
// ───────────────────────────────────────────────────────────────────────────────
const CompleteTaskSchema = z.object({
    taskId:       z.string().uuid(),
    status:       z.enum(['completed', 'failed']),
    agentName:    z.string().default('unknown'),
    durationMs:   z.number().int().nonnegative().optional(),
    result:       z.any().optional(),
    errorMessage: z.string().optional(),
    modelUsed:    z.string().optional(),
    tokensUsed:   z.number().int().nonnegative().optional(),
});

router.post('/tasks/complete', validate('json', CompleteTaskSchema), async (c) => {
    const payload = await c.req.json() as z.infer<typeof CompleteTaskSchema>;
    const completedAt = new Date().toISOString();

    // Fetch current retry state
    const taskMeta = await c.env.DB.prepare(
        'SELECT type, payload, retry_count, max_retries FROM agent_tasks WHERE id = ?'
    ).bind(payload.taskId).first<{ type: string; payload: string; retry_count: number; max_retries: number }>();

    if (!taskMeta) {
        return c.json({ error: 'not_found', message: 'Task not found' }, 404);
    }

    // A Worker/agent may report transport-level success while returning a thin
    // draft. Treat that as a failed attempt so the existing retry/backoff path
    // can request a substantive replacement instead of publishing it.
    if (taskMeta.type === 'generate_article' && payload.status === 'completed') {
        const generated = payload.result as Record<string, any> | undefined;
        const professionalBrief = generated?.investor_brief || generated?.ai_investor_brief || '';
        const depth = evaluateArticleDepth(generated?.content, professionalBrief);
        if (!depth.publishable) {
            payload.status = 'failed';
            payload.errorMessage = `Depth quality gate: article ${depth.articleWords}/${MIN_PUBLISHABLE_ARTICLE_WORDS} words; professional brief ${depth.briefWords}/${MIN_PUBLISHABLE_INVESTOR_BRIEF_WORDS} words`;
            payload.result = undefined;
        }
    }

    let finalStatus = payload.status;

    if (payload.status === 'failed') {
        const newRetryCount = (taskMeta.retry_count ?? 0) + 1;

        if (newRetryCount < (taskMeta.max_retries ?? 3)) {
            // Exponential backoff: 30s, 2m, 8m for attempts 1-3.
            // We repurpose expires_at as a "not-before" gate — the pending query
            // already filters `expires_at IS NULL`, so reuse it to delay pickup.
            const backoffSeconds = Math.pow(4, newRetryCount) * 30; // 30s, 120s, 480s
            // Priority degrades by 1 per retry so new tasks aren't blocked behind retries.
            const degradedPriority = Math.min(10, (taskMeta as any).priority ?? 5) + 1;

            await c.env.DB.prepare(`
                UPDATE agent_tasks
                SET status        = 'pending',
                    retry_count   = ?,
                    priority      = ?,
                    error_message = ?,
                    updated_at    = datetime('now'),
                    expires_at    = datetime('now', '+' || ? || ' seconds')
                WHERE id = ?
            `).bind(newRetryCount, degradedPriority, payload.errorMessage ?? null, backoffSeconds, payload.taskId).run();

            console.log(`[agent] Task ${payload.taskId} failed (attempt ${newRetryCount}/${taskMeta.max_retries}), re-queuing with ${backoffSeconds}s backoff.`);
            finalStatus = 'failed'; // we still log it as failed for this run
        } else {
            // Exhausted retries — mark permanently failed
            await c.env.DB.prepare(`
                UPDATE agent_tasks
                SET status        = 'failed',
                    retry_count   = ?,
                    error_message = ?,
                    updated_at    = datetime('now'),
                    completed_at  = datetime('now'),
                    expires_at    = NULL
                WHERE id = ?
            `).bind(taskMeta.retry_count + 1, payload.errorMessage ?? null, payload.taskId).run();
        }
    } else {
        // Completed successfully
        await c.env.DB.prepare(`
            UPDATE agent_tasks
            SET status       = 'completed',
                result       = ?,
                error_message = NULL,
                updated_at   = datetime('now'),
                completed_at = datetime('now'),
                expires_at   = NULL
            WHERE id = ?
        `).bind(
            payload.result ? JSON.stringify(payload.result) : null,
            payload.taskId
        ).run();
    }

    // Write telemetry (fire and forget — don't block the response)
    c.executionCtx.waitUntil(writeAgentMetric(c.env.DB, {
        agentName:   payload.agentName,
        durationMs:  payload.durationMs ?? 0,
        tasksSeen:   1,
        tasksDone:   finalStatus === 'completed' ? 1 : 0,
        tasksFailed: finalStatus === 'failed' ? 1 : 0,
        modelUsed:   MODELS.TEXT_GENERATION,
        tokensUsed:  payload.tokensUsed,
        error:       payload.errorMessage,
    }));

    // ── Article ingestion pipeline (unchanged from before) ──────────────────
    if (taskMeta.type === 'generate_article' && payload.status === 'completed' && payload.result) {
        c.executionCtx.waitUntil((async () => {
            try {
                const originalPayload = JSON.parse(taskMeta.payload);
                const itemId    = originalPayload.ingested_item_id;
                const generated = payload.result;

                if (itemId && generated.title && generated.content) {
                    // Sanitize text fields: strip markdown asterisks, stray quotes, leading/trailing whitespace
                    const cleanTitle    = sanitizeField(generated.title);
                    const cleanSubtitle = sanitizeField(generated.subtitle);
                    const cleanSummary  = sanitizeField(generated.summary);

                    const readingTime = Math.ceil(generated.content.split(/\s+/).length / 200);
                    const baseSlug = cleanTitle
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')
                        .slice(0, 80);
                    const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
                    const articleId = crypto.randomUUID();
                    const countryCode = await identifyCountry(c.env, cleanTitle, generated.content);
                    const sectorId = await identifySector(c.env, cleanTitle, generated.content);

                    await c.env.DB.prepare(`
                        INSERT INTO articles (
                            id, slug, title, subtitle, content, summary,
                            country_code, sector_id, tags,
                            reading_time_minutes, source_url, source_title, source_published_at,
                            generation_model, generation_prompt_version, ai_investor_brief,
                            engagement_score,
                            status, moderation_status, published_at, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending_audit', 'pending', NULL, datetime('now'))
                    `).bind(
                        articleId, slug,
                        cleanTitle, cleanSubtitle || null,
                        generated.content, cleanSummary || null,
                        countryCode,
                        sectorId,
                        generated.tags ? JSON.stringify(generated.tags) : '[]',
                        readingTime,
                        originalPayload.url          || null,
                        originalPayload.title        || null,
                        originalPayload.published_at || null,
                        MODELS.TEXT_GENERATION,
                        ARTICLE_PROMPT_VERSION,
                        generated.investor_brief || generated.ai_investor_brief || null,
                    ).run();

                    await c.env.DB.prepare(`
                        UPDATE ingested_items
                        SET status = 'completed', article_id = ?, error_message = NULL
                        WHERE id = ?
                    `).bind(articleId, itemId).run();

                    // Async enrichment: translation and hero image are independent —
                    // failure of one must not prevent the other from running.
                    try {
                        await autoTranslateArticle(c.env, articleId, {
                            title:        generated.title,
                            subtitle:     generated.subtitle,
                            summary:      generated.summary,
                            content:      generated.content,
                            country_code: countryCode,
                        });
                    } catch (translateError) {
                        console.error(`[enrichment] Translation failed for article ${articleId}:`, translateError);
                    }

                    try {
                        await generateAudioNarration(c.env, articleId, generated.title, generated.content);
                    } catch (audioError) {
                        console.error(`[enrichment] Audio generation failed for article ${articleId}:`, audioError);
                    }
                }
            } catch (e) {
                console.error('Failed to process completed article generation task', e);
            }
        })());
    }

    // ── Post-completion: evolve_instructions ──────────────────────────────────
    // Mark the feedback rows as processed now that the task actually succeeded.
    // If the task failed (and retries are exhausted), rows stay unprocessed so
    // the next /self-improve/evolve call can include them in a fresh task.
    if (taskMeta.type === 'evolve_instructions' && payload.status === 'completed') {
        c.executionCtx.waitUntil((async () => {
            try {
                const originalPayload = JSON.parse(taskMeta.payload);
                const feedbacks = originalPayload.feedbacks as Array<{ id: string }> | undefined;
                if (Array.isArray(feedbacks) && feedbacks.length > 0) {
                    const ids = feedbacks.map(f => f.id);
                    const placeholders = ids.map(() => '?').join(',');
                    await c.env.DB.prepare(
                        `UPDATE article_feedback SET is_processed_by_agent = 1 WHERE id IN (${placeholders})`
                    ).bind(...ids).run();
                }
            } catch (e) {
                console.error('[agent] Failed to mark feedback as processed after evolve_instructions:', e);
            }
        })());
    }

    return c.json({ success: true, message: 'Task status updated', status: finalStatus });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //metrics — ZeroClaw can POST a batch metric record directly
// (alternative to per-task reporting via /tasks/complete)
// ───────────────────────────────────────────────────────────────────────────────
const MetricSchema = z.object({
    agentName:   z.string(),
    durationMs:  z.number().int().nonnegative(),
    tasksSeen:   z.number().int().nonnegative().default(0),
    tasksDone:   z.number().int().nonnegative().default(0),
    tasksFailed: z.number().int().nonnegative().default(0),
    modelUsed:   z.string().optional(),
    tokensUsed:  z.number().int().nonnegative().optional(),
    error:       z.string().optional(),
});

router.use('/metrics', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized' }, 401);
    }
    await next();
});

router.post('/metrics', validate('json', MetricSchema), async (c) => {
    const body = await c.req.json() as z.infer<typeof MetricSchema>;
    await writeAgentMetric(c.env.DB, { ...body, modelUsed: MODELS.TEXT_GENERATION });
    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //metrics — Admin view of execution history
// ───────────────────────────────────────────────────────────────────────────────
router.use('/metrics*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized' }, 401);
    }
    await next();
});

router.get('/metrics', async (c) => {
    const days  = Number(c.req.query('days') || 7);
    const agent = c.req.query('agent');

    const rows = await c.env.DB.prepare(`
        SELECT id, agent_name, run_at, duration_ms, tasks_seen, tasks_done, tasks_failed, model_used, tokens_used, error
        FROM agent_metrics
        WHERE run_at > datetime('now', '-' || ? || ' days')
          ${agent ? "AND agent_name = ?" : ""}
        ORDER BY run_at DESC
        LIMIT 200
    `).bind(...(agent ? [days, agent] : [days])).all<Record<string, unknown>>();

    return c.json({ data: rows.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// DELETE //tasks/archive — Admin: manually purge old terminal tasks
// Accepts ?completed_days=N (default 30) and ?failed_days=N (default 7)
// ───────────────────────────────────────────────────────────────────────────────
router.delete('/tasks/archive', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized' }, 401);
    }

    const completedDays = Math.max(1, Number(c.req.query('completed_days') || 30));
    const failedDays    = Math.max(1, Number(c.req.query('failed_days')    || 7));

    const result = await c.env.DB.prepare(`
        DELETE FROM agent_tasks
        WHERE (status = 'completed' AND completed_at < datetime('now', '-' || ? || ' days'))
           OR (status = 'failed'    AND completed_at < datetime('now', '-' || ? || ' days'))
    `).bind(completedDays, failedDays).run();

    return c.json({
        success: true,
        deleted: result.meta.changes,
        policy: { completed_days: completedDays, failed_days: failedDays },
    });
});

export { router as agentWebhooksRouter };
