// ═══════════════════════════════════════════════════════════════════════════════
// USER ANALYTICS SERVICE
// Extended user behavior tracking and reporting
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Analytics Summary
// ───────────────────────────────────────────────────────────────────────────────
export interface AnalyticsSummary {
    period: string;
    total_events: number;
    unique_sessions: number;
    top_articles: { id: string; slug: string; title: string; views: number }[];
    top_countries: { code: string; name: string; views: number }[];
    top_sectors: { id: string; name: string; views: number }[];
    events_by_type: Record<string, number>;
    daily_trend: { date: string; events: number }[];
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Analytics Summary
// ───────────────────────────────────────────────────────────────────────────────
export async function getAnalyticsSummary(
    env: Env,
    days: number = 7
): Promise<AnalyticsSummary> {
    // Top articles by view count
    const topArticles = await env.DB.prepare(`
        SELECT id, slug, title, view_count as views
        FROM articles
        WHERE status = 'published'
        ORDER BY view_count DESC
        LIMIT 10
    `).all();

    // Top countries by article count
    const topCountries = await env.DB.prepare(`
        SELECT c.code, c.name, COUNT(a.id) as views
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
        GROUP BY c.code
        ORDER BY views DESC
        LIMIT 10
    `).all();

    // Top sectors by article count
    const topSectors = await env.DB.prepare(`
        SELECT s.id, s.name, COUNT(a.id) as views
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
        GROUP BY s.id
        ORDER BY views DESC
        LIMIT 10
    `).all();

    return {
        period: `${days} days`,
        total_events: 0,
        unique_sessions: 0,
        top_articles: (topArticles.results || []) as any[],
        top_countries: (topCountries.results || []) as any[],
        top_sectors: (topSectors.results || []) as any[],
        events_by_type: {},
        daily_trend: [],
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Content Performance
// ───────────────────────────────────────────────────────────────────────────────
export async function getContentPerformance(
    env: Env,
    articleId: string
): Promise<{
    views: number;
    engagement_score: number;
    share_count: number;
    avg_read_time: number;
}> {
    const article = await env.DB.prepare(`
        SELECT view_count, engagement_score, share_count, avg_read_time_seconds
        FROM articles
        WHERE id = ?
    `).bind(articleId).first<{
        view_count: number;
        engagement_score: number;
        share_count: number;
        avg_read_time_seconds: number;
    }>();

    return {
        views: article?.view_count || 0,
        engagement_score: article?.engagement_score || 0,
        share_count: article?.share_count || 0,
        avg_read_time: article?.avg_read_time_seconds || 0,
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Platform Stats
// ───────────────────────────────────────────────────────────────────────────────
export async function getPlatformStats(env: Env): Promise<{
    total_articles: number;
    total_countries: number;
    total_sectors: number;
    articles_today: number;
    total_views: number;
}> {
    const stats = await env.DB.prepare(`
        SELECT
            (SELECT COUNT(*) FROM articles WHERE status = 'published') as total_articles,
            (SELECT COUNT(*) FROM countries) as total_countries,
            (SELECT COUNT(*) FROM sectors) as total_sectors,
            (SELECT COUNT(*) FROM articles WHERE status = 'published' AND date(published_at) = date('now')) as articles_today,
            (SELECT SUM(view_count) FROM articles) as total_views
    `).first<{
        total_articles: number;
        total_countries: number;
        total_sectors: number;
        articles_today: number;
        total_views: number;
    }>();

    return {
        total_articles: stats?.total_articles || 0,
        total_countries: stats?.total_countries || 0,
        total_sectors: stats?.total_sectors || 0,
        articles_today: stats?.articles_today || 0,
        total_views: stats?.total_views || 0,
    };
}
