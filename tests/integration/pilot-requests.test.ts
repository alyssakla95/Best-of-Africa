import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { adminRouter } from '../../src/routes/admin';
import { PilotRequestSchema, servicesRouter } from '../../src/routes/services';
import { createMockEnv } from '../mocks/env';

const validApplication = {
    contact_name: 'Amina Mensah',
    work_email: 'amina@example.com',
    organization: 'Example Trade Group',
    role_title: 'Strategy Director',
    organization_type: 'corporate' as const,
    target_sector: 'Regional logistics',
    candidate_countries: ['Ghana', 'Kenya', 'Rwanda'],
    decision_question: 'Which candidate market should receive our next-stage entry diligence?',
    decision_deadline: '2026-10-30',
    current_research_process: 'Our strategy team reconciles public reports and external adviser notes manually.',
    success_measure: 'Reduce reconciliation time and document every unresolved material risk before committee review.',
    no_sensitive_data_confirmed: true as const,
};

describe('market-entry pilot application contracts', () => {
    let services: Hono;
    let admin: Hono;

    beforeEach(() => {
        services = new Hono();
        services.route('/', servicesRouter);
        admin = new Hono();
        admin.route('/', adminRouter);
    });

    it('requires an explicit no-sensitive-data confirmation', () => {
        expect(PilotRequestSchema.safeParse({
            ...validApplication,
            no_sensitive_data_confirmed: false,
        }).success).toBe(false);
    });

    it('limits a pilot to three candidate markets', () => {
        expect(PilotRequestSchema.safeParse({
            ...validApplication,
            candidate_countries: ['Ghana', 'Kenya', 'Rwanda', 'Nigeria'],
        }).success).toBe(false);
    });

    it('records a validated application without generating or promising an outcome', async () => {
        const writes: unknown[][] = [];
        const statement = {
            bind: vi.fn((...values: unknown[]) => {
                writes.push(values);
                return statement;
            }),
            run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
        };
        const env = createMockEnv({
            DB: { prepare: vi.fn(() => statement) } as unknown as D1Database,
        });

        const response = await services.fetch(new Request('http://localhost/pilot-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' },
            body: JSON.stringify(validApplication),
        }), env);
        const body = await response.json() as Record<string, unknown>;

        expect(response.status).toBe(201);
        expect(body).toMatchObject({ success: true, status: 'new', message: 'Application recorded for operator review.' });
        expect(body.id).toBeTruthy();
        expect(writes).toHaveLength(1);
        expect(writes[0]).toEqual(expect.arrayContaining([
            'Amina Mensah',
            'Example Trade Group',
            JSON.stringify(['Ghana', 'Kenya', 'Rwanda']),
        ]));
        expect(JSON.stringify(body)).not.toMatch(/guarantee|accepted|approved|generated/i);
    });

    it('protects and validates qualification status updates', async () => {
        const id = crypto.randomUUID();
        const statement = {
            bind: vi.fn(() => statement),
            run: vi.fn(async () => ({ success: true, meta: { changes: 1 } })),
        };
        const env = createMockEnv({
            DB: { prepare: vi.fn(() => statement) } as unknown as D1Database,
        });
        const request = (headers: Record<string, string>, status: string) => admin.fetch(new Request(`http://localhost/pilot-requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({ status, qualification_notes: 'Decision scope is specific enough for operator follow-up.' }),
        }), env);

        expect((await request({}, 'qualified')).status).toBe(401);
        expect((await request({ 'X-Admin-Key': 'test-admin-key' }, 'invented')).status).toBe(400);
        const response = await request({ 'X-Admin-Key': 'test-admin-key' }, 'qualified');
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ success: true, id, status: 'qualified' });
    });
});
