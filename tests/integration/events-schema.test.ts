import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { eventsRouter } from '../../src/routes/events';
import { createMockEnv } from '../mocks/env';

describe('events production schema compatibility', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', eventsRouter);
    });

    it('queries date_start and category and returns reader compatibility aliases', async () => {
        const queries: string[] = [];
        const statement = {
            bind: vi.fn(() => statement),
            all: vi.fn(async () => ({
                results: [{
                    id: 'evt-1', title: 'Trade Forum', slug: 'trade-forum',
                    date_start: '2026-10-01', date_end: '2026-10-02',
                    location: 'Accra', country_code: 'GH', category: 'Trade',
                    status: 'upcoming', is_featured: 1, is_vip: 1,
                    description: 'A documented forum.', registration_url: 'https://example.org/register',
                }],
                success: true,
            })),
        };
        const db = {
            prepare: vi.fn((sql: string) => {
                queries.push(sql);
                return statement;
            }),
        } as unknown as D1Database;

        const response = await app.fetch(new Request('http://localhost/'), createMockEnv({ DB: db }));
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(queries[0]).toContain('date_start');
        expect(queries[0]).toContain('category');
        expect(queries[0]).toContain('ORDER BY date_start ASC');
        expect(queries[0]).not.toMatch(/\bhero_image_url\b|\bevent_type\b|ORDER BY date ASC/);
        expect(body.data[0]).toMatchObject({
            date: '2026-10-01', event_type: 'Trade', is_exclusive: true,
        });
    });

    it('reports a genuine database failure instead of a false empty schedule', async () => {
        const statement = {
            bind: vi.fn(() => statement),
            all: vi.fn(async () => { throw new Error('database unavailable'); }),
        };
        const db = { prepare: vi.fn(() => statement) } as unknown as D1Database;

        const response = await app.fetch(new Request('http://localhost/'), createMockEnv({ DB: db }));
        const body = await response.json() as any;

        expect(response.status).toBe(503);
        expect(body).toMatchObject({ success: false, error: 'events_unavailable' });
    });
});
