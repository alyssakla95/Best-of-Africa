// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTER
// JWT-based authentication for client login
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { createJWT, verifyJWT } from '../lib/auth';
import { throttle } from '../lib/ratelimit';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// Password storage uses PBKDF2-SHA256. Existing SHA-256 rows are accepted once
// and upgraded after a successful login so current accounts are not locked out.
// ───────────────────────────────────────────────────────────────────────────────
const PASSWORD_ITERATIONS = 210_000;

function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
    const material = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
        material,
        256,
    );
    return new Uint8Array(bits);
}

async function hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derived = await derivePassword(password, salt, PASSWORD_ITERATIONS);
    return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${toBase64(salt)}$${toBase64(derived)}`;
}

async function verifyPassword(password: string, stored: string): Promise<{ valid: boolean; legacy: boolean }> {
    if (stored.startsWith('pbkdf2-sha256$')) {
        const [, iterationsText, saltText, hashText] = stored.split('$');
        const iterations = Number(iterationsText);
        if (!Number.isInteger(iterations) || iterations < 100_000 || !saltText || !hashText) {
            return { valid: false, legacy: false };
        }
        const expected = fromBase64(hashText);
        const actual = await derivePassword(password, fromBase64(saltText), iterations);
        if (expected.length !== actual.length) return { valid: false, legacy: false };
        let difference = 0;
        for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ actual[index];
        return { valid: difference === 0, legacy: false };
    }

    // Legacy rows contain a 64-character hexadecimal SHA-256 digest.
    if (!/^[a-f0-9]{64}$/i.test(stored)) return { valid: false, legacy: false };
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)));
    const actual = Array.from(digest).map(byte => byte.toString(16).padStart(2, '0')).join('');
    return { valid: actual === stored.toLowerCase(), legacy: true };
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /auth/login - Authenticate and issue JWT
// ───────────────────────────────────────────────────────────────────────────────
router.post('/login', async (c) => {
    try {
        const limited = await throttle(c, 'auth-login');
        if (limited) return limited;
        const body = await c.req.json();
        const { client_id, secret } = body;

        if (!client_id || !secret) {
            return c.json({
                error: 'bad_request',
                message: 'client_id and secret are required'
            }, 400);
        }

        // Fetch by normalized email, then verify the versioned password hash.
        const client = await c.env.DB.prepare(`
            SELECT id, name, email, organization, tier, rate_limit_per_hour, is_active, expires_at,
                   password_hash, api_key_hash
            FROM clients
            WHERE lower(email) = lower(?)
        `).bind(client_id).first();

        const clientData = client as Record<string, any> | null;
        const storedPassword = clientData?.password_hash || clientData?.api_key_hash || '';
        const password = clientData
            ? await verifyPassword(secret, String(storedPassword))
            : { valid: false, legacy: false };
        if (!clientData || !password.valid) {
            return c.json({
                error: 'unauthorized',
                message: 'Invalid credentials'
            }, 401);
        }

        // Check if client is active
        if (!clientData.is_active) {
            return c.json({
                error: 'forbidden',
                message: 'Account is deactivated'
            }, 403);
        }

        // Check expiration
        if (clientData.expires_at && new Date(clientData.expires_at) < new Date()) {
            return c.json({
                error: 'forbidden',
                message: 'Account has expired'
            }, 403);
        }

        if (!clientData.password_hash || password.legacy) {
            await c.env.DB.prepare('UPDATE clients SET password_hash = ?, api_key_hash = ? WHERE id = ?')
                .bind(
                    await hashPassword(secret),
                    `unprovisioned:${crypto.randomUUID()}`,
                    clientData.id,
                )
                .run();
        }

        // Generate JWT (24 hour expiration by default)
        const token = await createJWT(clientData.id, c.env.JWT_SECRET, 86400);

        // Calculate access level based on tier
        const accessLevelMap: Record<string, string> = {
            'basic': 'Standard',
            'premium': 'High',
            'enterprise': 'Sovereign'
        };

        return c.json({
            token,
            tier: clientData.tier,
            access_level: accessLevelMap[clientData.tier] || 'Standard',
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            client: {
                id: clientData.id,
                name: clientData.name,
                organization: clientData.organization
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return c.json({
            error: 'internal_error',
            message: 'Authentication failed'
        }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /auth/register - Register a new client (for demo/testing)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/register', async (c) => {
    try {
        const limited = await throttle(c, 'auth-register');
        if (limited) return limited;
        if (!c.env.ADMIN_API_KEY || c.req.header('X-Admin-Key') !== c.env.ADMIN_API_KEY) {
            return c.json({
                error: 'forbidden',
                message: 'Client registration requires administrator authorization'
            }, 403);
        }
        const body = await c.req.json();
        const { email, password, name, organization } = body;

        if (!email || !password || !name) {
            return c.json({
                error: 'bad_request',
                message: 'email, password, and name are required'
            }, 400);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)) || String(password).length < 12) {
            return c.json({
                error: 'bad_request',
                message: 'A valid email and a password of at least 12 characters are required'
            }, 400);
        }

        // Check if email already exists
        const existing = await c.env.DB.prepare(
            'SELECT id FROM clients WHERE email = ?'
        ).bind(String(email).toLowerCase().trim()).first();

        if (existing) {
            return c.json({
                error: 'conflict',
                message: 'Email already registered'
            }, 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate client ID
        const clientId = crypto.randomUUID();

        // Insert new client (basic tier by default)
        await c.env.DB.prepare(`
            INSERT INTO clients (
                id, name, email, organization, type, api_key_hash,
                password_hash, tier, rate_limit_per_hour, is_active
            )
            VALUES (?, ?, ?, ?, 'partner', ?, ?, 'basic', 100, 1)
        `).bind(
            clientId,
            String(name).trim(),
            String(email).toLowerCase().trim(),
            organization || null,
            `unprovisioned:${crypto.randomUUID()}`,
            passwordHash,
        ).run();

        // Generate JWT for immediate login
        const token = await createJWT(clientId, c.env.JWT_SECRET, 86400);

        return c.json({
            success: true,
            token,
            tier: 'basic',
            access_level: 'Standard',
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            client: {
                id: clientId,
                name,
                organization
            }
        }, 201);

    } catch (error) {
        console.error('Registration error:', error);
        return c.json({
            error: 'internal_error',
            message: 'Registration failed'
        }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /auth/me - Get current authenticated user info
// ───────────────────────────────────────────────────────────────────────────────
router.get('/me', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({
            error: 'unauthorized',
            message: 'Bearer token required'
        }, 401);
    }

    const payload = await verifyJWT(authHeader.slice(7), c.env.JWT_SECRET);
    if (!payload) {
        return c.json({ error: 'unauthorized', message: 'Invalid token' }, 401);
    }

    try {
        // Get client info
        const client = await c.env.DB.prepare(`
            SELECT id, name, email, organization, tier, rate_limit_per_hour, created_at
            FROM clients
            WHERE id = ? AND is_active = 1
        `).bind(payload.sub).first();

        if (!client) {
            return c.json({
                error: 'unauthorized',
                message: 'Client not found'
            }, 401);
        }

        return c.json({
            authenticated: true,
            client: client
        });

    } catch (error) {
        return c.json({
            error: 'unauthorized',
            message: 'Invalid token'
        }, 401);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh - Refresh JWT token
// ───────────────────────────────────────────────────────────────────────────────
router.post('/refresh', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({
            error: 'unauthorized',
            message: 'Bearer token required'
        }, 401);
    }

    const payload = await verifyJWT(authHeader.slice(7), c.env.JWT_SECRET);
    if (!payload) {
        return c.json({ error: 'unauthorized', message: 'Invalid token' }, 401);
    }

    try {
        // Verify client still exists and is active
        const client = await c.env.DB.prepare(`
            SELECT id, tier FROM clients WHERE id = ? AND is_active = 1
        `).bind(payload.sub).first();

        if (!client) {
            return c.json({
                error: 'unauthorized',
                message: 'Client not found'
            }, 401);
        }

        const clientData = client as Record<string, any>;

        // Issue new token
        const newToken = await createJWT(clientData.id, c.env.JWT_SECRET, 86400);

        return c.json({
            token: newToken,
            tier: clientData.tier,
            expires_at: new Date(Date.now() + 86400000).toISOString()
        });

    } catch (error) {
        return c.json({
            error: 'unauthorized',
            message: 'Invalid token'
        }, 401);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /auth/validate - Validate a JWT token (for AdminPage)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/validate', async (c) => {
    try {
        const body = await c.req.json();
        const { token } = body;

        if (!token) {
            return c.json({ valid: false, error: 'Token required' }, 400);
        }

        const payload = await verifyJWT(token, c.env.JWT_SECRET);
        if (!payload) return c.json({ valid: false, error: 'Invalid or expired token' }, 401);

        // Verify client exists and is active
        const client = await c.env.DB.prepare(`
            SELECT id, name, tier FROM clients WHERE id = ? AND is_active = 1
        `).bind(payload.sub).first();

        if (!client) {
            return c.json({ valid: false, error: 'Client not found' }, 401);
        }

        return c.json({
            valid: true,
            client: {
                id: (client as Record<string, any>).id,
                name: (client as Record<string, any>).name,
                tier: (client as Record<string, any>).tier
            }
        });

    } catch (error) {
        return c.json({ valid: false, error: 'Invalid token' }, 401);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /auth/reset-password - Record a non-enumerating support request
// ───────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (c) => {
    let body: { email?: string };
    try {
        body = await c.req.json();
    } catch {
        return c.json({ error: 'bad_request', message: 'Invalid JSON' }, 400);
    }
    const email = body.email?.toLowerCase().trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json({ error: 'bad_request', message: 'A valid email address is required' }, 400);
    }

    const { throttle } = await import('../lib/ratelimit');
    const limited = await throttle(c, 'password-reset');
    if (limited) return limited;

    const client = await c.env.DB.prepare(
        'SELECT id, name FROM clients WHERE email = ?'
    ).bind(email).first<{ id: string; name: string }>();

    if (client) {
        await c.env.DB.prepare(`
            INSERT INTO contact_submissions
                (id, name, organization, email, inquiry_type, message, created_at)
            VALUES (?, ?, '', ?, 'Password reset', ?, datetime('now'))
        `).bind(
            crypto.randomUUID(),
            client.name || 'Account holder',
            email,
            'Secure password reset assistance requested through the authenticated client portal.',
        ).run();
    }

    return c.json({
        success: true,
        message: 'If an account with that email exists, a secure reset request has been recorded for account support.'
    });
});

export { router as authRouter };
