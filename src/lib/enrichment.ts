/**
 * Unified Content Enrichment Service
 * 
 * Combines all free data sources to automatically enrich articles
 * with contextual intelligence from multiple APIs
 */

import type { Env } from '../types';

// Import all data services
import { enrichWithTradeData } from './trade-data';
import { enrichWithIMFData } from './imf-data';
import { enrichWithWeatherData } from './weather-data';
import { enrichWithResearchData } from './research-data';
import { enrichWithPressReleases } from './press-releases';
import { getKeyEconomicStats } from './economics';
import { enrichWithWikiContext } from './wikipedia';
import { getCommodityPrices, getCurrencyRates } from './market-data';
import { getHDIData } from './un-data';

export interface EnrichmentResult {
    economic?: string;      // World Bank data
    imf?: string;           // IMF forecasts
    trade?: string;         // UN Comtrade
    weather?: string;       // Open-Meteo
    research?: string;      // OpenAlex papers
    pressReleases?: string; // PR feeds
    wikipedia?: string;     // Wikipedia context
    commodities?: string;   // Market prices
    currencies?: string;    // Exchange rates
    development?: string;   // HDI/UN data
}

export interface EnrichmentOptions {
    includeEconomic?: boolean;
    includeIMF?: boolean;
    includeTrade?: boolean;
    includeWeather?: boolean;
    includeResearch?: boolean;
    includePressReleases?: boolean;
    includeWikipedia?: boolean;
    includeCommodities?: boolean;
    includeCurrencies?: boolean;
    includeDevelopment?: boolean;
}

const DEFAULT_OPTIONS: EnrichmentOptions = {
    includeEconomic: true,
    includeIMF: true,
    includeTrade: true,
    includeWeather: false, // Only for agriculture
    includeResearch: true,
    includePressReleases: true,
    includeWikipedia: true,
    includeCommodities: false, // Only for relevant sectors
    includeCurrencies: false,
    includeDevelopment: true,
};

/**
 * Fully enrich an article with all available data sources
 */
export async function enrichArticle(
    env: Env,
    countryName: string,
    sector?: string,
    options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const result: EnrichmentResult = {};

    // Determine sector-specific options
    const agriSectors = ['agriculture', 'farming', 'food', 'commodities'];
    const energySectors = ['energy', 'oil', 'gas', 'mining'];
    const financeSectors = ['finance', 'banking', 'fintech'];

    if (sector) {
        const lowerSector = sector.toLowerCase();
        if (agriSectors.some(s => lowerSector.includes(s))) {
            opts.includeWeather = true;
            opts.includeCommodities = true;
        }
        if (energySectors.some(s => lowerSector.includes(s))) {
            opts.includeCommodities = true;
        }
        if (financeSectors.some(s => lowerSector.includes(s))) {
            opts.includeCurrencies = true;
        }
    }

    // Run all enrichments in parallel for speed
    const promises: Promise<void>[] = [];

    if (opts.includeEconomic) {
        promises.push(
            getKeyEconomicStats(env, countryName)
                .then((data: any) => {
                    if (data) {
                        result.economic = `**Economic Snapshot**: GDP ${data.gdp || 'N/A'} (Growth: ${data.gdp_growth || 'N/A'}), Pop: ${data.population || 'N/A'}`;
                    }
                })
                .catch(() => { })
        );
    }

    if (opts.includeIMF) {
        promises.push(
            enrichWithIMFData(env, countryName)
                .then((data: string | null) => { if (data) result.imf = data; })
                .catch(() => { })
        );
    }

    if (opts.includeTrade) {
        promises.push(
            enrichWithTradeData(env, countryName)
                .then((data: string | null) => { if (data) result.trade = data; })
                .catch(() => { })
        );
    }

    if (opts.includeWeather) {
        promises.push(
            enrichWithWeatherData(env, countryName, sector)
                .then((data: string | null) => { if (data) result.weather = data; })
                .catch(() => { })
        );
    }

    if (opts.includeResearch) {
        promises.push(
            enrichWithResearchData(env, countryName, sector)
                .then((data: string | null) => { if (data) result.research = data; })
                .catch(() => { })
        );
    }

    if (opts.includePressReleases) {
        promises.push(
            enrichWithPressReleases(env, countryName, sector)
                .then((data: string | null) => { if (data) result.pressReleases = data; })
                .catch(() => { })
        );
    }

    if (opts.includeWikipedia) {
        promises.push(
            enrichWithWikiContext(env, { title: countryName, country_code: null, sector_id: null })
                .then((data: any) => {
                    if (data && data.country_context) {
                        result.wikipedia = `**Context**: ${data.country_context.description || data.country_context.extract?.slice(0, 200)}...`;
                    }
                })
                .catch(() => { })
        );
    }

    if (opts.includeCommodities) {
        promises.push(
            getCommodityPrices(env)
                .then((data: any[]) => {
                    if (data && data.length > 0) {
                        const formatted = data.slice(0, 4)
                            .map((v: any) => `${v.name}: $${v.price.toFixed(2)}`)
                            .join(', ');
                        result.commodities = `**Commodities**: ${formatted}`;
                    }
                })
                .catch(() => { })
        );
    }

    if (opts.includeCurrencies) {
        promises.push(
            getCurrencyRates(env)
                .then((data: any[]) => {
                    if (data) {
                        // Find the relevant country's currency
                        const countryToCurrency: Record<string, string> = {
                            'Nigeria': 'NGN', 'South Africa': 'ZAR', 'Kenya': 'KES',
                            'Egypt': 'EGP', 'Ghana': 'GHS', 'Morocco': 'MAD',
                        };
                        const currencyCode = countryToCurrency[countryName];
                        const rate = data.find((r: any) => r.code === currencyCode);

                        if (rate) {
                            result.currencies = `**Exchange Rate**: 1 USD = ${rate.rate_to_usd.toFixed(2)} ${currencyCode}`;
                        }
                    }
                })
                .catch(() => { })
        );
    }

    if (opts.includeDevelopment) {
        promises.push(
            getHDIData(env, countryName)
                .then((data: any) => {
                    if (data) {
                        result.development = `**Human Development**: HDI ${data.hdi?.toFixed(3) || 'N/A'} (Rank #${data.hdi_rank || 'N/A'})`;
                    }
                })
                .catch(() => { })
        );
    }

    await Promise.all(promises);
    return result;
}

/**
 * Format enrichment result as markdown for article
 */
export function formatEnrichmentForArticle(enrichment: EnrichmentResult): string {
    const sections: string[] = [];

    if (enrichment.economic) sections.push(enrichment.economic);
    if (enrichment.imf) sections.push(enrichment.imf);
    if (enrichment.trade) sections.push(enrichment.trade);
    if (enrichment.development) sections.push(enrichment.development);
    if (enrichment.weather) sections.push(enrichment.weather);
    if (enrichment.commodities) sections.push(enrichment.commodities);
    if (enrichment.currencies) sections.push(enrichment.currencies);
    if (enrichment.research) sections.push(enrichment.research);
    if (enrichment.pressReleases) sections.push(enrichment.pressReleases);
    if (enrichment.wikipedia) sections.push(enrichment.wikipedia);

    if (sections.length === 0) return '';

    return '\n\n---\n\n### Intelligence Brief\n\n' + sections.join('\n\n');
}

/**
 * Get number of enrichment sources available
 */
export function countEnrichmentSources(enrichment: EnrichmentResult): number {
    return Object.values(enrichment).filter(v => v !== undefined).length;
}

/**
 * Quick enrichment - only essential data sources
 */
export async function quickEnrich(
    env: Env,
    countryName: string
): Promise<string> {
    const enrichment = await enrichArticle(env, countryName, undefined, {
        includeEconomic: true,
        includeIMF: false,
        includeTrade: false,
        includeWeather: false,
        includeResearch: false,
        includePressReleases: true,
        includeWikipedia: false,
        includeCommodities: false,
        includeCurrencies: false,
        includeDevelopment: true,
    });

    return formatEnrichmentForArticle(enrichment);
}

/**
 * Full enrichment - all available sources
 */
export async function fullEnrich(
    env: Env,
    countryName: string,
    sector?: string
): Promise<string> {
    const enrichment = await enrichArticle(env, countryName, sector, {
        includeEconomic: true,
        includeIMF: true,
        includeTrade: true,
        includeWeather: true,
        includeResearch: true,
        includePressReleases: true,
        includeWikipedia: true,
        includeCommodities: true,
        includeCurrencies: true,
        includeDevelopment: true,
    });

    return formatEnrichmentForArticle(enrichment);
}
