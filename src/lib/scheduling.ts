// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT SCHEDULING SERVICE
// Schedule articles for future publication
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Schedule Article for Future Publication
// ───────────────────────────────────────────────────────────────────────────────
export async function scheduleArticle(
    env: Env,
    articleId: string,
    publishAt: Date
): Promise<void> {
    // Validate future date
    if (publishAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
    }

    await env.DB.prepare(`
        UPDATE articles
        SET status = 'scheduled',
            scheduled_at = ?,
            updated_at = datetime('now')
        WHERE id = ?
    `).bind(publishAt.toISOString(), articleId).run();
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Scheduled Articles
// ───────────────────────────────────────────────────────────────────────────────
export async function getScheduledArticles(env: Env): Promise<{
    id: string;
    title: string;
    scheduled_at: string;
}[]> {
    const articles = await env.DB.prepare(`
        SELECT id, title, scheduled_at
        FROM articles
        WHERE status = 'scheduled'
        ORDER BY scheduled_at ASC
    `).all();

    return (articles.results || []) as any[];
}

// ───────────────────────────────────────────────────────────────────────────────
// Publish Scheduled Articles (Called by Cron)
// ───────────────────────────────────────────────────────────────────────────────
export async function publishScheduledArticles(env: Env): Promise<number> {
    // Find articles due for publication
    const dueArticles = await env.DB.prepare(`
        SELECT id, title
        FROM articles
        WHERE status = 'scheduled'
        AND scheduled_at <= datetime('now')
    `).all();

    let published = 0;

    for (const article of dueArticles.results || []) {
        const a = article as Record<string, any>;

        try {
            // Publish the article
            await env.DB.prepare(`
                UPDATE articles
                SET status = 'published',
                    published_at = datetime('now'),
                    updated_at = datetime('now')
                WHERE id = ?
            `).bind(a.id).run();

            published++;
            console.log(`Published scheduled article: ${a.title}`);

            // Trigger post-publish automation
            // These would normally be imported but kept inline for clarity
            await env.CONTENT_QUEUE.send({
                type: 'post_publish',
                article_id: a.id,
            });

        } catch (error) {
            console.error(`Failed to publish scheduled article ${a.id}:`, error);
        }
    }

    return published;
}

// ───────────────────────────────────────────────────────────────────────────────
// Cancel Scheduled Article
// ───────────────────────────────────────────────────────────────────────────────
export async function cancelScheduledArticle(
    env: Env,
    articleId: string
): Promise<boolean> {
    const result = await env.DB.prepare(`
        UPDATE articles
        SET status = 'draft',
            scheduled_at = NULL,
            updated_at = datetime('now')
        WHERE id = ? AND status = 'scheduled'
    `).bind(articleId).run();

    return result.meta.changes > 0;
}

// ───────────────────────────────────────────────────────────────────────────────
// Reschedule Article
// ───────────────────────────────────────────────────────────────────────────────
export async function rescheduleArticle(
    env: Env,
    articleId: string,
    newPublishAt: Date
): Promise<void> {
    if (newPublishAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
    }

    await env.DB.prepare(`
        UPDATE articles
        SET scheduled_at = ?,
            updated_at = datetime('now')
        WHERE id = ? AND status = 'scheduled'
    `).bind(newPublishAt.toISOString(), articleId).run();
}
