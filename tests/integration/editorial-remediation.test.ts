import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { adminRouter } from '../../src/routes/admin';
import { createMockEnv } from '../mocks/env';

describe('legacy editorial remediation', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', adminRouter);
    });

    it('keeps the preview read-only and separates objective quarantine from review-only signals', async () => {
        const queries: string[] = [];
        const db = {
            prepare(sql: string) {
                queries.push(sql);
                const statement = {
                    first: vi.fn(async () => ({
                        published_total: 31783, unaudited: 31783,
                        missing_source: 132, short_content: 8596,
                    })),
                    all: vi.fn(async () => ({ results: [{ id: 'unsourced-1' }], success: true })),
                };
                return statement;
            },
        } as unknown as D1Database;
        const env = createMockEnv({ DB: db });

        const response = await app.fetch(new Request('http://localhost/editorial/remediation-preview', {
            headers: { 'X-Admin-Key': 'test-admin-key' },
        }), env);
        const body = await response.json() as any;

        expect(response.status).toBe(200);
        expect(body.data).toMatchObject({
            automatic_quarantine_rule: 'missing_source',
            automatic_quarantine_candidates: 132,
            review_only: { short_content: 8596 },
        });
        expect(queries.every(sql => !/\bUPDATE\b|\bINSERT\b|\bDELETE\b/i.test(sql))).toBe(true);
    });

    it('requires explicit confirmation and rejects subjective automatic rules', async () => {
        const prepare = vi.fn();
        const batch = vi.fn();
        const env = createMockEnv({ DB: { prepare, batch } as unknown as D1Database });

        const unsupported = await app.fetch(new Request('http://localhost/editorial/remediation/quarantine', {
            method: 'POST',
            headers: { 'X-Admin-Key': 'test-admin-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({ rule: 'short_content', confirm: true }),
        }), env);
        const unconfirmed = await app.fetch(new Request('http://localhost/editorial/remediation/quarantine', {
            method: 'POST',
            headers: { 'X-Admin-Key': 'test-admin-key', 'Content-Type': 'application/json' },
            body: JSON.stringify({ rule: 'missing_source' }),
        }), env);

        expect(unsupported.status).toBe(400);
        expect(unconfirmed.status).toBe(400);
        expect(prepare).not.toHaveBeenCalled();
        expect(batch).not.toHaveBeenCalled();
    });
});
