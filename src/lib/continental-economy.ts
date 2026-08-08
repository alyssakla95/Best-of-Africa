import type { Env } from '../types';
import {
    CONTINENTAL_WDI_SNAPSHOT,
    type ContinentalCountryRank,
    type ContinentalIndicator,
    type ContinentalRegion,
} from '../data/continental-wdi-snapshot';

const WORLD_BANK_API = 'https://api.worldbank.org/v2';
const CACHE_KEY = 'continental:economy:wdi:v1';
const FRESH_MS = 15 * 60 * 1000;
const COUNTRY_CODES = [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CD', 'CG', 'CI',
    'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR',
    'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN',
    'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
] as const;
const SERIES = [
    'NY.GDP.MKTP.CD', 'SP.POP.TOTL', 'NY.GDP.MKTP.KD.ZG', 'FP.CPI.TOTL.ZG',
    'BX.KLT.DINV.CD.WD', 'NE.EXP.GNFS.CD', 'NE.IMP.GNFS.CD', 'NY.GDP.PCAP.CD',
    'NE.GDI.FTOT.ZS', 'BN.CAB.XOKA.GD.ZS',
] as const;

type Snapshot = typeof CONTINENTAL_WDI_SNAPSHOT;
type WdiRecord = { country?: { id?: string; value?: string }; date?: string; value?: number | null };
type Point = { country_code: string; country_name: string; year: number; value: number };
type CountryMeta = { code: string; name: string; region: string };

const median = (values: number[]): number => {
    const sorted = [...values].sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

function latestPoints(records: WdiRecord[]): Point[] {
    const latest = new Map<string, Point>();
    for (const record of records) {
        const countryCode = record.country?.id?.toUpperCase();
        const year = Number(record.date);
        const value = Number(record.value);
        if (!countryCode || record.value === null || !Number.isFinite(year) || !Number.isFinite(value)) continue;
        const existing = latest.get(countryCode);
        if (!existing || year > existing.year) latest.set(countryCode, {
            country_code: countryCode,
            country_name: record.country?.value || countryCode,
            year,
            value,
        });
    }
    return [...latest.values()];
}

async function fetchSeries(code: string): Promise<Point[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const currentYear = new Date().getUTCFullYear();
    try {
        const groups: string[][] = [];
        for (let index = 0; index < COUNTRY_CODES.length; index += 14) groups.push([...COUNTRY_CODES.slice(index, index + 14)]);
        const responses = await Promise.all(groups.map(async group => {
            const url = `${WORLD_BANK_API}/country/${group.join(';')}/indicator/${code}?format=json&date=${currentYear - 7}:${currentYear}&per_page=1000`;
            const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
            if (!response.ok) throw new Error(`${code} returned ${response.status}`);
            const payload = await response.json() as [unknown, WdiRecord[]];
            return Array.isArray(payload?.[1]) ? payload[1] : [];
        }));
        return latestPoints(responses.flat());
    } finally {
        clearTimeout(timeout);
    }
}

const reading = (points: Point[], aggregation: 'sum' | 'median') => ({
    value: aggregation === 'sum' ? points.reduce((sum, point) => sum + point.value, 0) : median(points.map(point => point.value)),
    countries_reported: points.length,
    period_start: points.length ? Math.min(...points.map(point => point.year)) : 0,
    period_end: points.length ? Math.max(...points.map(point => point.year)) : 0,
});

function updateIndicator(base: ContinentalIndicator, points: Point[]): ContinentalIndicator {
    const aggregation = base.aggregation === 'sum' ? 'sum' : 'median';
    return { ...base, ...reading(points, aggregation) };
}

export async function getContinentalEconomyCache(env: Env): Promise<Snapshot> {
    return (await env.CACHE.get(CACHE_KEY, 'json') as Snapshot | null) || CONTINENTAL_WDI_SNAPSHOT;
}

export function continentalEconomyCacheIsFresh(snapshot: Snapshot): boolean {
    return Date.now() - Date.parse(snapshot.retrieved_at) <= FRESH_MS;
}

export async function refreshContinentalEconomy(env: Env): Promise<Snapshot> {
    const previous = await getContinentalEconomyCache(env);
    try {
        const [seriesResults, countryResult] = await Promise.all([
            Promise.all(SERIES.map(fetchSeries)),
            env.DB.prepare('SELECT code, name, region FROM countries ORDER BY name').all<CountryMeta>(),
        ]);
        if (seriesResults.some(points => points.length < 35)) return previous;
        const byCode = new Map(SERIES.map((code, index) => [code, seriesResults[index]]));
        const countries = countryResult.results || [];
        const countryMeta = new Map(countries.map(country => [country.code, country]));
        const exportsByCountry = new Map((byCode.get('NE.EXP.GNFS.CD') || []).map(point => [point.country_code, point]));
        const importsByCountry = new Map((byCode.get('NE.IMP.GNFS.CD') || []).map(point => [point.country_code, point]));
        const tradeCountries = [...exportsByCountry.keys()].filter(code => importsByCountry.has(code));
        const tradePoints = tradeCountries.map(code => {
            const exported = exportsByCountry.get(code)!;
            const imported = importsByCountry.get(code)!;
            return { ...exported, year: Math.min(exported.year, imported.year), value: exported.value - imported.value };
        });
        const indicators = previous.indicators.map(base => {
            if (base.indicator_code.includes('+')) return updateIndicator(base, tradePoints);
            return updateIndicator(base, byCode.get(base.indicator_code as typeof SERIES[number]) || []);
        });
        const regions: ContinentalRegion[] = ['North', 'West', 'Central', 'East', 'Southern'].map(region => {
            const codes = new Set(countries.filter(country => country.region === region).map(country => country.code));
            const subset = (code: typeof SERIES[number]) => (byCode.get(code) || []).filter(point => codes.has(point.country_code));
            return {
                region,
                country_count: codes.size,
                gdp: reading(subset('NY.GDP.MKTP.CD'), 'sum'),
                population: reading(subset('SP.POP.TOTL'), 'sum'),
                growth: reading(subset('NY.GDP.MKTP.KD.ZG'), 'median'),
                inflation: reading(subset('FP.CPI.TOTL.ZG'), 'median'),
                fdi: reading(subset('BX.KLT.DINV.CD.WD'), 'sum'),
                investment: reading(subset('NE.GDI.FTOT.ZS'), 'median'),
            };
        });
        const rank = (code: typeof SERIES[number]): ContinentalCountryRank[] => [...(byCode.get(code) || [])]
            .sort((a, b) => b.value - a.value)
            .slice(0, 8)
            .map(point => ({
                country_code: point.country_code,
                country_name: countryMeta.get(point.country_code)?.name || point.country_name,
                region: countryMeta.get(point.country_code)?.region || 'Unclassified',
                year: point.year,
                value: point.value,
            }));
        const snapshot: Snapshot = {
            ...previous,
            retrieved_at: new Date().toISOString(),
            countries_in_scope: countries.length || 54,
            indicators,
            regions,
            rankings: {
                largest_economies: rank('NY.GDP.MKTP.CD'),
                fastest_growth: rank('NY.GDP.MKTP.KD.ZG'),
                largest_fdi_inflows: rank('BX.KLT.DINV.CD.WD'),
            },
        };
        await env.CACHE.put(CACHE_KEY, JSON.stringify(snapshot));
        return snapshot;
    } catch (error) {
        console.error('[continental-economy] refresh failed', error);
        return previous;
    }
}
