import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { countriesRouter } from '../../src/routes/countries';
import { countryEvidenceCacheKey } from '../../src/lib/country-evidence';
import { createMockEnv } from '../mocks/env';

describe('GET /countries/:code/dossier decision evidence', () => {
    it('returns fresh official evidence and localized, quality-attributed source records without caching the response', async () => {
        const country = {
            code: 'NG', name: 'Nigeria', region: 'West', capital: 'Abuja', currency: 'NGN',
            languages: '["English"]', investment_highlights: '[]', tourism_highlights: '[]',
            business_portal_url: 'https://official.example/business',
            visa_portal_url: 'https://official.example/visa',
            tourism_portal_url: null, investment_agency_url: 'https://official.example/invest',
        };
        const article = {
            title: 'Título português verificado', slug: 'verified-market-record', summary: 'Resumo português.',
            source_url: 'https://reuters.com/example', source_name: 'Reuters', source_quality_tier: 4,
            sector_id: 'finance', sector_name: 'Finance & Investment',
            published_at: '2026-08-07T10:00:00Z', reviewed_at: '2026-08-07T11:00:00Z',
        };
        const prepare = vi.fn((sql: string) => {
            const statement = {
                bind: vi.fn(() => statement),
                first: vi.fn().mockResolvedValue(sql.includes('FROM countries WHERE code') ? country : null),
                all: vi.fn().mockResolvedValue({
                    results: sql.includes('FROM events') ? []
                        : sql.includes('FROM sectors s JOIN articles') ? [{ id: 'finance', name: 'Finance & Investment', article_count: 1, latest_evidence_at: article.published_at }]
                        : sql.includes('FROM articles a') ? [article]
                        : [],
                    success: true,
                }),
            };
            return statement;
        });
        const env = createMockEnv({ DB: { prepare } as unknown as D1Database });
        await env.CACHE.put(countryEvidenceCacheKey('NG'), JSON.stringify({
            macroeconomics: {
                official_profile: {
                    country_code: 'NG', country_name: 'Nigeria', source_name: 'World Bank World Development Indicators',
                    source_url: 'https://data.worldbank.org/country/nigeria', last_updated: '2026-08-08T00:00:00Z',
                    indicators: [{ code: 'NY.GDP.MKTP.CD', name: 'GDP', value: 360_000_000_000, year: 2025, unit: 'current US$', source_url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.CD' }],
                },
                world_bank: {
                    country_code: 'NG', country_name: 'Nigeria', source_name: 'World Bank World Development Indicators',
                    source_url: 'https://data.worldbank.org/country/nigeria', last_updated: '2026-08-08T00:00:00Z', indicators: [],
                },
                imf_current: { year: 2026, gdpGrowth: 4.1, inflation: 16 },
                imf_gdp_growth: {}, imf_debt: {},
            },
            trade: {
                kind: 'reported_totals', country: 'Nigeria', year: 2025, totalExports: 70_000_000_000,
                totalImports: 60_000_000_000, balance: 10_000_000_000, topExportPartners: [], topImportPartners: [],
                topExportCommodities: [], topImportCommodities: [], provider: 'UN Comtrade', source_name: 'UN Comtrade',
                source_url: 'https://comtradeplus.un.org/', retrieved_at: '2026-08-08T00:00:00Z',
            },
            freshness: [
                { provider: 'World Bank WDI', source_url: 'https://data.worldbank.org/', checked_at: '2026-08-08T00:00:00Z', observation_period: '2025', state: 'current_snapshot' },
                { provider: 'IMF WEO', source_url: 'https://www.imf.org/external/datamapper/', checked_at: '2026-08-08T00:00:00Z', observation_period: '2026', state: 'current_snapshot' },
                { provider: 'UN Comtrade', source_url: 'https://comtradeplus.un.org/', checked_at: '2026-08-08T00:00:00Z', observation_period: '2025', state: 'current_snapshot' },
            ],
            retrieved_at: new Date().toISOString(),
        }));

        const app = new Hono();
        app.route('/countries', countriesRouter);
        const response = await app.fetch(new Request('http://localhost/countries/ng/dossier?lang=pt'), env);
        const body = await response.json() as Record<string, any>;

        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
        expect(body.dossier.macroeconomics.official_profile.indicators[0]).toMatchObject({ value: 360_000_000_000, year: 2025 });
        expect(body.dossier.trade).toMatchObject({ provider: 'UN Comtrade', balance: 10_000_000_000 });
        expect(body.dossier.freshness).toHaveLength(3);
        expect(body.dossier.recent_source_record[0]).toMatchObject({
            title: 'Título português verificado', source_name: 'Reuters', source_quality_tier: 4, sector_id: 'finance',
        });
        expect(body.dossier.official_resources).toHaveLength(3);
        expect(prepare.mock.calls.some(([sql]) => String(sql).includes('article_translations pt'))).toBe(true);
    });
});
