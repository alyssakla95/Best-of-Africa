// ═══════════════════════════════════════════════════════════════════════════════
// CACHE UTILITY
// KV-based caching with Stale-While-Revalidate pattern
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

interface CacheOptions {
    /** Time-to-live in seconds */
    ttl: number;
    /** If true, serve stale content while revalidating in background */
    staleWhileRevalidate?: boolean;
}

interface CachedValue<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

/** Read a cached value without triggering its expensive producer. */
export async function getCachedValue<T>(env: Env, key: string): Promise<T | null> {
    try {
        const cached = await env.CACHE.get(`cache:${key}`, 'json') as CachedValue<T> | null;
        if (!cached) return null;
        const age = Math.floor(Date.now() / 1000) - cached.timestamp;
        return age <= cached.ttl ? cached.data : null;
    } catch (error) {
        console.error(`Cache read error for key ${key}:`, error);
        return null;
    }
}

/**
 * Generic caching wrapper for any async fetch function.
 * Uses Cloudflare KV for persistent caching.
 * 
 * @example
 * const countries = await getCached(
 *     env,
 *     'countries:list',
 *     () => fetchCountriesFromDB(env),
 *     { ttl: 21600 } // 6 hours
 * );
 */
export async function getCached<T>(
    env: Env,
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions
): Promise<T> {
    const { ttl, staleWhileRevalidate = true } = options;
    const cacheKey = `cache:${key}`;

    try {
        // Try to get from cache
        const cached = await env.CACHE.get(cacheKey, 'json') as CachedValue<T> | null;

        if (cached) {
            const age = Math.floor(Date.now() / 1000) - cached.timestamp;
            const isStale = age > cached.ttl;

            if (!isStale) {
                // Fresh cache hit
                return cached.data;
            }

            if (staleWhileRevalidate) {
                // Serve stale content immediately, revalidate in background
                // Note: We can't use waitUntil here as we don't have ExecutionContext
                // In production, you'd pass ctx and use ctx.waitUntil()
                revalidateCache(env, cacheKey, fetchFn, ttl).catch(console.error);
                return cached.data;
            }
        }

        // Cache miss or expired without SWR - fetch fresh data
        return await revalidateCache(env, cacheKey, fetchFn, ttl);

    } catch (error) {
        console.error(`Cache error for key ${key}:`, error);
        // On cache error, fall back to fresh fetch
        return fetchFn();
    }
}

/**
 * Fetch fresh data and update cache
 */
async function revalidateCache<T>(
    env: Env,
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number
): Promise<T> {
    const data = await fetchFn();

    const cacheValue: CachedValue<T> = {
        data,
        timestamp: Math.floor(Date.now() / 1000),
        ttl,
    };

    // Store in KV with expiration (TTL + buffer for SWR)
    await env.CACHE.put(cacheKey, JSON.stringify(cacheValue), {
        expirationTtl: ttl * 2, // Allow SWR window
    });

    return data;
}

/**
 * Invalidate a specific cache key
 */
export async function invalidateCache(env: Env, key: string): Promise<void> {
    await env.CACHE.delete(`cache:${key}`);
}

/**
 * Invalidate all cache keys matching a prefix
 * Note: KV list operations have limitations, use sparingly
 */
export async function invalidateCachePrefix(env: Env, prefix: string): Promise<void> {
    const list = await env.CACHE.list({ prefix: `cache:${prefix}` });
    await Promise.all(list.keys.map(k => env.CACHE.delete(k.name)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// Pre-defined Cache Keys (for consistency)
// ═══════════════════════════════════════════════════════════════════════════════

export const CACHE_KEYS = {
    // Existing keys
    // Versioned because the public country projection now excludes unverified
    // legacy portals and synthetic scores. Reusing v1 would serve the unsafe
    // shape from KV for up to the full static-cache lifetime after deployment.
    COUNTRIES_LIST: 'countries:list:v2-verified-resources',
    SECTORS_LIST: 'sectors:list',
    ARTICLES_FEATURED: 'articles:featured',
    ARTICLES_LATEST: 'articles:latest',
    DASHBOARD_SUMMARY: 'dashboard:regional-summary',
    countryStats: (code: string) => `country:${code}:stats`,
    articleRelated: (id: string) => `article:${id}:related`,

    // Search optimization keys
    searchSuggest: (q: string) => `search:suggest:${q.toLowerCase().substring(0, 20)}`,
    searchAiSummary: (q: string) => `search:ai:depth-v5:${q.toLowerCase().trim().substring(0, 50)}`,

    // Analytics dashboard keys
    analyticsDashboard: (period: string) => `analytics:dashboard:${period}`,

    // Intelligence API keys
    intelCountryReport: (code: string) => `intel:country:${code}:report:depth-v7`,
    intelSectorTrends: (id: string) => `intel:sector:${id}:trends:depth-v5`,
    intelAudienceReach: () => 'intel:audience:reach',
    countryOutlook: (code: string) => `country:${code}:outlook:depth-v6`,
    articleContext: (id: string) => `article:${id}:ai_context:depth-v7`,
    narrativeSynthesis: (code: string) => `narrative:synthesis:${code}:depth-v5`,
    sectorOutlook: (id: string) => `sector:${id}:outlook:depth-v5`,
    countryRelationships: (code: string) => `country:${code}:relationships:depth-v7`,
    countrySituation: (code: string) => `country:${code}:situation:depth-v5`,
    globalBriefing: 'home:global-briefing:depth-v5',
    intelSectorAnalysis: (id: string) => `intel:sector:${id}:analysis:depth-v5`,
    adminContentRecs: 'admin:content-recommendations:depth-v5',
    analyticsContentStrategy: 'analytics:content-strategy:depth-v5',
    marketSentiment: (code: string) => `market:sentiment:${code}:depth-v5`,
    sectorSupplyChain: (id: string) => `market:supply-chain:${id}:depth-v5`,

} as const;

export const CACHE_TTL = {
    STATIC: 21600,      // 6 hours - countries, sectors
    FREQUENT: 300,      // 5 minutes - featured articles, search suggestions
    DYNAMIC: 120,       // 2 minutes - latest articles, analytics dashboard
    DASHBOARD: 600,     // 10 minutes - dashboard summary, summaries
    INTEL: 1800,        // 30 minutes - intelligence reports
    ARCHIVE: 2592000,   // 30 days - immutable published-article enrichments
} as const;
