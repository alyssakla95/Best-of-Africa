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
 * GET /audit/scan
 * Scans for articles needing refresh and ingested items needing initial audit.
 */
router.get('/scan', async (c) => {
    try {
        // 1. Find articles needing refresh (e.g., published > 30 days ago and not recently audited)
        const staleArticles = await c.env.DB.prepare(`
            SELECT id, title, content 
            FROM articles 
            WHERE status = 'published' 
            AND (last_audited_at IS NULL OR last_audited_at < datetime('now', '-30 days'))
            LIMIT 10
        `).all<{ id: string, title: string, content: string }>();

        let tasksCreated = 0;

        for (const article of staleArticles.results) {
            const taskId = crypto.randomUUID();
            await c.env.DB.prepare(`
                INSERT INTO agent_tasks (id, type, payload, status)
                VALUES (?, 'audit_article', ?, 'pending')
            `).bind(
                taskId,
                JSON.stringify({
                    article_id: article.id,
                    title: article.title,
                    content: article.content,
                    context: 'Routine shelf-life audit'
                })
            ).run();
            tasksCreated++;
        }

        return c.json({
            success: true,
            scanned: staleArticles.results.length,
            tasks_created: tasksCreated
        });
    } catch (error) {
        console.error('Audit scan failed:', error);
        return c.json({ success: false, error: 'Audit scan failed' }, 500);
    }
});

export { router as auditRouter };
