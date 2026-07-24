// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../../types';
import { generateHeadlineVariants, fillNarrativeGap, MODELS } from '../../lib/ai';
import { findNarrativeGaps, indexArticle } from '../../lib/vectorize';
// ───────────────────────────────────────────────────────────────────────────────
// Update Engagement Scores
// ───────────────────────────────────────────────────────────────────────────────
export async function updateEngagementScores(env: Env): Promise<void> {
    // Set-based on purpose: the old version looped every article from the last
    // 30 days calling updateArticleEngagement (two D1 queries each) — 13k+
    // subrequests per 2-minute run against Workers' 1,000 cap. It died partway
    // through EVERY invocation, which is why 28k published articles carried six
    // nonzero engagement scores. One UPDATE applies the same formula
    // (calculateEngagementScore in lib/analytics.ts) to every row, and the
    // score-changed guard keeps it from rewriting thousands of identical rows.
    const SCORE = `ROUND((
        MIN(100.0, view_count / 10.0)
        + MIN(1.0, avg_read_time_seconds / (COALESCE(NULLIF(reading_time_minutes, 0), 3) * 60.0)) * 50.0
        + MIN(50.0, share_count * 5.0)
    ) / 2.0)`;

    const res = await env.DB.prepare(`
        UPDATE articles SET engagement_score = ${SCORE}
        WHERE status = 'published'
          AND published_at > datetime('now', '-30 days')
          AND engagement_score <> ${SCORE}
    `).run();

    console.log(`Updated engagement for ${res.meta?.changes ?? 0} article(s)`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Refresh Regional Dashboards (Autonomous Dashboard Generation)
// ───────────────────────────────────────────────────────────────────────────────
export async function refreshDashboards(env: Env): Promise<void> {
    const regions = ['North', 'West', 'East', 'Central', 'Southern', 'Continental'];

    for (const region of regions) {
        try {
            // Mark old dashboards as not current
            await env.DB.prepare(`
                UPDATE dashboards SET is_current = 0 WHERE region = ?
            `).bind(region).run();

            // Generate fresh dashboard data
            const metrics = await env.DB.prepare(`
                SELECT 
                    COUNT(a.id) as articles_24h,
                    SUM(a.view_count) as total_views
                FROM articles a
                JOIN countries c ON a.country_code = c.code
                WHERE c.region = ? AND a.status = 'published'
                    AND a.published_at > datetime('now', '-1 day')
            `).bind(region).first();

            const trending = await env.DB.prepare(`
                SELECT c.code FROM countries c
                JOIN articles a ON a.country_code = c.code
                WHERE c.region = ? AND a.status = 'published'
                    AND a.published_at > datetime('now', '-7 days')
                GROUP BY c.code
                ORDER BY SUM(a.view_count) DESC
                LIMIT 3
            `).bind(region).all();

            const featured = await env.DB.prepare(`
                SELECT a.id FROM articles a
                JOIN countries c ON a.country_code = c.code
                WHERE c.region = ? AND a.status = 'published'
                ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
                LIMIT 6
            `).bind(region).all();

            const dashboardId = crypto.randomUUID();
            await env.DB.prepare(`
                INSERT INTO dashboards (id, region, title, key_metrics, featured_articles, is_current, generated_at)
                VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
            `).bind(
                dashboardId,
                region,
                `${region} Africa Update`,
                JSON.stringify({
                    articles_24h: (metrics as Record<string, any>)?.articles_24h || 0,
                    total_views: (metrics as Record<string, any>)?.total_views || 0,
                    trending_countries: (trending.results || []).map((c: any) => c.code),
                }),
                JSON.stringify((featured.results || []).map((a: any) => a.id))
            ).run();

        } catch (error) {
            console.error(`Failed to refresh dashboard for ${region}:`, error);
        }
    }

    console.log(`Refreshed dashboards for ${regions.length} regions`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Update Country Image Strength Scores
// (Narrative Diplomacy metric - how well is each country represented)
// ───────────────────────────────────────────────────────────────────────────────
export async function updateCountryScores(env: Env): Promise<void> {
    // Calculate image strength based on: article count, engagement, sector diversity
    const countryStats = await env.DB.prepare(`
        SELECT 
            c.code,
            COUNT(DISTINCT a.id) as article_count,
            AVG(a.engagement_score) as avg_engagement,
            COUNT(DISTINCT a.sector_id) as sector_coverage,
            SUM(a.view_count) as total_views
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
        GROUP BY c.code
    `).all();

    for (const country of countryStats.results || []) {
        const c = country as Record<string, any>;

        // Image strength formula: 
        // - Article count (weighted 30%)
        // - Engagement score (weighted 40%)
        // - Sector diversity (weighted 30%)
        const articleScore = Math.min(100, (c.article_count || 0) * 5);
        const engagementScore = c.avg_engagement || 0;
        const diversityScore = Math.min(100, (c.sector_coverage || 0) * 12.5); // 8 sectors = 100

        const imageStrength = (articleScore * 0.3) + (engagementScore * 0.4) + (diversityScore * 0.3);

        await env.DB.prepare(`
            UPDATE countries 
            SET image_strength_score = ?, updated_at = datetime('now')
            WHERE code = ?
        `).bind(imageStrength, c.code).run();
    }

    console.log(`Updated image strength for ${countryStats.results?.length || 0} countries`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Log Content Refinement (Track self-improvements)
// ───────────────────────────────────────────────────────────────────────────────
export async function logRefinement(
    env: Env,
    articleId: string,
    refinementType: string,
    beforeValue: string,
    afterValue: string,
    triggerReason: string
): Promise<void> {
    const refinementId = crypto.randomUUID();
    await env.DB.prepare(`
        INSERT INTO content_refinements (
            id, article_id, refinement_type, before_value, after_value,
            trigger_reason, model_used, prompt_version, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        refinementId,
        articleId,
        refinementType,
        beforeValue,
        afterValue,
        triggerReason,
        triggerReason,
        MODELS.TEXT_GENERATION as any,
        'v1'
    ).run();

    // Update article refinement count
    await env.DB.prepare(`
        UPDATE articles 
        SET refinement_count = refinement_count + 1, 
            last_refined_at = datetime('now')
        WHERE id = ?
    `).bind(articleId).run();
}
