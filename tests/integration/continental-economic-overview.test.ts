import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { dashboardsRouter } from '../../src/routes/dashboards';
import { createMockEnv } from '../mocks/env';
import { CONTINENTAL_WDI_SNAPSHOT } from '../../src/data/continental-wdi-snapshot';
import { getSectorPerformanceCache } from '../../src/lib/sector-performance';

async function seedFreshOfficialCaches(env: ReturnType<typeof createMockEnv>) {
    await env.CACHE.put('continental:economy:wdi:v1', JSON.stringify({ ...CONTINENTAL_WDI_SNAPSHOT, retrieved_at: new Date().toISOString() }));
    const sector = await getSectorPerformanceCache(env);
    await env.CACHE.put('market-intel:sector-performance:wdi:v2', JSON.stringify({ ...sector, retrieved_at: new Date().toISOString() }));
}

describe('GET /dashboards/continental/overview', () => {
    it('keeps official economic records separate while returning real narrated briefings', async () => {
        const briefing = {
            id: 'article-1',
            slug: 'regional-trade-update',
            title: 'Regional trade update',
            summary: 'A source-linked briefing.',
            audio_url: 'https://media.example/audio.mp3',
            audio_duration_seconds: 420,
            published_at: '2026-07-25T10:00:00Z',
            country_code: 'KE',
            source_title: 'Reuters',
            source_quality_tier: 4,
            country_name: 'Kenya',
            sector_name: 'Trade',
        };
        const prepare = vi.fn((sql: string) => ({
            all: vi.fn().mockResolvedValue({
                results: sql.includes('FROM articles a') ? [briefing]
                    : sql.includes('FROM countries c') ? [{ country_code: 'KE', country_name: 'Kenya', region: 'East', records_30d: 1, latest_record_at: briefing.published_at }]
                    : [{ sector_id: 'finance', sector_name: 'Finance & Investment', records_30d: 1, countries_30d: 1, latest_record_at: briefing.published_at }],
                success: true,
            }),
        }));
        const env = createMockEnv({ DB: { prepare } as unknown as D1Database });
        await seedFreshOfficialCaches(env);
        const app = new Hono();
        app.route('/dashboards', dashboardsRouter);

        const response = await app.fetch(new Request('http://localhost/dashboards/continental/overview'), env);
        const body = await response.json() as Record<string, any>;

        expect(response.status).toBe(200);
        expect(prepare).toHaveBeenCalledTimes(3);
        expect(body.indicators).toHaveLength(11);
        expect(body.regions).toHaveLength(5);
        expect(body.sector_performance).toHaveLength(8);
        expect(body.narrated_briefings).toEqual([briefing]);
        expect(body.briefing_scope).toMatchObject({ countries_considered: 1, sectors_considered: 1, countries_with_records: 1, sectors_with_records: 1 });
        expect(body.rankings.largest_economies).toHaveLength(8);
        expect(body.methodology).toContain('latest verified observation');
        expect(JSON.stringify(body)).not.toMatch(/total_articles|highlights|underreported|view_count|engagement/);
    });

    it('returns an empty narrated briefing collection when no audio has been published', async () => {
        const prepare = vi.fn().mockReturnValue({
            all: vi.fn().mockResolvedValue({ results: [], success: true }),
        });
        const env = createMockEnv({ DB: { prepare } as unknown as D1Database });
        await seedFreshOfficialCaches(env);
        const app = new Hono();
        app.route('/dashboards', dashboardsRouter);

        const response = await app.fetch(new Request('http://localhost/dashboards/continental/overview'), env);
        const body = await response.json() as Record<string, any>;

        expect(response.status).toBe(200);
        expect(body.narrated_briefings).toEqual([]);
        expect(body.briefing_scope).toMatchObject({ countries_considered: 0, sectors_considered: 0 });
        expect(body.regions).toHaveLength(5);
    });
});
