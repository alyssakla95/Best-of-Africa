import { Hono } from 'hono';
import type { Env, Variables, MarketIntelligence } from '../../types';
import { requireApiKey, rateLimit } from '../../lib/auth';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../../lib/cache';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();


// ───────────────────────────────────────────────────────────────────────────────

// GET /market-intel/reports - List available reports
router.get('/generated-reports', async (c) => {
    const reports = await c.env.DB.prepare(`
        SELECT id, type, title, metadata, created_at
        FROM generated_reports
        ORDER BY created_at DESC
        LIMIT 20
    `).all();

    return c.json({
        data: (reports.results || []).map((r: any) => ({
            id: r.id,
            type: r.type,
            title: r.title,
            metadata: JSON.parse(r.metadata as string),
            created_at: r.created_at
        }))
    });
});

// GET /market-intel/generated-reports/:id - One report as structured JSON.
// Sections render as native application pages; the stored HTML artifact is
// internal (PDF/email) and is never returned here.
router.get('/generated-reports/:id', async (c) => {
    const report = await c.env.DB.prepare(`
        SELECT id, type, title, metadata, created_at
        FROM generated_reports
        WHERE id = ?
    `).bind(c.req.param('id')).first();

    if (!report) {
        return c.json({ error: 'not_found', message: 'Report not found' }, 404);
    }

    const r = report as Record<string, any>;
    let metadata: Record<string, any> = {};
    try { metadata = r.metadata ? JSON.parse(r.metadata as string) : {}; } catch { metadata = {}; }
    const { sections, subtitle, generated_at, ...rest } = metadata;

    return c.json({
        data: {
            id: r.id,
            type: r.type,
            title: r.title,
            subtitle: subtitle || null,
            sections: Array.isArray(sections) ? sections : [],
            metadata: rest,
            generated_at: generated_at || r.created_at,
            created_at: r.created_at,
        },
    });
});

// GET /market-intel/reports - List available reports
router.get('/reports', async (c) => {
    const clientTier = c.get('clientTier') as string;

    let query = 'SELECT * FROM market_intelligence WHERE 1=1';
    if (clientTier === 'basic') {
        query += ' AND is_premium = 0';
    }
    query += ' ORDER BY generated_at DESC LIMIT 50';

    const reports = await c.env.DB.prepare(query).all();

    return c.json({
        data: (reports.results || []).map((r: any) => ({
            id: r.id,
            report_type: r.report_type,
            title: r.title,
            country_code: r.country_code,
            sector_id: r.sector_id,
            executive_summary: r.executive_summary,
            generated_at: r.generated_at,
            is_premium: r.is_premium,
        }))
    });
});

// GET /market-intel/reports/:id - Full report (premium)
router.get('/reports/:id', requireApiKey, rateLimit, async (c) => {
    const reportId = c.req.param('id');
    const clientTier = c.get('clientTier') as string;

    const report = await c.env.DB.prepare(`
        SELECT * FROM market_intelligence WHERE id = ?
    `).bind(reportId).first();

    if (!report) {
        return c.json({ error: 'not_found', message: 'Report not found' }, 404);
    }

    const reportData = report as Record<string, any>;

    if (reportData.is_premium && clientTier === 'basic') {
        return c.json({
            error: 'forbidden',
            message: 'Premium tier required for this report'
        }, 403);
    }

    // Increment view count
    await c.env.DB.prepare(`
        UPDATE market_intelligence SET view_count = view_count + 1 WHERE id = ?
    `).bind(reportId).run();

    return c.json({
        ...reportData,
        key_findings: reportData.key_findings ? JSON.parse(reportData.key_findings) : [],
        opportunities: reportData.opportunities ? JSON.parse(reportData.opportunities) : [],
        risks: reportData.risks ? JSON.parse(reportData.risks) : [],
        data_sources: reportData.data_sources ? JSON.parse(reportData.data_sources) : [],
    });
});

// GET /market-intel/reports/sector/:id - Sector analysis report
router.get('/reports/sector/:id', requireApiKey, rateLimit, async (c) => {
    const sectorId = c.req.param('id');

    const report = await c.env.DB.prepare(`
        SELECT * FROM market_intelligence 
        WHERE sector_id = ? AND report_type = 'sector_analysis'
        ORDER BY generated_at DESC
        LIMIT 1
    `).bind(sectorId).first();

    if (!report) {
        return c.json({
            error: 'not_found',
            message: 'No sector analysis available. Request generation via admin.'
        }, 404);
    }

    const reportData = report as Record<string, any>;
    return c.json({
        ...reportData,
        key_findings: reportData.key_findings ? JSON.parse(reportData.key_findings) : [],
        opportunities: reportData.opportunities ? JSON.parse(reportData.opportunities) : [],
        risks: reportData.risks ? JSON.parse(reportData.risks) : [],
    });
});


export { router as reportsRouter };
