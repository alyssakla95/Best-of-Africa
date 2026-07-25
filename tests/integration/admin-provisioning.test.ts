import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { adminRouter } from '../../src/routes/admin';
import { createMockEnv } from '../mocks/env';

describe('admin provisioning contracts', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', adminRouter);
    });

    it('rejects malformed client records before writing to D1', async () => {
        const prepare = vi.fn();
        const env = createMockEnv({ DB: { prepare } as unknown as D1Database });

        const response = await app.fetch(new Request('http://localhost/clients', {
            method: 'POST',
            headers: { 'X-Admin-Key': 'test-admin-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'A',
                email: 'not-an-email',
                type: 'invented',
                tier: 'unlimited',
                rate_limit_per_hour: 1,
            }),
        }), env);

        expect(response.status).toBe(400);
        expect(prepare).not.toHaveBeenCalled();
    });

    it('provisions a validated client and only returns the raw key once', async () => {
        const writes: unknown[][] = [];
        const db = {
            prepare(sql: string) {
                const statement = {
                    bind: (...values: unknown[]) => {
                        if (/INSERT INTO clients/i.test(sql)) writes.push(values);
                        return statement;
                    },
                    first: vi.fn(async () => null),
                    run: vi.fn(async () => ({ success: true })),
                };
                return statement;
            },
        } as unknown as D1Database;
        const env = createMockEnv({ DB: db });

        const response = await app.fetch(new Request('http://localhost/clients', {
            method: 'POST',
            headers: { 'X-Admin-Key': 'test-admin-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Alyssa Van Klassen',
                email: 'alyssa@example.com',
                organization: 'Best of Africa',
                type: 'partner',
                tier: 'enterprise',
                rate_limit_per_hour: 2_000,
            }),
        }), env);
        const body = await response.json() as { id: string; api_key: string };

        expect(response.status).toBe(201);
        expect(body.id).toBeTruthy();
        expect(body.api_key).toMatch(/^boa_/);
        expect(writes).toHaveLength(1);
        expect(writes[0]).toEqual(expect.arrayContaining([
            'Alyssa Van Klassen',
            'alyssa@example.com',
            'Best of Africa',
            'partner',
            'enterprise',
            2_000,
        ]));
        expect(writes[0]).not.toContain(body.api_key);
    });
});
