import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { notificationsRouter } from '../../src/routes/notifications';
import { createMockEnv } from '../mocks/env';

describe('reader notifications', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', notificationsRouter);
    });

    it('returns source-linked alerts for the requesting session', async () => {
        const db = {
            prepare() {
                const statement = {
                    bind: () => statement,
                    all: vi.fn(async () => ({
                        results: [{
                            notification_id: '4e9a8986-b2e9-4d4d-b404-b95459cc41d2',
                            created_at: '2026-07-25 23:00:00',
                            id: 'article-1',
                            slug: 'verified-corridor-update',
                            title: 'Verified corridor update',
                            summary: 'New official evidence was added to this market record.',
                            country_code: 'NG',
                            country_name: 'Nigeria',
                            sector_id: 'infrastructure',
                            sector_name: 'Infrastructure',
                            hero_image_url: null,
                        }],
                    })),
                };
                return statement;
            },
        } as unknown as D1Database;

        const response = await app.fetch(new Request('http://localhost/', {
            headers: { 'X-Session-ID': 'reader-session-1234' },
        }), createMockEnv({ DB: db }));
        const body = await response.json() as { data: Array<Record<string, unknown>> };

        expect(response.status).toBe(200);
        expect(body.data).toEqual([expect.objectContaining({
            id: '4e9a8986-b2e9-4d4d-b404-b95459cc41d2',
            title: 'Verified corridor update',
            article_slug: 'verified-corridor-update',
            is_read: false,
        })]);
    });

    it('marks only the requesting session notifications as read', async () => {
        const binds: unknown[][] = [];
        const run = vi.fn(async () => ({ success: true }));
        const db = {
            prepare() {
                const statement = {
                    bind: (...values: unknown[]) => {
                        binds.push(values);
                        return statement;
                    },
                    run,
                };
                return statement;
            },
        } as unknown as D1Database;
        const notificationId = '4e9a8986-b2e9-4d4d-b404-b95459cc41d2';

        const response = await app.fetch(new Request('http://localhost/read', {
            method: 'POST',
            headers: { 'X-Session-ID': 'reader-session-1234', 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [notificationId] }),
        }), createMockEnv({ DB: db }));

        expect(response.status).toBe(200);
        expect(run).toHaveBeenCalledOnce();
        expect(binds).toContainEqual([notificationId, 'reader-session-1234']);
    });

    it('rejects missing or malformed session identifiers', async () => {
        const response = await app.fetch(new Request('http://localhost/'), createMockEnv());
        expect(response.status).toBe(400);
    });
});
