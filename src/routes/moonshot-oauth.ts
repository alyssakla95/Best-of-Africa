// ═══════════════════════════════════════════════════════════════════════════════
// MOONSHOT OAUTH ROUTES
// Admin endpoints for setting up and managing Moonshot subscription OAuth.
//
// Setup flow (one time):
//   1. GET  //moonshot/oauth/authorize  → redirects to Kimi authorization page
//   2. User approves → Moonshot redirects to //moonshot/oauth/callback
//   3. Tokens stored in KV — agents use subscription from this point forward
//
// The callback route is intentionally public (no admin key) because the
// browser redirect from Moonshot won't carry the Authorization header.
// CSRF is handled via a time-limited state parameter validated against KV.
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import {
    getMoonshotAccessToken,
    exchangeCodeForTokens,
    buildMoonshotAuthUrl,
    storeMoonshotTokens,
    refreshMoonshotToken,
} from '../lib/moonshot-oauth';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Admin auth for all routes except the OAuth callback (browser redirect, no header)
router.use('/*', async (c, next) => {
    if (c.req.path.endsWith('/callback')) return next();
    const auth = c.req.header('Authorization');
    if (!auth || auth !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized' }, 401);
    }
    return next();
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //moonshot/oauth/authorize
// Redirects to Moonshot's authorization page.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/authorize', async (c) => {
    const clientId = c.env.MOONSHOT_CLIENT_ID;
    if (!clientId) {
        return c.json({
            error: 'misconfigured',
            message: 'MOONSHOT_CLIENT_ID is not set. Run: wrangler secret put MOONSHOT_CLIENT_ID',
        }, 400);
    }

    // Short-lived CSRF state — expires in 10 minutes
    const state = crypto.randomUUID();
    await c.env.CACHE.put(`moonshot:oauth:state:${state}`, '1', { expirationTtl: 600 });

    const origin      = new URL(c.req.url).origin;
    const redirectUri = `${origin}/api/v1/agent/moonshot/oauth/callback`;
    const authUrl     = buildMoonshotAuthUrl(clientId, redirectUri, state);

    return c.redirect(authUrl, 302);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //moonshot/oauth/callback
// Moonshot redirects here after the user approves access.
// Exchanges the authorization code for tokens and stores them in KV.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/callback', async (c) => {
    const { code, state, error: oauthError } = c.req.query();

    if (oauthError) {
        return c.json({ error: 'oauth_denied', detail: oauthError }, 400);
    }

    if (!code || !state) {
        return c.json({ error: 'missing_code_or_state' }, 400);
    }

    // Validate CSRF state
    const stateKey   = `moonshot:oauth:state:${state}`;
    const validState = await c.env.CACHE.get(stateKey);
    if (!validState) {
        return c.json({ error: 'invalid_or_expired_state' }, 400);
    }
    await c.env.CACHE.delete(stateKey);

    const origin      = new URL(c.req.url).origin;
    const redirectUri = `${origin}/api/v1/agent/moonshot/oauth/callback`;
    const tokens      = await exchangeCodeForTokens(c.env, code, redirectUri);

    if (!tokens) {
        return c.json({
            error: 'token_exchange_failed',
            message: 'Could not exchange authorization code. Check MOONSHOT_CLIENT_ID and MOONSHOT_CLIENT_SECRET secrets.',
        }, 500);
    }

    return c.json({
        success: true,
        message: 'Moonshot OAuth authorized. All agents will now use your subscription automatically.',
        token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        note: 'Tokens are stored in KV and auto-refreshed. No further action required.',
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //moonshot/oauth/status
// Shows token health without exposing any secrets.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/status', async (c) => {
    const [accessToken, refreshToken] = await Promise.all([
        getMoonshotAccessToken(c.env),
        c.env.CACHE.get('moonshot:oauth:refresh_token'),
    ]);

    const hasClientId     = !!c.env.MOONSHOT_CLIENT_ID;
    const hasClientSecret = !!c.env.MOONSHOT_CLIENT_SECRET;

    return c.json({
        authorized:         !!accessToken,
        access_token_valid: !!accessToken,
        has_refresh_token:  !!refreshToken,
        client_configured:  hasClientId && hasClientSecret,
        next_step: !hasClientId || !hasClientSecret
            ? 'Set MOONSHOT_CLIENT_ID and MOONSHOT_CLIENT_SECRET secrets, then visit /authorize'
            : !refreshToken
            ? 'Visit GET /agent/moonshot/oauth/authorize to complete OAuth setup'
            : null,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //moonshot/oauth/bootstrap
//
// Subscription workaround: inject a token extracted directly from the Kimi
// browser session, bypassing the OAuth authorization-code flow entirely.
//
// How to extract the token (one-time, ~2 minutes):
//   1. Log into kimi.moonshot.cn in Chrome/Firefox
//   2. Open DevTools → Network tab → type "completion" in the filter box
//   3. Send any message in Kimi chat
//   4. Click the streaming request that appears → Headers tab
//   5. Copy the value of the "Authorization" header (starts with "Bearer eyJ...")
//      — this is your access token
//   6. For the refresh token: DevTools → Application → Local Storage →
//      kimi.moonshot.cn → look for key "refresh_token" or intercept a
//      POST to /api/auth/token/refresh in the Network tab
//
// POST body: { "access_token": "eyJ...", "refresh_token": "eyJ...", "expires_in": 3600 }
// refresh_token is optional — if omitted only the access token is stored
// (agents work until it expires; add refresh_token to make it permanent).
// ───────────────────────────────────────────────────────────────────────────────
router.post('/bootstrap', async (c) => {
    const body = await c.req.json<{
        access_token:  string;
        refresh_token?: string;
        expires_in?:   number; // seconds from now; default 3600
    }>();

    if (!body.access_token) {
        return c.json({ error: 'access_token is required' }, 400);
    }

    const expiresIn  = body.expires_in ?? 3600;
    const expiresAt  = Math.floor(Date.now() / 1000) + expiresIn;

    // Store access token immediately so agents can use it right now
    await c.env.CACHE.put(
        'moonshot:oauth:access_token',
        JSON.stringify({ token: body.access_token, expires_at: expiresAt }),
        { expirationTtl: expiresIn + 3600 },
    );

    let refreshStatus = 'not_provided';

    if (body.refresh_token) {
        // Store refresh token — enables automatic renewal indefinitely
        await c.env.CACHE.put('moonshot:oauth:refresh_token', body.refresh_token, {
            expirationTtl: 60 * 60 * 24 * 90,
        });

        // Immediately verify the refresh token works by exchanging it now
        const newToken = await refreshMoonshotToken(c.env, body.refresh_token);
        refreshStatus = newToken ? 'verified_and_stored' : 'stored_but_unverified';
    }

    return c.json({
        success:        true,
        access_token:   'stored',
        refresh_token:  refreshStatus,
        expires_at:     new Date(expiresAt * 1000).toISOString(),
        message:        body.refresh_token
            ? 'Subscription active. Tokens will auto-refresh — no further action needed.'
            : `Access token stored. Expires ${new Date(expiresAt * 1000).toISOString()}. Add refresh_token to make it permanent.`,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //moonshot/oauth/probe
//
// Validates a raw token by making a cheap live call to Moonshot's API
// before committing it to KV. Use this to confirm the token works.
// Body: { "token": "eyJ..." }
// ───────────────────────────────────────────────────────────────────────────────
router.post('/probe', async (c) => {
    const { token } = await c.req.json<{ token: string }>();
    if (!token) return c.json({ error: 'token is required' }, 400);

    try {
        const res = await fetch('https://api.moonshot.cn/v1/models', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json() as { data?: { id: string }[] };
            return c.json({
                valid:  true,
                models: data.data?.map(m => m.id) ?? [],
            });
        }

        return c.json({ valid: false, status: res.status });
    } catch (err) {
        return c.json({ valid: false, error: err instanceof Error ? err.message : 'Network error' });
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// DELETE //moonshot/oauth/tokens
// Clears all stored tokens — forces re-authorization on next run.
// ───────────────────────────────────────────────────────────────────────────────
router.delete('/tokens', async (c) => {
    await Promise.all([
        c.env.CACHE.delete('moonshot:oauth:access_token'),
        c.env.CACHE.delete('moonshot:oauth:refresh_token'),
    ]);
    return c.json({ success: true, message: 'Tokens cleared. Re-authorize via GET /agent/moonshot/oauth/authorize.' });
});

export { router as moonshotOAuthRouter };
