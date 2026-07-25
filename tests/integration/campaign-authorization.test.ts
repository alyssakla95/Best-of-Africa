import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { campaignsRouter } from '../../src/routes/campaigns';
import { createJWT } from '../../src/lib/auth';
import { createMockEnv } from '../mocks/env';

const SECRET = 'campaign-authorization-test-secret';

type RecordedQuery = {
    sql: string;
    values: unknown[];
};

function campaignDb(options: { campaign?: Record<string, unknown> | null; list?: Record<string, unknown>[] } = {}) {
    const queries: RecordedQuery[] = [];
    const db = {
        prepare(sql: string) {
            const record: RecordedQuery = { sql, values: [] };
            queries.push(record);
            const statement = {
                bind: (...values: unknown[]) => {
                    record.values = values;
                    return statement;
                },
                first: vi.fn(async () => {
                    if (/FROM clients WHERE id/.test(sql)) {
                        return {
                            id: 'client-owner',
                            name: 'Owner',
                            type: 'partner',
                            tier: 'premium',
                            rate_limit_per_hour: 100,
                            is_active: 1,
                            expires_at: null,
                        };
                    }
                    if (/FROM campaigns/.test(sql)) return options.campaign ?? null;
                    return null;
                }),
                all: vi.fn(async () => ({ results: options.list || [], success: true })),
                run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
            };
            return statement;
        },
    } as unknown as D1Database;
    return { db, queries };
}

function makeApp() {
    const app = new Hono();
    app.route('/campaigns', campaignsRouter);
    return app;
}

describe('campaign authorization', () => {
    it('rejects anonymous access before campaign data is queried', async () => {
        const prepare = vi.fn();
        const env = createMockEnv({
            DB: { prepare } as unknown as D1Database,
            JWT_SECRET: SECRET,
        });

        const response = await makeApp().fetch(new Request('http://localhost/campaigns'), env);

        expect(response.status).toBe(401);
        expect(prepare).not.toHaveBeenCalled();
    });

    it('rejects a forged bearer token before campaign data is queried', async () => {
        const prepare = vi.fn();
        const env = createMockEnv({
            DB: { prepare } as unknown as D1Database,
            JWT_SECRET: SECRET,
        });
        const valid = await createJWT('client-owner', SECRET);
        const [header, payload, signature] = valid.split('.');
        const forgedPayload = btoa(JSON.stringify({
            ...JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))),
            sub: 'client-attacker',
        })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

        const response = await makeApp().fetch(new Request('http://localhost/campaigns', {
            headers: { Authorization: `Bearer ${header}.${forgedPayload}.${signature}` },
        }), env);

        expect(response.status).toBe(401);
        expect(prepare).not.toHaveBeenCalled();
    });

    it('scopes campaign lists to the signed-in client', async () => {
        const { db, queries } = campaignDb({ list: [{ id: 'campaign-owned', client_id: 'client-owner' }] });
        const env = createMockEnv({ DB: db, JWT_SECRET: SECRET });
        const token = await createJWT('client-owner', SECRET);

        const response = await makeApp().fetch(new Request('http://localhost/campaigns', {
            headers: { Authorization: `Bearer ${token}` },
        }), env);
        const body = await response.json() as { data: Array<{ id: string }> };

        expect(response.status).toBe(200);
        expect(body.data).toEqual([
            expect.objectContaining({ id: 'campaign-owned', client_id: 'client-owner' }),
        ]);
        const listQuery = queries.find(query => /SELECT c\.\*/.test(query.sql));
        expect(listQuery?.sql).toContain('c.client_id = ?');
        expect(listQuery?.values[0]).toBe('client-owner');
    });

    it('does not disclose a campaign owned by another client', async () => {
        const { db, queries } = campaignDb({ campaign: null });
        const env = createMockEnv({ DB: db, JWT_SECRET: SECRET });
        const token = await createJWT('client-owner', SECRET);

        const response = await makeApp().fetch(new Request('http://localhost/campaigns/campaign-other', {
            headers: { Authorization: `Bearer ${token}` },
        }), env);

        expect(response.status).toBe(404);
        const lookup = queries.find(query => /SELECT c\.\*/.test(query.sql));
        expect(lookup?.sql).toContain('c.client_id = ?');
        expect(lookup?.values).toEqual(['campaign-other', 'client-owner']);
    });
});
