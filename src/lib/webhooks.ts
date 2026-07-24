// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOKS SERVICE
// User-registered webhooks for event notifications
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { publicArticleUrl } from './public-url';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export type WebhookEvent =
    | 'article.published'
    | 'article.updated'
    | 'trend.detected'
    | 'report.generated'
    | 'digest.sent';

export interface Webhook {
    id: string;
    client_id: string;
    url: string;
    events: WebhookEvent[];
    secret: string | null;
    is_active: boolean;
    last_triggered_at: string | null;
    failure_count: number;
    created_at: string;
}

export interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: Record<string, any>;
}

// ───────────────────────────────────────────────────────────────────────────────
// Register Webhook
// ───────────────────────────────────────────────────────────────────────────────
export async function registerWebhook(
    env: Env,
    clientId: string,
    url: string,
    events: WebhookEvent[],
    secret?: string
): Promise<string> {
    // Validate URL
    try {
        new URL(url);
    } catch {
        throw new Error('Invalid webhook URL');
    }

    // Check limit (max 10 webhooks per client)
    const count = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM webhooks WHERE client_id = ?'
    ).bind(clientId).first<{ count: number }>();

    if ((count?.count || 0) >= 10) {
        throw new Error('Maximum webhook limit reached (10)');
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(`
        INSERT INTO webhooks (id, client_id, url, events, secret, is_active, failure_count, created_at)
        VALUES (?, ?, ?, ?, ?, 1, 0, datetime('now'))
    `).bind(
        id,
        clientId,
        url,
        JSON.stringify(events),
        secret || null
    ).run();

    return id;
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Client Webhooks
// ───────────────────────────────────────────────────────────────────────────────
export async function getClientWebhooks(
    env: Env,
    clientId: string
): Promise<Webhook[]> {
    const results = await env.DB.prepare(
        'SELECT * FROM webhooks WHERE client_id = ? ORDER BY created_at DESC'
    ).bind(clientId).all();

    return (results.results || []).map((r: any) => ({
        ...r,
        events: JSON.parse(r.events),
        is_active: r.is_active === 1,
    }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Delete Webhook
// ───────────────────────────────────────────────────────────────────────────────
export async function deleteWebhook(
    env: Env,
    clientId: string,
    webhookId: string
): Promise<boolean> {
    const result = await env.DB.prepare(
        'DELETE FROM webhooks WHERE id = ? AND client_id = ?'
    ).bind(webhookId, clientId).run();

    return result.meta.changes > 0;
}

// ───────────────────────────────────────────────────────────────────────────────
// Dispatch Event to Webhooks
// ───────────────────────────────────────────────────────────────────────────────
export async function dispatchWebhookEvent(
    env: Env,
    event: WebhookEvent,
    data: Record<string, any>
): Promise<{ sent: number; failed: number }> {
    // Find all active webhooks subscribed to this event
    const webhooks = await env.DB.prepare(`
        SELECT * FROM webhooks
        WHERE is_active = 1
        AND events LIKE ?
    `).bind(`%"${event}"%`).all<Webhook>();

    let sent = 0;
    let failed = 0;

    const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
    };

    for (const webhook of webhooks.results || []) {
        const w = webhook as Record<string, any>;

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'BestOfAfrica-Webhooks/1.0',
                'X-Webhook-Event': event,
            };

            // Sign payload if secret exists
            if (w.secret) {
                const signature = await signPayload(JSON.stringify(payload), w.secret);
                headers['X-Webhook-Signature'] = signature;
            }

            const response = await fetch(w.url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                sent++;
                // Reset failure count on success
                await env.DB.prepare(`
                    UPDATE webhooks 
                    SET last_triggered_at = datetime('now'), failure_count = 0
                    WHERE id = ?
                `).bind(w.id).run();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }

        } catch (error) {
            failed++;
            console.error(`Webhook ${w.id} failed:`, error);

            // Increment failure count
            const newCount = (w.failure_count || 0) + 1;
            await env.DB.prepare(`
                UPDATE webhooks 
                SET failure_count = ?,
                    is_active = CASE WHEN ? >= 5 THEN 0 ELSE is_active END
                WHERE id = ?
            `).bind(newCount, newCount, w.id).run();
        }
    }

    // Log dispatch
    await env.DB.prepare(`
        INSERT INTO webhook_logs (id, event, payload, sent_count, failed_count, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        crypto.randomUUID(),
        event,
        JSON.stringify(data),
        sent,
        failed
    ).run();

    return { sent, failed };
}

// ───────────────────────────────────────────────────────────────────────────────
// Sign Payload with HMAC
// ───────────────────────────────────────────────────────────────────────────────
async function signPayload(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
    );

    return 'sha256=' + Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ───────────────────────────────────────────────────────────────────────────────
// Event Dispatchers for Specific Events
// ───────────────────────────────────────────────────────────────────────────────
export async function onArticlePublishedWebhook(
    env: Env,
    article: {
        id: string;
        slug: string;
        title: string;
        country_code: string | null;
        sector_id: string | null;
    }
): Promise<void> {
    await dispatchWebhookEvent(env, 'article.published', {
        article_id: article.id,
        slug: article.slug,
        title: article.title,
        country_code: article.country_code,
        sector_id: article.sector_id,
        url: publicArticleUrl(env, article.slug),
    });
}

export async function onTrendDetectedWebhook(
    env: Env,
    trend: {
        entity: string;
        entity_type: string;
        change_percent: number;
    }
): Promise<void> {
    await dispatchWebhookEvent(env, 'trend.detected', trend);
}
