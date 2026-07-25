import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { marketIntelRouter } from '../../src/routes/market-intel';
import { createMockEnv } from '../mocks/env';

describe('supporter reporting ledger', () => {
    it('describes verified publication activity without synthetic founder voice', async () => {
        const db = {
            prepare: vi.fn(() => ({
                all: vi.fn(async () => ({
                    results: [
                        {
                            title: 'Ghana opens verified energy procurement record',
                            country_name: 'Ghana',
                            sector_name: 'Energy',
                            source_name: 'Energy Commission Ghana',
                            published_at: '2026-07-25 14:00:00',
                        },
                        {
                            title: 'Nigeria publishes corridor financing terms',
                            country_name: 'Nigeria',
                            sector_name: 'Infrastructure',
                            source_name: 'Federal Ministry of Finance',
                            published_at: '2026-07-24 10:00:00',
                        },
                    ],
                })),
            })),
        } as unknown as D1Database;
        const app = new Hono();
        app.route('/', marketIntelRouter);

        const response = await app.fetch(
            new Request('http://localhost/founder-log'),
            createMockEnv({ DB: db }),
        );
        const body = await response.json() as Array<{ tag: string; title: string; body: string }>;

        expect(response.status).toBe(200);
        expect(body).toHaveLength(3);
        expect(body[0]).toMatchObject({
            tag: 'Publication ledger',
            title: expect.stringContaining('2 source-reviewed records'),
        });
        expect(body[1].body).toContain('Ghana (1)');
        expect(body[2].body).toContain('Energy Commission Ghana (1)');
        expect(JSON.stringify(body)).not.toMatch(/what i(?:'|’)m working on|tired but passionate|as the founder/i);
    });
});
