import type { Env } from '../types';
import { BUNDLED_WDI_SECTOR_METRICS } from '../data/sector-performance-wdi-snapshot';
import {
    BUNDLED_WDI_SECTOR_DIMENSIONS,
    type SectorPerformanceDimension,
} from '../data/sector-performance-wdi-dimensions';

const WORLD_BANK_API = 'https://api.worldbank.org/v2';
const AFRICAN_COUNTRY_CODES = [
    'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CD', 'CG', 'CI',
    'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR',
    'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN',
    'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
] as const;

type CalculationMode = 'growth_rate' | 'year_over_year' | 'level_change';

type SectorSeriesConfig = {
    sector_id: string;
    sector_name: string;
    indicator_code: string;
    indicator_name: string;
    mode: CalculationMode;
    headline_unit: '%' | '% of GDP' | '% of population' | '% of service exports';
    comparison_unit: 'percentage points';
    headline_label: string;
    scope: string;
    caveat: string;
};

export const SECTOR_PERFORMANCE_SERIES: readonly SectorSeriesConfig[] = [
    {
        sector_id: 'agriculture', sector_name: 'Agriculture & Agribusiness',
        indicator_code: 'NV.AGR.TOTL.KD.ZG', indicator_name: 'Agriculture, forestry and fishing value-added growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real growth',
        scope: 'Real value-added growth across reporting African economies.',
        caveat: 'National accounts measure primary-sector output; they do not isolate agribusiness margins, prices or listed-company returns.',
    },
    {
        sector_id: 'energy', sector_name: 'Energy & Mining',
        indicator_code: 'NV.IND.TOTL.KD.ZG', indicator_name: 'Industry including construction value-added growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real industrial growth',
        scope: 'Broad industrial output growth used as the comparable macro proxy for energy and extractive activity.',
        caveat: 'This broad series also includes manufacturing and construction; commodity prices and company returns require separate instruments.',
    },
    {
        sector_id: 'finance', sector_name: 'Finance & Investment',
        indicator_code: 'FS.AST.PRVT.GD.ZS', indicator_name: 'Domestic credit to private sector by banks',
        mode: 'level_change', headline_unit: '% of GDP', comparison_unit: 'percentage points', headline_label: 'Median private-sector credit depth',
        scope: 'Bank credit supplied to the private sector relative to economic output.',
        caveat: 'Credit depth is a financial-intermediation proxy, not a measure of bank profitability, asset quality or investment returns.',
    },
    {
        sector_id: 'healthcare', sector_name: 'Healthcare & Pharma',
        indicator_code: 'SH.XPD.CHEX.PC.CD', indicator_name: 'Current health expenditure per capita',
        mode: 'year_over_year', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual spending growth',
        scope: 'Year-over-year change in per-capita health expenditure in current US dollars.',
        caveat: 'The measure includes public and private health spending and is affected by inflation and exchange rates; it is not pharmaceutical revenue.',
    },
    {
        sector_id: 'infrastructure', sector_name: 'Infrastructure & Construction',
        indicator_code: 'NE.GDI.FTOT.KD.ZG', indicator_name: 'Gross fixed capital formation growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real investment growth',
        scope: 'Real growth in fixed-asset formation across reporting African economies.',
        caveat: 'Fixed capital formation includes machinery and other assets as well as infrastructure and does not measure project bankability.',
    },
    {
        sector_id: 'manufacturing', sector_name: 'Manufacturing & Industry',
        indicator_code: 'NV.IND.MANF.KD.ZG', indicator_name: 'Manufacturing value-added growth',
        mode: 'growth_rate', headline_unit: '%', comparison_unit: 'percentage points', headline_label: 'Median annual real growth',
        scope: 'Real manufacturing value-added growth across reporting African economies.',
        caveat: 'National manufacturing output does not capture subsector margins, capacity utilisation or listed-company performance.',
    },
    {
        sector_id: 'technology', sector_name: 'Technology & Innovation',
        indicator_code: 'IT.NET.USER.ZS', indicator_name: 'Individuals using the internet',
        mode: 'level_change', headline_unit: '% of population', comparison_unit: 'percentage points', headline_label: 'Median digital adoption',
        scope: 'Internet adoption and its annual change across reporting African economies.',
        caveat: 'Adoption is a demand and access proxy, not technology-company revenue, venture funding or innovation productivity.',
    },
    {
        sector_id: 'tourism', sector_name: 'Tourism & Hospitality',
        indicator_code: 'BX.GSR.TRVL.ZS', indicator_name: 'Travel services share of service exports',
        mode: 'level_change', headline_unit: '% of service exports', comparison_unit: 'percentage points', headline_label: 'Median travel-export concentration',
        scope: 'Travel services as a share of total service exports and the annual change across reporting African economies.',
        caveat: 'The series covers business and personal travel and measures export concentration, not visitor counts, hotel profitability or domestic tourism.',
    },
] as const;

type WorldBankRecord = {
    country?: { id?: string; value?: string };
    countryiso3code?: string;
    date?: string;
    value?: number | null;
};

export type SectorMarketPoint = {
    country_code: string;
    country_name: string;
    observation_year: number;
    value: number;
};

export type SectorPerformance = {
    sector_id: string;
    sector_name: string;
    indicator_code: string;
    indicator_name: string;
    headline_label: string;
    headline_value: number;
    headline_unit: string;
    comparison_value: number;
    comparison_unit: string;
    improving_markets_pct: number;
    positive_markets_pct: number;
    countries_reported: number;
    continent_coverage_pct: number;
    period_start: number;
    period_end: number;
    dispersion_low: number;
    dispersion_high: number;
    leaders: SectorMarketPoint[];
    laggards: SectorMarketPoint[];
    direction: 'accelerating' | 'slowing' | 'steady';
    scope: string;
    caveat: string;
    source_name: 'World Bank World Development Indicators';
    source_url: string;
    dimensions: SectorPerformanceDimension[];
    diligence_questions: string[];
};

export type SectorPerformanceResponse = {
    data: SectorPerformance[];
    sectors_measured: number;
    countries_in_scope: 54;
    methodology: string;
    retrieved_at: string;
    source_name: 'World Bank World Development Indicators';
    source_url: 'https://data.worldbank.org/indicator';
};

const SECTOR_DILIGENCE_QUESTIONS: Record<string, string[]> = {
    agriculture: ['Which value chains convert farm output into higher-margin processing and exports?', 'How exposed are yields and margins to rainfall, irrigation, fertiliser, seed and storage constraints?', 'Which land, food-safety, subsidy and trade rules change market-entry economics?', 'Where do logistics, cold-chain, finance and offtake gaps prevent scale?'],
    energy: ['What dependable generation, transmission and distribution capacity is actually available?', 'How do tariffs, subsidies, losses, collection rates and currency exposure affect project bankability?', 'Which projects have binding licences, financing, offtake agreements and construction milestones?', 'Does the renewable share reflect modern generation or traditional biomass dependence?'],
    finance: ['Is credit expansion reaching productive firms or concentrating risk in government and large borrowers?', 'How do lending rates, inflation, currency volatility and non-performing loans affect real financing costs?', 'Which licensing, capital, foreign-ownership and consumer-protection rules shape entry?', 'Where does account ownership translate into active deposits, payments, insurance, investment or credit use?'],
    healthcare: ['Which spending pools are public, insured, out-of-pocket or donor-financed?', 'Where do workforce, beds, diagnostics, medicines and distribution create binding capacity gaps?', 'What reimbursement, registration, procurement and price-control rules govern commercial access?', 'Which demand segments can support sustainable provision without treating unmet need as bankable demand?'],
    infrastructure: ['Which announced projects have completed feasibility, permits, procurement, financing and land acquisition?', 'How are construction, demand, currency, offtake and sovereign risks allocated?', 'Which ports, airports, corridors and urban systems face measurable capacity constraints?', 'What maintenance obligations and lifecycle costs sit behind new capital formation?'],
    manufacturing: ['Which subsectors are gaining real output, domestic value added and export share?', 'How do power, logistics, inputs, skills, finance and capacity utilisation constrain margins?', 'Which tariff, local-content, standards and industrial-zone regimes alter competitiveness?', 'Where is industrial employment growth matched by productivity rather than low-value assembly?'],
    technology: ['Does connectivity translate into affordable, reliable usage and digital transaction volume?', 'Which markets have payment rails, cloud capacity, data centres, cybersecurity and technical talent?', 'How do data protection, localisation, licensing, tax and competition rules affect scaling?', 'Where do adoption figures conceal device, affordability, rural coverage or enterprise-digitisation gaps?'],
    tourism: ['Are arrivals, receipts, air capacity and accommodation demand recovering in the same markets?', 'How seasonal and concentrated are source markets, routes and visitor spending?', 'Which visa, aviation, tax, land, conservation and licensing rules constrain growth?', 'Do dated official series require validation against current tourism-board, airport and company disclosures?'],
};

const BUNDLED_SNAPSHOT: SectorPerformanceResponse = {
    data: SECTOR_PERFORMANCE_SERIES.map(config => ({
        ...config,
        ...BUNDLED_WDI_SECTOR_METRICS[config.sector_id],
        dimensions: BUNDLED_WDI_SECTOR_DIMENSIONS[config.sector_id] || [],
        diligence_questions: SECTOR_DILIGENCE_QUESTIONS[config.sector_id] || [],
        source_name: 'World Bank World Development Indicators' as const,
        source_url: `https://data.worldbank.org/indicator/${config.indicator_code}`,
    })),
    sectors_measured: SECTOR_PERFORMANCE_SERIES.length,
    countries_in_scope: 54,
    methodology: 'Each sector combines a primary official performance proxy with three structural or operating dimensions. Country-level observations use the latest available annual records in the World Bank WDI bulk release retrieved 18 July 2026. Values are cross-country medians, not continental totals; comparison values are median changes versus each country\'s preceding observation; breadth is the share of reporting markets moving higher. Higher is not automatically better for contextual or adverse indicators. Series with different units are never combined into a synthetic score or investment ranking.',
    retrieved_at: '2026-07-18T16:15:31.000Z',
    source_name: 'World Bank World Development Indicators',
    source_url: 'https://data.worldbank.org/indicator',
};

const CACHE_KEY = 'market-intel:sector-performance:wdi:v2';
const FRESH_MS = 12 * 60 * 60 * 1000;

function round(value: number, digits = 1): number {
    return Number(value.toFixed(digits));
}

function median(values: number[]): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percentile(values: number[], fraction: number): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * fraction)))];
}

export function calculateSectorPerformance(
    config: SectorSeriesConfig,
    records: WorldBankRecord[],
): SectorPerformance | null {
    const grouped = new Map<string, { country_name: string; values: { year: number; value: number }[] }>();
    for (const record of records) {
        const countryCode = record.country?.id?.toUpperCase();
        const year = Number(record.date);
        const value = Number(record.value);
        if (!countryCode || !Number.isFinite(year) || record.value === null || !Number.isFinite(value)) continue;
        const entry = grouped.get(countryCode) || { country_name: record.country?.value || countryCode, values: [] };
        entry.values.push({ year, value });
        grouped.set(countryCode, entry);
    }

    const markets: Array<SectorMarketPoint & { comparison: number; positive: boolean }> = [];
    for (const [countryCode, country] of grouped) {
        const values = country.values.sort((a, b) => b.year - a.year);
        const required = config.mode === 'year_over_year' ? 3 : 2;
        if (values.length < required) continue;

        let headline: number;
        let comparison: number;
        let positive: boolean;
        if (config.mode === 'growth_rate') {
            headline = values[0].value;
            comparison = values[0].value - values[1].value;
            positive = headline > 0;
        } else if (config.mode === 'year_over_year') {
            if (values[1].value === 0 || values[2].value === 0) continue;
            headline = ((values[0].value - values[1].value) / Math.abs(values[1].value)) * 100;
            const previousGrowth = ((values[1].value - values[2].value) / Math.abs(values[2].value)) * 100;
            comparison = headline - previousGrowth;
            positive = headline > 0;
        } else {
            headline = values[0].value;
            comparison = values[0].value - values[1].value;
            positive = comparison > 0;
        }

        if (![headline, comparison].every(Number.isFinite)) continue;
        markets.push({
            country_code: countryCode,
            country_name: country.country_name,
            observation_year: values[0].year,
            value: round(headline),
            comparison,
            positive,
        });
    }

    if (!markets.length) return null;
    const headlineValues = markets.map(market => market.value);
    const comparisons = markets.map(market => market.comparison);
    const years = markets.map(market => market.observation_year);
    const leaders = [...markets].sort((a, b) => b.value - a.value).slice(0, 5)
        .map(({ comparison: _comparison, positive: _positive, ...market }) => market);
    const laggards = [...markets].sort((a, b) => a.value - b.value).slice(0, 5)
        .map(({ comparison: _comparison, positive: _positive, ...market }) => market);
    const comparisonValue = median(comparisons);

    return {
        sector_id: config.sector_id,
        sector_name: config.sector_name,
        indicator_code: config.indicator_code,
        indicator_name: config.indicator_name,
        headline_label: config.headline_label,
        headline_value: round(median(headlineValues)),
        headline_unit: config.headline_unit,
        comparison_value: round(comparisonValue),
        comparison_unit: config.comparison_unit,
        improving_markets_pct: round((markets.filter(market => market.comparison > 0).length / markets.length) * 100),
        positive_markets_pct: round((markets.filter(market => market.positive).length / markets.length) * 100),
        countries_reported: markets.length,
        continent_coverage_pct: round((markets.length / AFRICAN_COUNTRY_CODES.length) * 100),
        period_start: Math.min(...years),
        period_end: Math.max(...years),
        dispersion_low: round(percentile(headlineValues, 0.25)),
        dispersion_high: round(percentile(headlineValues, 0.75)),
        leaders,
        laggards,
        direction: comparisonValue > 0.25 ? 'accelerating' : comparisonValue < -0.25 ? 'slowing' : 'steady',
        scope: config.scope,
        caveat: config.caveat,
        source_name: 'World Bank World Development Indicators',
        source_url: `https://data.worldbank.org/indicator/${config.indicator_code}`,
        dimensions: BUNDLED_WDI_SECTOR_DIMENSIONS[config.sector_id] || [],
        diligence_questions: SECTOR_DILIGENCE_QUESTIONS[config.sector_id] || [],
    };
}

async function fetchSeries(config: SectorSeriesConfig): Promise<SectorPerformance | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const currentYear = new Date().getUTCFullYear();
    try {
        // The API accepts semicolon-separated countries but rejects very long
        // 54-country paths at the edge. Four bounded batches also prevent one
        // upstream country-code issue from discarding the whole continent.
        const groups: string[][] = [];
        for (let index = 0; index < AFRICAN_COUNTRY_CODES.length; index += 14) {
            groups.push([...AFRICAN_COUNTRY_CODES.slice(index, index + 14)]);
        }
        const responses = await Promise.all(groups.map(async group => {
            const countries = group.join(';');
            const url = `${WORLD_BANK_API}/country/${countries}/indicator/${config.indicator_code}?format=json&date=${currentYear - 7}:${currentYear}&per_page=1000`;
            const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
            if (!response.ok) {
                console.error(`[sector-performance] ${config.indicator_code} batch returned ${response.status}`);
                return [] as WorldBankRecord[];
            }
            const payload = await response.json() as [unknown, WorldBankRecord[]];
            return Array.isArray(payload?.[1]) ? payload[1] : [];
        }));
        return calculateSectorPerformance(config, responses.flat());
    } catch (error) {
        console.error(`[sector-performance] ${config.indicator_code} refresh failed`, error);
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

export async function getSectorPerformanceCache(env: Env): Promise<SectorPerformanceResponse | null> {
    return (await env.CACHE.get(CACHE_KEY, 'json') as SectorPerformanceResponse | null) || BUNDLED_SNAPSHOT;
}

export function sectorPerformanceCacheIsFresh(snapshot: SectorPerformanceResponse): boolean {
    return Date.now() - Date.parse(snapshot.retrieved_at) <= FRESH_MS;
}

export async function refreshSectorPerformance(env: Env): Promise<SectorPerformanceResponse | null> {
    const previous = await getSectorPerformanceCache(env);
    const results = await Promise.all(SECTOR_PERFORMANCE_SERIES.map(fetchSeries));
    if (!results.some((item): item is SectorPerformance => item !== null)) return previous;
    const previousBySector = new Map((previous?.data || []).map(item => [item.sector_id, item]));
    const data = SECTOR_PERFORMANCE_SERIES
        .map((config, index) => results[index] || previousBySector.get(config.sector_id) || null)
        .filter((item): item is SectorPerformance => item !== null);
    if (!data.length) return previous;

    const snapshot: SectorPerformanceResponse = {
        data,
        sectors_measured: data.length,
        countries_in_scope: 54,
        methodology: 'Each sector combines a primary official performance proxy with three structural or operating dimensions. Country-level observations use the latest available annual records within the retrieval window. Values are cross-country medians, not continental totals; comparison values are median changes versus each country’s preceding observation; breadth is the share of reporting markets moving higher. Higher is not automatically better for contextual or adverse indicators. Series with different units are never combined into a synthetic score or investment ranking.',
        retrieved_at: new Date().toISOString(),
        source_name: 'World Bank World Development Indicators',
        source_url: 'https://data.worldbank.org/indicator',
    };
    await env.CACHE.put(CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
}
