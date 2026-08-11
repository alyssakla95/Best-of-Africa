import { describe, expect, it } from 'vitest';
import { adminRouter } from './admin';
import type { Env } from '../types';

describe('marketplace screening transitions', () => {
    it('does not permit a terminal application to be approved again', async () => {
        const database = {
            prepare(sql: string) {
                const statement = {
                    bind() { return statement; },
                    async first() {
                        if (sql.includes('FROM specialist_applications WHERE id')) {
                            return {
                                id: 'application-1',
                                status: 'approved',
                                client_id: 'specialist-1',
                            };
                        }
                        return null;
                    },
                };
                return statement;
            },
        } as unknown as D1Database;
        const response = await adminRouter.request(
            'https://example.test/specialists/applications/application-1',
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': 'admin-test-key',
                },
                body: JSON.stringify({ status: 'approved' }),
            },
            { DB: database, ADMIN_API_KEY: 'admin-test-key' } as Env,
        );
        expect(response.status).toBe(409);
        await expect(response.json()).resolves.toMatchObject({
            error: 'invalid_transition',
            from: 'approved',
            to: 'approved',
        });
    });

    it('keeps screening APIs administrator-only', async () => {
        const response = await adminRouter.request(
            'https://example.test/specialists',
            undefined,
            { ADMIN_API_KEY: 'admin-test-key' } as Env,
        );
        expect(response.status).toBe(401);
    });

    it('requires a public evidence summary for elevated verification standing', async () => {
        const response = await adminRouter.request(
            'https://example.test/specialists/profiles/profile-1/standing',
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': 'admin-test-key',
                },
                body: JSON.stringify({
                    verification_level: 'verified',
                    verification_summary: '',
                    founding_cohort: true,
                    listing_fee_waived: true,
                }),
            },
            { ADMIN_API_KEY: 'admin-test-key' } as Env,
        );
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({ error: 'validation_error' });
    });

    it('automatically waives listing access for the bounded founding cohort', async () => {
        const updateValues: unknown[][] = [];
        const database = {
            prepare(sql: string) {
                const statement = {
                    bind(...values: unknown[]) {
                        if (sql.includes('UPDATE specialist_profiles SET')) updateValues.push(values);
                        return statement;
                    },
                    async first() {
                        if (sql.includes('SELECT id, client_id, founding_cohort')) {
                            return {
                                id: 'profile-1',
                                client_id: 'specialist-1',
                                founding_cohort: 0,
                                verification_level: 'boa_specialist',
                            };
                        }
                        if (sql.includes('COUNT(*) AS count FROM specialist_profiles')) return { count: 49 };
                        return null;
                    },
                    async run() {
                        return { success: true, meta: { changes: 1 } };
                    },
                };
                return statement;
            },
        } as unknown as D1Database;
        const response = await adminRouter.request(
            'https://example.test/specialists/profiles/profile-1/standing',
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Key': 'admin-test-key',
                },
                body: JSON.stringify({
                    verification_level: 'verified',
                    verification_summary: 'Reviewed professional credentials and two relevant references.',
                    founding_cohort: true,
                    listing_fee_waived: false,
                    listing_fee_waived_until: null,
                }),
            },
            { DB: database, ADMIN_API_KEY: 'admin-test-key' } as Env,
        );
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toMatchObject({
            verification_level: 'verified',
            founding_cohort: true,
            listing_fee_waived: true,
        });
        expect(updateValues[0]).toEqual(expect.arrayContaining(['verified', 1, 'profile-1']));
    });
});
