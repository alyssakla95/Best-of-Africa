import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { analyticsRouter, ReaderAnalyticsEventSchema } from '../../src/routes/analytics';
import { createMockEnv } from '../mocks/env';

describe('reader engagement evidence', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', analyticsRouter);
    });

    it('accepts only bounded first-party event fields', () => {
        expect(ReaderAnalyticsEventSchema.safeParse({
            type: 'briefing_open',
            path: '/feed',
        }).success).toBe(true);
        expect(ReaderAnalyticsEventSchema.safeParse({
            type: 'invented_metric',
            path: 'https://external.example',
        }).success).toBe(false);
        expect(ReaderAnalyticsEventSchema.safeParse({
            type: 'article_read',
            scroll_depth: 101,
        }).success).toBe(false);
    });

    it('requires a reader session before recording an event', async () => {
        const response = await app.fetch(new Request('http://localhost/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'page_view', path: '/' }),
        }), createMockEnv());

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ error: 'session_required' });
    });

    it('stores the connecting IP and a one-way user-agent fingerprint, not the raw user-agent', async () => {
        const bound: unknown[][] = [];
        const waits: Promise<unknown>[] = [];
        const db = {
            prepare() {
                const statement = {
                    bind: (...values: unknown[]) => {
                        bound.push(values);
                        return statement;
                    },
                    run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
                };
                return statement;
            },
        } as unknown as D1Database;
        const env = createMockEnv({ DB: db });
        const ctx = {
            waitUntil(promise: Promise<unknown>) { waits.push(promise); },
            passThroughOnException() {},
            props: {},
        } as unknown as ExecutionContext;

        const response = await app.fetch(new Request('http://localhost/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': 'reader-session-123',
                'CF-Connecting-IP': '203.0.113.42',
                'User-Agent': 'BOA Test Browser/1.0',
            },
            body: JSON.stringify({ type: 'briefing_open', path: '/feed' }),
        }), env, ctx);
        await Promise.all(waits);

        expect(response.status).toBe(200);
        const insert = bound.find(values => values.includes('briefing_open'));
        expect(insert).toBeTruthy();
        expect(insert).toContain('203.0.113.42');
        expect(insert).toContain('/feed');
        expect(insert).not.toContain('BOA Test Browser/1.0');
        expect(insert?.filter(value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value))).toHaveLength(2);
    });

    it('protects audience reporting and returns zeros instead of invented values', async () => {
        const db = {
            prepare(sql: string) {
                const statement = {
                    first: vi.fn(async () => {
                        if (/returning_readers_30d/i.test(sql)) return { returning_readers_30d: 0 };
                        if (/digest_subscriptions/i.test(sql)) return { active: null, added_30d: null };
                        if (/bookmarks/i.test(sql)) return { saves_30d: null, saving_readers_30d: null };
                        return {};
                    }),
                    all: vi.fn(async () => ({ results: [], success: true })),
                };
                return statement;
            },
        } as unknown as D1Database;
        const env = createMockEnv({ DB: db });

        const unauthorized = await app.fetch(new Request('http://localhost/audience'), env);
        expect(unauthorized.status).toBe(401);

        const response = await app.fetch(new Request('http://localhost/audience', {
            headers: { 'X-Admin-Key': 'test-admin-key' },
        }), env);
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(body.audience).toMatchObject({
            monthly_active_readers: 0,
            weekly_active_readers: 0,
            returning_reader_rate_pct: 0,
        });
        expect(body.habits).toMatchObject({
            briefing_opens_30d: 0,
            high_progress_rate_pct: 0,
            audio_completion_rate_pct: 0,
        });
        expect(body.distribution.email_open_rate_pct).toBeNull();
        expect(body.definitions.retention).toContain('90 days');
    });
});
