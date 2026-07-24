// ═══════════════════════════════════════════════════════════════════════════════
// MOONSHOT OAUTH TOKEN MANAGER
// Manages OAuth 2.0 tokens for Moonshot (Kimi) subscription access.
// Stores access + refresh tokens in KV, auto-refreshes before expiry.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// Moonshot OAuth endpoints
// Override MOONSHOT_TOKEN_URL via env var if Moonshot changes them
const DEFAULT_TOKEN_URL = 'https://api.moonshot.cn/oauth/token';
const DEFAULT_AUTH_URL  = 'https://kimi.moonshot.cn/oauth/authorize';

// KV keys
const KV_ACCESS  = 'moonshot:oauth:access_token';   // { token, expires_at }
const KV_REFRESH = 'moonshot:oauth:refresh_token';  // raw refresh token string

// Refresh the access token 5 minutes before it actually expires
const EXPIRY_BUFFER_SECONDS = 300;

export interface MoonshotTokens {
    access_token:  string;
    refresh_token: string;
    expires_at:    number; // Unix timestamp (seconds)
    token_type:    string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Returns a valid access token for Moonshot AI.
 * - Returns the cached token if still fresh.
 * - Silently refreshes if within the 5-minute buffer.
 * - Returns null if OAuth has never been authorized (no refresh token stored).
 */
export async function getMoonshotAccessToken(env: Env): Promise<string | null> {
    // 1. Try the cached access token
    try {
        const raw = await env.CACHE.get(KV_ACCESS);
        if (raw) {
            const { token, expires_at } = JSON.parse(raw) as { token: string; expires_at: number };
            const nowSeconds = Math.floor(Date.now() / 1000);
            if (expires_at - nowSeconds > EXPIRY_BUFFER_SECONDS) {
                return token;
            }
        }
    } catch {
        // KV miss or parse error — fall through to refresh
    }

    // 2. Access token missing / expiring — use refresh token
    const refreshToken = await env.CACHE.get(KV_REFRESH);
    if (!refreshToken) {
        // OAuth flow has not been completed yet
        return null;
    }

    return refreshMoonshotToken(env, refreshToken);
}

/**
 * Exchange a refresh token for a new access token and persist both.
 */
export async function refreshMoonshotToken(env: Env, refreshToken: string): Promise<string | null> {
    const clientId     = env.MOONSHOT_CLIENT_ID;
    const clientSecret = env.MOONSHOT_CLIENT_SECRET;
    const tokenUrl     = env.MOONSHOT_TOKEN_URL ?? DEFAULT_TOKEN_URL;

    if (!clientId || !clientSecret) {
        console.error('[moonshot-oauth] MOONSHOT_CLIENT_ID or MOONSHOT_CLIENT_SECRET not set');
        return null;
    }

    try {
        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type:    'refresh_token',
                refresh_token: refreshToken,
                client_id:     clientId,
                client_secret: clientSecret,
            }).toString(),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error(`[moonshot-oauth] Token refresh failed HTTP ${res.status}:`, body);
            return null;
        }

        const data = await res.json() as Record<string, any>;
        const tokens: MoonshotTokens = {
            access_token:  data.access_token,
            refresh_token: data.refresh_token || refreshToken, // some providers don't rotate refresh tokens
            expires_at:    Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
            token_type:    data.token_type || 'Bearer',
        };

        await storeMoonshotTokens(env, tokens);
        console.log('[moonshot-oauth] Access token refreshed successfully.');
        return tokens.access_token;

    } catch (err) {
        console.error('[moonshot-oauth] Token refresh error:', err);
        return null;
    }
}

/**
 * Exchange an authorization code for tokens (called once from the OAuth callback).
 */
export async function exchangeCodeForTokens(
    env: Env,
    code: string,
    redirectUri: string,
): Promise<MoonshotTokens | null> {
    const clientId     = env.MOONSHOT_CLIENT_ID;
    const clientSecret = env.MOONSHOT_CLIENT_SECRET;
    const tokenUrl     = env.MOONSHOT_TOKEN_URL ?? DEFAULT_TOKEN_URL;

    if (!clientId || !clientSecret) return null;

    try {
        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type:   'authorization_code',
                code,
                redirect_uri: redirectUri,
                client_id:    clientId,
                client_secret: clientSecret,
            }).toString(),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error(`[moonshot-oauth] Code exchange failed HTTP ${res.status}:`, body);
            return null;
        }

        const data = await res.json() as Record<string, any>;
        const tokens: MoonshotTokens = {
            access_token:  data.access_token,
            refresh_token: data.refresh_token,
            expires_at:    Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
            token_type:    data.token_type || 'Bearer',
        };

        await storeMoonshotTokens(env, tokens);
        return tokens;

    } catch (err) {
        console.error('[moonshot-oauth] Code exchange error:', err);
        return null;
    }
}

/**
 * Persist tokens to KV. Access token is short-lived; refresh token is kept for 90 days.
 */
export async function storeMoonshotTokens(env: Env, tokens: MoonshotTokens): Promise<void> {
    const accessTtl = Math.max(
        tokens.expires_at - Math.floor(Date.now() / 1000) + 3600, // keep 1 hour past expiry for overlap
        60
    );
    await env.CACHE.put(
        KV_ACCESS,
        JSON.stringify({ token: tokens.access_token, expires_at: tokens.expires_at }),
        { expirationTtl: accessTtl },
    );
    await env.CACHE.put(KV_REFRESH, tokens.refresh_token, {
        expirationTtl: 60 * 60 * 24 * 90, // 90 days
    });
}

/**
 * Build the Moonshot OAuth authorization URL.
 */
export function buildMoonshotAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const authUrl = DEFAULT_AUTH_URL;
    const params = new URLSearchParams({
        response_type: 'code',
        client_id:     clientId,
        redirect_uri:  redirectUri,
        scope:         'api',
        state,
    });
    return `${authUrl}?${params.toString()}`;
}
