import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { dashboardsRouter } from '../../src/routes/dashboards';
import { createMockEnv } from '../mocks/env';

describe('GET /dashboards/continental/overview', () => {
    it('serves official economic and sector records without querying articles', async () => {
        const prepare = vi.fn(() => { throw new Error('continental overview must not query editorial tables'); });
        const env = createMockEnv({ DB: { prepare } as unknown as D1Database });
        const app = new Hono();
        app.route('/dashboards', dashboardsRouter);

        const response = await app.fetch(new Request('http://localhost/dashboards/continental/overview'), env);
        const body = await response.json() as Record<string, any>;

        expect(response.status).toBe(200);
        expect(prepare).not.toHaveBeenCalled();
        expect(body.indicators).toHaveLength(11);
        expect(body.regions).toHaveLength(5);
        expect(body.sector_performance).toHaveLength(8);
        expect(body.rankings.largest_economies).toHaveLength(8);
        expect(body.methodology).toContain('latest verified observation');
        expect(JSON.stringify(body)).not.toMatch(/total_articles|highlights|underreported|narrated_briefings|view_count|engagement/);
    });
});
