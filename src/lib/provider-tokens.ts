// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER TOKEN MANAGER
// KV-based storage for bootstrapped provider API keys / tokens.
// Enables runtime key injection without redeploying wrangler secrets.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

const KV_PREFIX = 'provider:bootstrap:';

export async function getProviderToken(env: Env, provider: string): Promise<string | null> {
    try {
        const raw = await env.CACHE.get(`${KV_PREFIX}${provider}`);
        if (!raw) return null;
        const { token, expires_at } = JSON.parse(raw) as { token: string; expires_at: number | null };
        if (expires_at && Date.now() / 1000 > expires_at) return null;
        return token;
    } catch {
        return null;
    }
}

export async function storeProviderToken(
    env: Env,
    provider: string,
    token: string,
    expiresInSeconds?: number,
): Promise<{ expires_at: string | null }> {
    const expiresAt = expiresInSeconds
        ? Math.floor(Date.now() / 1000) + expiresInSeconds
        : null;

    const ttl = expiresInSeconds
        ? expiresInSeconds + 3600
        : 60 * 60 * 24 * 365;

    await env.CACHE.put(
        `${KV_PREFIX}${provider}`,
        JSON.stringify({ token, expires_at: expiresAt }),
        { expirationTtl: ttl },
    );

    return { expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null };
}

export async function clearProviderToken(env: Env, provider: string): Promise<void> {
    await env.CACHE.delete(`${KV_PREFIX}${provider}`);
}
