// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER UTILITY
// Distributed fault tolerance using Cloudflare KV
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

/**
 * Circuit breaker states:
 * - CLOSED: Normal operation, requests flow through.
 * - OPEN: Failure threshold reached, requests blocked immediately.
 * - HALF_OPEN: Trial period, allows a single request to test recovery.
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
    /** Number of failures before tripping the circuit */
    failureThreshold: number;
    /** Time in milliseconds to wait before attempting recovery */
    resetTimeout: number;
    /** Service name for identification in KV */
    serviceName: string;
}

interface CircuitBreakerData {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
}

const DEFAULT_OPTIONS: Omit<CircuitBreakerOptions, 'serviceName'> = {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
};

/**
 * Execution wrapper with Circuit Breaker pattern.
 * Prevents cascading failures by "tripping" when a service fails repeatedly.
 * 
 * @example
 * const data = await withCircuitBreaker(
 *     env,
 *     'news-api',
 *     () => fetchFromNewsApi(),
 *     { failureThreshold: 3 }
 * );
 */
export async function withCircuitBreaker<T>(
    env: Env,
    serviceName: string,
    operation: () => Promise<T>,
    options?: Partial<Omit<CircuitBreakerOptions, 'serviceName'>>
): Promise<T> {
    const opts: CircuitBreakerOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        serviceName,
    };

    const key = `cb:${opts.serviceName}`;
    
    // 1. Get current state from KV
    let data = await env.CACHE.get(key, 'json') as CircuitBreakerData | null;

    if (!data) {
        data = { state: 'CLOSED', failures: 0, lastFailureTime: 0 };
    }

    // 2. Handle OPEN state
    if (data.state === 'OPEN') {
        const now = Date.now();
        if (now - data.lastFailureTime > opts.resetTimeout) {
            // Transition to HALF_OPEN for a trial run
            data.state = 'HALF_OPEN';
            // We don't necessarily need to persist HALF_OPEN immediately, 
            // but doing so helps with distributed visibility.
            await env.CACHE.put(key, JSON.stringify(data));
        } else {
            const remaining = Math.ceil((opts.resetTimeout - (now - data.lastFailureTime)) / 1000);
            throw new Error(`Circuit breaker for ${opts.serviceName} is OPEN. Retrying in ${remaining}s`);
        }
    }

    // 3. Execute operation
    try {
        const result = await operation();

        // SUCCESS: clear the state AND any accumulated failure count. Only
        // resetting on non-CLOSED states let intermittent failures creep
        // toward the trip threshold forever — two flakes on Monday plus three
        // on Friday opened the breaker despite thousands of successes between.
        if (data.state !== 'CLOSED' || data.failures > 0) {
            data = { state: 'CLOSED', failures: 0, lastFailureTime: 0 };
            await env.CACHE.put(key, JSON.stringify(data));
        }

        return result;

    } catch (error) {
        // FAILURE: Track and trip if threshold reached
        data.failures++;
        data.lastFailureTime = Date.now();

        if (data.state === 'HALF_OPEN' || data.failures >= opts.failureThreshold) {
            data.state = 'OPEN';
        }

        // Persistent failure state
        await env.CACHE.put(key, JSON.stringify(data));

        throw error;
    }
}

/**
 * Manually reset a circuit breaker state
 */
export async function resetCircuitBreaker(env: Env, serviceName: string): Promise<void> {
    await env.CACHE.delete(`cb:${serviceName}`);
}

/**
 * Get the current status of a circuit breaker
 */
export async function getCircuitBreakerStatus(env: Env, serviceName: string): Promise<CircuitBreakerData> {
    const data = await env.CACHE.get(`cb:${serviceName}`, 'json') as CircuitBreakerData | null;
    return data || { state: 'CLOSED', failures: 0, lastFailureTime: 0 };
}
