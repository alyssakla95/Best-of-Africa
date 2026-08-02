// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITING MIDDLEWARE
// Tier-based request throttling for API access
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { TIER_LIMITS, type SubscriptionTier } from './premium';

// ───────────────────────────────────────────────────────────────────────────────
// Rate Limit Configuration
// ───────────────────────────────────────────────────────────────────────────────
const WINDOW_SIZE_SECONDS = 60; // 1 minute window

const RATE_LIMITS: Record<SubscriptionTier, { requests: number; window: number }> = {
    free: { requests: 20, window: WINDOW_SIZE_SECONDS },
    professional: { requests: 100, window: WINDOW_SIZE_SECONDS },
    enterprise: { requests: 1000, window: WINDOW_SIZE_SECONDS },
};

// ───────────────────────────────────────────────────────────────────────────────
// Rate Limit Result
// ───────────────────────────────────────────────────────────────────────────────
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    limit: number;
    reset: number; // Unix timestamp
    retryAfter?: number; // Seconds until next request allowed
}

// ───────────────────────────────────────────────────────────────────────────────
// Check Rate Limit (Using KV for distributed counting)
// ───────────────────────────────────────────────────────────────────────────────
export async function checkRateLimit(
    env: Env,
    identifier: string, // API key or IP
    tier: SubscriptionTier = 'free'
): Promise<RateLimitResult> {
    const limits = RATE_LIMITS[tier];
    const windowKey = Math.floor(Date.now() / 1000 / limits.window);
    const key = `ratelimit:${identifier}:${windowKey}`;

    try {
        // Get current count
        const currentStr = await env.RATE_LIMIT.get(key);
        const current = currentStr ? parseInt(currentStr, 10) : 0;

        if (current >= limits.requests) {
            const resetTime = (windowKey + 1) * limits.window;
            const retryAfter = resetTime - Math.floor(Date.now() / 1000);

            return {
                allowed: false,
                remaining: 0,
                limit: limits.requests,
                reset: resetTime,
                retryAfter,
            };
        }

        // Increment count
        await env.RATE_LIMIT.put(key, String(current + 1), {
            expirationTtl: limits.window * 2, // Keep slightly longer than window
        });

        return {
            allowed: true,
            remaining: limits.requests - current - 1,
            limit: limits.requests,
            reset: (windowKey + 1) * limits.window,
        };

    } catch (error) {
        // KV unavailable — fail open so a KV blip doesn't DDoS legitimate users,
        // but log with enough context to detect sustained KV outages in production logs.
        console.error('[ratelimit] KV check failed — failing open', {
            identifier,
            tier,
            error: error instanceof Error ? error.message : String(error),
        });
        return {
            allowed: true,
            remaining: limits.requests,
            limit: limits.requests,
            reset: Math.floor(Date.now() / 1000) + limits.window,
        };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Per-IP throttle for unauthenticated endpoints — one call site per handler:
//   const limited = await throttle(c, 'contact'); if (limited) return limited;
// Returns a 429 Response (with X-RateLimit-* / Retry-After headers) when the
// bucket is exhausted, null otherwise. Centralized so every abuse-prone route
// shares one shape instead of hand-rolled copies that drift.
// ───────────────────────────────────────────────────────────────────────────────
export async function throttle(
    c: {
        env: Env;
        req: { header(name: string): string | undefined };
        header(name: string, value: string): void;
        json(object: unknown, status?: number): Response;
    },
    bucket: string,
): Promise<Response | null> {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(c.env, `${bucket}:${ip}`, 'free');
    for (const [k, v] of Object.entries(rateLimitHeaders(rl))) c.header(k, v);
    if (!rl.allowed) {
        return c.json({ error: 'too_many_requests', message: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` }, 429);
    }
    return null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Rate Limit Headers
// ───────────────────────────────────────────────────────────────────────────────
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
    };

    if (!result.allowed && result.retryAfter) {
        headers['Retry-After'] = String(result.retryAfter);
    }

    return headers;
}

// ───────────────────────────────────────────────────────────────────────────────
// Rate Limit Response
// ───────────────────────────────────────────────────────────────────────────────
export function rateLimitResponse(result: RateLimitResult): Response {
    return new Response(
        JSON.stringify({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
            retry_after: result.retryAfter,
        }),
        {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                ...rateLimitHeaders(result),
            },
        }
    );
}
