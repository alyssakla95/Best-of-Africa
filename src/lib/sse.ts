// ═══════════════════════════════════════════════════════════════════════════════
// SSE (SERVER-SENT EVENTS) SERVICE
// Alternative to WebSocket for real-time updates
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// SSE Event Types
// ───────────────────────────────────────────────────────────────────────────────
export interface SSEEvent {
    event: string;
    data: any;
    id?: string;
    retry?: number;
}

// ───────────────────────────────────────────────────────────────────────────────
// Format SSE Message
// ───────────────────────────────────────────────────────────────────────────────
export function formatSSE(event: SSEEvent): string {
    let message = '';

    if (event.id) {
        message += `id: ${event.id}\n`;
    }

    if (event.retry) {
        message += `retry: ${event.retry}\n`;
    }

    message += `event: ${event.event}\n`;
    message += `data: ${JSON.stringify(event.data)}\n\n`;

    return message;
}

// ───────────────────────────────────────────────────────────────────────────────
// Create SSE Stream
// ───────────────────────────────────────────────────────────────────────────────
export function createSSEStream(
    env: Env,
    options: {
        countries?: string[];
        sectors?: string[];
        events?: string[];
    } = {}
): Response {
    const encoder = new TextEncoder();
    let heartbeat: any; // Timer reference
    let pollArticles: any; // Timer reference

    const stream = new ReadableStream({
        async start(controller: any) {
            // Send initial connection message
            const connectEvent = formatSSE({
                event: 'connected',
                data: { timestamp: new Date().toISOString() },
                retry: 5000,
            });
            controller.enqueue(encoder.encode(connectEvent));

            // Keep-alive heartbeat
            heartbeat = setInterval(() => {
                try {
                    const ping = formatSSE({
                        event: 'heartbeat',
                        data: { timestamp: new Date().toISOString() },
                    });
                    controller.enqueue(encoder.encode(ping));
                } catch {
                    clearInterval(heartbeat);
                }
            }, 30000); // Every 30 seconds

            // Poll for new articles (simple implementation)
            let lastCheck = new Date().toISOString();

            pollArticles = setInterval(async () => {
                try {
                    let query = `
                        SELECT a.id, a.slug, a.title, a.summary, a.country_code, a.sector_id, a.published_at
                        FROM articles a
                        WHERE a.status = 'published'
                        AND a.published_at > ?
                    `;

                    const bindings: string[] = [lastCheck];

                    if (options.countries && options.countries.length > 0) {
                        query += ` AND a.country_code IN (${options.countries.map(() => '?').join(',')})`;
                        bindings.push(...options.countries);
                    }

                    if (options.sectors && options.sectors.length > 0) {
                        query += ` AND a.sector_id IN (${options.sectors.map(() => '?').join(',')})`;
                        bindings.push(...options.sectors);
                    }

                    query += ' ORDER BY a.published_at DESC LIMIT 10';

                    const articles = await env.DB.prepare(query).bind(...bindings).all();

                    for (const article of articles.results || []) {
                        const event = formatSSE({
                            event: 'article_published',
                            data: article,
                            id: (article as Record<string, any>).id,
                        });
                        controller.enqueue(encoder.encode(event));
                    }

                    lastCheck = new Date().toISOString();

                } catch (error) {
                    console.error('SSE poll error:', error);
                }
            }, 10000); // Poll every 10 seconds
        },

        cancel() {
            // Cleanup on close
            clearInterval(heartbeat);
            clearInterval(pollArticles);
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

// ───────────────────────────────────────────────────────────────────────────────
// Broadcast Event (for use with Durable Object)
// ───────────────────────────────────────────────────────────────────────────────
export async function broadcastSSEEvent(
    env: Env,
    event: SSEEvent
): Promise<void> {
    // This would integrate with the LiveCounter Durable Object
    // to broadcast to all connected SSE clients
    const id = env.LIVE_COUNTER.idFromName('sse-broadcast');
    const stub = env.LIVE_COUNTER.get(id);

    await stub.fetch('https://internal/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
    });
}
