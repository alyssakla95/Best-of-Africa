import { Hono } from 'hono';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();

router.get('/', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    if (!sessionId) return c.json({ data: [] });

    const bookmarks = await c.env.DB.prepare(`
        SELECT b.id, b.article_id, b.created_at,
               a.slug, a.title, a.summary, a.hero_image_url
        FROM bookmarks b
        JOIN articles a ON a.id = b.article_id
        WHERE b.session_id = ?
        ORDER BY b.created_at DESC
    `).bind(sessionId).all();

    return c.json({ data: bookmarks.results || [] });
});

router.post('/', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    if (!sessionId) return c.json({ error: 'unauthorized', message: 'Session required' }, 401);

    const { article_id } = await c.req.json();
    if (!article_id) return c.json({ error: 'validation_error', message: 'article_id required' }, 400);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT OR IGNORE INTO bookmarks (id, session_id, article_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `).bind(id, sessionId, article_id).run();

    return c.json({ success: true, id });
});

router.delete('/:id', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    const bookmarkId = c.req.param('id');

    await c.env.DB.prepare(`
        DELETE FROM bookmarks WHERE id = ? AND session_id = ?
    `).bind(bookmarkId, sessionId).run();

    return c.json({ success: true });
});

router.delete('/article/:article_id', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    const articleId = c.req.param('article_id');

    await c.env.DB.prepare(`
        DELETE FROM bookmarks WHERE article_id = ? AND session_id = ?
    `).bind(articleId, sessionId).run();

    return c.json({ success: true });
});

export { router as bookmarksRouter };
