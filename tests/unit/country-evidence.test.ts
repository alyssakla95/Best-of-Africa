import { afterEach, describe, expect, it, vi } from 'vitest';
import { isCountryEvidenceStale, refreshCountryEvidence, worldBankTradeFallback, type CountryEvidenceSnapshot } from '../../src/lib/country-evidence';
import { aggregateTradeTotal, getTradeBalance } from '../../src/lib/trade-data';
import { publisherNameForArticle, publisherNameForStoredArticle } from '../../src/lib/source-attribution';
import { fetchIFCAfricaPressroom, fetchWorldBankOfficialContent, parseHTMLListing, parseRSS, rankCandidatesForCoverage, unseenCandidates, worldBankCountryName } from '../../src/workers/ingestion';
import { createMockEnv } from '../mocks/env';
import { getCountryEconomicProfile } from '../../src/lib/economics';

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

    it('retains a dated observation history and calculates the preceding change', async () => {
        vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request) => {
            const url = String(input);
            if (/\/country\/NG\?format=json$/.test(url)) {
                return new Response(JSON.stringify([{}, [{ name: 'Nigeria' }]]), { status: 200 });
            }
            if (url.includes('/indicator/NY.GDP.MKTP.CD')) {
                return new Response(JSON.stringify([{}, [
                    { date: '2025', value: 110 },
                    { date: '2024', value: 100 },
                    { date: '2023', value: null },
                ]]), { status: 200 });
            }
            return new Response(JSON.stringify([{}, []]), { status: 200 });
        }));

        const profile = await getCountryEconomicProfile(createMockEnv(), 'NG', { refresh: true });
        expect(profile?.indicators).toHaveLength(1);
        expect(profile?.indicators[0]).toMatchObject({
            code: 'NY.GDP.MKTP.CD',
            value: 110,
            year: 2025,
            previous_value: 100,
            absolute_change: 10,
            percentage_change: 10,
            history: [{ year: 2024, value: 100 }, { year: 2025, value: 110 }],
        });
    });

    it('marks an assembled snapshot stale without erasing it', () => {
        const snapshot = {
            retrieved_at: '2026-07-18T00:00:00.000Z',
            macroeconomics: { official_profile: { indicators: Array.from({ length: 20 }, () => ({ history: [{ year: 2024, value: 1 }, { year: 2025, value: 2 }] })) } },
        } as unknown as CountryEvidenceSnapshot;
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T05:59:59.000Z'))).toBe(false);
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T06:00:01.000Z'))).toBe(true);
    });

    it('refreshes a recent legacy snapshot when its official evidence set is still narrow', () => {
        const snapshot = {
            retrieved_at: '2026-07-18T00:00:00.000Z',
            macroeconomics: { official_profile: { indicators: Array.from({ length: 12 }) } },
        } as unknown as CountryEvidenceSnapshot;
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T00:05:00.000Z'))).toBe(true);
    });

    it('refreshes a broad latest-value snapshot when observation histories are missing', () => {
        const snapshot = {
            retrieved_at: '2026-07-18T00:00:00.000Z',
            macroeconomics: { official_profile: { indicators: Array.from({ length: 25 }, () => ({ value: 1 })) } },
        } as unknown as CountryEvidenceSnapshot;
        expect(isCountryEvidenceStale(snapshot, Date.parse('2026-07-18T00:05:00.000Z'))).toBe(true);
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

    it('reports blocked or non-feed RSS responses instead of recording false empty success', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('Access denied', { status: 403 })));
        await expect(parseRSS('https://publisher.example/blocked')).rejects.toThrow('HTTP 403');

        vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>challenge</html>', {
            status: 200,
            headers: { 'content-type': 'text/html' },
        })));
        await expect(parseRSS('https://publisher.example/not-a-feed')).rejects.toThrow('non-feed content');
    });

    it('extracts unique same-publisher articles from a direct HTML listing', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(`
            <a href="/article/kenya-trade-123"><h2>Kenya opens a regional trade corridor</h2></a>
            <a href="/article/kenya-trade-123">Kenya opens a regional trade corridor</a>
            <a href="/news/ghana-financing-456"><h2>Ghana secures new infrastructure financing</h2></a>
            <a href="/pressroom/2026/rwanda-investment-789"><h2>Rwanda investment programme reaches financial close</h2></a>
            <a href="https://outside.example/article/unrelated">Outside article must be excluded</a>
            <a href="/hub/africa">Africa hub navigation</a>
        `, { status: 200, headers: { 'content-type': 'text/html' } })));
        const items = await parseHTMLListing('https://publisher.example/hub/africa');
        expect(items).toHaveLength(3);
        expect(items[0]).toMatchObject({
            title: 'Kenya opens a regional trade corridor',
            link: 'https://publisher.example/article/kenya-trade-123',
        });
        expect(items.map(item => item.link)).toContain('https://publisher.example/news/ghana-financing-456');
        expect(items.map(item => item.link)).toContain('https://publisher.example/pressroom/2026/rwanda-investment-789');
    });

    it('extracts official FAO news-detail links from its server-rendered content endpoint', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(`
            <a href="https://www.fao.org:443/africa/news-stories/news-detail/ghana-food-market-investment/en">
                Ghana food-market investment expands regional processing
            </a>
        `, { status: 200, headers: { 'content-type': 'text/html' } })));
        const items = await parseHTMLListing('https://www.fao.org/africa/news-stories/news/GetContent/1/en/');
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Ghana food-market investment expands regional processing',
            link: 'https://www.fao.org/africa/news-stories/news-detail/ghana-food-market-investment/en',
        });
    });

    it('reports blocked HTML listings instead of recording false empty success', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response('Access denied', { status: 403 })));
        await expect(parseHTMLListing('https://publisher.example/news')).rejects.toThrow('HTTP 403');

        vi.stubGlobal('fetch', vi.fn(async () => new Response('{"items":[]}', {
            status: 200,
            headers: { 'content-type': 'application/json' },
        })));
        await expect(parseHTMLListing('https://publisher.example/news')).rejects.toThrow('non-HTML content');
    });

    it('reads recent country evidence from the World Bank official content API', async () => {
        const now = new Date('2026-08-09T12:00:00.000Z');
        const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify({
            value: [
                {
                    title: 'Uganda expands private-sector investment programme',
                    publishUrl: 'https://www.worldbank.org/en/news/press-release/2026/08/08/uganda-investment',
                    contentType: 'Press Release',
                    contentDate: '2026-08-08T10:00:00Z',
                    s7ThumbnailPath: 'https://worldbank.scene7.com/example.jpg',
                },
                {
                    title: 'Future event must not enter current evidence',
                    publishUrl: '/future-event',
                    contentType: 'Event',
                    contentDate: '2026-08-12T10:00:00Z',
                },
                {
                    title: 'Old publication outside the evidence window',
                    publishUrl: '/old-publication',
                    contentType: 'Publication',
                    contentDate: '2025-01-01T10:00:00Z',
                },
            ],
        }), { status: 200 }));
        vi.stubGlobal('fetch', fetchMock);

        const items = await fetchWorldBankOfficialContent('UG', 'Uganda', now);
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'Uganda expands private-sector investment programme',
            publisherName: 'World Bank Group',
            pubDate: '2026-08-08T10:00:00.000Z',
        });
        expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).filter)
            .toContain("countries/any(c: c eq 'Uganda')");
    });

    it('discovers and reads current Africa press releases from IFC first-party services', async () => {
        const now = new Date('2026-08-13T12:00:00.000Z');
        const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
            const url = String(input);
            if (url.includes('/pressroom?regions=Africa')) {
                return new Response('<advance-search subKey="public-key" url="https://webapi.worldbank.org/aemsite/ifc/search">Loading</advance-search>', { status: 200 });
            }
            return new Response(JSON.stringify({
                value: [{
                    title: 'IFC expands digital commerce infrastructure across Africa',
                    pagePublishPath: '/en/pressroom/2026/ifc-expands-digital-commerce-infrastructure-across-africa',
                    contentDate: '2026-08-12T00:00:00Z',
                    description: 'The programme will finance small businesses in Kenya, Senegal and Ghana.',
                }],
            }), { status: 200 });
        });
        vi.stubGlobal('fetch', fetchMock);

        const items = await fetchIFCAfricaPressroom('https://www.ifc.org/en/pressroom?regions=Africa', now);
        expect(items).toHaveLength(1);
        expect(items[0]).toMatchObject({
            title: 'IFC expands digital commerce infrastructure across Africa',
            publisherName: 'International Finance Corporation',
            pubDate: '2026-08-12T00:00:00.000Z',
        });
        expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
            'Ocp-Apim-Subscription-Key': 'public-key',
        });
        expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).filter).toContain("regions eq 'Africa'");
    });

    it('uses provider country aliases and reaches fresh items beyond duplicate feed leaders', () => {
        expect(worldBankCountryName('CI', "Côte d'Ivoire")).toBe("Cote d'Ivoire");
        expect(worldBankCountryName('CD', 'Democratic Republic of the Congo')).toBe('Congo, Democratic Republic of');
        expect(worldBankCountryName('EG', 'Egypt')).toBe('Egypt');
        expect(worldBankCountryName('SO', 'Somalia')).toBe('Federal Republic of Somalia');
        expect(unseenCandidates(
            Array.from({ length: 10 }, (_, index) => ({ url: `https://example.com/${index}` })),
            new Set(Array.from({ length: 6 }, (_, index) => `https://example.com/${index}`)),
        ).map(item => item.url)).toEqual([
            'https://example.com/6', 'https://example.com/7', 'https://example.com/8', 'https://example.com/9',
        ]);
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
