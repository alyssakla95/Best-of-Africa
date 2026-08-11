import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { createJWT } from '../../src/lib/auth';
import { authRouter } from '../../src/routes/auth-router';
import type { Env, Variables } from '../../src/types';
import { createMockEnv } from '../mocks/env';

const SECRET = 'auth-identity-test-secret';

function makeApp() {
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.route('/auth', authRouter);
    return app;
}

function identityDatabase(client: Record<string, unknown> | null) {
    let query = '';
    let values: unknown[] = [];
    const prepare = vi.fn((sql: string) => {
        query = sql;
        const statement = {
            bind(...args: unknown[]) {
                values = args;
                return statement;
            },
            first: vi.fn(async () => client),
        };
        return statement;
    });
    return {
        db: { prepare } as unknown as D1Database,
        prepare,
        getQuery: () => query,
        getValues: () => values,
    };
}

async function requestMe(env: Env, token: string): Promise<Response> {
    return makeApp().request('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
    }, env);
}

describe('GET /auth/me identity', () => {
    it('returns only the safe live client identity and marketplace status', async () => {
        const database = identityDatabase({
            id: 'client-1',
            name: 'Amina Diallo',
            email: 'amina@example.com',
            organization: 'Sahel Ventures',
            type: 'enterprise',
            tier: 'enterprise',
            marketplace_access_status: 'enabled',
            password_hash: 'must-not-leak',
            api_key_hash: 'must-not-leak',
        });
        const env = createMockEnv({ DB: database.db, JWT_SECRET: SECRET });
        const token = await createJWT('client-1', SECRET);

        const response = await requestMe(env, token);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({
            authenticated: true,
            client: {
                id: 'client-1',
                name: 'Amina Diallo',
                email: 'amina@example.com',
                organization: 'Sahel Ventures',
                type: 'enterprise',
                tier: 'enterprise',
                marketplace_access_status: 'enabled',
            },
        });
        expect(database.getQuery()).toMatch(/LEFT JOIN marketplace_client_access mca ON mca\.client_id = c\.id/);
        expect(database.getQuery()).toContain("COALESCE(mca.status, 'not_granted') AS marketplace_access_status");
        expect(database.getQuery()).toContain('c.is_active = 1');
        expect(database.getValues()).toEqual(['client-1']);
    });

    it('returns not_granted when the left join has no access row', async () => {
        const database = identityDatabase({
            id: 'client-2',
            name: 'Kofi Mensah',
            email: 'kofi@example.com',
            organization: null,
            type: 'partner',
            tier: 'basic',
            marketplace_access_status: 'not_granted',
        });
        const env = createMockEnv({ DB: database.db, JWT_SECRET: SECRET });
        const token = await createJWT('client-2', SECRET);

        const response = await requestMe(env, token);
        const body = await response.json() as {
            client: { marketplace_access_status: string };
        };

        expect(response.status).toBe(200);
        expect(body.client.marketplace_access_status).toBe('not_granted');
    });

    it('rejects invalid tokens and inactive or missing live accounts', async () => {
        const invalidDatabase = identityDatabase(null);
        const invalidEnv = createMockEnv({ DB: invalidDatabase.db, JWT_SECRET: SECRET });
        const invalidResponse = await requestMe(invalidEnv, 'invalid-token');

        expect(invalidResponse.status).toBe(401);
        expect(invalidDatabase.prepare).not.toHaveBeenCalled();

        const inactiveDatabase = identityDatabase(null);
        const inactiveEnv = createMockEnv({ DB: inactiveDatabase.db, JWT_SECRET: SECRET });
        const token = await createJWT('inactive-client', SECRET);
        const inactiveResponse = await requestMe(inactiveEnv, token);

        expect(inactiveResponse.status).toBe(401);
        expect(inactiveDatabase.prepare).toHaveBeenCalledOnce();
        expect(inactiveDatabase.getValues()).toEqual(['inactive-client']);
    });
});
