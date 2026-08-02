// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTER
// Protected endpoints for content management
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { z } from 'zod';
import type { Env, Variables } from '../types';
import { requireAdmin } from '../lib/auth';
import { getCached, CACHE_KEYS } from '../lib/cache';
import { validate, CreateArticleSchema } from '../lib';
import { editorialApprovalFailure } from '../lib/editorial-quality';
import { indexArticle } from '../lib/vectorize';
import { onArticlePublished } from '../lib/alerts';
import { autoPostArticle } from '../lib/social';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply admin auth to all routes
router.use('*', requireAdmin);

// Import helpers
import { generateSummary, analyzeSentiment, callConfiguredAI } from '../lib/ai';

async function generateTags(env: Env, content: string): Promise<string[]> {
    try {
        const prompt = `Generate exactly 5 SEO tags for this article. Respond with a valid JSON array of strings only. Example: ["tag1","tag2","tag3","tag4","tag5"]

Article Content:
${content.slice(0, 1000)}`;

        const raw = await callConfiguredAI(env, { prompt, max_tokens: 100, temperature: 0.1 });
        
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw || '[]');
        } catch {
            const match = (raw || '').match(/\[[\s\S]*\]/);
            if (!match) return ['African Business', 'News'];
            parsed = JSON.parse(match[0]);
        }

        // Accept both array and object-with-tags-key shapes
        const tags = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as any)?.tags)
                ? (parsed as any).tags
                : null;

        if (!tags) return ['African Business', 'News'];
        return tags.filter((t: unknown) => typeof t === 'string').slice(0, 5);
    } catch {
        return ['African Business', 'News'];
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Articles Management
// ───────────────────────────────────────────────────────────────────────────────

// GET /admin/articles - List all articles (including drafts)
router.get('/articles', async (c) => {
    const { page = '1', limit = '20', status } = c.req.query();
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const pageNum = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const limitNum = Math.min(100, Number.isNaN(parsedLimit) ? 20 : parsedLimit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    const params: unknown[] = [];

    if (status) {
        whereClause = 'WHERE status = ?';
        params.push(status);
    }

    const [countResult, articles] = await Promise.all([
        c.env.DB.prepare(`SELECT COUNT(*) as total FROM articles ${whereClause}`).bind(...params).first<{ total: number }>(),
        c.env.DB.prepare(`
      SELECT a.*, c.name as country_name, s.name as sector_name
      FROM articles a
      LEFT JOIN countries c ON a.country_code = c.code
      LEFT JOIN sectors s ON a.sector_id = s.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limitNum, offset).all(),
    ]);

    return c.json({
        data: articles.results || [],
        pagination: {
            page: pageNum,
            limit: limitNum,
            total: countResult?.total || 0,
            total_pages: Math.ceil((countResult?.total || 0) / limitNum),
        },
    });
});

// POST /admin/articles - Create article
router.post('/articles', validate('json', CreateArticleSchema.extend({
    subtitle: z.string().max(300).optional(),
    summary: z.string().max(1000).optional(),
    slug: z.string().min(3).max(200).optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    is_sponsored: z.boolean().default(false),
})), async (c) => {
    const body = (c.req as any).valid('json');
    const id = crypto.randomUUID();
    // : Auto-fill missing fields
    let summary = body.summary;
    let tags = body.tags || [];

    // Calculate sentiment/engagement score for initial sort
    let engagementScore = 50;

    if (body.content && (!summary || tags.length === 0)) {
        const [aiSummary, aiTags, aiSentiment] = await Promise.all([
            !summary ? generateSummary(c.env, body.content) : Promise.resolve(summary),
            tags.length === 0 ? generateTags(c.env, body.content) : Promise.resolve(tags),
            analyzeSentiment(c.env, body.title, body.content)
        ]);

        summary = aiSummary;
        tags = aiTags;
        engagementScore = Math.round(aiSentiment.score); // Use sentiment as proxy for initial engagement score
    }

    const finalSlug = body.slug || generateSlug(body.title);

    await c.env.DB.prepare(`
    INSERT INTO articles (id, slug, title, subtitle, content, summary, country_code, sector_id, tags, status, engagement_score, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
        id,
        finalSlug,
        body.title,
        body.subtitle || null,
        body.content,
        summary || null,
        body.country_code || null,
        body.sector_id || null,
        JSON.stringify(tags || []),
        body.status || 'draft',
        engagementScore
    ).run();

    return c.json({
        id,
        slug: finalSlug,
        ai_generated: { summary: !!body.summary, tags: body.tags?.length > 0 }
    }, 201);
});

// GET /admin/articles/:id - Get single article details
router.get('/articles/:id', async (c) => {
    const id = c.req.param('id');

    // Fetch article with country and sector names joined
    const article = await c.env.DB.prepare(`
        SELECT a.*, c.name as country_name, s.name as sector_name
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.id = ?
    `).bind(id).first();

    if (!article) {
        return c.json({ error: 'not_found', message: 'Article not found' }, 404);
    }

    return c.json(article);
});

// PUT /admin/articles/:id - Update article
router.put('/articles/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await c.env.DB.prepare('SELECT id FROM articles WHERE id = ?').bind(id).first();
    if (!existing) {
        return c.json({ error: 'not_found', message: 'Article not found' }, 404);
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ['title', 'subtitle', 'content', 'summary', 'country_code', 'sector_id', 'status', 'hero_image_url'];
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(body[field]);
        }
    }

    if (body.tags) {
        updates.push('tags = ?');
        values.push(JSON.stringify(body.tags));
    }

    if (body.status === 'published') {
        updates.push('published_at = ?');
        values.push(new Date().toISOString());
    }

    updates.push("updated_at = datetime('now')");

    // for Updates
    if (body.content && (body.summary === undefined || body.tags === undefined)) {
        // Only run if content is being updated and fields are missing/requested
        // This logic allows explicit "reset" if user sends empty string, so we check for undefined
        const currentArticle = await c.env.DB.prepare('SELECT title, content FROM articles WHERE id = ?').bind(id).first<{ title: string; content: string }>();
        const contentToAnalyze = body.content || currentArticle?.content;

        if (contentToAnalyze) {
            if (body.summary === "") { // User explicitly cleared it, maybe request regen?
                const aiSummary = await generateSummary(c.env, contentToAnalyze);
                updates.push('summary = ?');
                values.push(aiSummary);
            }

            // Update sentiment if content changed
            if (body.content) {
                const aiSentiment = await analyzeSentiment(c.env, body.title || currentArticle?.title || '', body.content);
                updates.push('engagement_score = ?'); // Update score based on new sentiment
                values.push(Math.round(aiSentiment.score));
            }
        }
    }

    await c.env.DB.prepare(`UPDATE articles SET ${updates.join(', ')} WHERE id = ?`).bind(...values, id).run();

    // Log feedback if content was changed significanlty
    const currentContent = await c.env.DB.prepare('SELECT content FROM articles WHERE id = ?').bind(id).first<{ content: string }>();
    if (body.content && body.content !== currentContent?.content) {
        const feedbackId = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO article_feedback (id, article_id, feedback_type, comment, original_content, edited_content)
            VALUES (?, ?, 'edit', 'Manual editorial improvement', ?, ?)
        `).bind(
            feedbackId,
            id,
            currentContent?.content || '',
            body.content
        ).run();
    }

    return c.json({ success: true });
});

// DELETE /admin/articles/:id - Delete article
router.delete('/articles/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// POST /admin/articles/:id/publish - Publish article
router.post('/articles/:id/publish', async (c) => {
    const id = c.req.param('id');

    await c.env.DB.prepare(`
    UPDATE articles 
    SET status = 'published', published_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(id).run();

    return c.json({ success: true });
});

/**
 * POST /admin/articles/:id/curate
 * Toggle the curated (human-reviewed, personal byline, magazine-front) tier.
 * Body: { curated: boolean } — defaults to true when omitted.
 */
router.post('/articles/:id/curate', async (c) => {
    const id = c.req.param('id');
    let curated = 1;
    try {
        const body = await c.req.json();
        if (typeof body?.curated === 'boolean') curated = body.curated ? 1 : 0;
    } catch { /* no body → curate */ }

    const res = await c.env.DB.prepare(
        `UPDATE articles SET curated = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(curated, id).run();

    if (!res.meta.changes) return c.json({ error: 'not_found' }, 404);
    return c.json({ success: true, curated: !!curated });
});

/**
 * POST /admin/articles/:id/reject
 * Reject and archive article, logging the reason as feedback for agents.
 */
router.post('/articles/:id/reject', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    const article = await c.env.DB.prepare('SELECT content FROM articles WHERE id = ?').bind(id).first<{ content: string }>();
    if (!article) {
        return c.json({ error: 'not_found' }, 404);
    }

    // Log rejection feedback
    const feedbackId = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO article_feedback (id, article_id, feedback_type, comment, original_content)
        VALUES (?, ?, 'rejection', ?, ?)
    `).bind(
        feedbackId,
        id,
        body.reason || 'Manual rejection',
        article.content
    ).run();

    // Update status to archived
    await c.env.DB.prepare(`
        UPDATE articles SET status = 'archived' WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Article rejected and feedback logged' });
});

// ───────────────────────────────────────────────────────────────────────────────
// Sources Management
// ───────────────────────────────────────────────────────────────────────────────

router.get('/sources', async (c) => {
    const sources = await c.env.DB.prepare('SELECT * FROM sources ORDER BY name ASC').all();
    return c.json({ data: sources.results || [] });
});

const CreateSourceSchema = z.object({
    name: z.string().min(2).max(200),
    type: z.enum(['rss', 'api', 'scraper', 'manual']),
    url: z.string().url().refine(url => url.startsWith('http://') || url.startsWith('https://'), {
        message: 'Only http and https URLs are allowed',
    }),
    country_code: z.string().length(2).optional(),
    sector_id: z.string().uuid().optional(),
    is_active: z.boolean().default(true),
    fetch_interval_minutes: z.number().int().min(5).max(1440).default(30),
});

router.post('/sources', validate('json', CreateSourceSchema), async (c) => {
    const body = (c.req as any).valid('json');
    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
    INSERT INTO sources (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
        id,
        body.name,
        body.type,
        body.url,
        body.country_code || null,
        body.sector_id || null,
        body.is_active ?? 1,
        body.fetch_interval_minutes || 30
    ).run();

    return c.json({ id }, 201);
});

router.delete('/sources/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM sources WHERE id = ?').bind(id).run();
    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// Countries Management
// ───────────────────────────────────────────────────────────────────────────────

router.put('/countries/:code', async (c) => {
    const code = c.req.param('code').toUpperCase();
    const body = await c.req.json();

    const updates: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ['description', 'investment_highlights', 'tourism_highlights', 'hero_image_url', 'population', 'gdp_usd'];
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(typeof body[field] === 'object' ? JSON.stringify(body[field]) : body[field]);
        }
    }

    updates.push("updated_at = datetime('now')");

    await c.env.DB.prepare(`UPDATE countries SET ${updates.join(', ')} WHERE code = ?`).bind(...values, code).run();

    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// Clients Management
// ───────────────────────────────────────────────────────────────────────────────

router.get('/clients', async (c) => {
    const clients = await c.env.DB.prepare(`
    SELECT id, name, email, organization, type, tier, is_active, created_at
    FROM clients
    ORDER BY created_at DESC
  `).all();
    return c.json({ data: clients.results || [] });
});

const CreateClientSchema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    organization: z.string().trim().max(200).optional(),
    type: z.enum(['government', 'investor', 'partner', 'media', 'other']).default('other'),
    tier: z.enum(['basic', 'premium', 'enterprise']).default('basic'),
    rate_limit_per_hour: z.number().int().min(10).max(100_000).default(100),
});

router.post('/clients', validate('json', CreateClientSchema), async (c) => {
    const body = (c.req as any).valid('json');
    const existing = await c.env.DB.prepare(
        'SELECT id FROM clients WHERE lower(email) = lower(?) LIMIT 1',
    ).bind(body.email).first<{ id: string }>();
    if (existing) {
        return c.json({ error: 'client_exists', message: 'A client with this email already exists' }, 409);
    }

    const id = crypto.randomUUID();
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    await c.env.DB.prepare(`
    INSERT INTO clients (id, name, email, organization, type, api_key_hash, tier, rate_limit_per_hour)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
        id,
        body.name,
        body.email,
        body.organization || null,
        body.type,
        apiKeyHash,
        body.tier,
        body.rate_limit_per_hour
    ).run();

    // Return API key only on creation (won't be retrievable later)
    return c.json({ id, api_key: apiKey }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// Operator Inbox — every inbound submission in one place. The public forms
// (contact, consultation booking, event registration, newsletter) all store
// to D1; without this endpoint nothing ever surfaced them to a human.
// ───────────────────────────────────────────────────────────────────────────────

router.get('/inbox', async (c) => {
    const [pilots, contact, bookings, registrations, subscribers] = await Promise.all([
        c.env.DB.prepare(`
            SELECT id, contact_name, work_email, organization, role_title,
                   organization_type, target_sector, candidate_countries,
                   decision_question, decision_deadline, current_research_process,
                   success_measure, status, qualification_notes, created_at, updated_at
            FROM pilot_requests ORDER BY created_at DESC LIMIT 100
        `).all(),
        c.env.DB.prepare(`
            SELECT id, name, organization, email, inquiry_type, message, created_at
            FROM contact_submissions ORDER BY created_at DESC LIMIT 100
        `).all(),
        c.env.DB.prepare(`
            SELECT id, guest_name, guest_email, guest_organization, service_type,
                   requirements, budget_range, urgency, status, created_at
            FROM booking_requests ORDER BY created_at DESC LIMIT 100
        `).all(),
        c.env.DB.prepare(`
            SELECT r.id, r.event_id, e.title AS event_title, r.user_email, r.user_name,
                   r.user_organization, r.ticket_type, r.status, r.confirmation_code, r.registered_at
            FROM event_registrations r
            LEFT JOIN events e ON e.id = r.event_id
            ORDER BY r.registered_at DESC LIMIT 100
        `).all(),
        c.env.DB.prepare(
            'SELECT COUNT(*) AS n FROM digest_subscriptions WHERE is_active = 1'
        ).first<{ n: number }>(),
    ]);

    return c.json({
        pilots: (pilots.results || []).map((row: Record<string, unknown>) => ({
            ...row,
            candidate_countries: JSON.parse(String(row.candidate_countries || '[]')),
        })),
        contact: contact.results || [],
        bookings: bookings.results || [],
        registrations: registrations.results || [],
        newsletter_subscribers: subscribers?.n || 0,
    });
});

const PilotStatusSchema = z.object({
    status: z.enum(['new', 'reviewing', 'qualified', 'pilot_proposed', 'closed']),
    qualification_notes: z.string().trim().max(2000).optional(),
});

router.patch(
    '/pilot-requests/:id',
    validate('param', z.object({ id: z.string().uuid() })),
    validate('json', PilotStatusSchema),
    async (c) => {
        const { id } = (c.req as any).valid('param') as { id: string };
        const body = (c.req as any).valid('json') as z.infer<typeof PilotStatusSchema>;
        const result = await c.env.DB.prepare(`
            UPDATE pilot_requests
            SET status = ?, qualification_notes = ?, updated_at = datetime('now')
            WHERE id = ?
        `).bind(body.status, body.qualification_notes || null, id).run();

        if (!result.meta.changes) {
            return c.json({ error: 'not_found', message: 'Pilot request not found' }, 404);
        }

        return c.json({ success: true, id, status: body.status });
    },
);

// ───────────────────────────────────────────────────────────────────────────────
// Intelligence & Strategy (-Driven)
// ───────────────────────────────────────────────────────────────────────────────

router.get('/intelligence/recommendations', async (c) => {
    const recommendations = await getCached(
        c.env,
        CACHE_KEYS.adminContentRecs,
        async () => {
            // Measured coverage gaps only. An earlier version asked the model to
            // imagine "trending" topics from parametric knowledge — fabricated
            // recommendations presented as analysis. Every recommendation here
            // is computed from the actual publication record.
            const gaps: string[] = [];

            // 1. Thinnest sector coverage over the last 30 days.
            const sectorRows = await c.env.DB.prepare(`
                SELECT s.name, COUNT(a.id) AS recent
                FROM sectors s
                LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
                    AND a.published_at >= datetime('now', '-30 days')
                GROUP BY s.id
                ORDER BY recent ASC, s.name ASC
            `).all<{ name: string; recent: number }>();
            const sectors = sectorRows.results || [];
            if (sectors.length) {
                const busiest = Math.max(...sectors.map(row => Number(row.recent)));
                for (const row of sectors.filter(r => Number(r.recent) <= Math.max(1, busiest * 0.1)).slice(0, 2)) {
                    const count = Number(row.recent);
                    gaps.push(`${row.name} has ${count} published ${count === 1 ? 'story' : 'stories'} in the last 30 days — the thinnest sector coverage on record (busiest sector: ${busiest}).`);
                }
            }

            // 2. Countries with no published coverage in the last 30 days.
            const silent = await c.env.DB.prepare(`
                SELECT c.name
                FROM countries c
                WHERE NOT EXISTS (
                    SELECT 1 FROM articles a
                    WHERE a.country_code = c.code AND a.status = 'published'
                        AND a.published_at >= datetime('now', '-30 days')
                )
                ORDER BY c.name
                LIMIT 6
            `).all<{ name: string }>();
            const silentNames = (silent.results || []).map(row => row.name);
            if (silentNames.length) {
                gaps.push(`No published coverage in the last 30 days for: ${silentNames.join(', ')}${silentNames.length === 6 ? ' (and possibly more)' : ''}.`);
            }

            // 3. Published articles invisible to sector filters and trends.
            const unclassified = await c.env.DB.prepare(`
                SELECT COUNT(*) AS n FROM articles
                WHERE status = 'published' AND (sector_id IS NULL OR sector_id = '')
            `).first<{ n: number }>();
            const unclassifiedCount = Number(unclassified?.n || 0);
            if (unclassifiedCount > 0) {
                gaps.push(`${unclassifiedCount} published ${unclassifiedCount === 1 ? 'article has' : 'articles have'} no sector classification and are invisible to sector filters, trends and dossiers.`);
            }

            return gaps;
        },
        { ttl: 3600 } // 1 hour
    );

    return c.json({ recommendations });
});

// ───────────────────────────────────────────────────────────────────────────────
// Manual Trigger for Workers
// ───────────────────────────────────────────────────────────────────────────────

router.post('/trigger/ingestion', async (c) => {
    const { ingestNews } = await import('../workers/ingestion');
    await ingestNews(c.env);
    return c.json({ success: true, message: 'Ingestion triggered' });
});

router.post('/trigger/optimization', async (c) => {
    const { optimizeContent } = await import('../workers/optimizer');
    await optimizeContent(c.env);
    return c.json({ success: true, message: 'Optimization triggered' });
});

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);
}

function generateApiKey(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return `boa_${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

async function hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ───────────────────────────────────────────────────────────────────────────────
// Batch Fix: Reclassify Articles Without Sectors
// ───────────────────────────────────────────────────────────────────────────────
import { identifySector, identifyCountry } from '../lib/ai';

router.post('/fix-sectors', async (c) => {
    const { limit = '50' } = c.req.query();
    const batchSize = Math.min(100, parseInt(limit));

    const articles = await c.env.DB.prepare(`
        SELECT id, title, content, sector_id, country_code
        FROM articles
        WHERE (sector_id IS NULL OR sector_id = '' OR country_code IS NULL OR country_code = '')
        ORDER BY published_at DESC
        LIMIT ?
    `).bind(batchSize).all<{ id: string; title: string; content: string | null; sector_id: string | null; country_code: string | null }>();

    const results = { fixed: 0, failed: 0, details: [] as { id: string; sector: string | null; country: string | null }[] };

    for (const a of (articles.results || [])) {
        try {
            let newSector = a.sector_id;
            let newCountry = a.country_code;

            // Classify sector if missing
            if (!newSector) {
                newSector = await identifySector(c.env, a.title, a.content || '');
            }

            // Classify country if missing
            if (!newCountry) {
                newCountry = await identifyCountry(c.env, a.title, a.content || '');
            }

            // Update if we found either
            if (newSector || newCountry) {
                await c.env.DB.prepare(`
                    UPDATE articles SET sector_id = COALESCE(?, sector_id), country_code = COALESCE(?, country_code)
                    WHERE id = ?
                `).bind(newSector || null, newCountry || null, a.id).run();

                results.fixed++;
                results.details.push({ id: a.id, sector: newSector, country: newCountry });
            } else {
                results.failed++;
            }
        } catch (e) {
            console.error(`Failed to classify article ${a.id}:`, e);
            results.failed++;
        }
    }

    return c.json({
        message: `Batch sector/country fix complete`,
        total_processed: articles.results?.length || 0,
        fixed: results.fixed,
        failed: results.failed,
        details: results.details.slice(0, 10) // Only return first 10 for brevity
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// Batch Job: Generate Article Images
// ───────────────────────────────────────────────────────────────────────────────
import { generateArticleImage } from '../lib/ai';
import { uploadImage } from '../lib/media';

router.post('/generate-images', async (c) => {
    return c.json({ error: 'gone', message: 'Synthetic editorial image generation is permanently disabled. Supply a source-owned image URL, credit and source page instead.' }, 410);
    /* compatibility code below is intentionally unreachable */
    const { limit = '10' } = c.req.query();
    const batchSize = Math.min(50, parseInt(limit));

    // Get articles without images
    const articles = await c.env.DB.prepare(`
        SELECT a.id, a.title, a.content, c.name as country_name, s.name as sector_name 
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE (a.hero_image_url IS NULL OR a.hero_image_url = '')
        AND a.status = 'published'
        ORDER BY a.published_at DESC
        LIMIT ?
    `).bind(batchSize).all<{ id: string; title: string; country_name: string | null; sector_name: string | null }>();

    const results = { generated: 0, failed: 0, details: [] as any[] };

    for (const a of (articles.results || [])) {
        try {
            // Construct Prompt
            const context = [a.country_name, a.sector_name].filter(Boolean).join(', ');
            const prompt = `Photorealistic journalism style photo of ${a.title}. Context: ${context}. High quality, 4k, award winning photography, dramatic lighting, highly detailed, news editorial style. No text.`;

            console.log(`Generating image for ${a.id}: ${prompt.slice(0, 100)}...`);

            // Generate
            const imageBuffer = await generateArticleImage(c.env, prompt);

            if (imageBuffer) {
                // Upload to R2
                const key = `hero/${a.id}.png`;
                const publicUrl = await uploadImage(c.env, key, imageBuffer!, 'image/png');

                // Update DB
                await c.env.DB.prepare(`
                    UPDATE articles SET hero_image_url = ? WHERE id = ?
                `).bind(publicUrl, a.id).run();

                results.generated++;
                results.details.push({ id: a.id, url: publicUrl });
            } else {
                results.failed++;
                console.error(`Failed to generate image for ${a.id}`);
            }
        } catch (e) {
            console.error(`Error processing image for article ${a.id}:`, e);
            results.failed++;
        }
    }

    return c.json({
        message: `Batch image generation complete`,
        total_processed: articles.results?.length || 0,
        results
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// ZEROCLAW EDITORIAL ENDPOINTS
// Referenced by .zeroclaw/skills/proactive-editorial.md
// and .zeroclaw/skills/self-improving-editorial.md
// ───────────────────────────────────────────────────────────────────────────────

// GET /admin/articles?filter=needs_audit — articles needing proactive audit
// (extends the existing list handler, checked via query param)
router.get('/articles/needs-audit', async (c) => {
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

    const articles = await c.env.DB.prepare(`
        SELECT a.id, a.title, a.content, a.summary, a.country_code, a.sector_id,
               a.source_url, a.source_title, a.source_published_at,
               a.status, a.moderation_status, a.last_audited_at, a.created_at,
               c.name as country_name, s.name as sector_name
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'pending_audit'
           OR (a.status = 'published' AND (a.last_audited_at IS NULL OR a.last_audited_at < datetime('now', '-7 days')))
        ORDER BY a.created_at DESC
        LIMIT ?
    `).bind(limit).all<Record<string, unknown>>();

    return c.json({ data: articles.results || [], count: articles.results?.length || 0 });
});

// GET /admin/editorial/remediation-preview — read-only legacy corpus assessment.
// Only objectively unverifiable records are eligible for automatic quarantine;
// short or old records remain in the human/agent review queue.
router.get('/editorial/remediation-preview', async (c) => {
    const [counts, samples] = await Promise.all([
        c.env.DB.prepare(`
            SELECT
                COUNT(*) AS published_total,
                SUM(CASE WHEN last_audited_at IS NULL THEN 1 ELSE 0 END) AS unaudited,
                SUM(CASE WHEN source_url IS NULL OR trim(source_url) = '' THEN 1 ELSE 0 END) AS missing_source,
                SUM(CASE WHEN length(content) < 2500 THEN 1 ELSE 0 END) AS short_content
            FROM articles
            WHERE status = 'published'
        `).first<Record<string, number>>(),
        c.env.DB.prepare(`
            SELECT id, slug, title, country_code, sector_id, created_at
            FROM articles
            WHERE status = 'published'
              AND (source_url IS NULL OR trim(source_url) = '')
            ORDER BY created_at DESC
            LIMIT 25
        `).all<Record<string, unknown>>(),
    ]);

    return c.json({
        data: {
            ...counts,
            automatic_quarantine_rule: 'missing_source',
            automatic_quarantine_candidates: counts?.missing_source || 0,
            review_only: { short_content: counts?.short_content || 0 },
            sample: samples.results || [],
        },
        generated_at: new Date().toISOString(),
    });
});

// POST /admin/editorial/remediation/quarantine — reversible batch quarantine.
// A caller must explicitly confirm the run. The narrow rule deliberately avoids
// making subjective automated judgements about article length or writing style.
router.post('/editorial/remediation/quarantine', async (c) => {
    const body = await c.req.json<{ rule?: string; limit?: number; confirm?: boolean }>();
    if (body.rule !== 'missing_source') {
        return c.json({ error: 'unsupported_rule', message: 'Only missing_source can be quarantined automatically.' }, 400);
    }
    if (body.confirm !== true) {
        return c.json({ error: 'confirmation_required', message: 'Set confirm to true after reviewing the preview.' }, 400);
    }

    const limit = Math.min(500, Math.max(1, Number(body.limit) || 100));
    const runId = crypto.randomUUID();
    const reason = 'No verifiable source URL was attached to this published record.';
    const matched = await c.env.DB.prepare(`
        SELECT COUNT(*) AS total FROM articles
        WHERE status = 'published' AND (source_url IS NULL OR trim(source_url) = '')
    `).first<{ total: number }>();

    await c.env.DB.batch([
        c.env.DB.prepare(`
            INSERT INTO editorial_remediation_runs (id, rule, status, matched_count)
            VALUES (?, 'missing_source', 'running', ?)
        `).bind(runId, matched?.total || 0),
        c.env.DB.prepare(`
            INSERT INTO editorial_remediation_items (
                run_id, article_id, previous_status, previous_moderation_status,
                previous_moderation_score, reason
            )
            SELECT ?, id, status, moderation_status, moderation_score, ?
            FROM articles
            WHERE status = 'published' AND (source_url IS NULL OR trim(source_url) = '')
            ORDER BY created_at ASC
            LIMIT ?
        `).bind(runId, reason, limit),
        c.env.DB.prepare(`
            UPDATE articles
            SET status = 'pending_audit', moderation_status = 'flagged',
                moderation_score = 0, updated_at = datetime('now')
            WHERE id IN (
                SELECT article_id FROM editorial_remediation_items WHERE run_id = ?
            )
        `).bind(runId),
        c.env.DB.prepare(`
            INSERT INTO article_feedback (
                id, article_id, feedback_type, comment, is_processed_by_agent
            )
            SELECT ? || ':' || article_id, article_id, 'audit_fail',
                   'Legacy remediation ' || ? || ': ' || reason, 0
            FROM editorial_remediation_items WHERE run_id = ?
        `).bind(runId, runId, runId),
        c.env.DB.prepare(`
            UPDATE editorial_remediation_runs
            SET status = 'completed',
                processed_count = (SELECT COUNT(*) FROM editorial_remediation_items WHERE run_id = ?),
                completed_at = datetime('now')
            WHERE id = ?
        `).bind(runId, runId),
    ]);

    const run = await c.env.DB.prepare(`
        SELECT * FROM editorial_remediation_runs WHERE id = ?
    `).bind(runId).first();
    return c.json({ success: true, run });
});

// POST /admin/editorial/remediation/:runId/restore — emergency rollback for a run.
router.post('/editorial/remediation/:runId/restore', async (c) => {
    const runId = c.req.param('runId');
    const run = await c.env.DB.prepare(`
        SELECT id, status FROM editorial_remediation_runs WHERE id = ?
    `).bind(runId).first<{ id: string; status: string }>();
    if (!run) return c.json({ error: 'not_found' }, 404);
    if (run.status === 'restored') return c.json({ error: 'already_restored' }, 409);

    await c.env.DB.batch([
        c.env.DB.prepare(`
            UPDATE articles
            SET status = COALESCE((
                    SELECT previous_status FROM editorial_remediation_items i
                    WHERE i.run_id = ? AND i.article_id = articles.id
                ), status),
                moderation_status = (
                    SELECT previous_moderation_status FROM editorial_remediation_items i
                    WHERE i.run_id = ? AND i.article_id = articles.id
                ),
                moderation_score = (
                    SELECT previous_moderation_score FROM editorial_remediation_items i
                    WHERE i.run_id = ? AND i.article_id = articles.id
                ),
                updated_at = datetime('now')
            WHERE id IN (
                SELECT article_id FROM editorial_remediation_items
                WHERE run_id = ? AND restored_at IS NULL
            ) AND status = 'pending_audit' AND moderation_status = 'flagged'
        `).bind(runId, runId, runId, runId),
        c.env.DB.prepare(`
            UPDATE editorial_remediation_items SET restored_at = datetime('now')
            WHERE run_id = ? AND restored_at IS NULL
        `).bind(runId),
        c.env.DB.prepare(`
            UPDATE editorial_remediation_runs SET status = 'restored' WHERE id = ?
        `).bind(runId),
    ]);

    return c.json({ success: true, run_id: runId, status: 'restored' });
});

// POST /admin/articles/:id/audit — submit audit result from ZeroClaw proactive-editorial skill
router.post('/articles/:id/audit', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{
        quality_score: number;
        passed: boolean;
        issues: string[];
        recommendation: 'approve' | 'rewrite' | 'delete';
    }>();

    const article = await c.env.DB.prepare(`
        SELECT a.id, a.slug, a.title, a.summary, a.content, a.source_url,
               a.country_code, a.sector_id, a.hero_image_url, s.name AS sector_name
        FROM articles a LEFT JOIN sectors s ON s.id = a.sector_id
        WHERE a.id = ?
    `).bind(id).first<{
        id: string; slug: string; title: string; summary: string | null; content: string;
        source_url?: string | null; country_code: string | null; sector_id: string | null;
        hero_image_url: string | null; sector_name: string | null;
    }>();
    if (!article) return c.json({ error: 'not_found' }, 404);

    const qualityScore = Number(body.quality_score);
    if (!Number.isFinite(qualityScore) || qualityScore < 0 || qualityScore > 100) {
        return c.json({ error: 'invalid_quality_score', message: 'quality_score must be between 0 and 100' }, 400);
    }
    if (!['approve', 'rewrite', 'delete'].includes(body.recommendation)) {
        return c.json({ error: 'invalid_recommendation' }, 400);
    }
    const approvalFailure = editorialApprovalFailure({
        qualityScore,
        passed: body.passed,
        issues: body.issues || [],
        recommendation: body.recommendation,
        sourceUrl: article.source_url,
    });
    if (approvalFailure) {
        return c.json({
            error: 'quality_gate_failed',
            message: approvalFailure,
        }, 422);
    }

    const newStatus = body.recommendation === 'approve' ? 'published'
        : body.recommendation === 'delete' ? 'archived'
        : 'pending_audit';
    const moderationStatus = body.recommendation === 'approve' ? 'approved'
        : body.recommendation === 'delete' ? 'rejected'
        : 'pending';

    await c.env.DB.prepare(`
        UPDATE articles
        SET status = ?, moderation_status = ?, moderation_score = ?,
            last_audited_at = datetime('now'),
            reviewed_at = CASE WHEN ? = 'approved' THEN datetime('now') ELSE reviewed_at END,
            published_at = CASE WHEN ? = 'approved' THEN COALESCE(published_at, datetime('now')) ELSE published_at END,
            updated_at = datetime('now')
        WHERE id = ?
    `).bind(newStatus, moderationStatus, qualityScore / 100, moderationStatus, moderationStatus, id).run();

    if (body.recommendation === 'approve') {
        c.executionCtx.waitUntil(Promise.allSettled([
            indexArticle(c.env, article.id, article.title, article.content, {
                country_code: article.country_code ?? undefined,
                sector_id: article.sector_id ?? undefined,
            }),
            onArticlePublished(c.env, article),
            autoPostArticle(c.env, article),
        ]).then(results => {
            results.forEach(result => {
                if (result.status === 'rejected') console.error('[editorial-publish] follow-up failed', result.reason);
            });
        }));
    }

    // Log the audit as a feedback event for self-improvement
    if (!body.passed) {
        const feedbackId = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO article_feedback (id, article_id, feedback_type, comment, original_content, is_processed_by_agent)
            VALUES (?, ?, 'audit_fail', ?, ?, 0)
        `).bind(
            feedbackId, id,
            `Quality: ${qualityScore}/100. Issues: ${(body.issues || []).join('; ')}. Recommendation: ${body.recommendation}`,
            article.content
        ).run();
    }

    return c.json({
        success: true,
        article_id: id,
        quality_score: qualityScore,
        recommendation: body.recommendation,
        status_changed_to: newStatus || null,
    });
});

// GET /admin/editorial/recent — recent editorial activity for self-improving-editorial skill
router.get('/editorial/recent', async (c) => {
    const hours = Math.min(parseInt(c.req.query('hours') || '24'), 168); // max 7 days

    const [auditResults, humanFeedback, qualityScores] = await Promise.all([
        c.env.DB.prepare(`
            SELECT f.id, f.article_id, f.feedback_type, f.comment, f.created_at,
                   a.title, a.country_code, a.sector_id
            FROM article_feedback f
            LEFT JOIN articles a ON f.article_id = a.id
            WHERE f.created_at > datetime('now', '-${hours} hours')
              AND f.feedback_type IN ('audit_fail', 'rejection')
            ORDER BY f.created_at DESC
            LIMIT 50
        `).all<Record<string, unknown>>(),

        c.env.DB.prepare(`
            SELECT f.id, f.article_id, f.feedback_type, f.comment, f.original_content, f.edited_content, f.created_at
            FROM article_feedback f
            WHERE f.created_at > datetime('now', '-${hours} hours')
              AND f.feedback_type = 'edit'
              AND f.is_processed_by_agent = 0
            ORDER BY f.created_at DESC
            LIMIT 50
        `).all<Record<string, unknown>>(),

        c.env.DB.prepare(`
            SELECT engagement_score, country_code, sector_id, created_at
            FROM articles
            WHERE status = 'published'
              AND created_at > datetime('now', '-${hours} hours')
            ORDER BY created_at DESC
        `).all<{ engagement_score: number; country_code: string; sector_id: string; created_at: string }>(),
    ]);

    const scores = qualityScores.results || [];
    const avgScore = scores.length
        ? Math.round(scores.reduce((s, r) => s + (r.engagement_score || 0), 0) / scores.length)
        : null;

    return c.json({
        audit_results: auditResults.results || [],
        human_feedback: humanFeedback.results || [],
        quality_scores: {
            articles: scores,
            average: avgScore,
            total: scores.length,
        },
        period_hours: hours,
        generated_at: new Date().toISOString(),
    });
});

// POST /admin/editorial/instruction-update — save learned rules from self-improving-editorial skill
router.post('/editorial/instruction-update', async (c) => {
    const body = await c.req.json<{
        date: string;
        rules_added: number;
        summary: string;
        rules: string[];
    }>();

    // Store as a special agent_task result for auditing / review
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO agent_tasks (id, type, payload, status, result, completed_at, created_at, updated_at)
        VALUES (?, 'instruction_update', '{}', 'completed', ?, datetime('now'), datetime('now'), datetime('now'))
    `).bind(
        id,
        JSON.stringify({
            date: body.date,
            rules_added: body.rules_added,
            summary: body.summary,
            rules: body.rules,
        })
    ).run();

    return c.json({ success: true, logged_as_task: id });
});

export { router as adminRouter };
