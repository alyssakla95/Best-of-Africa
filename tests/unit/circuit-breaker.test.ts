// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER UNIT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from 'vitest';
import {
    withCircuitBreaker,
    resetCircuitBreaker,
    getCircuitBreakerStatus,
    type CircuitState,
} from '../../src/lib/circuit-breaker';
import { createMockEnv } from '../mocks/env';

describe('Circuit Breaker', () => {
    let env: ReturnType<typeof createMockEnv>;

    beforeEach(() => {
        env = createMockEnv();
    });

    describe('withCircuitBreaker', () => {
        it('should execute operation successfully in CLOSED state', async () => {
            const operation = () => Promise.resolve('success');
            const result = await withCircuitBreaker(env, 'test-service', operation);
            expect(result).toBe('success');
        });

        it('should track failures and open circuit after threshold', async () => {
            const operation = () => Promise.reject(new Error('Service down'));
            
            // Execute multiple failing operations
            for (let i = 0; i < 5; i++) {
                try {
                    await withCircuitBreaker(env, 'failing-service', operation, {
                        failureThreshold: 3,
                    });
                } catch {
                    // Expected to fail
                }
            }

            // Circuit should be OPEN now
            const status = await getCircuitBreakerStatus(env, 'failing-service');
            expect(status.state).toBe('OPEN');
        });

        it('should block requests when circuit is OPEN', async () => {
            // Pre-set circuit to OPEN state
            await env.CACHE.put('cb:blocked-service', JSON.stringify({
                state: 'OPEN' as CircuitState,
                failures: 5,
                lastFailureTime: Date.now(),
            }));

            const operation = () => Promise.resolve('should not execute');
            
            await expect(
                withCircuitBreaker(env, 'blocked-service', operation)
            ).rejects.toThrow('Circuit breaker for blocked-service is OPEN');
        });

        it('should transition from OPEN to HALF_OPEN after timeout', async () => {
            // Set circuit to OPEN with expired timeout
            await env.CACHE.put('cb:recovery-service', JSON.stringify({
                state: 'OPEN' as CircuitState,
                failures: 5,
                lastFailureTime: Date.now() - 31000, // 31 seconds ago (past 30s default timeout)
            }));

            const operation = () => Promise.resolve('recovered');
            const result = await withCircuitBreaker(env, 'recovery-service', operation);
            
            expect(result).toBe('recovered');
            
            // Circuit should be CLOSED after success
            const status = await getCircuitBreakerStatus(env, 'recovery-service');
            expect(status.state).toBe('CLOSED');
        });

        it('should reset failure count on successful operation', async () => {
            // Set some failures
            await env.CACHE.put('cb:reset-service', JSON.stringify({
                state: 'CLOSED' as CircuitState,
                failures: 2,
                lastFailureTime: Date.now(),
            }));

            const operation = () => Promise.resolve('success');
            await withCircuitBreaker(env, 'reset-service', operation);

            const status = await getCircuitBreakerStatus(env, 'reset-service');
            expect(status.failures).toBe(0);
        });

        it('should use custom options when provided', async () => {
            const operation = () => Promise.reject(new Error('fail'));
            
            // With lower threshold
            try {
                await withCircuitBreaker(env, 'custom-service', operation, {
                    failureThreshold: 1,
                    resetTimeout: 1000,
                });
            } catch {
                // Expected
            }

            const status = await getCircuitBreakerStatus(env, 'custom-service');
            expect(status.state).toBe('OPEN');
        });
    });

    describe('resetCircuitBreaker', () => {
        it('should reset circuit state to CLOSED', async () => {
            // Set to OPEN
            await env.CACHE.put('cb:manual-reset', JSON.stringify({
                state: 'OPEN' as CircuitState,
                failures: 10,
                lastFailureTime: Date.now(),
            }));

            await resetCircuitBreaker(env, 'manual-reset');

            const status = await getCircuitBreakerStatus(env, 'manual-reset');
            expect(status.state).toBe('CLOSED');
            expect(status.failures).toBe(0);
        });
    });

    describe('getCircuitBreakerStatus', () => {
        it('should return default status for non-existent circuit', async () => {
            const status = await getCircuitBreakerStatus(env, 'new-circuit');
            expect(status.state).toBe('CLOSED');
            expect(status.failures).toBe(0);
        });

        it('should return current status for existing circuit', async () => {
            await env.CACHE.put('cb:existing', JSON.stringify({
                state: 'OPEN' as CircuitState,
                failures: 3,
                lastFailureTime: Date.now(),
            }));

            const status = await getCircuitBreakerStatus(env, 'existing');
            expect(status.state).toBe('OPEN');
            expect(status.failures).toBe(3);
        });
    });
});
