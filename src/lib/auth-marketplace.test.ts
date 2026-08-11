import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { Env, Variables } from '../types';
import {
    createJWT,
    requireMarketplaceEnterprise,
    requireSpecialist,
} from './auth';

function authDatabase(options: {
    specialistStatus?: string;
    screeningStatus?: string;
    enterpriseStatus?: string;
    enterpriseTier?: string;
}): D1Database {
    return {
        prepare(sql: string) {
            let values: unknown[] = [];
            const statement = {
                bind(...args: unknown[]) { values = args; return statement; },
                async first() {
                    if (sql.includes('FROM clients WHERE id')) {
                        return {
                            id: values[0],
                            name: 'Test',
                            type: options.specialistStatus ? 'specialist' : 'enterprise',
                            tier: options.specialistStatus ? 'specialist' : (options.enterpriseTier || 'enterprise'),
                            rate_limit_per_hour: 100,
                            is_active: 1,
                            expires_at: null,
                        };
                    }
                    if (sql.includes('FROM specialist_applications')) {
                        return options.specialistStatus ? {
                            application_status: options.specialistStatus,
                            screening_status: options.screeningStatus,
                        } : null;
                    }
                    if (sql.includes('FROM marketplace_client_access')) {
                        return options.enterpriseStatus ? {
                            status: options.enterpriseStatus,
                            type: 'enterprise',
                            tier: options.enterpriseTier || 'enterprise',
                        } : null;
                    }
                    return null;
                },
            };
            return statement;
        },
    } as unknown as D1Database;
}

async function responseFor(
    middleware: typeof requireSpecialist,
    database: D1Database,
): Promise<Response> {
    const secret = 'marketplace-test-secret';
    const token = await createJWT('client-1', secret);
    const app = new Hono<{ Bindings: Env; Variables: Variables }>();
    app.get('/', middleware, c => c.json({ ok: true, client: c.get('clientId') }));
    return app.request('https://example.test/', {
        headers: { Authorization: `Bearer ${token}` },
    }, { DB: database, JWT_SECRET: secret } as Env);
}

describe('marketplace live authorization', () => {
    it('allows only currently approved specialists', async () => {
        const approved = await responseFor(requireSpecialist, authDatabase({
            specialistStatus: 'approved',
            screeningStatus: 'approved',
        }));
        expect(approved.status).toBe(200);

        const suspended = await responseFor(requireSpecialist, authDatabase({
            specialistStatus: 'approved',
            screeningStatus: 'suspended',
        }));
        expect(suspended.status).toBe(403);
    });

    it('allows only currently enabled Enterprise clients', async () => {
        const enabled = await responseFor(requireMarketplaceEnterprise, authDatabase({
            enterpriseStatus: 'enabled',
            enterpriseTier: 'enterprise',
        }));
        expect(enabled.status).toBe(200);

        const revoked = await responseFor(requireMarketplaceEnterprise, authDatabase({
            enterpriseStatus: 'revoked',
            enterpriseTier: 'enterprise',
        }));
        expect(revoked.status).toBe(403);
    });
});
