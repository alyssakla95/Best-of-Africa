
import { Hono } from 'hono';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();

// GET /api/v1/config/system
// Returns all dynamic system configuration strings (Sector headlines, welcome messages, etc.)
router.get('/system', async (c) => {
    // Try cache first (1 hour)
    // const cacheKey = 'system_config_all';
    // const cached = await c.env.DB.prepare('SELECT value FROM cache WHERE key = ?').bind(cacheKey).first();
    // if (cached) return c.json(JSON.parse(cached.value as string));

    const config = await c.env.DB.prepare('SELECT key, value FROM system_config').all();

    // Reduce to key-value object
    const map: Record<string, string> = {};
    for (const row of (config.results || [])) {
        map[(row as Record<string, any>).key] = (row as Record<string, any>).value;
    }

    return c.json(map);
});

export { router as configRouter };
