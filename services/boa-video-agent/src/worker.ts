
import { db } from './core/db';
import { SeedanceClient } from './clients/seedance';
import { BoaContentClient } from './clients/boa';
import { PromptBuilder } from './core/promptBuilder';
import { translator } from './core/translator';
import pino from 'pino';

// Configuration
const POLL_INTERVAL_MS = (parseInt(process.env.VIDEO_STATUS_POLL_INTERVAL_SECONDS || '30')) * 1000;
const MAX_POLLS = parseInt(process.env.VIDEO_STATUS_MAX_POLLS || '10');
const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS || '2');
const HOURLY_LIMIT = parseInt(process.env.VIDEO_MAX_REQUESTS_PER_HOUR || '8');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: { target: 'pino-pretty' } // Pretty print for dev
});

const seedance = new SeedanceClient(process.env.SEEDANCE_API_KEY || '', process.env.SEEDANCE_API_BASE_URL);
const boa = new BoaContentClient(process.env.BOA_API_URL, process.env.BOA_API_KEY);

async function checkRateLimit(): Promise<boolean> {
    // Count jobs attempted in the last hour
    // SQLite uses datetime('now', '-1 hour'), Postgres uses NOW() - INTERVAL '1 hour'
    // We'll use a standardized query if possible or DB-specific.
    // Given the hybrid DB adapter, let's try a robust ANSI-ish query or handle logic in DB adapter?
    // DB adapter is simple. Let's try to query by simplified timestamp string comparison if using SQLite default format.

    // For simplicity/robustness across both without complex adapter logic:
    // We can fetch recent jobs and count in memory if volume is low (it is, <100/hr).
    // Or just try the SQLite syntax since in Dev we are SQLite.
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

        const result = await db.get(
            "SELECT COUNT(*) as count FROM article_videos WHERE last_attempt_at > ?",
            [oneHourAgo]
        );

        const count = result.count || result.total || 0; // Handle simple scalar return variations
        logger.debug({ event: 'rate_limit_check', count, limit: HOURLY_LIMIT });
        return count < HOURLY_LIMIT;
    } catch (e) {
        logger.error({ event: 'rate_limit_check_error', error: e });
        return false; // Fail safe
    }
}

async function processPendingJobs() {
    if (!await checkRateLimit()) {
        logger.warn({ event: 'rate_limit_hit', message: 'Hourly limit reached. Skipping new jobs.' });
        return;
    }

    // specific priority ordering: 'front_page' > 'sponsored' > 'normal'
    // We can map these to integers or just use CASE. 
    // SQLite/PG CASE Syntax is compatible.
    const priorityCase = `
        CASE priority 
            WHEN 'front_page' THEN 1 
            WHEN 'sponsored' THEN 2 
            ELSE 3 
        END
    `;

    try {
        // Fetch one pending job
        const job = await db.get(`
            SELECT * FROM article_videos 
            WHERE status = 'pending' 
            ORDER BY ${priorityCase} ASC, created_at ASC 
            LIMIT 1
        `);

        if (!job) return;

        logger.info({ event: 'job_picked', article_id: job.article_id, priority: job.priority });

        // 1. Fetch Article Data
        const metadata = await boa.getArticleMetadata(job.article_id);
        if (!metadata) {
            logger.error({ event: 'job_failed', article_id: job.article_id, reason: 'Metadata fetch failed' });
            await db.run("UPDATE article_videos SET status = 'failed', last_attempt_at = CURRENT_TIMESTAMP, attempts = attempts + 1 WHERE article_id = ?", [job.article_id]);
            return;
        }

        // 2. Build Prompt (English)
        const prompt = PromptBuilder.build(metadata);
        logger.info({ event: 'prompt_built', article_id: job.article_id, prompt_preview: prompt.slice(0, 50) });

        // 2b. Generate Localized Metadata (Async/Parallel)
        // We do this while calling Seedance or before? 
        // Seedance takes ~10-60s. Translation takes ~2-5s.
        // Let's do it in parallel with Seedance generation to save time.

        const enabledLangs = ['fr', 'de', 'ar', 'hi', 'zh', 'pt'];
        const localizedMeta: Record<string, any> = {};

        const translationPromise = (async () => {
            // We only translate title and description (from tourist variant or base)
            const title = metadata.title;
            const desc = metadata.description || metadata.variants?.tourist || "";

            await Promise.all(enabledLangs.map(async (lang) => {
                const tTitle = await translator.translate(title, lang);
                const tDesc = await translator.translate(desc, lang);
                if (tTitle) localizedMeta[`title_${lang}`] = tTitle;
                if (tDesc) localizedMeta[`description_${lang}`] = tDesc;
            }));
            // Also store English explicitly
            localizedMeta['title_en'] = title;
            localizedMeta['description_en'] = desc;
        })();

        // 3. Call Seedance
        try {
            const [videoId, _] = await Promise.all([
                seedance.generateVideo(prompt),
                translationPromise
            ]);

            // Merge new metadata with existing if any (postgres jsonb_set or just overwrite field)
            // We need to update the `metadata` column in `article_videos`
            // Current schema has `metadata` JSONB? Yes, migration 0002 added it.

            await db.run(`
                UPDATE article_videos 
                SET status = 'generating', 
                    seedance_video_id = ?, 
                    prompt_used = ?, 
                    last_attempt_at = CURRENT_TIMESTAMP, 
                    attempts = attempts + 1,
                    metadata = ?
                WHERE article_id = ?
            `, [videoId, prompt, JSON.stringify(localizedMeta), job.article_id]);

            logger.info({ event: 'generation_started', article_id: job.article_id, seedance_id: videoId });

        } catch (apiError: any) {
            logger.error({ event: 'generation_api_error', article_id: job.article_id, error: apiError.message });
            await db.run(`
                UPDATE article_videos 
                SET status = 'failed', last_attempt_at = CURRENT_TIMESTAMP, attempts = attempts + 1 
                WHERE article_id = ?
            `, [job.article_id]);
        }

    } catch (e) {
        logger.error({ event: 'process_loop_error', error: e });
    }
}

async function checkGeneratingJobs() {
    try {
        const jobs = await db.all("SELECT * FROM article_videos WHERE status = 'generating'");

        for (const job of jobs) {
            try {
                const status = await seedance.getVideoStatus(job.seedance_video_id);

                if (status.status === 'succeeded' && status.output_url) {
                    await db.run(
                        "UPDATE article_videos SET status = 'ready', video_url = ?, updated_at = CURRENT_TIMESTAMP WHERE article_id = ?",
                        [status.output_url, job.article_id]
                    );
                    logger.info({ event: 'job_complete', article_id: job.article_id, url: status.output_url });
                } else if (status.status === 'failed') {
                    // Retry logic handled by next Loop if we set to failed, or we can reset to pending here if attempts < MAX
                    // User requirement: "If failed and attempts < max, reset to pending"
                    if (job.attempts < MAX_ATTEMPTS) {
                        await db.run(
                            "UPDATE article_videos SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE article_id = ?",
                            [job.article_id]
                        );
                        logger.warn({ event: 'job_retry_queued', article_id: job.article_id, attempt: job.attempts });
                    } else {
                        await db.run(
                            "UPDATE article_videos SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE article_id = ?",
                            [job.article_id]
                        );
                        logger.error({ event: 'job_failed_permanently', article_id: job.article_id, reason: status.error });
                    }
                } else {
                    // Check for timeout
                    const startedAt = new Date(job.last_attempt_at).getTime();
                    const now = Date.now();
                    // Max duration = polls * interval
                    const maxDuration = MAX_POLLS * POLL_INTERVAL_MS * 2; // *2 buffer

                    if (now - startedAt > maxDuration) {
                        await db.run(
                            "UPDATE article_videos SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE article_id = ?",
                            [job.article_id]
                        );
                        logger.error({ event: 'job_timeout', article_id: job.article_id });
                    }
                }

            } catch (e) {
                logger.error({ event: 'status_check_error', article_id: job.article_id, error: e });
            }
        }

    } catch (e) {
        logger.error({ event: 'status_loop_error', error: e });
    }
}

async function startWorker() {
    logger.info({ event: 'worker_startup', config: { POLL_INTERVAL_MS, MAX_ATTEMPTS, HOURLY_LIMIT } });

    // Main Loop
    while (true) {
        await processPendingJobs();
        await checkGeneratingJobs();

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }
}

// Start
if (require.main === module) {
    startWorker().catch(e => {
        logger.fatal({ event: 'worker_crash', error: e });
        process.exit(1);
    });
}
