// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTER
// JWT-based authentication for client login
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { createJWT, verifyJWT } from '../lib/auth';
import { throttle } from '../lib/ratelimit';
import { hashPassword, verifyPassword } from '../lib/password';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

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
        // Resolve identity and marketplace access from live account state.
        const client = await c.env.DB.prepare(`
            SELECT
                c.id,
                c.name,
                c.email,
                c.organization,
                c.type,
                c.tier,
                COALESCE(mca.status, 'not_granted') AS marketplace_access_status
            FROM clients c
            LEFT JOIN marketplace_client_access mca ON mca.client_id = c.id
            WHERE c.id = ? AND c.is_active = 1
        `).bind(payload.sub).first<{
            id: string;
            name: string;
            email: string;
            organization: string | null;
            type: string;
            tier: string;
            marketplace_access_status: string;
        }>();

        if (!client) {
            return c.json({
                error: 'unauthorized',
                message: 'Client not found'
            }, 401);
        }

        return c.json({
            authenticated: true,
            client: {
                id: client.id,
                name: client.name,
                email: client.email,
                organization: client.organization,
                type: client.type,
                tier: client.tier,
                marketplace_access_status: client.marketplace_access_status,
            }
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
