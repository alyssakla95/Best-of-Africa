import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Authentication middleware
router.use('/*', async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || authHeader !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized' }, 401);
    }
    await next();
});

/**
 * POST /self-improve/evolve
 * Fetches all unprocessed feedback and queues a task for the agent to evolve its rules.
 */
router.get('/evolve', async (c) => {
    try {
        // 1. Fetch unprocessed feedback
        const feedbacks = await c.env.DB.prepare(`
            SELECT id, feedback_type, comment, original_content, edited_content 
            FROM article_feedback 
            WHERE is_processed_by_agent = 0
            LIMIT 50
        `).all<{ id: string, feedback_type: string, comment: string, original_content: string, edited_content: string }>();

        if (feedbacks.results.length === 0) {
            return c.json({ success: true, message: 'No new feedback to process' });
        }

        // 2. Queue the evolution task
        const taskId = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO agent_tasks (id, type, payload, status)
            VALUES (?, 'evolve_instructions', ?, 'pending')
        `).bind(
            taskId,
            JSON.stringify({
                feedbacks: feedbacks.results,
                context: 'System-wide quality evolution'
            })
        ).run();

        // NOTE: Feedback rows are NOT marked as processed here.
        // They will be marked processed by the -webhooks completion handler
        // when the 'evolve_instructions' task succeeds. This prevents feedback
        // from being silently lost if the fails or the task is never picked up.

        return c.json({
            success: true,
            feedback_count: feedbacks.results.length,
            task_id: taskId
        });
    } catch (error) {
        console.error('Self-improvement evolution failed:', error);
        return c.json({ success: false, error: 'Evolution trigger failed' }, 500);
    }
});

export { router as selfImproveRouter };
