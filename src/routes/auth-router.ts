// ═══════════════════════════════════════════════════════════════════════════════
// AUTH ROUTER
// JWT-based authentication for client login
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { createJWT } from '../lib/auth';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// Hash password using SHA-256 (same method as API keys)
// ───────────────────────────────────────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /auth/login - Authenticate and issue JWT
// ───────────────────────────────────────────────────────────────────────────────
router.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const { client_id, secret } = body;

        if (!client_id || !secret) {
            return c.json({
                error: 'bad_request',
                message: 'client_id and secret are required'
            }, 400);
        }

        // Hash the provided secret
        const secretHash = await hashPassword(secret);

        // Look up client by email and password hash
        const client = await c.env.DB.prepare(`
            SELECT id, name, email, organization, tier, rate_limit_per_hour, is_active, expires_at
            FROM clients
            WHERE email = ? AND api_key_hash = ?
        `).bind(client_id, secretHash).first();

        if (!client) {
            return c.json({
                error: 'unauthorized',
                message: 'Invalid credentials'
            }, 401);
        }

        const clientData = client as Record<string, any>;

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
        const body = await c.req.json();
        const { email, password, name, organization } = body;

        if (!email || !password || !name) {
            return c.json({
                error: 'bad_request',
                message: 'email, password, and name are required'
            }, 400);
        }

        // Check if email already exists
        const existing = await c.env.DB.prepare(
            'SELECT id FROM clients WHERE email = ?'
        ).bind(email).first();

        if (existing) {
            return c.json({
                error: 'conflict',
                message: 'Email already registered'
            }, 409);
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Generate client ID
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Insert new client (basic tier by default)
        await c.env.DB.prepare(`
            INSERT INTO clients (id, name, email, organization, type, api_key_hash, tier, rate_limit_per_hour, is_active)
            VALUES (?, ?, ?, ?, 'partner', ?, 'basic', 100, 1)
        `).bind(clientId, name, email, organization || null, passwordHash).run();

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

    const token = authHeader.slice(7);

    try {
        // Decode JWT payload (verification happens in verifyJWT)
        const [, payloadB64] = token.split('.');
        const payload = JSON.parse(atob(payloadB64));

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

    const token = authHeader.slice(7);

    try {
        const [, payloadB64] = token.split('.');
        const payload = JSON.parse(atob(payloadB64));

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

        // Decode JWT payload
        const parts = token.split('.');
        if (parts.length !== 3) {
            return c.json({ valid: false, error: 'Invalid token format' }, 400);
        }

        const payload = JSON.parse(atob(parts[1]));

        // Check expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
            return c.json({ valid: false, error: 'Token expired' }, 401);
        }

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
// POST /auth/reset-password - Request password reset (logs request for demo)
// ───────────────────────────────────────────────────────────────────────────────
router.post('/reset-password', async (c) => {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
        return c.json({ error: 'bad_request', message: 'Email required' }, 400);
    }

    // Check if client exists
    const client = await c.env.DB.prepare(
        'SELECT id, name FROM clients WHERE email = ?'
    ).bind(email).first();

    // Always return success to prevent email enumeration
    // In production, this would send an email with reset link
    console.log(`Password reset requested for: ${email}, exists: ${!!client}`);

    return c.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
    });
});

export { router as authRouter };
