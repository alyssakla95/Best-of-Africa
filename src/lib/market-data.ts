// ═══════════════════════════════════════════════════════════════════════════════
// MARKET DATA SERVICE
// Free commodity prices, currencies, and stock indices
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached } from './cache';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export interface CommodityPrice {
    name: string;
    symbol: string;
    price: number;
    currency: 'USD';
    change_24h: number;
    change_percent: number;
    updated_at: string;
}

export interface CurrencyRate {
    code: string;
    name: string;
    rate_to_usd: number;
    updated_at: string;
}

export interface StockIndex {
    name: string;
    country_code: string;
    value: number;
    change: number;
    change_percent: number;
    updated_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// African Commodities (Key exports)
// ───────────────────────────────────────────────────────────────────────────────
const AFRICAN_COMMODITIES = [
    { name: 'Gold', symbol: 'XAU' },
    { name: 'Crude Oil (Brent)', symbol: 'BRENT' },
    { name: 'Cocoa', symbol: 'CC' },
    { name: 'Coffee', symbol: 'KC' },
    { name: 'Copper', symbol: 'HG' },
    { name: 'Platinum', symbol: 'XPT' },
    { name: 'Diamonds', symbol: 'DIA' },
    { name: 'Natural Gas', symbol: 'NG' },
];

// ───────────────────────────────────────────────────────────────────────────────
// Fetch Commodity Prices (Free API)
// ───────────────────────────────────────────────────────────────────────────────
export async function getCommodityPrices(env: Env): Promise<CommodityPrice[]> {
    return getCached(
        env,
        'commodities:all',
        async () => {
            const prices: CommodityPrice[] = [];

            try {
                // metals.live free spot-price feed; an empty result is
                // returned on failure — never fabricated prices.
                const response = await fetch(
                    'https://api.metals.live/v1/spot',
                    { headers: { 'Accept': 'application/json' } }
                );

                if (response.ok) {
                    const data = await response.json() as any[];

                    // Map to our format
                    for (const item of data) {
                        const commodity = AFRICAN_COMMODITIES.find(c =>
                            c.symbol === item.symbol || c.name.toLowerCase().includes(item.name?.toLowerCase())
                        );

                        if (commodity) {
                            prices.push({
                                name: commodity.name,
                                symbol: commodity.symbol,
                                price: item.price || item.value,
                                currency: 'USD',
                                change_24h: item.change || 0,
                                change_percent: item.changePercent || 0,
                                updated_at: new Date().toISOString(),
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch commodity prices:', error);
            }

            // Fallback: Return empty if API fails (no mock data)
            if (prices.length === 0) {
                return [];
            }

            return prices;
        },
        { ttl: 3600 } // Cache for 1 hour
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// African Currencies
// ───────────────────────────────────────────────────────────────────────────────
const AFRICAN_CURRENCIES = [
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'NGN', name: 'Nigerian Naira' },
    { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'MAD', name: 'Moroccan Dirham' },
    { code: 'TZS', name: 'Tanzanian Shilling' },
    { code: 'UGX', name: 'Ugandan Shilling' },
    { code: 'XOF', name: 'CFA Franc BCEAO' },
    { code: 'XAF', name: 'CFA Franc BEAC' },
    { code: 'ETB', name: 'Ethiopian Birr' },
    { code: 'RWF', name: 'Rwandan Franc' },
    { code: 'AOA', name: 'Angolan Kwanza' },
    { code: 'MZN', name: 'Mozambican Metical' },
];

// ───────────────────────────────────────────────────────────────────────────────
// Fetch Currency Rates (Free API)
// ───────────────────────────────────────────────────────────────────────────────
export async function getCurrencyRates(env: Env): Promise<CurrencyRate[]> {
    return getCached(
        env,
        'currencies:african',
        async () => {
            const rates: CurrencyRate[] = [];

            try {
                // Using exchangerate.host (free, no key required)
                const symbols = AFRICAN_CURRENCIES.map(c => c.code).join(',');
                const response = await fetch(
                    `https://api.exchangerate.host/latest?base=USD&symbols=${symbols}`,
                    { headers: { 'Accept': 'application/json' } }
                );

                if (response.ok) {
                    const data = await response.json() as { rates: Record<string, number> };

                    for (const currency of AFRICAN_CURRENCIES) {
                        if (data.rates[currency.code]) {
                            rates.push({
                                code: currency.code,
                                name: currency.name,
                                rate_to_usd: data.rates[currency.code],
                                updated_at: new Date().toISOString(),
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch currency rates:', error);
            }

            return rates;
        },
        { ttl: 3600 } // Cache for 1 hour
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// African Stock Indices
// ───────────────────────────────────────────────────────────────────────────────
const AFRICAN_INDICES = [
    { name: 'JSE All Share', country_code: 'ZA' },
    { name: 'NGX All Share', country_code: 'NG' },
    { name: 'NSE 20', country_code: 'KE' },
    { name: 'EGX 30', country_code: 'EG' },
    { name: 'GSE Composite', country_code: 'GH' },
    { name: 'BRVM Composite', country_code: 'CI' },
];

export async function getStockIndices(env: Env): Promise<StockIndex[]> {
    return getCached(
        env,
        'stocks:african_indices',
        async () => {
            // Pending integration with live stock API
            return [];
        },
        { ttl: 3600 }
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Market Summary for Country Articles
// ───────────────────────────────────────────────────────────────────────────────
export async function getCountryMarketData(
    env: Env,
    countryCode: string
): Promise<{
    currency: CurrencyRate | null;
    index: StockIndex | null;
    commodities: CommodityPrice[];
}> {
    const currencyMap: Record<string, string> = {
        ZA: 'ZAR', NG: 'NGN', EG: 'EGP', KE: 'KES', GH: 'GHS',
        MA: 'MAD', TZ: 'TZS', UG: 'UGX', ET: 'ETB', RW: 'RWF',
        AO: 'AOA', MZ: 'MZN',
    };

    const [currencies, indices, commodities] = await Promise.all([
        getCurrencyRates(env),
        getStockIndices(env),
        getCommodityPrices(env),
    ]);

    const currencyCode = currencyMap[countryCode];
    const currency = currencies.find(c => c.code === currencyCode) || null;
    const index = indices.find(i => i.country_code === countryCode) || null;

    return {
        currency,
        index,
        commodities: commodities.slice(0, 4), // Top 4 commodities
    };
}
