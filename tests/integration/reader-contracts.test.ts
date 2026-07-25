import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { membersRouter } from '../../src/routes/members';
import { systemRouter } from '../../src/routes/system';
import { authRouter } from '../../src/routes/auth-router';
import { createMockEnv } from '../mocks/env';

describe('reader-facing contracts', () => {
    it('returns the membership fields consumed by the OTP login screen', async () => {
        const env = createMockEnv({ JWT_SECRET: 'member-contract-test-secret' });
        await env.CACHE.put('member_otp:reader@example.com', JSON.stringify({
            otp: '123456',
            clientId: 'member-reader',
            tier: 'premium',
            name: 'Test Reader',
            expires_at: '2026-12-31T00:00:00.000Z',
            otp_deadline: Math.floor(Date.now() / 1000) + 600,
            attempts: 0,
        }));
        const app = new Hono();
        app.route('/members', membersRouter);

        const response = await app.fetch(new Request('http://localhost/members/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'reader@example.com', otp: '123456' }),
        }), env);
        const body = await response.json() as Record<string, unknown>;

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            ok: true,
            tier: 'premium',
            name: 'Test Reader',
            expires_at: '2026-12-31T00:00:00.000Z',
        });
        expect(body.token).toEqual(expect.any(String));
    });

    it('reports recorded 30-day page views without inventing monthly readers', async () => {
        const first = vi.fn(async () => ({
            total_articles: 14,
            page_views_30d: 320,
            countries_covered: 9,
        }));
        const prepare = vi.fn(() => ({ first }));
        const env = createMockEnv({ DB: { prepare } as unknown as D1Database });
        const app = new Hono();
        app.route('/', systemRouter);

        const response = await app.fetch(new Request('http://localhost/stats/audience'), env);
        const body = await response.json() as Record<string, unknown>;

        expect(response.status).toBe(200);
        expect(body.page_views_30d).toBe(320);
        expect(body).not.toHaveProperty('monthly_readers');
        expect(body).not.toHaveProperty('audience_breakdown');
        expect(body.methodology).toMatch(/first-party article view events/i);
    });

    it('records a real password-support request without claiming an email was sent', async () => {
        const run = vi.fn(async () => ({ success: true, meta: { changes: 1 } }));
        const prepare = vi.fn((sql: string) => {
            const statement = {
                bind: () => statement,
                first: vi.fn(async () => /FROM clients/.test(sql)
                    ? { id: 'client-reader', name: 'Test Reader' }
                    : null),
                run,
            };
            return statement;
        });
        const env = createMockEnv({ DB: { prepare } as unknown as D1Database });
        const app = new Hono();
        app.route('/auth', authRouter);

        const response = await app.fetch(new Request('http://localhost/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.8' },
            body: JSON.stringify({ email: 'READER@example.com' }),
        }), env);
        const body = await response.json() as { success: boolean; message: string };

        expect(response.status).toBe(200);
        expect(run).toHaveBeenCalledOnce();
        expect(body.success).toBe(true);
        expect(body.message).toMatch(/request has been recorded/i);
        expect(body.message).not.toMatch(/\bsent\b|reset link/i);
    });
});
