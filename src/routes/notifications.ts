import { Hono } from 'hono';
import { z } from 'zod';
import type { Env } from '../types';
import { getUserNotifications, markNotificationsRead } from '../lib/alerts';

const router = new Hono<{ Bindings: Env }>();

const sessionId = (value: string | undefined) => {
    const normalized = value?.trim();
    return normalized && /^[A-Za-z0-9_-]{8,128}$/.test(normalized) ? normalized : null;
};

router.get('/', async (c) => {
    const session = sessionId(c.req.header('X-Session-ID'));
    if (!session) return c.json({ error: 'valid_session_required' }, 400);

    const requestedLimit = Number(c.req.query('limit') || 20);
    const limit = Number.isInteger(requestedLimit) ? Math.min(50, Math.max(1, requestedLimit)) : 20;
    const alerts = await getUserNotifications(c.env, session, limit);

    return c.json({
        data: alerts.map(alert => ({
            id: alert.notification_id || `${alert.article.id}:${alert.timestamp}`,
            title: alert.article.ai_push_message || alert.article.title,
            message: alert.article.summary || 'New source-linked reporting matches your saved interests.',
            article_slug: alert.article.slug,
            created_at: alert.timestamp,
            is_read: false,
        })),
    });
});

const ReadNotificationsSchema = z.object({
    ids: z.array(z.string().uuid()).max(50).optional(),
});

router.post('/read', async (c) => {
    const session = sessionId(c.req.header('X-Session-ID'));
    if (!session) return c.json({ error: 'valid_session_required' }, 400);

    const parsed = ReadNotificationsSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: 'invalid_notification_ids' }, 400);

    await markNotificationsRead(c.env, session, parsed.data.ids);
    return c.json({ success: true, marked: parsed.data.ids?.length ?? 'all' });
});

export { router as notificationsRouter };
