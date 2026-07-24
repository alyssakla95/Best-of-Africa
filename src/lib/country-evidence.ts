import type { Env } from '../types';
import { getCountryEconomicProfile, type CountryEconomicProfile } from './economics';
import { fetchIMFData, type IMFEconomicData } from './imf-data';
import { getTradeBalance, type TradeBalance } from './trade-data';

export const COUNTRY_EVIDENCE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const CACHE_PREFIX = 'country-evidence:v3:';
const CURSOR_KEY = 'country-evidence:v3:refresh-cursor';

export interface ProviderFreshness {
    provider: string;
    source_url: string;
    checked_at: string;
    observation_period: string;
    state: 'current_snapshot' | 'last_verified_snapshot' | 'checked_no_series';
}

export interface CountryEvidenceSnapshot {
    macroeconomics: {
        official_profile: CountryEconomicProfile;
        /** @deprecated Compatibility alias; inspect source_name before assuming the provider. */
        world_bank: CountryEconomicProfile;
        imf_current: Record<string, unknown>;
        imf_gdp_growth: Record<string, unknown>;
        imf_debt: Record<string, unknown>;
    };
    trade: ((TradeBalance & {
        kind: 'reported_totals';
        provider: 'UN Comtrade' | 'World Bank World Development Indicators';
        export_year?: number;
        import_year?: number;
    }) | IMFExternalBalanceEvidence);
    freshness: ProviderFreshness[];
    retrieved_at: string;
}

export interface IMFExternalBalanceEvidence {
    kind: 'external_balance';
    country: string;
    year: number;
    current_account_percent_gdp?: number;
    current_account_usd?: number;
    period_status: 'historical_observation' | 'estimate_or_projection';
    provider: 'IMF World Economic Outlook';
    source_name: 'IMF World Economic Outlook';
    source_url: string;
    retrieved_at: string;
}

type CountryRecord = {
    code: string;
    name: string;
};

export const countryEvidenceCacheKey = (code: string) => `${CACHE_PREFIX}${code.toUpperCase()}`;

export function isCountryEvidenceStale(snapshot: CountryEvidenceSnapshot, now = Date.now()): boolean {
    const retrieved = Date.parse(snapshot.retrieved_at);
    return !Number.isFinite(retrieved) || now - retrieved > COUNTRY_EVIDENCE_MAX_AGE_MS;
}

export async function readCountryEvidence(env: Env, code: string): Promise<CountryEvidenceSnapshot | null> {
    const stored = await env.CACHE.get(countryEvidenceCacheKey(code), 'json') as CountryEvidenceSnapshot | null;
    if (!stored) return null;

    // Normalize snapshots assembled before official_profile/kind were added.
    const legacy = stored as CountryEvidenceSnapshot & {
        macroeconomics: CountryEvidenceSnapshot['macroeconomics'] & { official_profile?: CountryEconomicProfile };
        trade: CountryEvidenceSnapshot['trade'] & { kind?: 'reported_totals' };
    };
    if (!legacy.macroeconomics.official_profile && legacy.macroeconomics.world_bank) {
        legacy.macroeconomics.official_profile = legacy.macroeconomics.world_bank;
    }
    if (!legacy.macroeconomics.official_profile) return null;
    legacy.trade.kind ||= 'reported_totals';
    return legacy;
}

function latestObservationPeriod(profile: CountryEconomicProfile): string {
    const years = profile.indicators.map((indicator) => indicator.year).filter(Number.isFinite);
    return years.length ? `${Math.min(...years)}-${Math.max(...years)}` : 'provider metadata only';
}

export function worldBankTradeFallback(profile: CountryEconomicProfile): CountryEvidenceSnapshot['trade'] | null {
    const exports = profile.indicators.find((indicator) => indicator.code === 'NE.EXP.GNFS.CD');
    const imports = profile.indicators.find((indicator) => indicator.code === 'NE.IMP.GNFS.CD');
    if (!exports || !imports || exports.value === null || imports.value === null) return null;

    const year = Math.min(exports.year, imports.year);
    return {
        kind: 'reported_totals',
        country: profile.country_name,
        year,
        totalExports: exports.value,
        totalImports: imports.value,
        balance: exports.value - imports.value,
        topExportPartners: [],
        topImportPartners: [],
        topExportCommodities: [],
        topImportCommodities: [],
        source_name: 'World Bank World Development Indicators',
        source_url: 'https://data.worldbank.org/indicator/NE.EXP.GNFS.CD',
        retrieved_at: profile.last_updated,
        provider: 'World Bank World Development Indicators',
        export_year: exports.year,
        import_year: imports.year,
    };
}

const IMF_WEO_URL = 'https://www.imf.org/external/datamapper/datasets/WEO';

export function imfEconomicProfile(
    data: IMFEconomicData,
    countryCode: string,
    retrievedAt: string,
): CountryEconomicProfile | null {
    const sourceUrl = `https://www.imf.org/external/datamapper/profile/${data.countryCode}`;
    const definitions: Array<[string, string, number | undefined, string, number]> = [
        ['NGDPD', 'GDP, current prices', data.gdpBillions, 'USD', 1_000_000_000],
        ['NGDP_RPCH', 'Real GDP growth', data.gdpGrowth, '%', 1],
        ['NGDPDPC', 'GDP per capita, current prices', data.gdpPerCapita, 'USD per person', 1],
        ['PCPIPCH', 'Inflation, average consumer prices', data.inflation, '%', 1],
        ['LUR', 'Unemployment rate', data.unemployment, '%', 1],
        ['GGXWDG_NGDP', 'General government gross debt', data.debtToGDP, '% of GDP', 1],
        ['BCA_NGDPD', 'Current account balance', data.currentAccountBalance, '% of GDP', 1],
        ['BCA', 'Current account balance', data.currentAccountBillions, 'USD', 1_000_000_000],
        ['LP', 'Population', data.populationMillions, 'people', 1_000_000],
        ['GGXCNL_NGDP', 'General government net lending/borrowing', data.netLendingToGDP, '% of GDP', 1],
    ];
    const indicators = definitions.flatMap(([code, name, value, unit, multiplier]) =>
        typeof value === 'number' && Number.isFinite(value) ? (() => {
            const indicatorYear = data.indicatorYears?.[code] || data.year;
            const periodStatus = indicatorYear >= new Date(retrievedAt).getUTCFullYear()
                ? 'estimate_or_projection' as const
                : 'historical_observation' as const;
            return [{ code, name, value: value * multiplier, year: indicatorYear, unit, source_url: sourceUrl, period_status: periodStatus }];
        })() : []
    );
    if (!indicators.length) return null;
    return {
        country_code: countryCode.toUpperCase(),
        country_name: data.country,
        indicators,
        last_updated: retrievedAt,
        source_name: 'IMF World Economic Outlook',
        source_url: sourceUrl,
    };
}

export function imfExternalBalanceFallback(
    data: IMFEconomicData,
    retrievedAt: string,
): IMFExternalBalanceEvidence | null {
    if (data.currentAccountBalance === undefined && data.currentAccountBillions === undefined) return null;
    const periodYear = data.indicatorYears?.BCA_NGDPD || data.indicatorYears?.BCA || data.year;
    return {
        kind: 'external_balance',
        country: data.country,
        year: periodYear,
        ...(data.currentAccountBalance !== undefined ? { current_account_percent_gdp: data.currentAccountBalance } : {}),
        ...(data.currentAccountBillions !== undefined ? { current_account_usd: data.currentAccountBillions * 1_000_000_000 } : {}),
        period_status: periodYear >= new Date(retrievedAt).getUTCFullYear() ? 'estimate_or_projection' : 'historical_observation',
        provider: 'IMF World Economic Outlook',
        source_name: 'IMF World Economic Outlook',
        source_url: `https://www.imf.org/external/datamapper/profile/${data.countryCode}`,
        retrieved_at: retrievedAt,
    };
}

function checkedNoSeries(provider: string, sourceUrl: string, checkedAt: string): Record<string, unknown> {
    return {
        provider,
        source_url: sourceUrl,
        checked_at: checkedAt,
        observation_status: 'The provider was checked; no numeric series was substituted or estimated.',
    };
}

export async function refreshCountryEvidence(
    env: Env,
    country: CountryRecord,
    options: { fast?: boolean } = {},
): Promise<CountryEvidenceSnapshot | null> {
    const previous = await readCountryEvidence(env, country.code);
    const checkedAt = new Date().toISOString();

    const [worldBankResult, imfResult, tradeResult] = await Promise.allSettled([
        options.fast ? Promise.resolve(null) : getCountryEconomicProfile(env, country.code, { refresh: true }),
        fetchIMFData(env, country.name, undefined, { refresh: true, timeoutMs: 8000, criticalOnly: options.fast }),
        options.fast ? Promise.resolve(null) : getTradeBalance(env, country.name, undefined, { refresh: true, lookbackYears: 6, timeoutMs: 7000 }),
    ]);

    const freshWorldBank = worldBankResult.status === 'fulfilled' ? worldBankResult.value : null;
    const freshIMF = imfResult.status === 'fulfilled' ? imfResult.value : null;
    const freshIMFProfile = freshIMF ? imfEconomicProfile(freshIMF, country.code, checkedAt) : null;
    const previousWorldBank = previous?.macroeconomics.world_bank?.source_name === 'World Bank World Development Indicators'
        ? previous.macroeconomics.world_bank
        : null;
    const worldBank = freshWorldBank || previousWorldBank;
    const officialProfile = freshWorldBank
        || freshIMFProfile
        || previous?.macroeconomics.official_profile
        || worldBank;
    if (!officialProfile) return previous;

    const freshTrade = tradeResult.status === 'fulfilled' ? tradeResult.value : null;
    const trade = freshTrade
        ? { ...freshTrade, kind: 'reported_totals' as const, provider: 'UN Comtrade' as const }
        : (worldBank ? worldBankTradeFallback(worldBank) : null)
            || (freshIMF ? imfExternalBalanceFallback(freshIMF, checkedAt) : null)
            || previous?.trade;
    if (!trade) return previous;

    const current = freshIMF
        ? freshIMF as unknown as Record<string, unknown>
        : previous?.macroeconomics.imf_current || checkedNoSeries('IMF World Economic Outlook', IMF_WEO_URL, checkedAt);
    const forecast = freshIMF?.gdpGrowth !== undefined
        ? { country: country.name, year: freshIMF.year, value: freshIMF.gdpGrowth, period_status: freshIMFProfile?.indicators[0]?.period_status }
        : previous?.macroeconomics.imf_gdp_growth || checkedNoSeries('IMF World Economic Outlook', IMF_WEO_URL, checkedAt);
    const debt = freshIMF?.debtToGDP !== undefined
        ? { country: country.name, year: freshIMF.year, debtToGDP: freshIMF.debtToGDP, period_status: freshIMFProfile?.indicators[0]?.period_status }
        : previous?.macroeconomics.imf_debt || checkedNoSeries('IMF World Economic Outlook', IMF_WEO_URL, checkedAt);

    const snapshot: CountryEvidenceSnapshot = {
        macroeconomics: {
            official_profile: officialProfile,
            // Retain the legacy field through the backend-first rollout. Its
            // source_name tells older clients whether IMF supplied the profile.
            world_bank: worldBank || officialProfile,
            imf_current: current,
            imf_gdp_growth: forecast,
            imf_debt: debt,
        },
        trade,
        freshness: [
            {
                provider: `${officialProfile.source_name} · macroeconomic profile`,
                source_url: officialProfile.source_url,
                checked_at: officialProfile.last_updated,
                observation_period: latestObservationPeriod(officialProfile),
                state: freshWorldBank || freshIMFProfile ? 'current_snapshot' : 'last_verified_snapshot',
            },
            {
                provider: `${trade.provider} · external-sector record`,
                source_url: trade.source_url,
                checked_at: trade.retrieved_at || checkedAt,
                observation_period: trade.kind === 'reported_totals' && trade.export_year && trade.import_year
                    ? `exports ${trade.export_year}; imports ${trade.import_year}`
                    : `${trade.year}${trade.kind === 'external_balance' && trade.period_status === 'estimate_or_projection' ? ' projection' : ''}`,
                state: freshTrade ? 'current_snapshot' : previous?.trade === trade ? 'last_verified_snapshot' : 'current_snapshot',
            },
            ...(officialProfile.source_name !== 'IMF World Economic Outlook' ? [{
                provider: 'IMF World Economic Outlook',
                source_url: IMF_WEO_URL,
                checked_at: checkedAt,
                observation_period: 'historical observations and separately labelled projections',
                state: freshIMF ? 'current_snapshot' as const : 'checked_no_series' as const,
            }] : []),
        ],
        retrieved_at: checkedAt,
    };

    await env.CACHE.put(countryEvidenceCacheKey(country.code), JSON.stringify(snapshot));
    return snapshot;
}

/** Refresh one country per cron turn so all 54 stay warm without a request fan-out. */
export async function refreshNextCountryEvidence(env: Env): Promise<void> {
    const countRow = await env.DB.prepare('SELECT COUNT(*) AS count FROM countries').first<{ count: number }>();
    const count = Number(countRow?.count || 0);
    if (!count) return;

    const rawCursor = await env.CACHE.get(CURSOR_KEY);
    const cursor = Number.parseInt(rawCursor || '0', 10) % count;
    const country = await env.DB.prepare('SELECT code, name FROM countries ORDER BY code ASC LIMIT 1 OFFSET ?')
        .bind(cursor)
        .first<CountryRecord>();
    if (!country) return;

    await refreshCountryEvidence(env, country);
    await env.CACHE.put(CURSOR_KEY, String((cursor + 1) % count));
}
