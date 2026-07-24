
import express from 'express';
import { db } from './core/db';
import { BoaContentClient } from './clients/boa';
import pino from 'pino';

const app = express();
app.use(express.json());

const logger = pino({ level: 'info' });
const boa = new BoaContentClient(process.env.BOA_API_URL, process.env.BOA_API_KEY);

const PORT = process.env.PORT || 3001;
const INTERNAL_SECRET = process.env.BOA_INTERNAL_SECRET || 'secret';

// Middleware: Auth
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'] || req.headers['x-boa-secret'];
    // Accept Bearer or direct secret
    const token = authHeader?.toString().replace('Bearer ', '');

    if (token !== INTERNAL_SECRET) {
        logger.warn({ event: 'unauthorized_access', ip: req.ip });
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET /api/videos/article/:id
app.get('/api/videos/article/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const result = await db.get("SELECT * FROM article_videos WHERE article_id = ?", [articleId]);

        if (!result) {
            return res.status(404).json({ status: 'not_found' });
        }

        res.json(result);
    } catch (e: any) {
        logger.error({ event: 'api_error', error: e.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/videos/article/:id/generate
app.post('/api/videos/article/:id/generate', requireAuth, async (req, res) => {
    try {
        const articleId = req.params.id;
        const { priority = 'normal' } = req.body; // 'front_page', 'sponsored', 'normal'

        // 1. Check if exists
        const existing = await db.get("SELECT * FROM article_videos WHERE article_id = ?", [articleId]);
        if (existing) {
            // Include logic to re-generate if failed? 
            if (existing.status === 'failed' && existing.attempts < 2) {
                await db.run("UPDATE article_videos SET status = 'pending', priority = ? WHERE article_id = ?", [priority, articleId]);
                return res.json({ status: 'pending', message: 'Retry queued' });
            }
            return res.json(existing);
        }

        // 2. Validate Article Exists
        const metadata = await boa.getArticleMetadata(articleId);
        if (!metadata) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // 3. Enqueue
        await db.run(`
            INSERT INTO article_videos (article_id, status, priority, variant)
            VALUES (?, 'pending', ?, ?)
        `, [articleId, priority, 'tourist']);

        logger.info({ event: 'job_enqueued', article_id: articleId, priority });

        res.status(201).json({ status: 'pending', message: 'Job enqueued' });

    } catch (e: any) {
        logger.error({ event: 'api_error', error: e.message });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    logger.info({ event: 'server_started', port: PORT });
});
