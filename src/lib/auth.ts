// ═══════════════════════════════════════════════════════════════════════════════
// AUTH LIBRARY
// JWT authentication and API key validation
// ═══════════════════════════════════════════════════════════════════════════════

import { Context, Next } from 'hono';
import type { Env, Variables } from '../types';

// App context type helper
type AppContext = Context<{ Bindings: Env; Variables: Variables }>;

// ───────────────────────────────────────────────────────────────────────────────
// Middleware: Require Admin Auth (JWT or Admin API Key)
// ───────────────────────────────────────────────────────────────────────────────
export async function requireAdmin(c: AppContext, next: Next) {
    const authHeader = c.req.header('Authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const presented = c.req.header('X-Admin-Key') || bearer;

    // ONLY the admin API key opens the admin surface. Member JWTs are signed
    // with the same JWT_SECRET but carry no admin claim — the old "any valid
    // JWT" branch meant every signed-in member had full admin access.
    if (presented && c.env.ADMIN_API_KEY && presented === c.env.ADMIN_API_KEY) {
        await next();
        return;
    }

    return c.json({ error: 'unauthorized', message: 'Invalid or missing authentication' }, 401);
}

// ───────────────────────────────────────────────────────────────────────────────
// Middleware: Require Auth (any authenticated user)
// ───────────────────────────────────────────────────────────────────────────────
export async function requireAuth(c: AppContext, next: Next) {
    return requireClientAuth(c, next);
}

/**
 * Authenticate a first-party client using either its signed bearer token or
 * API key. Every successful authentication is checked against the current
 * client row so revoked and expired accounts stop working immediately.
 */
export async function requireClientAuth(c: AppContext, next: Next) {
    const authHeader = c.req.header('Authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const payload = bearer ? await verifyJWT(bearer, c.env.JWT_SECRET) : null;

    let client: Record<string, unknown> | null = null;
    if (payload) {
        client = await c.env.DB.prepare(`
            SELECT id, name, type, tier, rate_limit_per_hour, is_active, expires_at
            FROM clients WHERE id = ?
        `).bind(payload.sub).first<Record<string, unknown>>();
    } else {
        const apiKey = c.req.header('X-API-Key');
        if (apiKey) {
            client = await c.env.DB.prepare(`
                SELECT id, name, type, tier, rate_limit_per_hour, is_active, expires_at
                FROM clients WHERE api_key_hash = ?
            `).bind(await hashApiKey(apiKey)).first<Record<string, unknown>>();
        }
    }

    if (!client) {
        return c.json({ error: 'unauthorized', message: 'Valid bearer token or API key required' }, 401);
    }
    if (!client.is_active) {
        return c.json({ error: 'forbidden', message: 'Account is deactivated' }, 403);
    }
    if (client.expires_at && new Date(String(client.expires_at)) < new Date()) {
        return c.json({ error: 'forbidden', message: 'Account has expired' }, 403);
    }

    const clientId = String(client.id);
    c.set('userId', clientId);
    c.set('clientId', clientId);
    c.set('clientTier', String(client.tier || 'basic'));
    c.set('rateLimit', Number(client.rate_limit_per_hour || 100));
    await next();
}

// ───────────────────────────────────────────────────────────────────────────────
// Middleware: Require API Key (for paid intelligence clients)
// ───────────────────────────────────────────────────────────────────────────────
export async function requireApiKey(c: AppContext, next: Next) {
    const apiKey = c.req.header('X-API-Key');

    if (!apiKey) {
        return c.json({ error: 'unauthorized', message: 'API key required' }, 401);
    }

    // Hash the provided key and look up in database
    const keyHash = await hashApiKey(apiKey);

    const client = await c.env.DB.prepare(`
    SELECT id, name, tier, rate_limit_per_hour, is_active, expires_at
    FROM clients
    WHERE api_key_hash = ?
  `).bind(keyHash).first();

    if (!client) {
        return c.json({ error: 'unauthorized', message: 'Invalid API key' }, 401);
    }

    if (!(client as Record<string, any>).is_active) {
        return c.json({ error: 'forbidden', message: 'API key is deactivated' }, 403);
    }

    if ((client as Record<string, any>).expires_at && new Date((client as Record<string, any>).expires_at) < new Date()) {
        return c.json({ error: 'forbidden', message: 'API key has expired' }, 403);
    }

    // Set client info in context
    c.set('clientId', (client as Record<string, any>).id);
    c.set('clientTier', (client as Record<string, any>).tier);
    c.set('rateLimit', (client as Record<string, any>).rate_limit_per_hour);

    await next();
}

// ───────────────────────────────────────────────────────────────────────────────
// Middleware: Rate Limiting (KV-based)
// ───────────────────────────────────────────────────────────────────────────────
export async function rateLimit(c: AppContext, next: Next) {
    const clientId = (c.get('clientId') as string) || `ip:${c.req.header('CF-Connecting-IP') || 'unknown'}`; // anonymous callers share one bucket without an IP key
    const limit = c.get('rateLimit') as number || 100;

    const key = `rate:${clientId}:${getCurrentHour()}`;

    const current = await c.env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
        c.header('X-Rate-Limit-Limit', limit.toString());
        c.header('X-Rate-Limit-Remaining', '0');
        c.header('X-Rate-Limit-Reset', getNextHourTimestamp().toString());

        return c.json({
            error: 'rate_limited',
            message: `Rate limit exceeded. Limit: ${limit}/hour`
        }, 429);
    }

    // Increment counter with 1 hour TTL
    await c.env.RATE_LIMIT.put(key, (count + 1).toString(), {
        expirationTtl: 3600
    });

    c.header('X-Rate-Limit-Limit', limit.toString());
    c.header('X-Rate-Limit-Remaining', (limit - count - 1).toString());

    await next();
}

// ───────────────────────────────────────────────────────────────────────────────
// JWT Helpers
// ───────────────────────────────────────────────────────────────────────────────

export interface JWTPayload {
    sub: string;
    iat: number;
    exp: number;
}

export async function createJWT(userId: string, secret: string, expiresIn = 86400): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
        sub: userId,
        iat: now,
        exp: now + expiresIn,
    };

    const headerB64 = encodeBase64Url(new TextEncoder().encode(JSON.stringify(header)));
    const payloadB64 = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    const message = `${headerB64}.${payloadB64}`;

    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    const signatureB64 = encodeBase64Url(new Uint8Array(signature));

    return `${message}.${signatureB64}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
    try {
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        if (!headerB64 || !payloadB64 || !signatureB64) return null;
        if (!secret) return null;

        const message = `${headerB64}.${payloadB64}`;
        const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(headerB64))) as { alg?: string; typ?: string };
        if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signature = decodeBase64Url(signatureB64);
        const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(message));

        if (!isValid) return null;

        const payload: JWTPayload = JSON.parse(new TextDecoder().decode(decodeBase64Url(payloadB64)));

        const now = Math.floor(Date.now() / 1000);
        if (
            typeof payload.sub !== 'string' || !payload.sub ||
            !Number.isFinite(payload.iat) || !Number.isFinite(payload.exp) ||
            payload.iat > now + 60 ||
            payload.exp <= now ||
            payload.exp <= payload.iat
        ) return null;

        return payload;
    } catch {
        return null;
    }
}

function encodeBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

async function hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getCurrentHour(): string {
    const now = new Date();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const hh = String(now.getUTCHours()).padStart(2, '0');
    return `${now.getUTCFullYear()}-${mm}-${dd}-${hh}`;
}

function getNextHourTimestamp(): number {
    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
    return Math.floor(now.getTime() / 1000);
}
