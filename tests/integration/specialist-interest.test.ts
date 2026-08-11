import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { adminRouter } from '../../src/routes/admin';
import { servicesRouter, SpecialistInterestSchema } from '../../src/routes/services';
import { createMockEnv } from '../mocks/env';

const validInterest = {
    contact_name: 'Amina Mensah',
    work_email: 'Amina@Example.com',
    entity_type: 'individual' as const,
    organization: 'Independent Advisory',
    role_title: 'Market-entry adviser',
    countries: ['Ghana', 'Kenya'],
    sectors: ['Logistics'],
    service_categories: ['Market entry'],
    languages: ['English', 'French'],
    interest_summary: 'I help strategy teams verify logistics partners and operating constraints.',
    no_sensitive_data_confirmed: true as const,
};

describe('specialist interest registry contracts', () => {
    let services: Hono;
    let admin: Hono;

    beforeEach(() => {
        services = new Hono();
        services.route('/', servicesRouter);
        admin = new Hono();
        admin.route('/', adminRouter);
    });

    it('requires useful coverage fields and the no-sensitive-data confirmation', () => {
        expect(SpecialistInterestSchema.safeParse({
            ...validInterest,
            countries: [],
        }).success).toBe(false);
        expect(SpecialistInterestSchema.safeParse({
            ...validInterest,
            no_sensitive_data_confirmed: false,
        }).success).toBe(false);
    });

    it('records interest without creating an account or application', async () => {
        const queries: string[] = [];
        const writes: unknown[][] = [];
        const env = createMockEnv({
            DB: {
                prepare: vi.fn((sql: string) => {
                    queries.push(sql);
                    const statement = {
                        bind: vi.fn((...values: unknown[]) => {
                            writes.push(values);
                            return statement;
                        }),
                        first: vi.fn(async () => null),
                        run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
                    };
                    return statement;
                }),
            } as unknown as D1Database,
        });

        const response = await services.fetch(new Request('http://localhost/specialist-interest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.10' },
            body: JSON.stringify(validInterest),
        }), env);
        const body = await response.json() as Record<string, unknown>;

        expect(response.status).toBe(202);
        expect(body).toEqual({
            success: true,
            status: 'registered',
            message: 'Your interest has been registered for consideration. Selected specialists may be invited to complete screening.',
        });
        expect(queries.some(sql => sql.includes('INSERT INTO specialist_interest_registrations'))).toBe(true);
        expect(queries.some(sql => /INSERT INTO (clients|specialist_applications)/.test(sql))).toBe(false);
        expect(writes.flat()).toContain('amina@example.com');
        expect(body).not.toHaveProperty('id');
        expect(body).not.toHaveProperty('token');
        expect(String(body.message)).not.toMatch(/guarantee|approved|accepted/i);
    });

    it('returns the same generic response for an existing email without another insert', async () => {
        const queries: string[] = [];
        const env = createMockEnv({
            DB: {
                prepare: vi.fn((sql: string) => {
                    queries.push(sql);
                    const statement = {
                        bind: vi.fn(() => statement),
                        first: vi.fn(async () => ({ found: 1 })),
                        run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
                    };
                    return statement;
                }),
            } as unknown as D1Database,
        });
        const response = await services.fetch(new Request('http://localhost/specialist-interest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.11' },
            body: JSON.stringify(validInterest),
        }), env);

        expect(response.status).toBe(202);
        expect(await response.json()).toMatchObject({ success: true, status: 'registered' });
        expect(queries.some(sql => sql.includes('INSERT INTO specialist_interest_registrations'))).toBe(false);
    });

    it('keeps review transitions administrator-only', async () => {
        const id = crypto.randomUUID();
        const env = createMockEnv({
            DB: {
                prepare: vi.fn(() => {
                    const statement = {
                        bind: vi.fn(() => statement),
                        first: vi.fn(async () => ({ id, status: 'new' })),
                        run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
                    };
                    return statement;
                }),
            } as unknown as D1Database,
        });
        const request = (headers: Record<string, string>) => admin.fetch(new Request(`http://localhost/specialists/interest/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ status: 'reviewing', qualification_notes: 'Relevant to current logistics demand.' }),
        }), env);

        expect((await request({})).status).toBe(401);
        const response = await request({ 'X-Admin-Key': 'test-admin-key' });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ success: true, id, status: 'reviewing' });
    });
});
