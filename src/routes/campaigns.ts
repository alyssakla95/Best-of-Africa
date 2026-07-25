// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS ROUTER
// Sponsored content and campaign management
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { requireClientAuth } from '../lib/auth';
import { throttle } from '../lib/ratelimit';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const isAdmin = (c: { req: { header(name: string): string | undefined }; env: Env }) =>
    Boolean(c.env.ADMIN_API_KEY && c.req.header('X-Admin-Key') === c.env.ADMIN_API_KEY);

// Tracking a rendered sponsored article is the only public operation. Campaign
// records and all direct mutations are private to their owning client or admin.
router.use('*', async (c, next) => {
    if (c.req.path.endsWith('/track-impression')) return next();
    if (isAdmin(c)) return next();
    return requireClientAuth(c, next);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /campaigns - List all campaigns (for admin dashboard)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { status, limit = '20' } = c.req.query();
    const boundedLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 20, 100));

    let query = `
        SELECT c.*, 
               (SELECT COUNT(*) FROM articles a WHERE a.sponsor_id = c.client_id AND a.is_sponsored = 1) as article_count
        FROM campaigns c
        WHERE 1=1
    `;
    const params: Array<string | number> = [];

    if (!isAdmin(c)) {
        query += ' AND c.client_id = ?';
        params.push(c.get('clientId'));
    }

    if (status) {
        query += ' AND c.status = ?';
        params.push(status);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ?';
    params.push(boundedLimit);

    const campaigns = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
        success: true,
        data: (campaigns.results || []).map((campaign: any) => ({
            ...campaign,
            target_countries: campaign.target_countries ? JSON.parse(campaign.target_countries) : [],
            target_sectors: campaign.target_sectors ? JSON.parse(campaign.target_sectors) : [],
        }))
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /campaigns/:id - Get single campaign details
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (c) => {
    const id = c.req.param('id');
    const ownerClause = isAdmin(c) ? '' : ' AND c.client_id = ?';
    const ownerParams = isAdmin(c) ? [id] : [id, c.get('clientId')];

    const campaign = await c.env.DB.prepare(`
        SELECT c.*
        FROM campaigns c
        WHERE c.id = ?${ownerClause}
    `).bind(...ownerParams).first();

    if (!campaign) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Campaign not found'
        }, 404);
    }

    // Get associated sponsored articles
    const articles = await c.env.DB.prepare(`
        SELECT id, slug, title, summary, published_at, view_count
        FROM articles
        WHERE sponsor_id = ? AND is_sponsored = 1
        ORDER BY published_at DESC
        LIMIT 20
    `).bind((campaign as Record<string, any>).client_id).all();

    const data = campaign as Record<string, any>;

    return c.json({
        success: true,
        data: {
            ...data,
            target_countries: data.target_countries ? JSON.parse(data.target_countries) : [],
            target_sectors: data.target_sectors ? JSON.parse(data.target_sectors) : [],
            articles: articles.results || [],
            stats: {
                total_articles: articles.results?.length || 0,
                total_views: articles.results?.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0) || 0,
                methodology: 'Article count and views are stored first-party delivery records. No engagement, reach, return or impact estimate is inferred.',
            }
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /campaigns - Create new campaign
// ───────────────────────────────────────────────────────────────────────────────
router.post('/', async (c) => {
    const body = await c.req.json();
    const {
        client_id,
        name,
        description,
        target_countries,
        target_sectors,
        target_audience,
        budget_usd,
        start_date,
        end_date,
        narrative_strategy_id
    } = body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'name is required'
        }, 400);
    }

    const id = crypto.randomUUID();
    const ownerId = isAdmin(c) ? client_id : c.get('clientId');
    if (!ownerId) return c.json({ success: false, error: 'client_id is required for admin creation' }, 400);

    await c.env.DB.prepare(`
        INSERT INTO campaigns (
        id, client_id, name, description,
            target_countries, target_sectors, target_audience,
            budget_usd, start_date, end_date, 
            narrative_strategy_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'))
    `).bind(
        id,
        ownerId,
        name.trim(),
        description || null,
        target_countries ? JSON.stringify(target_countries) : null,
        target_sectors ? JSON.stringify(target_sectors) : null,
        target_audience || null,
        budget_usd || null,
        start_date || null,
        end_date || null,
        narrative_strategy_id || null
    ).run();

    return c.json({
        success: true,
        data: { id },
        message: 'Campaign created successfully'
    }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /campaigns/:id - Update campaign
// ───────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();

    // Check if campaign exists
    const existing = isAdmin(c)
        ? await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ?').bind(id).first()
        : await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND client_id = ?').bind(id, c.get('clientId')).first();
    if (!existing) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Campaign not found'
        }, 404);
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
        'name', 'description', 'target_audience', 'budget_usd',
        'start_date', 'end_date', 'status', 'narrative_strategy_id',
        'target_countries', 'target_sectors'
    ];

    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updates.push(`${field} = ?`);
            if (field === 'target_countries' || field === 'target_sectors') {
                values.push(JSON.stringify(body[field]));
            } else {
                values.push(body[field]);
            }
        }
    }

    if (updates.length === 0) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'No valid fields to update'
        }, 400);
    }

    values.push(id);
    if (!isAdmin(c)) values.push(c.get('clientId'));
    await c.env.DB.prepare(
        `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?${isAdmin(c) ? '' : ' AND client_id = ?'}`
    ).bind(...values).run();

    return c.json({
        success: true,
        message: 'Campaign updated successfully'
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /campaigns/:id/launch - Launch/activate campaign
// ───────────────────────────────────────────────────────────────────────────────
router.post('/:id/launch', async (c) => {
    const id = c.req.param('id');

    const campaign = isAdmin(c)
        ? await c.env.DB.prepare('SELECT id, status FROM campaigns WHERE id = ?').bind(id).first()
        : await c.env.DB.prepare('SELECT id, status FROM campaigns WHERE id = ? AND client_id = ?').bind(id, c.get('clientId')).first();

    if (!campaign) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Campaign not found'
        }, 404);
    }

    if ((campaign as Record<string, any>).status === 'active') {
        return c.json({
            success: false,
            error: 'already_active',
            message: 'Campaign is already active'
        }, 400);
    }

    await c.env.DB.prepare(`
        UPDATE campaigns SET status = 'active', start_date = datetime('now') WHERE id = ?
    `).bind(id).run();

    return c.json({
        success: true,
        message: 'Campaign launched successfully'
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /campaigns/:id/pause - Pause active campaign
// ───────────────────────────────────────────────────────────────────────────────
router.post('/:id/pause', async (c) => {
    const id = c.req.param('id');

    const result = isAdmin(c)
        ? await c.env.DB.prepare("UPDATE campaigns SET status = 'paused' WHERE id = ?").bind(id).run()
        : await c.env.DB.prepare("UPDATE campaigns SET status = 'paused' WHERE id = ? AND client_id = ?").bind(id, c.get('clientId')).run();
    if (!result.meta?.changes) return c.json({ success: false, error: 'not_found' }, 404);

    return c.json({
        success: true,
        message: 'Campaign paused'
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// DELETE /campaigns/:id - Delete campaign
// ───────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (c) => {
    const id = c.req.param('id');

    const result = isAdmin(c)
        ? await c.env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run()
        : await c.env.DB.prepare('DELETE FROM campaigns WHERE id = ? AND client_id = ?').bind(id, c.get('clientId')).run();

    if (result.meta?.changes === 0) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Campaign not found'
        }, 404);
    }

    return c.json({
        success: true,
        message: 'Campaign deleted'
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /campaigns/:id/analytics - Get campaign performance analytics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:id/analytics', async (c) => {
    const id = c.req.param('id');

    const campaign = isAdmin(c)
        ? await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first()
        : await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND client_id = ?').bind(id, c.get('clientId')).first();

    if (!campaign) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Campaign not found'
        }, 404);
    }

    const data = campaign as Record<string, any>;

    // Calculate CTR
    const ctr = data.impressions > 0
        ? ((data.clicks / data.impressions) * 100).toFixed(2)
        : '0.00';

    return c.json({
        success: true,
        data: {
            campaign_id: id,
            impressions: data.impressions || 0,
            clicks: data.clicks || 0,
            ctr: parseFloat(ctr),
            configured_budget_usd: data.budget_usd || 0,
            methodology: 'Impressions and clicks are counted first-party delivery events. CTR is clicks divided by impressions. No ROI, reach multiplier or credibility score is inferred.',
            status: data.status,
            start_date: data.start_date,
            end_date: data.end_date
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /campaigns/:id/timeseries - Real daily impression/click series
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:id/timeseries', async (c) => {
    const id = c.req.param('id');
    const days = Math.min(parseInt(c.req.query('days') || '14', 10) || 14, 90);

    const owner = isAdmin(c)
        ? await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ?').bind(id).first()
        : await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND client_id = ?').bind(id, c.get('clientId')).first();
    if (!owner) return c.json({ success: false, error: 'not_found' }, 404);

    const rows = await c.env.DB.prepare(`
        SELECT date(created_at) AS day,
               SUM(CASE WHEN event_type = 'impression' THEN 1 ELSE 0 END) AS impressions,
               SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks
        FROM campaign_events
        WHERE campaign_id = ? AND created_at >= date('now', ?)
        GROUP BY day
        ORDER BY day ASC
    `).bind(id, `-${days} days`).all();

    return c.json({ success: true, data: rows.results || [] });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /campaigns/:id/track - Record an impression/click (also keeps totals in sync)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/:id/track', async (c) => {
    const id = c.req.param('id');
    let body: Record<string, any> = {};
    try { body = await c.req.json(); } catch { /* allow empty */ }
    const eventType = body.event_type === 'click' ? 'click' : 'impression';

    const campaign = isAdmin(c)
        ? await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ?').bind(id).first()
        : await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND client_id = ?').bind(id, c.get('clientId')).first();
    if (!campaign) return c.json({ success: false, error: 'not_found' }, 404);

    await c.env.DB.prepare(
        "INSERT INTO campaign_events (id, campaign_id, event_type) VALUES (?, ?, ?)"
    ).bind(crypto.randomUUID(), id, eventType).run();

    // Keep the campaign's running totals consistent with the event log.
    const col = eventType === 'click' ? 'clicks' : 'impressions';
    await c.env.DB.prepare(
        `UPDATE campaigns SET ${col} = COALESCE(${col}, 0) + 1 WHERE id = ?`
    ).bind(id).run();

    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /campaigns/track-impression - Record a sponsored-article impression.
// Called on the reader-side render; resolves the article's sponsor to its active
// campaign server-side so nothing is tamperable and non-sponsored views are no-ops.
// ───────────────────────────────────────────────────────────────────────────────
router.post('/track-impression', async (c) => {
    const limited = await throttle(c, 'sponsor-delivery');
    if (limited) return limited;
    let body: Record<string, any> = {};
    try { body = await c.req.json(); } catch { /* ignore */ }
    const articleId = body.article_id as string | undefined;
    const eventType = body.event_type === 'click' ? 'click' : 'impression';
    if (!articleId) return c.json({ success: false, error: 'article_id required' }, 400);

    const art = await c.env.DB.prepare(
        "SELECT sponsor_id FROM articles WHERE id = ? AND is_sponsored = 1"
    ).bind(articleId).first<{ sponsor_id: string | null }>();
    if (!art?.sponsor_id) return c.json({ success: true, skipped: 'not_sponsored' });

    // article.sponsor_id is the sponsoring client; campaigns link via client_id.
    // Prefer an active campaign for that client, else the most recent.
    const camp = await c.env.DB.prepare(`
        SELECT id FROM campaigns WHERE client_id = ?
        ORDER BY (LOWER(status) IN ('active', 'live', 'running')) DESC, created_at DESC
        LIMIT 1
    `).bind(art.sponsor_id).first<{ id: string }>();
    if (!camp?.id) return c.json({ success: true, skipped: 'no_campaign' });

    await c.env.DB.prepare(
        "INSERT INTO campaign_events (id, campaign_id, event_type) VALUES (?, ?, ?)"
    ).bind(crypto.randomUUID(), camp.id, eventType).run();
    const col = eventType === 'click' ? 'clicks' : 'impressions';
    await c.env.DB.prepare(
        `UPDATE campaigns SET ${col} = COALESCE(${col}, 0) + 1 WHERE id = ?`
    ).bind(camp.id).run();

    return c.json({ success: true });
});

export { router as campaignsRouter };
