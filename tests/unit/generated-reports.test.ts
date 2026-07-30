import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { marketIntelRouter } from '../../src/routes/market-intel';
import type { Env } from '../../src/types';

const storedMetadata = JSON.stringify({
    country_code: 'GH',
    subtitle: 'Market Intelligence Report | West Africa',
    generated_at: '2026-07-30T01:00:00.000Z',
    sections: [{ title: 'Executive Summary', content: 'Source-linked evidence.' }],
});

function createApp() {
    let sql = '';
    const statement = {
        bind: () => statement,
        all: async () => ({
            results: [{
                id: 'report-1',
                type: 'country_brief',
                title: 'Ghana Country Brief',
                metadata: storedMetadata,
                created_at: '2026-07-30 01:00:00',
            }],
        }),
        first: async () => ({
            id: 'report-1',
            type: 'country_brief',
            title: 'Ghana Country Brief',
            metadata: storedMetadata,
            created_at: '2026-07-30 01:00:00',
        }),
    };
    const env = {
        DB: {
            prepare: (value: string) => {
                sql = value;
                return statement;
            },
        },
    } as unknown as Env;
    const app = new Hono<{ Bindings: Env }>();
    app.route('/market-intel', marketIntelRouter);
    return { app, env, getSql: () => sql };
}

describe('generated evidence report routes', () => {
    it('serves a complete extended report from the active market router', async () => {
        const { app, env } = createApp();
        const response = await app.fetch(
            new Request('http://localhost/market-intel/generated-reports/report-1'),
            env,
        );

        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.data.sections).toEqual([
            { title: 'Executive Summary', content: 'Source-linked evidence.' },
        ]);
        expect(body.data.metadata.country_code).toBe('GH');
        expect(body.data.generated_at).toBe('2026-07-30T01:00:00.000Z');
    });

    it('keeps extended bodies out of the wider archive response', async () => {
        const { app, env, getSql } = createApp();
        const response = await app.fetch(
            new Request('http://localhost/market-intel/generated-reports'),
            env,
        );

        expect(response.status).toBe(200);
        const body = await response.json() as any;
        expect(body.data).toHaveLength(1);
        expect(body.data[0].metadata.country_code).toBe('GH');
        expect(body.data[0].metadata.sections).toBeUndefined();
        expect(getSql()).toContain('LIMIT 100');
    });
});
