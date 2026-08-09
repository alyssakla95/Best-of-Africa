// ═══════════════════════════════════════════════════════════════════════════════
// ECONOMIC DATA SERVICE
// Fetches free economic indicators from World Bank API to enrich articles
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// World Bank API is completely free, no API key needed
const WORLD_BANK_API = 'https://api.worldbank.org/v2';

// Key indicators relevant to investors
const INDICATORS = {
    GDP: 'NY.GDP.MKTP.CD',                    // GDP (current US$)
    GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG',          // GDP growth (annual %)
    GDP_PER_CAPITA: 'NY.GDP.PCAP.CD',         // GDP per capita (current US$)
    POPULATION: 'SP.POP.TOTL',                 // Population, total
    INFLATION: 'FP.CPI.TOTL.ZG',              // Inflation, consumer prices (annual %)
    UNEMPLOYMENT: 'SL.UEM.TOTL.ZS',           // Unemployment, total (% of labor force)
    FDI_INFLOWS: 'BX.KLT.DINV.CD.WD',         // Foreign direct investment, net inflows (BoP, current US$)
    EXPORTS: 'NE.EXP.GNFS.CD',                // Exports of goods and services (current US$)
    IMPORTS: 'NE.IMP.GNFS.CD',                // Imports of goods and services (current US$)
    INTERNET_USERS: 'IT.NET.USER.ZS',         // Individuals using the Internet (% of population)
    MOBILE_SUBSCRIPTIONS: 'IT.CEL.SETS.P2',   // Mobile cellular subscriptions (per 100 people)
    FIXED_BROADBAND: 'IT.NET.BBND.P2',         // Fixed broadband subscriptions (per 100 people)
    ELECTRICITY_ACCESS: 'EG.ELC.ACCS.ZS',      // Access to electricity (% of population)
    URBAN_POPULATION: 'SP.URB.TOTL.IN.ZS',     // Urban population (% of total)
    LABOUR_PARTICIPATION: 'SL.TLF.CACT.ZS',    // Labour force participation (% ages 15+)
    WAGE_EMPLOYMENT: 'SL.EMP.WORK.ZS',         // Wage and salaried workers (% of employment)
    VULNERABLE_EMPLOYMENT: 'SL.EMP.VULN.ZS',  // Vulnerable employment (% of employment)
    PRIVATE_CREDIT: 'FS.AST.PRVT.GD.ZS',       // Bank credit to private sector (% of GDP)
    LENDING_RATE: 'FR.INR.LEND',               // Lending interest rate (%)
    EXCHANGE_RATE: 'PA.NUS.FCRF',              // Official exchange rate (LCU per US$)
    RESERVES: 'FI.RES.TOTL.CD',                 // Total reserves including gold (current US$)
    REMITTANCES: 'BX.TRF.PWKR.CD.DT',          // Personal remittances received (current US$)
    EXTERNAL_DEBT: 'DT.DOD.DECT.GN.ZS',        // External debt stocks (% of GNI)
    TRADE_OPENNESS: 'NE.TRD.GNFS.ZS',          // Trade (% of GDP)
    MANUFACTURING_SHARE: 'NV.IND.MANF.ZS',     // Manufacturing value added (% of GDP)
    BUSINESS_ENTRY_DENSITY: 'IC.BUS.NDNS.ZS',  // New business density (per 1,000 adults)
    LIFE_EXPECTANCY: 'SP.DYN.LE00.IN',          // Life expectancy at birth (years)
    BASIC_WATER: 'SH.H2O.BASW.ZS',             // Basic drinking water services (% of population)
    BASIC_SANITATION: 'SH.STA.BASS.ZS',         // Basic sanitation services (% of population)
};

type IndicatorCategory = 'Scale and demand' | 'Prices and labour' | 'Finance and external resilience' | 'Trade and production' | 'Infrastructure and digital access' | 'Human development';

export interface EconomicIndicator {
    code: string;
    name: string;
    value: number | null;
    year: number;
    unit: string;
    source_url: string;
    category?: IndicatorCategory;
    decision_use?: string;
    underlying_source?: string;
    underlying_source_url?: string;
    period_status?: 'historical_observation' | 'estimate_or_projection';
}

export interface CountryEconomicProfile {
    country_code: string;
    country_name: string;
    indicators: EconomicIndicator[];
    last_updated: string;
    source_name: 'World Bank World Development Indicators' | 'IMF World Economic Outlook';
    source_url: string;
}

const fetchWithTimeout = async (url: string, timeoutMs = 8000): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

// ───────────────────────────────────────────────────────────────────────────────
// Fetch Single Indicator
// ───────────────────────────────────────────────────────────────────────────────
async function fetchIndicator(
    countryCode: string,
    indicatorCode: string
): Promise<{ value: number | null; year: number } | null> {
    try {
        // MRNEV means "most recent non-empty value". MRV can return the latest
        // calendar row even when its value is null, hiding a valid older release.
        const url = `${WORLD_BANK_API}/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=1&mrnev=1`;
        const response = await fetchWithTimeout(url);

        if (!response.ok) return null;

        const data = await response.json() as any[];

        // World Bank API returns [metadata, data]
        if (!data || data.length < 2 || !data[1] || data[1].length === 0) {
            return null;
        }

        const record = data[1][0];
        return {
            value: record.value,
            year: parseInt(record.date),
        };
    } catch (error) {
        console.error(`Failed to fetch indicator ${indicatorCode} for ${countryCode}:`, error);
        return null;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Full Economic Profile for Country (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
export async function getCountryEconomicProfile(
    env: Env,
    countryCode: string,
    options: { refresh?: boolean } = {},
): Promise<CountryEconomicProfile | null> {
    const normalizedCode = countryCode.toUpperCase();
    const cacheKey = `economic:v3:${normalizedCode}`;
    if (!options.refresh) {
        const cached = await env.CACHE.get(cacheKey, 'json') as CountryEconomicProfile | null;
        if (cached) return cached;
    }

    try {
            // Fetch country name
            const countryResponse = await fetchWithTimeout(`${WORLD_BANK_API}/country/${normalizedCode}?format=json`);

            let countryName = normalizedCode;
            if (countryResponse.ok) {
                const countryData = await countryResponse.json() as any[];
                if (countryData && countryData[1] && countryData[1][0]) {
                    countryName = countryData[1][0].name;
                }
            }

            // Fetch all indicators in parallel
            const indicatorPromises = Object.entries(INDICATORS).map(async ([name, code]) => {
                const result = await fetchIndicator(normalizedCode, code);
                return {
                    code,
                    name: formatIndicatorName(name),
                    value: result?.value ?? null,
                    year: result?.year ?? new Date().getFullYear(),
                    unit: getIndicatorUnit(name),
                    source_url: `https://data.worldbank.org/indicator/${code}?locations=${normalizedCode}`,
                    category: getIndicatorCategory(name),
                    decision_use: getIndicatorDecisionUse(name),
                    ...getIndicatorUnderlyingSource(name),
                };
            });

            const indicators = await Promise.all(indicatorPromises);
            const verifiedIndicators = indicators.filter(i => i.value !== null);
            if (!verifiedIndicators.length) {
                return await env.CACHE.get(cacheKey, 'json') as CountryEconomicProfile | null;
            }

            const profile: CountryEconomicProfile = {
                country_code: normalizedCode,
                country_name: countryName,
                indicators: verifiedIndicators,
                last_updated: new Date().toISOString(),
                source_name: 'World Bank World Development Indicators' as const,
                source_url: `https://data.worldbank.org/?locations=${normalizedCode}`,
            };
            // Keep a last-known-good official snapshot. Freshness is represented
            // by last_updated and the dossier refresh policy, not destructive TTL.
            await env.CACHE.put(cacheKey, JSON.stringify(profile));
            return profile;
    } catch (error) {
        console.error(`World Bank profile refresh failed for ${normalizedCode}:`, error);
        return await env.CACHE.get(cacheKey, 'json') as CountryEconomicProfile | null;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Key Stats for Article Enrichment
// ───────────────────────────────────────────────────────────────────────────────
export async function getKeyEconomicStats(
    env: Env,
    countryCode: string
): Promise<{
    gdp: string | null;
    gdp_growth: string | null;
    population: string | null;
    fdi: string | null;
} | null> {
    const profile = await getCountryEconomicProfile(env, countryCode);
    if (!profile) return null;

    const findIndicator = (code: string) =>
        profile.indicators.find(i => i.code === code);

    const gdpIndicator = findIndicator(INDICATORS.GDP);
    const growthIndicator = findIndicator(INDICATORS.GDP_GROWTH);
    const popIndicator = findIndicator(INDICATORS.POPULATION);
    const fdiIndicator = findIndicator(INDICATORS.FDI_INFLOWS);

    return {
        gdp: gdpIndicator?.value ? formatCurrency(gdpIndicator.value) : null,
        gdp_growth: growthIndicator?.value ? `${growthIndicator.value.toFixed(1)}%` : null,
        population: popIndicator?.value ? formatNumber(popIndicator.value) : null,
        fdi: fdiIndicator?.value ? formatCurrency(fdiIndicator.value) : null,
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function formatIndicatorName(key: string): string {
    const names: Record<string, string> = {
        GDP: 'GDP',
        GDP_GROWTH: 'GDP Growth',
        GDP_PER_CAPITA: 'GDP per Capita',
        POPULATION: 'Population',
        INFLATION: 'Inflation Rate',
        UNEMPLOYMENT: 'Unemployment Rate',
        FDI_INFLOWS: 'FDI Inflows',
        EXPORTS: 'Exports',
        IMPORTS: 'Imports',
        INTERNET_USERS: 'Internet Users',
        MOBILE_SUBSCRIPTIONS: 'Mobile Subscriptions',
        FIXED_BROADBAND: 'Fixed Broadband Subscriptions',
        ELECTRICITY_ACCESS: 'Electricity Access',
        URBAN_POPULATION: 'Urban Population Share',
        LABOUR_PARTICIPATION: 'Labour Force Participation',
        WAGE_EMPLOYMENT: 'Wage and Salaried Employment',
        VULNERABLE_EMPLOYMENT: 'Vulnerable Employment',
        PRIVATE_CREDIT: 'Bank Credit to the Private Sector',
        LENDING_RATE: 'Lending Interest Rate',
        EXCHANGE_RATE: 'Official Exchange Rate',
        RESERVES: 'International Reserves Including Gold',
        REMITTANCES: 'Personal Remittances Received',
        EXTERNAL_DEBT: 'External Debt Stock',
        TRADE_OPENNESS: 'Trade Openness',
        MANUFACTURING_SHARE: 'Manufacturing Share of Output',
        BUSINESS_ENTRY_DENSITY: 'Formal Business Entry Density',
        LIFE_EXPECTANCY: 'Life Expectancy at Birth',
        BASIC_WATER: 'Access to Basic Drinking Water',
        BASIC_SANITATION: 'Access to Basic Sanitation',
    };
    return names[key] || key;
}

function getIndicatorUnit(key: string): string {
    const units: Record<string, string> = {
        GDP: 'USD',
        GDP_GROWTH: '%',
        GDP_PER_CAPITA: 'USD',
        POPULATION: 'people',
        INFLATION: '%',
        UNEMPLOYMENT: '%',
        FDI_INFLOWS: 'USD',
        EXPORTS: 'USD',
        IMPORTS: 'USD',
        INTERNET_USERS: '%',
        MOBILE_SUBSCRIPTIONS: 'per 100',
        FIXED_BROADBAND: 'per 100',
        ELECTRICITY_ACCESS: '%',
        URBAN_POPULATION: '%',
        LABOUR_PARTICIPATION: '%',
        WAGE_EMPLOYMENT: '% of employment',
        VULNERABLE_EMPLOYMENT: '% of employment',
        PRIVATE_CREDIT: '% of GDP',
        LENDING_RATE: '%',
        EXCHANGE_RATE: 'local currency per US$',
        RESERVES: 'USD',
        REMITTANCES: 'USD',
        EXTERNAL_DEBT: '% of GNI',
        TRADE_OPENNESS: '% of GDP',
        MANUFACTURING_SHARE: '% of GDP',
        BUSINESS_ENTRY_DENSITY: 'per 1,000 adults',
        LIFE_EXPECTANCY: 'years',
        BASIC_WATER: '%',
        BASIC_SANITATION: '%',
    };
    return units[key] || '';
}

function getIndicatorCategory(key: string): IndicatorCategory {
    if (['GDP', 'GDP_GROWTH', 'GDP_PER_CAPITA', 'POPULATION', 'URBAN_POPULATION'].includes(key)) return 'Scale and demand';
    if (['INFLATION', 'UNEMPLOYMENT', 'LABOUR_PARTICIPATION', 'WAGE_EMPLOYMENT', 'VULNERABLE_EMPLOYMENT'].includes(key)) return 'Prices and labour';
    if (['FDI_INFLOWS', 'PRIVATE_CREDIT', 'LENDING_RATE', 'EXCHANGE_RATE', 'RESERVES', 'REMITTANCES', 'EXTERNAL_DEBT'].includes(key)) return 'Finance and external resilience';
    if (['EXPORTS', 'IMPORTS', 'TRADE_OPENNESS', 'MANUFACTURING_SHARE', 'BUSINESS_ENTRY_DENSITY'].includes(key)) return 'Trade and production';
    if (['INTERNET_USERS', 'MOBILE_SUBSCRIPTIONS', 'FIXED_BROADBAND', 'ELECTRICITY_ACCESS'].includes(key)) return 'Infrastructure and digital access';
    return 'Human development';
}

function getIndicatorDecisionUse(key: string): string {
    const uses: Record<string, string> = {
        GDP: 'Recorded economic scale; combine with sector and household evidence before estimating demand.',
        GDP_GROWTH: 'Direction of real output; inspect sector composition and revisions before using it in a forecast.',
        GDP_PER_CAPITA: 'Broad income proxy; it is not household disposable income or market affordability.',
        POPULATION: 'Population scale; segment by age, income, location and formality before sizing customers.',
        URBAN_POPULATION: 'Potential geographic concentration of customers, workers and infrastructure demand.',
        INFLATION: 'Purchasing-power and operating-cost pressure; test pricing and wage assumptions separately.',
        UNEMPLOYMENT: 'Labour under-utilisation; it does not directly establish skill availability or wage cost.',
        LABOUR_PARTICIPATION: 'Share of working-age people active in the labour market.',
        WAGE_EMPLOYMENT: 'Approximate formal employment depth and payroll-market structure.',
        VULNERABLE_EMPLOYMENT: 'Exposure to own-account and contributing-family work; useful for informality risk.',
        FDI_INFLOWS: 'Recorded external investment flows; separate greenfield projects, acquisitions and exceptional transactions.',
        PRIVATE_CREDIT: 'Depth of bank financing to private activity relative to output.',
        LENDING_RATE: 'Indicative domestic borrowing cost before borrower, tenor and inflation adjustments.',
        EXCHANGE_RATE: 'Conversion reference for local-currency costs; volatility requires a separate time series.',
        RESERVES: 'External liquidity buffer; assess against imports, short-term debt and the exchange-rate regime.',
        REMITTANCES: 'Household external inflows that may support consumption and foreign-exchange availability.',
        EXTERNAL_DEBT: 'External leverage relative to national income; maturity, currency and creditor structure remain material.',
        EXPORTS: 'Recorded foreign demand for goods and services; identify products, partners and domestic value added.',
        IMPORTS: 'Recorded external sourcing and domestic demand; identify critical inputs and currency exposure.',
        TRADE_OPENNESS: 'Cross-border trade intensity relative to output, not the ease or profitability of a particular route.',
        MANUFACTURING_SHARE: 'Manufacturing weight in recorded output; subsector capacity and margins require direct evidence.',
        BUSINESS_ENTRY_DENSITY: 'Rate of new limited-liability registrations, useful as a formalisation signal rather than a survival measure.',
        INTERNET_USERS: 'Digital reach; affordability, quality, device access and commercial usage require separate checks.',
        MOBILE_SUBSCRIPTIONS: 'Connectivity penetration; multiple SIM ownership means subscriptions are not unique users.',
        FIXED_BROADBAND: 'Fixed connectivity depth relevant to enterprises, cloud services and data-intensive operations.',
        ELECTRICITY_ACCESS: 'Population access to electricity; reliability, capacity, tariff and quality remain separate constraints.',
        LIFE_EXPECTANCY: 'Broad health and living-conditions outcome, not a direct measure of health-system capacity.',
        BASIC_WATER: 'Coverage of basic drinking-water services relevant to workforce welfare and infrastructure gaps.',
        BASIC_SANITATION: 'Coverage of basic sanitation services relevant to public health and infrastructure demand.',
    };
    return uses[key] || 'Use with its stated year, unit, coverage and source limitation.';
}

function getIndicatorUnderlyingSource(key: string): { underlying_source: string; underlying_source_url: string } {
    if (['INTERNET_USERS', 'FIXED_BROADBAND', 'MOBILE_SUBSCRIPTIONS'].includes(key)) return {
        underlying_source: 'International Telecommunication Union World Telecommunication/ICT Indicators Database',
        underlying_source_url: 'https://datahub.itu.int/',
    };
    if (['UNEMPLOYMENT', 'LABOUR_PARTICIPATION', 'WAGE_EMPLOYMENT', 'VULNERABLE_EMPLOYMENT'].includes(key)) return {
        underlying_source: 'International Labour Organization ILOSTAT modelled estimates',
        underlying_source_url: 'https://ilostat.ilo.org/data/',
    };
    if (['BASIC_WATER', 'BASIC_SANITATION'].includes(key)) return {
        underlying_source: 'WHO/UNICEF Joint Monitoring Programme for Water Supply, Sanitation and Hygiene',
        underlying_source_url: 'https://washdata.org/data',
    };
    if (key === 'RESERVES') return {
        underlying_source: 'International Monetary Fund International Financial Statistics',
        underlying_source_url: 'https://data.imf.org/',
    };
    if (key === 'BUSINESS_ENTRY_DENSITY') return {
        underlying_source: 'World Bank Entrepreneurship Database',
        underlying_source_url: 'https://www.worldbank.org/en/programs/entrepreneurship',
    };
    return {
        underlying_source: 'World Bank World Development Indicators',
        underlying_source_url: 'https://datatopics.worldbank.org/world-development-indicators/',
    };
}

function formatCurrency(value: number): string {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
}

// ───────────────────────────────────────────────────────────────────────────────
// Sector-Specific Stats
// ───────────────────────────────────────────────────────────────────────────────
const SECTOR_INDICATORS: Record<string, string[]> = {
    technology: ['INTERNET_USERS', 'MOBILE_SUBSCRIPTIONS'],
    finance: ['GDP', 'GDP_GROWTH', 'FDI_INFLOWS'],
    energy: ['GDP', 'EXPORTS', 'IMPORTS'],
    agriculture: ['GDP', 'POPULATION'],
    tourism: ['GDP', 'INTERNET_USERS'],
    infrastructure: ['ELECTRICITY_ACCESS', 'FIXED_BROADBAND', 'FDI_INFLOWS', 'URBAN_POPULATION'],
    manufacturing: ['GDP', 'EXPORTS', 'IMPORTS'],
    healthcare: ['GDP_PER_CAPITA', 'POPULATION'],
};

export async function getSectorRelevantStats(
    env: Env,
    countryCode: string,
    sectorId: string
): Promise<EconomicIndicator[]> {
    const profile = await getCountryEconomicProfile(env, countryCode);
    if (!profile) return [];

    const relevantIndicatorKeys = SECTOR_INDICATORS[sectorId] || ['GDP', 'GDP_GROWTH'];
    const relevantCodes = relevantIndicatorKeys.map(key => INDICATORS[key as keyof typeof INDICATORS]);

    return profile.indicators.filter(i => relevantCodes.includes(i.code));
}
