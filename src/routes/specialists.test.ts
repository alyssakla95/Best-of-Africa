import { describe, expect, it } from 'vitest';
import Stripe from 'stripe';
import { specialistsRouter } from './specialists';
import type { Env } from '../types';
import { createJWT } from '../lib/auth';

function webhookDatabase() {
    const eventIds = new Set<string>();
    return {
        prepare(sql: string) {
            let values: unknown[] = [];
            const statement = {
                bind(...args: unknown[]) {
                    values = args;
                    return statement;
                },
                async run() {
                    if (sql.includes('INSERT OR IGNORE INTO stripe_webhook_events')) {
                        const eventId = String(values[0]);
                        if (eventIds.has(eventId)) return { success: true, meta: { changes: 0 } };
                        eventIds.add(eventId);
                    }
                    return { success: true, meta: { changes: 1 } };
                },
                async first() { return null; },
                async all() { return { success: true, results: [] }; },
            };
            return statement;
        },
    } as unknown as D1Database;
}

function environment(database: D1Database, overrides: Partial<Env> = {}): Env {
    const rateStore = new Map<string, string>();
    return {
        DB: database,
        JWT_SECRET: 'test-jwt',
        STRIPE_SECRET_KEY: 'sk_test_placeholder',
        STRIPE_WEBHOOK_SECRET: 'whsec_test',
        MARKETPLACE_ENABLED: 'true',
        RATE_LIMIT: {
            get: async (key: string) => rateStore.get(key) || null,
            put: async (key: string, value: string) => { rateStore.set(key, value); },
        } as KVNamespace,
        ...overrides,
    } as Env;
}

describe('specialist Stripe webhook', () => {
    it('fails closed when the signature is invalid', async () => {
        const response = await specialistsRouter.request(
            'https://example.test/stripe/webhook',
            {
                method: 'POST',
                headers: { 'Stripe-Signature': 'invalid' },
                body: '{}',
            },
            environment(webhookDatabase()),
        );
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({ error: 'invalid_signature' });
    });

    it('verifies the raw payload and treats replayed event IDs as duplicates', async () => {
        const payload = JSON.stringify({
            id: 'evt_replay_test',
            object: 'event',
            api_version: '2025-08-27.basil',
            created: 1,
            data: { object: { id: 'obj_1', object: 'customer' } },
            livemode: false,
            pending_webhooks: 1,
            request: null,
            type: 'customer.created',
        });
        const signature = Stripe.webhooks.generateTestHeaderString({
            payload,
            secret: 'whsec_test',
            timestamp: Math.floor(Date.now() / 1000),
        });
        const env = environment(webhookDatabase());
        const request = () => specialistsRouter.request(
            'https://example.test/stripe/webhook',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Stripe-Signature': signature,
                },
                body: payload,
            },
            env,
        );
        const first = await request();
        expect(first.status).toBe(200);
        await expect(first.json()).resolves.toEqual({ received: true });
        const replay = await request();
        expect(replay.status).toBe(200);
        await expect(replay.json()).resolves.toEqual({ received: true, duplicate: true });
    });
});

describe('specialist public routes', () => {
    it('are unavailable while the rollout flag is disabled', async () => {
        const response = await specialistsRouter.request(
            'https://example.test/',
            undefined,
            environment(webhookDatabase(), { MARKETPLACE_ENABLED: 'false' }),
        );
        expect(response.status).toBe(404);
    });

    it('never returns private profile columns', async () => {
        const database = {
            prepare() {
                return {
                    all: async () => ({
                        success: true,
                        results: [{
                            id: 'p1',
                            slug: 'amina',
                            display_name: 'Amina',
                            headline: 'Market specialist',
                            biography: 'Public biography',
                            countries: '["Kenya"]',
                            sectors: '["Trade"]',
                            service_categories: '["Market entry"]',
                            languages: '["English"]',
                            credential_summary: 'Public credentials',
                            credential_links: '[]',
                            work_email: 'private@example.com',
                            screening_notes: 'private',
                        }],
                    }),
                };
            },
        } as unknown as D1Database;
        const response = await specialistsRouter.request(
            'https://example.test/',
            undefined,
            environment(database),
        );
        expect(response.status).toBe(200);
        const body = await response.json() as { data: Record<string, unknown>[] };
        expect(body.data[0]).not.toHaveProperty('work_email');
        expect(body.data[0]).not.toHaveProperty('screening_notes');
    });
});

describe('specialist invitation redemption boundaries', () => {
    const validApplication = {
        token: 'a-valid-looking-invitation-token-value',
        password: 'a long secure password',
        contact_name: 'Amina Example',
        entity_type: 'individual',
        headline: 'African market-entry and trade specialist',
        biography: 'A sufficiently detailed professional biography describing relevant work across multiple African markets.',
        countries: ['Kenya'],
        sectors: ['Trade'],
        service_categories: ['Market entry'],
        languages: ['English'],
        credential_summary: 'Publicly verifiable professional credentials and references.',
        credential_links: ['https://example.com/reference'],
        conflicts_declaration: 'No current conflicts.',
        no_sensitive_data_confirmed: true,
    };

    it.each([
        ['expired', 'issued', '2020-01-01T00:00:00.000Z'],
        ['replayed', 'redeemed', '2099-01-01T00:00:00.000Z'],
    ])('rejects an %s invitation', async (_label, status, expiresAt) => {
        const database = {
            prepare(sql: string) {
                const statement = {
                    bind() { return statement; },
                    async first() {
                        if (sql.includes('FROM specialist_invites')) {
                            return { id: 'invite-1', email: 'amina@example.com', status, expires_at: expiresAt };
                        }
                        return null;
                    },
                };
                return statement;
            },
        } as unknown as D1Database;
        const response = await specialistsRouter.request(
            'https://example.test/join',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validApplication),
            },
            environment(database),
        );
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toMatchObject({ error: 'invalid_invitation' });
    });
});

describe('proposal ownership isolation', () => {
    it('rejects an authenticated client who owns neither side of the proposal', async () => {
        const database = {
            prepare(sql: string) {
                const statement = {
                    bind() { return statement; },
                    async first() {
                        if (sql.includes('FROM clients WHERE id')) {
                            return {
                                id: 'unrelated-client',
                                name: 'Unrelated',
                                type: 'enterprise',
                                tier: 'enterprise',
                                rate_limit_per_hour: 100,
                                is_active: 1,
                                expires_at: null,
                            };
                        }
                        if (sql.includes('FROM specialist_proposals')) {
                            return {
                                id: 'proposal-1',
                                specialist_client_id: 'specialist-owner',
                                request_id: 'request-1',
                                requester_client_id: 'enterprise-owner',
                            };
                        }
                        return null;
                    },
                };
                return statement;
            },
        } as unknown as D1Database;
        const token = await createJWT('unrelated-client', 'test-jwt');
        const response = await specialistsRouter.request(
            'https://example.test/proposals/proposal-1',
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'accepted' }),
            },
            environment(database),
        );
        expect(response.status).toBe(403);
    });
});
