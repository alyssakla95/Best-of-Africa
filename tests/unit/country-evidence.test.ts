import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCountryEvidenceStale, refreshCountryEvidence, worldBankTradeFallback, type CountryEvidenceSnapshot } from '../../src/lib/country-evidence';
import { aggregateTradeTotal, getTradeBalance } from '../../src/lib/trade-data';
import { publisherNameForArticle, publisherNameForStoredArticle } from '../../src/lib/source-attribution';
import { parseHTMLListing, parseRSS, rankCandidatesForCoverage } from '../../src/workers/ingestion';
import { createMockEnv } from '../mocks/env';

const worldBankProfile = {
    country_code: 'NG',
    country_name: 'Nigeria',
    last_updated: '2026-07-18T14:00:00.000Z',
    source_name: 'World Bank World Development Indicators' as const,
    source_url: 'https://data.worldbank.org/country/ng',
    indicators: [
        { code: 'NE.EXP.GNFS.CD', name: 'Exports', value: 71_000_000_000, year: 2024, unit: 'USD', source_url: 'https://data.worldbank.org/indicator/NE.EXP.GNFS.CD' },
        { code: 'NE.IMP.GNFS.CD', name: 'Imports', value: 66_000_000_000, year: 2024, unit: 'USD', source_url: 'https://data.worldbank.org/indicator/NE.IMP.GNFS.CD' },
    ],
};

describe('country evidence integrity', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('keeps official observation years separate from retrieval time', () => {
        const trade = worldBankTradeFallback(worldBankProfile);
        expect(trade).toMatchObject({
            provider: 'World Bank World Development Indicators',
            export_year: 2024,
            import_year: 2024,
            totalExports: 71_000_000_000,
            totalImports: 66_000_000_000,
            retrieved_at: '2026-07-18T14:00:00.000Z',
        });
    });

    it('marks an assembled snapshot stale without erasing it', () => {
        const snapshot = { retrieved_at: '2026-07-18T00:00:00.000Z' } as CountryEvidenceSnapshot;
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T05:59:59.000Z'))).toBe(false);
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T06:00:01.000Z'))).toBe(true);
    });

    it('never converts empty UN Comtrade responses into a zero-trade fact', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 })));
        const result = await getTradeBalance(createMockEnv(), 'Nigeria', 2025, { refresh: true });
        expect(result).toBeNull();
    });

    it('does not double-count repeated Comtrade aggregate rows', () => {
        expect(aggregateTradeTotal([
            { cmdCode: 'TOTAL', partnerCode: 0, partner2Code: 0, primaryValue: 12_000 },
            { cmdCode: 'TOTAL', partnerCode: 0, partner2Code: 0, primaryValue: 12_000 },
            { cmdCode: '01', partnerCode: 0, partner2Code: 0, primaryValue: 4_000 },
        ])).toBe(12_000);
    });

    it('walks backward to the latest period with an actual trade observation', async () => {
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            const year = Number(url.searchParams.get('period'));
            const flow = url.searchParams.get('flowCode');
            const data = year === 2024
                ? [{ period: '2024', primaryValue: flow === 'X' ? 12 : 9, partnerDesc: 'World', cmdDesc: 'Total' }]
                : [];
            return new Response(JSON.stringify({ data }), { status: 200 });
        });
        vi.stubGlobal('fetch', fetchMock);
        const result = await getTradeBalance(createMockEnv(), 'Nigeria', undefined, { refresh: true, lookbackYears: 4 });
        expect(result).toMatchObject({ year: 2024, totalExports: 12, totalImports: 9, balance: 3 });
        expect(fetchMock).toHaveBeenCalled();
    });

    it('resolves accented country names to the correct UN Comtrade reporter', async () => {
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = new URL(String(input));
            return new Response(JSON.stringify({
                data: [{ period: '2025', primaryValue: url.searchParams.get('flowCode') === 'X' ? 8 : 6 }],
            }), { status: 200 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const result = await getTradeBalance(
            createMockEnv(),
            'São Tomé and Príncipe',
            2025,
            { refresh: true },
        );

        expect(result).toMatchObject({ country: 'São Tomé and Príncipe', totalExports: 8, totalImports: 6 });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        for (const [input] of fetchMock.mock.calls) {
            expect(new URL(String(input)).searchParams.get('reporterCode')).toBe('678');
        }
    });

    it('assembles a real IMF snapshot when World Bank and Comtrade are unavailable', async () => {
        vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
            const url = String(input);
            if (url.includes('imf.org/external/datamapper')) {
                return new Response(JSON.stringify({
                    values: {
                        NGDP_RPCH: { CPV: { '2026': 5.2 } },
                        NGDPD: { CPV: { '2026': 2.9 } },
                        NGDPDPC: { CPV: { '2026': 5500 } },
                        PCPIPCH: { CPV: { '2026': 2.1 } },
                        GGXWDG_NGDP: { CPV: { '2026': 96.4 } },
                        BCA_NGDPD: { CPV: { '2026': -3.4 } },
                        BCA: { CPV: { '2026': -0.1 } },
                    },
                }), { status: 200 });
            }
            if (url.includes('comtradeapi.un.org')) {
                return new Response(JSON.stringify({ data: [] }), { status: 200 });
            }
            return new Response('upstream unavailable', { status: 503 });
        }));

        const snapshot = await refreshCountryEvidence(createMockEnv(), { code: 'CV', name: 'Cabo Verde' }, { fast: true });

        expect(snapshot?.macroeconomics.official_profile).toMatchObject({
            country_code: 'CV',
            source_name: 'IMF World Economic Outlook',
        });
        expect(snapshot?.macroeconomics.official_profile.indicators).toEqual(expect.arrayContaining([
            expect.objectContaining({ code: 'NGDPD', value: 2_900_000_000, year: 2026, period_status: 'estimate_or_projection' }),
        ]));
        expect(snapshot?.trade).toMatchObject({
            kind: 'external_balance',
            provider: 'IMF World Economic Outlook',
            current_account_percent_gdp: -3.4,
            current_account_usd: -100_000_000,
            period_status: 'estimate_or_projection',
        });
    });

    it('attributes aggregator discoveries to their original publisher', () => {
        expect(publisherNameForArticle({ publisher_name: 'African Development Bank', source_name: 'Google News Aggregator' }))
            .toBe('African Development Bank');
        expect(publisherNameForArticle({ source_name: 'BBC Africa' })).toBe('BBC Africa');
        expect(publisherNameForStoredArticle({
            source_title: 'African economies expand regional trade - Reuters',
            source_url: 'https://news.google.com/rss/articles/example',
        })).toBe('Reuters');
    });

    it('accepts Atom feeds so reliable publishers are not silently excluded', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(`<?xml version="1.0"?><feed><entry><title>Africa trade corridor opens</title><link rel="alternate" href="https://publisher.example/story"/><summary>Kenya and Ghana expand trade.</summary><updated>2026-07-18T10:00:00Z</updated></entry></feed>`, { status: 200 })));
        const items = await parseRSS('https://publisher.example/atom');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Africa trade corridor opens',
            link: 'https://publisher.example/story',
            pubDate: '2026-07-18T10:00:00Z',
        });
    });

    it('accepts RSS 1.0 items with attributes and dc:date', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(`<?xml version="1.0"?><rdf:RDF><item rdf:about="https://publisher.example/story"><title>Uganda investment market expands</title><link>https://publisher.example/story</link><description>Uganda expands infrastructure investment.</description><dc:date>2026-08-01T08:54:00Z</dc:date></item></rdf:RDF>`, { status: 200 })));
        const items = await parseRSS('https://publisher.example/feed.rdf');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Uganda investment market expands',
            link: 'https://publisher.example/story',
            pubDate: '2026-08-01T08:54:00Z',
        });
    });

    it('extracts unique same-publisher articles from a direct HTML listing', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(`
            <a href="/article/kenya-trade-123"><h2>Kenya opens a regional trade corridor</h2></a>
            <a href="/article/kenya-trade-123">Kenya opens a regional trade corridor</a>
            <a href="https://outside.example/article/unrelated">Outside article must be excluded</a>
            <a href="/hub/africa">Africa hub navigation</a>
        `, { status: 200 })));
        const items = await parseHTMLListing('https://publisher.example/hub/africa');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Kenya opens a regional trade corridor',
            link: 'https://publisher.example/article/kenya-trade-123',
        });
    });

    it('ranks qualifying candidates toward the least-covered named country', () => {
        const items = [
            { title: 'Nigeria investment expands', content: 'Nigeria market update' },
            { title: 'Djibouti port investment expands', content: 'Djibouti trade update' },
            { title: 'Africa trade outlook', content: 'Continental market update' },
        ];
        expect(rankCandidatesForCoverage(items, [
            { name: 'Nigeria', recent_count: 50 },
            { name: 'Djibouti', recent_count: 0 },
        ]).map(item => item.title)).toEqual([
            'Djibouti port investment expands',
            'Nigeria investment expands',
            'Africa trade outlook',
        ]);
    });
});
