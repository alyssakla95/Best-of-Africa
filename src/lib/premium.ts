// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM FEATURES SERVICE
// Tiered access, custom alerts, and saved searches
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Subscription Tiers
// ───────────────────────────────────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'professional' | 'enterprise';

export const TIER_LIMITS: Record<SubscriptionTier, {
    api_calls_per_day: number;
    saved_searches: number;
    custom_alerts: number;
    report_downloads: number;
    audio_narrations: number;
    translation_languages: number;
}> = {
    free: {
        api_calls_per_day: 100,
        saved_searches: 3,
        custom_alerts: 1,
        report_downloads: 0,
        audio_narrations: 5,
        translation_languages: 1,
    },
    professional: {
        api_calls_per_day: 1000,
        saved_searches: 20,
        custom_alerts: 10,
        report_downloads: 10,
        audio_narrations: 50,
        translation_languages: 4,
    },
    enterprise: {
        api_calls_per_day: 10000,
        saved_searches: -1, // Unlimited
        custom_alerts: -1,
        report_downloads: -1,
        audio_narrations: -1,
        translation_languages: 4,
    },
};

// ───────────────────────────────────────────────────────────────────────────────
// Check User Tier Limits
// ───────────────────────────────────────────────────────────────────────────────
export async function checkTierLimit(
    env: Env,
    userId: string,
    feature: keyof typeof TIER_LIMITS['free']
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    // Get user's tier
    const user = await env.DB.prepare(
        'SELECT subscription_tier FROM clients WHERE id = ?'
    ).bind(userId).first<{ subscription_tier: SubscriptionTier }>();

    const tier = user?.subscription_tier || 'free';
    const limit = TIER_LIMITS[tier][feature];

    // Unlimited for enterprise
    if (limit === -1) {
        return { allowed: true, remaining: -1, limit: -1 };
    }

    // Count usage today
    const usage = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM usage_log
        WHERE user_id = ? AND feature = ? AND date(created_at) = date('now')
    `).bind(userId, feature).first<{ count: number }>();

    const used = usage?.count || 0;
    const remaining = Math.max(0, limit - used);

    return {
        allowed: used < limit,
        remaining,
        limit,
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Log Feature Usage
// ───────────────────────────────────────────────────────────────────────────────
export async function logUsage(
    env: Env,
    userId: string,
    feature: string
): Promise<void> {
    await env.DB.prepare(`
        INSERT INTO usage_log (id, user_id, feature, created_at)
        VALUES (?, ?, ?, datetime('now'))
    `).bind(crypto.randomUUID(), userId, feature).run();
}

// ───────────────────────────────────────────────────────────────────────────────
// Saved Searches
// ───────────────────────────────────────────────────────────────────────────────
export interface SavedSearch {
    id: string;
    user_id: string;
    name: string;
    query: string;
    filters: {
        countries?: string[];
        sectors?: string[];
        date_range?: { start: string; end: string };
    };
    notify_on_match: boolean;
    last_run_at: string | null;
    created_at: string;
}

export async function createSavedSearch(
    env: Env,
    userId: string,
    search: Omit<SavedSearch, 'id' | 'user_id' | 'created_at' | 'last_run_at'>
): Promise<string> {
    // Check limit
    const { allowed } = await checkTierLimit(env, userId, 'saved_searches');
    if (!allowed) {
        throw new Error('Saved search limit reached. Upgrade your plan.');
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(`
        INSERT INTO saved_searches (id, user_id, name, query, filters, notify_on_match, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        id,
        userId,
        search.name,
        search.query,
        JSON.stringify(search.filters),
        search.notify_on_match ? 1 : 0
    ).run();

    return id;
}

export async function getUserSavedSearches(
    env: Env,
    userId: string
): Promise<SavedSearch[]> {
    const results = await env.DB.prepare(`
        SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();

    return (results.results || []).map((r: any) => ({
        ...r,
        filters: JSON.parse(r.filters),
        notify_on_match: r.notify_on_match === 1,
    }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Custom Alerts
// ───────────────────────────────────────────────────────────────────────────────
export interface CustomAlert {
    id: string;
    user_id: string;
    name: string;
    trigger_type: 'keyword' | 'country' | 'sector' | 'sentiment';
    trigger_value: string;
    notification_channels: ('email' | 'push' | 'slack')[];
    is_active: boolean;
    last_triggered_at: string | null;
    created_at: string;
}

export async function createCustomAlert(
    env: Env,
    userId: string,
    alert: Omit<CustomAlert, 'id' | 'user_id' | 'created_at' | 'last_triggered_at'>
): Promise<string> {
    const { allowed } = await checkTierLimit(env, userId, 'custom_alerts');
    if (!allowed) {
        throw new Error('Custom alert limit reached. Upgrade your plan.');
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(`
        INSERT INTO custom_alerts (id, user_id, name, trigger_type, trigger_value, notification_channels, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        id,
        userId,
        alert.name,
        alert.trigger_type,
        alert.trigger_value,
        JSON.stringify(alert.notification_channels),
        alert.is_active ? 1 : 0
    ).run();

    return id;
}

// ───────────────────────────────────────────────────────────────────────────────
// Check Article Against Custom Alerts
// ───────────────────────────────────────────────────────────────────────────────
export async function checkArticleAlerts(
    env: Env,
    article: {
        id: string;
        title: string;
        content: string;
        country_code: string | null;
        sector_id: string | null;
        sentiment_score: string | null;
    }
): Promise<string[]> {
    const triggeredAlertIds: string[] = [];

    // Get all active alerts
    const alerts = await env.DB.prepare(`
        SELECT * FROM custom_alerts WHERE is_active = 1
    `).all<CustomAlert>();

    for (const alert of alerts.results || []) {
        const a = alert as Record<string, any>;
        let triggered = false;

        switch (a.trigger_type) {
            case 'keyword':
                triggered = article.title.toLowerCase().includes(a.trigger_value.toLowerCase()) ||
                    article.content.toLowerCase().includes(a.trigger_value.toLowerCase());
                break;
            case 'country':
                triggered = article.country_code === a.trigger_value;
                break;
            case 'sector':
                triggered = article.sector_id === a.trigger_value;
                break;
            case 'sentiment':
                triggered = article.sentiment_score === a.trigger_value;
                break;
        }

        if (triggered) {
            triggeredAlertIds.push(a.id);

            // Update last triggered
            await env.DB.prepare(`
                UPDATE custom_alerts SET last_triggered_at = datetime('now') WHERE id = ?
            `).bind(a.id).run();

            // Create notification
            await env.DB.prepare(`
                INSERT INTO alert_notifications (id, alert_id, article_id, created_at)
                VALUES (?, ?, ?, datetime('now'))
            `).bind(crypto.randomUUID(), a.id, article.id).run();
        }
    }

    return triggeredAlertIds;
}

// ───────────────────────────────────────────────────────────────────────────────
// Run Saved Searches (Scheduled)
// ───────────────────────────────────────────────────────────────────────────────
export async function runSavedSearches(env: Env): Promise<void> {
    const searches = await env.DB.prepare(`
        SELECT * FROM saved_searches WHERE notify_on_match = 1
    `).all<SavedSearch>();

    for (const search of searches.results || []) {
        const s = search as Record<string, any>;
        const filters = JSON.parse(s.filters);

        // Build query
        let query = `
            SELECT id FROM articles
            WHERE status = 'published'
            AND (title LIKE ? OR content LIKE ?)
        `;
        const bindings: string[] = [`%${s.query}%`, `%${s.query}%`];

        if (filters.countries?.length > 0) {
            query += ` AND country_code IN (${filters.countries.map(() => '?').join(',')})`;
            bindings.push(...filters.countries);
        }

        if (s.last_run_at) {
            query += ` AND published_at > ?`;
            bindings.push(s.last_run_at);
        }

        query += ' LIMIT 10';

        const matches = await env.DB.prepare(query).bind(...bindings).all();

        if (matches.results && matches.results.length > 0) {
            // Create notifications for matches
            for (const match of matches.results) {
                await env.DB.prepare(`
                    INSERT INTO search_notifications (id, saved_search_id, article_id, created_at)
                    VALUES (?, ?, ?, datetime('now'))
                `).bind(crypto.randomUUID(), s.id, (match as Record<string, any>).id).run();
            }
        }

        // Update last run
        await env.DB.prepare(`
            UPDATE saved_searches SET last_run_at = datetime('now') WHERE id = ?
        `).bind(s.id).run();
    }
}
