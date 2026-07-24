import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

app.get('/check', async (c) => {
    const tasks = await c.env.DB.prepare('SELECT * FROM agent_tasks').all();
    const items = await c.env.DB.prepare('SELECT * FROM ingested_items').all();
    const taskCount = await c.env.DB.prepare('SELECT count(*) as count FROM agent_tasks').first('count');
    const itemCount = await c.env.DB.prepare('SELECT count(*) as count FROM ingested_items').first('count');
    
    return c.json({ 
        taskCount, 
        itemCount, 
        tasks: tasks.results, 
        items: items.results 
    });
});

app.get('/setup', async (c) => {
    try {
        // Create ingested_items
        await c.env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS ingested_items (
                id TEXT PRIMARY KEY,
                source_id TEXT,
                external_id TEXT,
                title TEXT NOT NULL,
                content TEXT,
                url TEXT,
                published_at TEXT,
                status TEXT DEFAULT 'pending',
                article_id TEXT,
                rejection_reason TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        // Create agent_tasks
        await c.env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS agent_tasks (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                payload TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                result TEXT,
                error TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            )
        `).run();

        // Seed required data
        await c.env.DB.prepare(`
            INSERT OR IGNORE INTO countries (code, name, region) VALUES ('MZ', 'Mozambique', 'Southern')
        `).run();

        await c.env.DB.prepare(`
            INSERT OR IGNORE INTO sectors (id, name) VALUES ('tourism', 'Tourism')
        `).run();

        await c.env.DB.prepare(`
            INSERT OR IGNORE INTO sources (id, name, type, url) VALUES ('reuters', 'Reuters Africa', 'rss', 'http://reuters.com')
        `).run();

        return c.json({ success: true, message: "Tables ensured and seeded" });
    } catch (e: any) {
        return c.json({ error: e.message, stack: e.stack }, 500);
    }
});

app.get('/insert', async (c) => {
    try {
        const itemId = 'test-item-' + Date.now();
        const taskId = 'test-task-' + Date.now();

        await c.env.DB.prepare(`
            INSERT INTO ingested_items (id, title, status, url, source_id, published_at) 
            VALUES (?, 'Test Article', 'pending', 'http://test.com', 'reuters', datetime('now'))
        `).bind(itemId).run();

        await c.env.DB.prepare(`
            INSERT INTO agent_tasks (id, type, payload, status) 
            VALUES (?, 'generate_article', ?, 'pending')
        `).bind(
            taskId, 
            JSON.stringify({ 
                ingested_item_id: itemId, 
                title: 'Test Article', 
                content: 'This is test content',
                country_code: 'MZ',
                country_name: 'Mozambique'
            })
        ).run();

        return c.json({ 
            success: true, 
            itemId, 
            taskId
        });
    } catch (e: any) {
        return c.json({ 
            error: e.message, 
            message: "Failed to insert test data"
        }, 500);
    }
});

export const debugRouter = app;
