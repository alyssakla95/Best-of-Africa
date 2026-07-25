// ═══════════════════════════════════════════════════════════════════════════════
// ALERTS SERVICE
// Real-time push notifications and WebSocket broadcasts
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { callConfiguredAI } from './ai';

// ───────────────────────────────────────────────────────────────────────────────
// Alert Types
// ───────────────────────────────────────────────────────────────────────────────
export interface ArticleAlert {
    type: 'new_article';
    notification_id?: string;
    article: {
        id: string;
        slug: string;
        title: string;
        summary: string | null;
        ai_push_message?: string;
        country_code: string | null;
        country_name: string | null;
        sector_id: string | null;
        sector_name: string | null;
        hero_image_url: string | null;
    };
    timestamp: string;
}

export interface TrendAlert {
    type: 'trending';
    country_code: string;
    country_name: string;
    article_count: number;
    timestamp: string;
}

export type Alert = ArticleAlert | TrendAlert;

// ───────────────────────────────────────────────────────────────────────────────
// Broadcast to Connected Clients via Durable Object
// ───────────────────────────────────────────────────────────────────────────────
export async function broadcastAlert(
    env: Env,
    alert: Alert
): Promise<void> {
    try {
        // Get the LiveCounter Durable Object
        const id = env.LIVE_COUNTER.idFromName('global');
        const stub = env.LIVE_COUNTER.get(id);

        // Broadcast the alert
        await stub.fetch('https://internal/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert),
        });

        console.log(`[ALERTS] Broadcasted ${alert.type} alert`);
    } catch (error) {
        console.error('[ALERTS] Failed to broadcast:', error);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Notify Users with Matching Preferences
// ───────────────────────────────────────────────────────────────────────────────
export async function notifyMatchingUsers(
    env: Env,
    article: {
        id: string;
        slug: string;
        title: string;
        summary: string | null;
        country_code: string | null;
        sector_id: string | null;
    }
): Promise<number> {
    // Find users whose preferences match this article
    let query = `
        SELECT DISTINCT up.session_id, up.id
        FROM user_preferences up
        WHERE up.last_seen_at > datetime('now', '-7 days')
    `;

    const conditions: string[] = [];
    const bindings: string[] = [];

    // Match by country of interest
    if (article.country_code) {
        conditions.push(`
            (up.countries_of_interest IS NULL 
             OR up.countries_of_interest LIKE ?)
        `);
        bindings.push(`%${article.country_code}%`);
    }

    // Match by sector of interest
    if (article.sector_id) {
        conditions.push(`
            (up.sectors_of_interest IS NULL 
             OR up.sectors_of_interest LIKE ?)
        `);
        bindings.push(`%${article.sector_id}%`);
    }

    if (conditions.length > 0) {
        query += ` AND (${conditions.join(' OR ')})`;
    }

    const users = await env.DB.prepare(query).bind(...bindings).all();
    const matchCount = users.results?.length || 0;

    console.log(`[ALERTS] ${matchCount} users matched article ${article.id}`);

    // Store notifications for matched users
    for (const user of users.results || []) {
        const u = user as Record<string, any>;
        await env.DB.prepare(`
            INSERT INTO user_notifications (id, user_preference_id, article_id, is_read, created_at)
            VALUES (?, ?, ?, 0, datetime('now'))
        `).bind(crypto.randomUUID(), u.id, article.id).run();
    }

    return matchCount;
}

// ───────────────────────────────────────────────────────────────────────────────
// On Article Published - Trigger All Alerts
// ───────────────────────────────────────────────────────────────────────────────
export async function onArticlePublished(
    env: Env,
    article: {
        id: string;
        slug: string;
        title: string;
        summary: string | null;
        country_code: string | null;
        sector_id: string | null;
        hero_image_url: string | null;
    }
): Promise<void> {
    // Get country and sector names
    let countryName = null;
    let sectorName = null;

    if (article.country_code) {
        const country = await env.DB.prepare(
            'SELECT name FROM countries WHERE code = ?'
        ).bind(article.country_code).first<{ name: string }>();
        countryName = country?.name || null;
    }

    if (article.sector_id) {
        const sector = await env.DB.prepare(
            'SELECT name FROM sectors WHERE id = ?'
        ).bind(article.sector_id).first<{ name: string }>();
        sectorName = sector?.name || null;
    }

    // Generate Push Message
    // Optimize for lock screen: < 120 chars, urgent, actionable
    let pushMessage = (article as Record<string, any>).ai_push_message || article.title;

    // Fallback: Generate if missing (e.g. old article)
    if (!pushMessage || pushMessage === article.title) {
        try {
            const prompt = `System: You are a Mobile Notification Editor. Rewrite this headline into a <120 char push notification. Urgent, high-signal, no clickbait.\n\nUser: Headline: ${article.title}\nSummary: ${article.summary || ''}`;
            const aiResponseRaw = await callConfiguredAI(env, { prompt });
            const generated = (aiResponseRaw || "").trim();
            if (generated && generated.length < 140) {
                pushMessage = generated.replace(/^"/, '').replace(/"$/, '');
            }
        } catch (e) { /* Fallback to title */ }
    }

    // 1. Broadcast to all connected WebSocket clients
    await broadcastAlert(env, {
        type: 'new_article',
        article: {
            id: article.id,
            slug: article.slug,
            title: article.title,
            ai_push_message: pushMessage,
            summary: article.summary,
            country_code: article.country_code,
            country_name: countryName,
            sector_id: article.sector_id,
            sector_name: sectorName,
            hero_image_url: article.hero_image_url,
        },
        timestamp: new Date().toISOString(),
    });

    // 2. Create notifications for users with matching preferences
    await notifyMatchingUsers(env, article);

    console.log(`[ALERTS] Completed alert processing for article ${article.id}`);
}

// ───────────────────────────────────────────────────────────────────────────────
// Get User's Unread Notifications
// ───────────────────────────────────────────────────────────────────────────────
export async function getUserNotifications(
    env: Env,
    sessionId: string,
    limit: number = 20
): Promise<ArticleAlert[]> {
    const notifications = await env.DB.prepare(`
        SELECT 
            un.id as notification_id,
            un.created_at,
            a.id, a.slug, a.title, a.summary,
            a.country_code, c.name as country_name,
            a.sector_id, s.name as sector_name,
            a.hero_image_url
        FROM user_notifications un
        JOIN user_preferences up ON un.user_preference_id = up.id
        JOIN articles a ON un.article_id = a.id
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE up.session_id = ? AND un.is_read = 0
        ORDER BY un.created_at DESC
        LIMIT ?
    `).bind(sessionId, limit).all();

    return (notifications.results || []).map((n: any) => ({
        type: 'new_article' as const,
        notification_id: n.notification_id,
        article: {
            id: n.id,
            slug: n.slug,
            title: n.title,
            summary: n.summary,
            country_code: n.country_code,
            country_name: n.country_name,
            sector_id: n.sector_id,
            sector_name: n.sector_name,
            hero_image_url: n.hero_image_url,
        },
        timestamp: n.created_at,
    }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Mark Notifications as Read
// ───────────────────────────────────────────────────────────────────────────────
export async function markNotificationsRead(
    env: Env,
    sessionId: string,
    notificationIds?: string[]
): Promise<void> {
    if (notificationIds && notificationIds.length > 0) {
        const placeholders = notificationIds.map(() => '?').join(',');
        await env.DB.prepare(`
            UPDATE user_notifications 
            SET is_read = 1 
            WHERE id IN (${placeholders})
            AND user_preference_id IN (
                SELECT id FROM user_preferences WHERE session_id = ?
            )
        `).bind(...notificationIds, sessionId).run();
    } else {
        // Mark all as read
        await env.DB.prepare(`
            UPDATE user_notifications 
            SET is_read = 1 
            WHERE user_preference_id IN (
                SELECT id FROM user_preferences WHERE session_id = ?
            )
        `).bind(sessionId).run();
    }
}
