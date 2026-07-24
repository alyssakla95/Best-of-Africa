// ═══════════════════════════════════════════════════════════════════════════════
// DATA EXPORT SERVICE
// CSV and structured data export for articles and reports
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// CSV Generation Helper
// ───────────────────────────────────────────────────────────────────────────────
function escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

function toCSV(headers: string[], rows: any[][]): string {
    const headerLine = headers.map(escapeCSV).join(',');
    const dataLines = rows.map(row => row.map(escapeCSV).join(','));
    return [headerLine, ...dataLines].join('\n');
}

// ───────────────────────────────────────────────────────────────────────────────
// Export Articles
// ───────────────────────────────────────────────────────────────────────────────
export async function exportArticlesCSV(
    env: Env,
    filters: {
        country?: string;
        sector?: string;
        from?: string;
        to?: string;
        limit?: number;
    }
): Promise<string> {
    let query = `
        SELECT 
            a.id, a.slug, a.title, a.summary,
            a.country_code, c.name as country_name,
            a.sector_id, s.name as sector_name,
            a.sentiment_score, a.engagement_score,
            a.reading_time_minutes, a.published_at,
            a.source_url
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'published'
    `;

    const bindings: any[] = [];

    if (filters.country) {
        query += ' AND a.country_code = ?';
        bindings.push(filters.country);
    }

    if (filters.sector) {
        query += ' AND a.sector_id = ?';
        bindings.push(filters.sector);
    }

    if (filters.from) {
        query += ' AND date(a.published_at) >= ?';
        bindings.push(filters.from);
    }

    if (filters.to) {
        query += ' AND date(a.published_at) <= ?';
        bindings.push(filters.to);
    }

    query += ' ORDER BY a.published_at DESC';
    query += ` LIMIT ${filters.limit || 1000}`;

    const articles = await env.DB.prepare(query).bind(...bindings).all();

    const headers = [
        'ID', 'Slug', 'Title', 'Summary',
        'Country Code', 'Country', 'Sector ID', 'Sector',
        'Sentiment', 'Engagement Score', 'Reading Time (min)',
        'Published At', 'Source URL'
    ];

    const rows = (articles.results || []).map((a: any) => [
        a.id, a.slug, a.title, a.summary,
        a.country_code, a.country_name, a.sector_id, a.sector_name,
        a.sentiment_score, a.engagement_score, a.reading_time_minutes,
        a.published_at, a.source_url
    ]);

    return toCSV(headers, rows);
}

// ───────────────────────────────────────────────────────────────────────────────
// Export Countries with Metrics
// ───────────────────────────────────────────────────────────────────────────────
export async function exportCountriesCSV(env: Env): Promise<string> {
    const countries = await env.DB.prepare(`
        SELECT 
            c.code, c.name, c.region, c.diplomacy_score, c.image_strength_score,
            COUNT(a.id) as article_count,
            AVG(a.engagement_score) as avg_engagement
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
        GROUP BY c.code
        ORDER BY article_count DESC
    `).all();

    const headers = [
        'Code', 'Name', 'Region', 'Diplomacy Score', 'Image Strength',
        'Article Count', 'Avg Engagement'
    ];

    const rows = (countries.results || []).map((c: any) => [
        c.code, c.name, c.region, c.diplomacy_score, c.image_strength_score,
        c.article_count, Math.round((c.avg_engagement || 0) * 100) / 100
    ]);

    return toCSV(headers, rows);
}

// ───────────────────────────────────────────────────────────────────────────────
// Export Trends Data
// ───────────────────────────────────────────────────────────────────────────────
export async function exportTrendsCSV(env: Env): Promise<string> {
    const trends = await env.DB.prepare(`
        SELECT * FROM trend_snapshots
        WHERE snapshot_date >= date('now', '-30 days')
        ORDER BY snapshot_date DESC, change_percent DESC
    `).all();

    const headers = [
        'Date', 'Entity', 'Type', 'Articles (24h)', 'Articles (7d)',
        'Velocity', 'Change %', 'Is Trending'
    ];

    const rows = (trends.results || []).map((t: any) => [
        t.snapshot_date, t.entity, t.entity_type, t.article_count_24h, t.article_count_7d,
        Math.round(t.velocity * 100) / 100, Math.round(t.change_percent * 100) / 100,
        t.is_trending ? 'Yes' : 'No'
    ]);

    return toCSV(headers, rows);
}

// ───────────────────────────────────────────────────────────────────────────────
// Export User Analytics
// ───────────────────────────────────────────────────────────────────────────────
export async function exportAnalyticsCSV(
    env: Env,
    clientId: string
): Promise<string> {
    const analytics = await env.DB.prepare(`
        SELECT 
            date(al.created_at) as date,
            al.event_type,
            COUNT(*) as count
        FROM analytics_log al
        WHERE al.client_id = ?
        AND al.created_at >= datetime('now', '-30 days')
        GROUP BY date(al.created_at), al.event_type
        ORDER BY date DESC
    `).bind(clientId).all();

    const headers = ['Date', 'Event Type', 'Count'];

    const rows = (analytics.results || []).map((a: any) => [
        a.date, a.event_type, a.count
    ]);

    return toCSV(headers, rows);
}

// ───────────────────────────────────────────────────────────────────────────────
// Create CSV Response
// ───────────────────────────────────────────────────────────────────────────────
export function csvResponse(csv: string, filename: string): Response {
    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// Export as JSON (Alternative)
// ───────────────────────────────────────────────────────────────────────────────
export async function exportArticlesJSON(
    env: Env,
    filters: {
        country?: string;
        sector?: string;
        limit?: number;
    }
): Promise<object> {
    let query = `
        SELECT 
            a.id, a.slug, a.title, a.subtitle, a.summary, a.content,
            a.country_code, c.name as country_name,
            a.sector_id, s.name as sector_name,
            a.tags, a.sentiment_score, a.engagement_score,
            a.published_at
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'published'
    `;

    const bindings: any[] = [];

    if (filters.country) {
        query += ' AND a.country_code = ?';
        bindings.push(filters.country);
    }

    if (filters.sector) {
        query += ' AND a.sector_id = ?';
        bindings.push(filters.sector);
    }

    query += ' ORDER BY a.published_at DESC';
    query += ` LIMIT ${filters.limit || 100}`;

    const articles = await env.DB.prepare(query).bind(...bindings).all();

    return {
        exported_at: new Date().toISOString(),
        count: articles.results?.length || 0,
        articles: (articles.results || []).map((a: any) => ({
            ...a,
            tags: a.tags ? JSON.parse(a.tags) : [],
        })),
    };
}
