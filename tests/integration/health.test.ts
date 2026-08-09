// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { systemRouter } from '../../src/routes/system';
import { createMockEnv } from '../mocks/env';

describe('Health Check Endpoints', () => {
    let app: Hono;
    let env: ReturnType<typeof createMockEnv>;

    beforeAll(() => {
        app = new Hono<{ Bindings: typeof env }>();
        app.route('/', systemRouter);
        env = createMockEnv();
    });

    describe('GET /health', () => {
        it('should return basic health status', async () => {
            const req = new Request('http://localhost/health');
            const res = await app.fetch(req, env);

            expect(res.status).toBe(200);
            
            const body = await res.json();
            expect(body.status).toBe('ok');
            expect(body.timestamp).toBeDefined();
            expect(body.version).toBeDefined();
            expect(body.environment).toBeDefined();
        });
    });

    describe('GET /health/deep', () => {
        it('should return detailed health status', async () => {
            const req = new Request('http://localhost/health/deep');
            const res = await app.fetch(req, env);

            const body = await res.json();
            // Degraded states must surface as 503 so external monitors notice.
            expect(res.status).toBe(body.status === 'healthy' ? 200 : 503);
            expect(body.status).toBeDefined();
            expect(body.timestamp).toBeDefined();
            expect(body.version).toBeDefined();
            expect(body.response_time_ms).toBeDefined();
            expect(Array.isArray(body.checks)).toBe(true);

            // Verify all expected checks are present
            const checkNames = body.checks.map((c: { name: string }) => c.name);
            expect(checkNames).toContain('database');
            expect(checkNames).toContain('kv_cache');
            expect(checkNames).toContain('rate_limit');
            expect(checkNames).toContain('vectorize');
            expect(checkNames).toContain('editorial_generation');
            expect(checkNames).toContain('durable_objects');

            // Verify check structure
            for (const check of body.checks) {
                expect(check.name).toBeDefined();
                expect(check.status).toMatch(/^(healthy|degraded|unhealthy)$/);
                expect(check.responseTimeMs).toBeDefined();
            }
        });

        it('should return unhealthy status when database fails', async () => {
            // Create env with failing database
            // The health route calls prepare(sql).first() directly (no bind).
            const failingStatement = {
                bind: () => failingStatement,
                first: () => Promise.reject(new Error('DB Connection Failed')),
                all: () => Promise.reject(new Error('DB Connection Failed')),
                run: () => Promise.reject(new Error('DB Connection Failed')),
            };
            const failingEnv = createMockEnv({
                DB: { prepare: () => failingStatement } as unknown as D1Database,
            });

            const req = new Request('http://localhost/health/deep');
            const res = await app.fetch(req, failingEnv);

            expect(res.status).toBe(503);
            
            const body = await res.json();
            expect(body.status).toBe('unhealthy');
            
            const dbCheck = body.checks.find((c: { name: string }) => c.name === 'database');
            expect(dbCheck.status).toBe('unhealthy');
            expect(dbCheck.message).toContain('DB Connection Failed');
        });
    });

    describe('GET /health/ready', () => {
        it('should return ready true when DB is accessible', async () => {
            const req = new Request('http://localhost/health/ready');
            const res = await app.fetch(req, env);

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.ready).toBe(true);
        });

        it('should return ready false when DB is not accessible', async () => {
            const failingEnv = createMockEnv({
                DB: {
                    prepare: () => ({
                        bind: () => ({
                            first: () => Promise.reject(new Error('DB Down')),
                        }),
                    }),
                } as unknown as D1Database,
            });

            const req = new Request('http://localhost/health/ready');
            const res = await app.fetch(req, failingEnv);

            expect(res.status).toBe(503);
            const body = await res.json();
            expect(body.ready).toBe(false);
        });
    });

    describe('GET /health/live', () => {
        it('should always return alive true', async () => {
            const req = new Request('http://localhost/health/live');
            const res = await app.fetch(req, env);

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.alive).toBe(true);
        });
    });

    describe('GET /status', () => {
        it('should return system status', async () => {
            const req = new Request('http://localhost/status');
            const res = await app.fetch(req, env);

            expect(res.status).toBe(200);
            
            const body = await res.json();
            expect(body.status).toMatch(/^(operational|degraded)$/);
            expect(body.version).toBeDefined();
            expect(body.services).toBeDefined();
            expect(body.services.database).toBeDefined();
            expect(body.services.api).toBe('ok');
            expect(body.response_time_ms).toBeDefined();
            expect(body.timestamp).toBeDefined();
        });
    });
});
