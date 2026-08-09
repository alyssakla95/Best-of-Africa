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

    it('returns a balanced public briefing when a session has no saved preferences', async () => {
        const rows = [
            { id: '1', country_code: 'GH', sector_id: 'energy', source_title: 'World Bank', source_quality_tier: 4, published_at: '2026-08-08' },
            { id: '2', country_code: 'KE', sector_id: 'finance', source_title: 'IMF', source_quality_tier: 4, published_at: '2026-08-07' },
        ];
        const db = {
            prepare(sql: string) {
                const statement = {
                    bind: () => statement,
                    first: vi.fn(async () => null),
                    all: vi.fn(async () => ({ results: /FROM articles a/i.test(sql) ? rows : [] })),
                };
                return statement;
            },
        } as unknown as D1Database;

        const response = await app.fetch(new Request('http://localhost/feed/curated', {
            headers: { 'X-Session-ID': 'reader-session-without-preferences' },
        }), createMockEnv({ DB: db }));
        const body = await response.json() as { data: Array<{ id: string }>; personalized: boolean; feed_summary: string };

        expect(response.status).toBe(200);
        expect(body.personalized).toBe(false);
        expect(body.data.map(item => item.id)).toEqual(['1', '2']);
        expect(body.feed_summary).toContain('Choose country and sector interests');
    });
});
