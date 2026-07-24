// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS LIBRARY
// Event tracking via Analytics Engine
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, AnalyticsEvent } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Track Event to Analytics Engine
// ───────────────────────────────────────────────────────────────────────────────
export async function trackEvent(env: Env, event: AnalyticsEvent): Promise<void> {
    try {
        // Write to Analytics Engine (built-in Cloudflare analytics)
        env.ANALYTICS.writeDataPoint({
            blobs: [
                event.type,
                event.article_id || '',
                event.country_code || '',
                event.sector_id || '',
                event.search_query || '',
                event.referrer || '',
                event.user_agent || '',
            ],
            doubles: [
                event.duration_seconds || 0,
                event.scroll_depth || 0,
                Date.now(),
            ],
            indexes: [
                event.type, // Index 1: event type for fast filtering
            ],
        });

        // Also update live counter via Durable Object
        if (event.type === 'page_view' || event.type === 'article_read') {
            const metricName = event.type === 'article_read' ? 'article_reads' : 'visitors';
            await incrementLiveCounter(env, metricName);
        }

        if (event.type === 'search') {
            await incrementLiveCounter(env, 'searches');
        }

        // Feed the engagement inputs on the article row — Analytics Engine is
        // write-only for the app, so without these updates two of the three
        // engagement-score inputs (read time, shares) could never move.
        if (event.type === 'article_read' && event.article_id && event.duration_seconds) {
            // Exponential moving average — no read-count column needed, and a
            // clamp keeps a stuck tab from poisoning the average.
            const dur = Math.max(0, Math.min(3600, Number(event.duration_seconds) || 0));
            if (dur > 0) {
                await env.DB.prepare(`
                    UPDATE articles SET avg_read_time_seconds = CASE
                        WHEN avg_read_time_seconds > 0 THEN avg_read_time_seconds * 0.8 + ? * 0.2
                        ELSE ?
                    END
                    WHERE id = ?
                `).bind(dur, dur, event.article_id).run();
            }
        }

        if (event.type === 'article_share' && event.article_id) {
            await env.DB.prepare(
                'UPDATE articles SET share_count = share_count + 1 WHERE id = ?'
            ).bind(event.article_id).run();
        }
    } catch (error) {
        console.error('Failed to track event:', error);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Increment Live Counter (Durable Object)
// ───────────────────────────────────────────────────────────────────────────────
async function incrementLiveCounter(env: Env, metric: string): Promise<void> {
    try {
        const id = env.LIVE_COUNTER.idFromName(metric);
        const counter = env.LIVE_COUNTER.get(id);
        await counter.fetch(new Request('https://internal/increment'));
    } catch (error) {
        console.error('Failed to increment live counter:', error);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Calculate Engagement Score
// ───────────────────────────────────────────────────────────────────────────────
export function calculateEngagementScore(
    viewCount: number,
    avgReadTime: number,
    shareCount: number,
    readingTimeMinutes: number
): number {
    // Normalize read time completion (0-1)
    const expectedReadSeconds = (readingTimeMinutes || 3) * 60;
    const readCompletion = Math.min(1, avgReadTime / expectedReadSeconds);

    // Weighted score
    const viewScore = Math.min(100, viewCount / 10); // Max 100 from views (1000+ views)
    const readScore = readCompletion * 50; // Max 50 from read completion
    const shareScore = Math.min(50, shareCount * 5); // Max 50 from shares (10+ shares)

    return Math.round((viewScore + readScore + shareScore) / 2);
}

// ───────────────────────────────────────────────────────────────────────────────
// Update Article Engagement (called periodically)
// ───────────────────────────────────────────────────────────────────────────────
export async function updateArticleEngagement(env: Env, articleId: string): Promise<void> {
    const article = await env.DB.prepare(`
    SELECT view_count, avg_read_time_seconds, share_count, reading_time_minutes
    FROM articles
    WHERE id = ?
  `).bind(articleId).first();

    if (!article) return;

    const score = calculateEngagementScore(
        (article as Record<string, any>).view_count || 0,
        (article as Record<string, any>).avg_read_time_seconds || 0,
        (article as Record<string, any>).share_count || 0,
        (article as Record<string, any>).reading_time_minutes || 3
    );

    await env.DB.prepare(`
    UPDATE articles SET engagement_score = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(score, articleId).run();
}
