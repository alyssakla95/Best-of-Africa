// ═══════════════════════════════════════════════════════════════════════════════
// GEMINI OAUTH TOKEN MANAGER
// Manages OAuth 2.0 tokens for Google Gemini subscription access.
// Stores access + refresh tokens in KV, auto-refreshes before expiry.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL  = 'https://accounts.google.com/o/oauth2/v2/auth';

const KV_ACCESS  = 'gemini:oauth:access_token';
const KV_REFRESH = 'gemini:oauth:refresh_token';

const EXPIRY_BUFFER_SECONDS = 300;

export interface GeminiTokens {
    access_token:  string;
    refresh_token: string;
    expires_at:    number;
    token_type:    string;
    scope?:        string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

export async function getGeminiAccessToken(env: Env): Promise<string | null> {
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

    const refreshToken = await env.CACHE.get(KV_REFRESH);
    if (!refreshToken) return null;

    return refreshGeminiToken(env, refreshToken);
}

export async function refreshGeminiToken(env: Env, refreshToken: string): Promise<string | null> {
    const clientId     = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('[gemini-oauth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set');
        return null;
    }

    try {
        const res = await fetch(TOKEN_URL, {
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
            console.error(`[gemini-oauth] Token refresh failed HTTP ${res.status}:`, body);
            return null;
        }

        const data = await res.json() as Record<string, any>;
        const tokens: GeminiTokens = {
            access_token:  data.access_token,
            refresh_token: data.refresh_token || refreshToken,
            expires_at:    Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
            token_type:    data.token_type || 'Bearer',
        };

        await storeGeminiTokens(env, tokens);
        console.log('[gemini-oauth] Access token refreshed successfully.');
        return tokens.access_token;

    } catch (err) {
        console.error('[gemini-oauth] Token refresh error:', err);
        return null;
    }
}

export async function exchangeCodeForTokens(
    env: Env,
    code: string,
    redirectUri: string,
): Promise<GeminiTokens | null> {
    const clientId     = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) return null;

    try {
        const res = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type:    'authorization_code',
                code,
                redirect_uri:  redirectUri,
                client_id:     clientId,
                client_secret: clientSecret,
            }).toString(),
        });

        if (!res.ok) {
            const body = await res.text().catch(() => '');
            console.error(`[gemini-oauth] Code exchange failed HTTP ${res.status}:`, body);
            throw new Error(`Google API Error: ${res.status} ${body}`);
        }

        const data = await res.json() as Record<string, any>;
        const tokens: GeminiTokens = {
            access_token:  data.access_token,
            refresh_token: data.refresh_token,
            expires_at:    Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
            token_type:    data.token_type || 'Bearer',
            scope:         data.scope,
        };

        await storeGeminiTokens(env, tokens);
        return tokens;

    } catch (err) {
        console.error('[gemini-oauth] Code exchange error:', err);
        return null;
    }
}

export async function storeGeminiTokens(env: Env, tokens: GeminiTokens): Promise<void> {
    const accessTtl = Math.max(
        tokens.expires_at - Math.floor(Date.now() / 1000) + 3600,
        60,
    );
    await env.CACHE.put(
        KV_ACCESS,
        JSON.stringify({ token: tokens.access_token, expires_at: tokens.expires_at }),
        { expirationTtl: accessTtl },
    );
    if (tokens.refresh_token) {
        await env.CACHE.put(KV_REFRESH, tokens.refresh_token, {
            expirationTtl: 60 * 60 * 24 * 365,
        });
    }
}

export function buildGeminiAuthUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
        response_type:  'code',
        client_id:      clientId,
        redirect_uri:   redirectUri,
        scope:          'openid email https://www.googleapis.com/auth/cloud-platform',
        state,
        access_type:    'offline',
        prompt:         'consent',
    });
    return `${AUTH_URL}?${params.toString()}`;
}
