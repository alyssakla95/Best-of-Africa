// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI OAUTH ROUTES
// Admin endpoints for setting up and managing Google Gemini subscription OAuth.
//
// Setup flow (one time):
//   1. GET  //gemini/oauth/authorize  → redirects to Google consent screen
//   2. User approves → Google redirects to //gemini/oauth/callback
//   3. Tokens stored in KV for explicitly configured specialist integrations.
// Informational generation remains pinned to Workers AI GPT-OSS 120B.
//
// The callback route is public (browser redirect won't carry Authorization header).
// CSRF is handled via a time-limited state parameter validated against KV.
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import {
    getGeminiAccessToken,
    exchangeCodeForTokens,
    buildGeminiAuthUrl,
    storeGeminiTokens,
    refreshGeminiToken,
} from '../lib/gemini-oauth';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// Admin auth for all routes except the OAuth callback
router.use('/*', async (c, next) => {
    if (c.req.path.endsWith('/callback')) return next();
    const auth = c.req.header('Authorization');
    if (!auth || auth !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized' }, 401);
    }
    return next();
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //gemini/oauth/authorize
// Redirects to Google's OAuth consent screen.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/authorize', async (c) => {
    const clientId = c.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
        return c.json({
            error: 'misconfigured',
            message: 'GOOGLE_CLIENT_ID is not set. Run: wrangler secret put GOOGLE_CLIENT_ID',
        }, 400);
    }

    const state = crypto.randomUUID();
    await c.env.CACHE.put(`gemini:oauth:state:${state}`, '1', { expirationTtl: 600 });

    const origin      = new URL(c.req.url).origin;
    const redirectUri = `${origin}/api/v1/agent/gemini/oauth/callback`;
    const authUrl     = buildGeminiAuthUrl(clientId, redirectUri, state);

    return c.redirect(authUrl, 302);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //gemini/oauth/callback
// Google redirects here after the user approves access.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/callback', async (c) => {
    const { code, state, error: oauthError } = c.req.query();

    if (oauthError) {
        return c.json({ error: 'oauth_denied', detail: oauthError }, 400);
    }

    if (!code || !state) {
        return c.json({ error: 'missing_code_or_state' }, 400);
    }

    const stateKey   = `gemini:oauth:state:${state}`;
    const validState = await c.env.CACHE.get(stateKey);
    if (!validState) {
        return c.json({ error: 'invalid_or_expired_state' }, 400);
    }
    await c.env.CACHE.delete(stateKey);

    const origin      = new URL(c.req.url).origin;
    const redirectUri = `${origin}/api/v1/agent/gemini/oauth/callback`;
    let tokens;
    try {
        tokens = await exchangeCodeForTokens(c.env, code, redirectUri);
    } catch (err: any) {
        return c.json({
            error: 'token_exchange_failed',
            message: err.message || 'Unknown error occurred during token exchange.',
            hint: 'This is the exact error Google returned.'
        }, 500);
    }

    if (!tokens) {
        return c.json({
            error: 'token_exchange_failed',
            message: 'Could not exchange authorization code. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets.',
        }, 500);
    }

    return c.json({
        success: true,
        message: 'Gemini OAuth authorized for explicit specialist integrations. Informational generation remains pinned to GPT-OSS 120B.',
        token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
        scope: tokens.scope,
        note: 'Tokens are stored in KV and auto-refreshed, but do not override the information-generation model.',
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //gemini/oauth/status
// Shows token health without exposing any secrets.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/status', async (c) => {
    const [accessToken, refreshToken] = await Promise.all([
        getGeminiAccessToken(c.env),
        c.env.CACHE.get('gemini:oauth:refresh_token'),
    ]);

    const hasClientId     = !!c.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!c.env.GOOGLE_CLIENT_SECRET;

    let email = null;
    if (accessToken) {
        try {
            const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json() as any;
                email = data.email;
            }
        } catch (e) {}
    }

    return c.json({
        authorized:         !!accessToken,
        access_token_valid: !!accessToken,
        has_refresh_token:  !!refreshToken,
        client_configured:  hasClientId && hasClientSecret,
        linked_account:     email,
        next_step: !hasClientId || !hasClientSecret
            ? 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets, then visit /authorize'
            : !refreshToken
            ? 'Visit GET /agent/gemini/oauth/authorize to complete OAuth setup'
            : null,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //gemini/oauth/bootstrap
//
// Inject a token extracted from a Google session or service account.
//
// How to extract (browser method):
//   1. Go to https://aistudio.google.com
//   2. Sign in with your Google account
//   3. Open DevTools → Network tab
//   4. Send a prompt in Studio
//   5. Find the generateContent request → copy the Authorization header value
//   6. POST it here as { "access_token": "ya29...." }
//
// Body: { "access_token": "ya29...", "refresh_token": "1//...", "expires_in": 3600 }
// ───────────────────────────────────────────────────────────────────────────────
router.post('/bootstrap', async (c) => {
    const body = await c.req.json<{
        access_token:   string;
        refresh_token?: string;
        expires_in?:    number;
    }>();

    if (!body.access_token) {
        return c.json({ error: 'access_token is required' }, 400);
    }

    const expiresIn = body.expires_in ?? 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    await storeGeminiTokens(c.env, {
        access_token:  body.access_token,
        refresh_token: body.refresh_token || '',
        expires_at:    expiresAt,
        token_type:    'Bearer',
    });

    let refreshStatus = 'not_provided';

    if (body.refresh_token) {
        const newToken = await refreshGeminiToken(c.env, body.refresh_token);
        refreshStatus = newToken ? 'verified_and_stored' : 'stored_but_unverified';
    }

    return c.json({
        success:       true,
        access_token:  'stored',
        refresh_token: refreshStatus,
        expires_at:    new Date(expiresAt * 1000).toISOString(),
        message:       body.refresh_token
            ? 'Gemini subscription stored for specialist integrations. Tokens will auto-refresh; informational generation remains on GPT-OSS 120B.'
            : `Access token stored. Expires ${new Date(expiresAt * 1000).toISOString()}. Add refresh_token to make it permanent.`,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //gemini/oauth/probe
// Validates a raw token against the Gemini API.
// Body: { "token": "ya29..." }
// ───────────────────────────────────────────────────────────────────────────────
router.post('/probe', async (c) => {
    const { token } = await c.req.json<{ token: string }>();
    if (!token) return c.json({ error: 'token is required' }, 400);

    try {
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            const data = await res.json() as { models?: { name: string }[] };
            return c.json({
                valid:  true,
                models: data.models?.map(m => m.name) ?? [],
            });
        }

        return c.json({ valid: false, status: res.status });
    } catch (err) {
        return c.json({ valid: false, error: err instanceof Error ? err.message : 'Network error' });
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// DELETE //gemini/oauth/tokens
// Clears all stored tokens — forces re-authorization.
// ───────────────────────────────────────────────────────────────────────────────
router.delete('/tokens', async (c) => {
    await Promise.all([
        c.env.CACHE.delete('gemini:oauth:access_token'),
        c.env.CACHE.delete('gemini:oauth:refresh_token'),
    ]);
    return c.json({ success: true, message: 'Tokens cleared. Re-authorize via GET /agent/gemini/oauth/authorize.' });
});

export { router as geminiOAuthRouter };
