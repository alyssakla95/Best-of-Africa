import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { personalizationRouter } from '../../src/routes/personalization';
import { createMockEnv } from '../mocks/env';

describe('reader preference contracts', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', personalizationRouter);
    });

    it('validates notification channels before writing', async () => {
        const prepare = vi.fn();
        const response = await app.fetch(new Request('http://localhost/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-ID': 'reader-session-1234' },
            body: JSON.stringify({ notification_preferences: { email: 'yes', push: false, reports: true } }),
        }), createMockEnv({ DB: { prepare } as unknown as D1Database }));

        expect(response.status).toBe(400);
        expect(prepare).not.toHaveBeenCalled();
    });

    it('stores and returns explicit notification preferences', async () => {
        const inserted: unknown[][] = [];
        const db = {
            prepare(sql: string) {
                const statement = {
                    bind: (...values: unknown[]) => {
                        if (/INSERT INTO user_preferences/i.test(sql)) inserted.push(values);
                        return statement;
                    },
                    first: vi.fn(async () => null),
                    run: vi.fn(async () => ({ success: true })),
                };
                return statement;
            },
        } as unknown as D1Database;
        const preferences = { email: false, push: true, reports: false };

        const response = await app.fetch(new Request('http://localhost/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Session-ID': 'reader-session-1234' },
            body: JSON.stringify({
                countries_of_interest: ['Ghana'],
                sectors_of_interest: ['energy'],
                notification_preferences: preferences,
            }),
        }), createMockEnv({ DB: db }));

        expect(response.status).toBe(201);
        expect(inserted).toHaveLength(1);
        expect(inserted[0]).toContain(JSON.stringify(preferences));
    });

    it('returns a complete default preference record', async () => {
        const response = await app.fetch(
            new Request('http://localhost/preferences'),
            createMockEnv(),
        );
        const body = await response.json() as { preferences: Record<string, unknown> };

        expect(response.status).toBe(200);
        expect(body.preferences).toMatchObject({
            countries_of_interest: [],
            sectors_of_interest: [],
            notification_preferences: { email: true, push: false, reports: true },
        });
    });
});
