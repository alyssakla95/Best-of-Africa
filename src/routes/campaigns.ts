// ═══════════════════════════════════════════════════════════════════════════════
// CAMPAIGNS ROUTER
// Sponsored content and campaign management
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /campaigns - List all campaigns (for admin dashboard)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { status, sponsor_id, limit = '20' } = c.req.query();

    let query = `
        SELECT c.*, 
               (SELECT COUNT(*) FROM articles a WHERE a.sponsor_id = c.client_id AND a.is_sponsored = 1) as article_count
        FROM campaigns c
        WHERE 1=1
    `;
    const params: string[] = [];

    if (status) {
        query += ' AND c.status = ?';
        params.push(status);
    }

    if (sponsor_id) {
        query += ' AND c.sponsor_id = ?';
        params.push(sponsor_id);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ?';
    params.push(limit);

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

    const campaign = await c.env.DB.prepare(`
        SELECT c.*
        FROM campaigns c
        WHERE c.id = ?
    `).bind(id).first();

    if (!campaign) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Campaign not found'
        }, 404);
    }

    // Get associated sponsored articles
    const articles = await c.env.DB.prepare(`
        SELECT id, slug, title, summary, published_at, view_count, engagement_score
        FROM articles
        WHERE sponsor_id = ? AND is_sponsored = 1
        ORDER BY published_at DESC
        LIMIT 20
    `).bind((campaign as Record<string, any>).sponsor_id).all();

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
                avg_engagement: articles.results?.length
                    ? (articles.results.reduce((sum: number, a: any) => sum + (a.engagement_score || 0), 0) / articles.results.length).toFixed(1)
                    : 0
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
        sponsor_id,
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
    if (!sponsor_id || !name) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'sponsor_id and name are required'
        }, 400);
    }

    const id = crypto.randomUUID();

    await c.env.DB.prepare(`
        INSERT INTO campaigns (
            id, sponsor_id, name, description, 
            target_countries, target_sectors, target_audience,
            budget_usd, start_date, end_date, 
            narrative_strategy_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'))
    `).bind(
        id,
        sponsor_id,
        name,
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
    const existing = await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ?').bind(id).first();
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
    await c.env.DB.prepare(`UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();

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

    const campaign = await c.env.DB.prepare('SELECT id, status FROM campaigns WHERE id = ?').bind(id).first();

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

    await c.env.DB.prepare(`
        UPDATE campaigns SET status = 'paused' WHERE id = ?
    `).bind(id).run();

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

    const result = await c.env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();

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

    const campaign = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();

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

    // Calculate ROI (simplified)
    const cost = data.budget_usd || 0;
    const value = data.clicks * 2.5; // Assumed $2.50 per click value
    const roi = cost > 0 ? (((value - cost) / cost) * 100).toFixed(1) : '0';

    return c.json({
        success: true,
        data: {
            campaign_id: id,
            impressions: data.impressions || 0,
            clicks: data.clicks || 0,
            ctr: parseFloat(ctr),
            budget_spent: data.budget_usd || 0,
            roi_percentage: parseFloat(roi),
            roi_score: data.roi_score || 0,
            reach_score: data.reach_score || 0,
            credibility_impact: data.credibility_impact || 0,
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

    const campaign = await c.env.DB.prepare('SELECT id FROM campaigns WHERE id = ?').bind(id).first();
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
