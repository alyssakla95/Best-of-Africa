/**
 * IMF Data Integration - Free Economic Forecasts
 * 
 * Fetches economic projections, debt metrics, and fiscal data
 * No API key required - public data access
 */

import type { Env } from '../types';

// The IMF DataMapper WAF rejects empty and browser-style User-Agents from
// non-browser clients but accepts API-client UAs; identify honestly.
const IMF_USER_AGENT = 'curl/8.9.0 (BOA-Story enrichment; cortesmailles01@gmail.com)';

// African country codes (IMF uses ISO 3-letter codes)
const AFRICAN_IMF_CODES: Record<string, string> = {
    'Nigeria': 'NGA',
    'South Africa': 'ZAF',
    'Kenya': 'KEN',
    'Egypt': 'EGY',
    'Morocco': 'MAR',
    'Ghana': 'GHA',
    'Ethiopia': 'ETH',
    'Tanzania': 'TZA',
    'Uganda': 'UGA',
    'Senegal': 'SEN',
    'Côte d\'Ivoire': 'CIV',
    'Rwanda': 'RWA',
    'Botswana': 'BWA',
    'Mauritius': 'MUS',
    'Namibia': 'NAM',
    'Tunisia': 'TUN',
    'Algeria': 'DZA',
    'Angola': 'AGO',
    'Zambia': 'ZMB',
    'Zimbabwe': 'ZWE',
    'Mozambique': 'MOZ',
    'DRC': 'COD',
    'Cameroon': 'CMR',
};

// Complete coverage for the 54 countries exposed by the country directory.
// Keep common database and editorial aliases so lookups do not depend on one
// spelling or accent convention.
Object.assign(AFRICAN_IMF_CODES, {
    'Benin': 'BEN', 'Burkina Faso': 'BFA', 'Burundi': 'BDI', 'Cabo Verde': 'CPV',
    'Cape Verde': 'CPV', 'Central African Republic': 'CAF', 'Chad': 'TCD',
    'Comoros': 'COM', 'Congo': 'COG', 'Republic of the Congo': 'COG',
    'DR Congo': 'COD', 'Democratic Republic of the Congo': 'COD',
    "Côte d'Ivoire": 'CIV', 'Côte d’Ivoire': 'CIV', "Cote d'Ivoire": 'CIV',
    'Djibouti': 'DJI', 'Equatorial Guinea': 'GNQ', 'Eritrea': 'ERI',
    'Eswatini': 'SWZ', 'Gabon': 'GAB', 'Gambia': 'GMB', 'Guinea': 'GIN',
    'Guinea-Bissau': 'GNB', 'Lesotho': 'LSO', 'Liberia': 'LBR', 'Libya': 'LBY',
    'Madagascar': 'MDG', 'Malawi': 'MWI', 'Mali': 'MLI', 'Mauritania': 'MRT',
    'Niger': 'NER', 'São Tomé and Príncipe': 'STP', 'Sao Tome and Principe': 'STP',
    'Seychelles': 'SYC', 'Sierra Leone': 'SLE', 'Somalia': 'SOM',
    'South Sudan': 'SSD', 'Sudan': 'SDN', 'Togo': 'TGO',
});

// Key IMF indicators
const IMF_INDICATORS = {
    'NGDP_RPCH': 'Real GDP Growth (%)',
    'NGDPD': 'GDP (Current USD billions)',
    'NGDPDPC': 'GDP per capita (USD)',
    'PCPIPCH': 'Inflation Rate (%)',
    'LUR': 'Unemployment Rate (%)',
    'GGXWDG_NGDP': 'Government Debt (% of GDP)',
    'BCA_NGDPD': 'Current Account Balance (% of GDP)',
    'BCA': 'Current Account Balance (USD billions)',
    'LP': 'Population (millions)',
    'GGXCNL_NGDP': 'General Government Net Lending/Borrowing (% of GDP)',
};

export interface IMFEconomicData {
    country: string;
    countryCode: string;
    year: number;
    gdpGrowth?: number;
    gdpBillions?: number;
    gdpPerCapita?: number;
    inflation?: number;
    unemployment?: number;
    debtToGDP?: number;
    currentAccountBalance?: number;
    currentAccountBillions?: number;
    populationMillions?: number;
    netLendingToGDP?: number;
    indicatorYears?: Record<string, number>;
}

export interface IMFForecast {
    country: string;
    indicator: string;
    indicatorName: string;
    historical: { year: number; value: number }[];
    projections: { year: number; value: number }[];
}

type IMFIndicatorSnapshot = {
    checkedAt: string;
    values: Record<string, Record<string, number>>;
};

const IMF_INDICATOR_MAX_AGE_MS = 6 * 60 * 60 * 1000;

async function fetchIMFIndicator(
    env: Env,
    indicator: string,
    targetYear: number,
    timeoutMs: number,
): Promise<IMFIndicatorSnapshot | null> {
    const cacheKey = `imf:indicator:v2:${indicator}`;
    const cached = await env.CACHE.get(cacheKey, 'json') as IMFIndicatorSnapshot | null;
    if (cached && Date.now() - Date.parse(cached.checkedAt) <= IMF_INDICATOR_MAX_AGE_MS) return cached;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const periods = [targetYear - 2, targetYear - 1, targetYear].join(',');
        const response = await fetch(`https://www.imf.org/external/datamapper/api/v1/${indicator}?periods=${periods}`, {
            headers: { 'User-Agent': IMF_USER_AGENT },
            signal: controller.signal,
        });
        if (!response.ok) return cached;
        const data = await response.json() as { values?: Record<string, Record<string, Record<string, number>>> };
        const values = data.values?.[indicator];
        if (!values || !Object.keys(values).length) return cached;
        const snapshot = { checkedAt: new Date().toISOString(), values };
        await env.CACHE.put(cacheKey, JSON.stringify(snapshot));
        return snapshot;
    } catch (error) {
        console.error(`IMF indicator refresh failed for ${indicator}:`, error);
        return cached;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Fetch World Economic Outlook data from IMF
 */
export async function fetchIMFData(
    env: Env,
    countryName: string,
    year?: number,
    options: { refresh?: boolean; timeoutMs?: number; criticalOnly?: boolean } = {},
): Promise<IMFEconomicData | null> {
    const cacheKey = `imf:${countryName}:${year || 'latest'}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as IMFEconomicData | null;
    if (cached && !options.refresh) return cached;

    const countryCode = AFRICAN_IMF_CODES[countryName];
    if (!countryCode) return null;

    const targetYear = year || new Date().getFullYear();

    try {
        // DataMapper accepts one indicator per series request. It currently
        // returns the all-country series even when a location is appended, so
        // cache that official series once and reuse it across all 54 dossiers.
        const indicatorIds = options.criticalOnly
            ? ['NGDP_RPCH', 'NGDPD', 'BCA_NGDPD', 'BCA']
            : Object.keys(IMF_INDICATORS);
        const series = await Promise.all(indicatorIds.map((indicator) =>
            fetchIMFIndicator(env, indicator, targetYear, options.timeoutMs || 8000)
        ));
        const dataByIndicator = Object.fromEntries(indicatorIds.map((indicator, index) => [indicator, series[index]?.values]));

        const economicData: IMFEconomicData = {
            country: countryName,
            countryCode,
            year: targetYear,
            indicatorYears: {},
        };

        const getValue = (indicator: string): number | undefined => {
                const indicatorData = dataByIndicator[indicator]?.[countryCode];
                if (!indicatorData) return undefined;

                // Try target year, then previous years
                for (let y = targetYear; y >= targetYear - 2; y--) {
                    if (indicatorData[y.toString()] !== undefined) {
                        economicData.indicatorYears![indicator] = y;
                        return Number(indicatorData[y.toString()]);
                    }
                }
                return undefined;
            };

        economicData.gdpGrowth = getValue('NGDP_RPCH');
        economicData.gdpBillions = getValue('NGDPD');
        economicData.gdpPerCapita = getValue('NGDPDPC');
        economicData.inflation = getValue('PCPIPCH');
        economicData.unemployment = getValue('LUR');
        economicData.debtToGDP = getValue('GGXWDG_NGDP');
        economicData.currentAccountBalance = getValue('BCA_NGDPD');
        economicData.currentAccountBillions = getValue('BCA');
        economicData.populationMillions = getValue('LP');
        economicData.netLendingToGDP = getValue('GGXCNL_NGDP');
        const observedYears = Object.values(economicData.indicatorYears || {});
        if (observedYears.length) economicData.year = Math.max(...observedYears);

        const hasObservation = [
            economicData.gdpGrowth, economicData.gdpBillions, economicData.gdpPerCapita,
            economicData.inflation, economicData.unemployment, economicData.debtToGDP,
            economicData.currentAccountBalance, economicData.currentAccountBillions,
        ].some((value) => typeof value === 'number' && Number.isFinite(value));
        if (!hasObservation) return cached;

        // Preserve the last verified official release. The assembled country
        // snapshot owns freshness and refresh scheduling.
        await env.CACHE.put(cacheKey, JSON.stringify(economicData));

        return economicData;
    } catch (error) {
        console.error('IMF data fetch error:', error);
        return cached;
    }
}

/**
 * Get GDP growth forecast for a country
 */
export async function getGDPForecast(
    env: Env,
    countryName: string
): Promise<IMFForecast | null> {
    const cacheKey = `imf-forecast:gdp:${countryName}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as IMFForecast | null;
    if (cached) return cached;

    const countryCode = AFRICAN_IMF_CODES[countryName];
    if (!countryCode) return null;

    try {
        const url = `https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH/${countryCode}`;

        const response = await fetch(url, {
            headers: { 'User-Agent': IMF_USER_AGENT }
        });
        if (!response.ok) return null;

        const data = await response.json() as Record<string, any>;
        const values = data.values?.NGDP_RPCH?.[countryCode] || {};

        const currentYear = new Date().getFullYear();
        const historical: { year: number; value: number }[] = [];
        const projections: { year: number; value: number }[] = [];

        for (const [yearStr, value] of Object.entries(values)) {
            const year = parseInt(yearStr);
            const numValue = parseFloat(value as string);

            if (year < currentYear) {
                historical.push({ year, value: numValue });
            } else {
                projections.push({ year, value: numValue });
            }
        }

        const forecast: IMFForecast = {
            country: countryName,
            indicator: 'NGDP_RPCH',
            indicatorName: 'Real GDP Growth (%)',
            historical: historical.sort((a, b) => a.year - b.year).slice(-5),
            projections: projections.sort((a, b) => a.year - b.year).slice(0, 5),
        };

        await env.CACHE.put(cacheKey, JSON.stringify(forecast), { expirationTtl: 86400 });
        return forecast;
    } catch (error) {
        console.error('GDP forecast fetch error:', error);
        return null;
    }
}

/**
 * Get debt sustainability metrics
 */
export async function getDebtMetrics(
    env: Env,
    countryName: string
): Promise<{ debtToGDP: number; trend: 'increasing' | 'stable' | 'decreasing' } | null> {
    const cacheKey = `imf-debt:${countryName}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as any | null;
    if (cached) return cached;

    const countryCode = AFRICAN_IMF_CODES[countryName];
    if (!countryCode) return null;

    try {
        const url = `https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP/${countryCode}`;

        const response = await fetch(url, {
            headers: { 'User-Agent': IMF_USER_AGENT }
        });
        if (!response.ok) return null;

        const data = await response.json() as Record<string, any>;
        const values = data.values?.GGXWDG_NGDP?.[countryCode] || {};

        const currentYear = new Date().getFullYear();
        const recentYears = [currentYear - 1, currentYear - 2, currentYear - 3];
        const recentValues: number[] = [];

        for (const year of recentYears) {
            if (values[year.toString()]) {
                recentValues.push(parseFloat(values[year.toString()]));
            }
        }

        if (recentValues.length === 0) return null;

        const debtToGDP = recentValues[0];
        let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';

        if (recentValues.length >= 2) {
            const diff = recentValues[0] - recentValues[recentValues.length - 1];
            if (diff > 5) trend = 'increasing';
            else if (diff < -5) trend = 'decreasing';
        }

        const result = { debtToGDP, trend };
        await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
        return result;
    } catch (error) {
        console.error('Debt metrics fetch error:', error);
        return null;
    }
}

/**
 * Compare African economies by indicator
 */
export async function compareAfricanEconomies(
    env: Env,
    indicator: keyof typeof IMF_INDICATORS
): Promise<{ country: string; value: number }[]> {
    const cacheKey = `imf-compare:${indicator}`;

    const cached = await env.CACHE.get(cacheKey, 'json') as any[] | null;
    if (cached) return cached;

    try {
        const countries = Object.values(AFRICAN_IMF_CODES).join(',');
        const url = `https://www.imf.org/external/datamapper/api/v1/${indicator}/${countries}`;

        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json() as Record<string, any>;
        const indicatorData = data.values?.[indicator] || {};

        const currentYear = new Date().getFullYear();
        const results: { country: string; value: number }[] = [];

        for (const [countryName, code] of Object.entries(AFRICAN_IMF_CODES)) {
            const countryValues = indicatorData[code];
            if (!countryValues) continue;

            // Find most recent value
            for (let y = currentYear; y >= currentYear - 2; y--) {
                if (countryValues[y.toString()] !== undefined) {
                    results.push({
                        country: countryName,
                        value: parseFloat(countryValues[y.toString()]),
                    });
                    break;
                }
            }
        }

        const sorted = results.sort((a, b) => b.value - a.value);
        await env.CACHE.put(cacheKey, JSON.stringify(sorted), { expirationTtl: 86400 });
        return sorted;
    } catch (error) {
        console.error('Economy comparison fetch error:', error);
        return [];
    }
}

/**
 * Format IMF data for article enrichment
 */
export function formatIMFInsight(data: IMFEconomicData): string {
    const parts: string[] = [];

    parts.push(`**IMF Economic Outlook (${data.year})**:`);

    if (data.gdpGrowth !== undefined) {
        const growthDesc = data.gdpGrowth > 5 ? 'strong' : data.gdpGrowth > 2 ? 'moderate' : 'slow';
        parts.push(`${growthDesc} GDP growth of ${data.gdpGrowth.toFixed(1)}%`);
    }

    if (data.gdpPerCapita !== undefined) {
        parts.push(`GDP per capita: $${data.gdpPerCapita.toFixed(0)}`);
    }

    if (data.inflation !== undefined) {
        const inflationDesc = data.inflation > 10 ? 'high' : data.inflation > 5 ? 'moderate' : 'low';
        parts.push(`${inflationDesc} inflation at ${data.inflation.toFixed(1)}%`);
    }

    if (data.debtToGDP !== undefined) {
        const debtDesc = data.debtToGDP > 80 ? 'elevated' : data.debtToGDP > 50 ? 'moderate' : 'manageable';
        parts.push(`${debtDesc} debt-to-GDP ratio of ${data.debtToGDP.toFixed(1)}%`);
    }

    return parts.join('. ') + '.';
}

/**
 * Enrich article with IMF economic data
 */
export async function enrichWithIMFData(
    env: Env,
    countryName: string
): Promise<string | null> {
    const data = await fetchIMFData(env, countryName);
    if (!data) return null;
    return formatIMFInsight(data);
}
