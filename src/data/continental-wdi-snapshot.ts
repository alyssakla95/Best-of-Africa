export type ContinentalIndicator = {
    indicator_code: string;
    label: string;
    value: number;
    unit: string;
    aggregation: 'sum' | 'country median' | 'derived balance';
    countries_reported: number;
    period_start: number;
    period_end: number;
    interpretation: string;
    caveat: string;
    source_url: string;
    category: 'Scale and demand' | 'Prices and labour' | 'Finance and external resilience' | 'Trade and production' | 'Infrastructure and digital access' | 'Human development';
    underlying_source: string;
    underlying_source_url: string;
};

type RegionalReading = { value: number; countries_reported: number; period_start: number; period_end: number };
export type ContinentalRegion = {
    region: string;
    country_count: number;
    gdp: RegionalReading;
    population: RegionalReading;
    growth: RegionalReading;
    inflation: RegionalReading;
    fdi: RegionalReading;
    investment: RegionalReading;
};

export type ContinentalCountryRank = {
    country_code: string;
    country_name: string;
    region: string;
    year: number;
    value: number;
};

const indicator = (
    indicator_code: string, label: string, value: number, unit: string,
    aggregation: ContinentalIndicator['aggregation'], countries_reported: number,
    period_start: number, period_end: number, interpretation: string, caveat: string,
): ContinentalIndicator => ({
    indicator_code, label, value, unit, aggregation, countries_reported, period_start, period_end,
    interpretation, caveat, source_url: `https://data.worldbank.org/indicator/${indicator_code.split('+')[0]}`,
    category: indicatorCategory(indicator_code),
    ...indicatorUnderlyingSource(indicator_code),
});

const indicatorCategory = (code: string): ContinentalIndicator['category'] => {
    if (['NY.GDP.MKTP.CD', 'SP.POP.TOTL', 'NY.GDP.MKTP.KD.ZG', 'NY.GDP.PCAP.CD', 'SP.URB.TOTL.IN.ZS'].includes(code)) return 'Scale and demand';
    if (['FP.CPI.TOTL.ZG', 'SL.TLF.CACT.ZS', 'SL.UEM.TOTL.ZS'].includes(code)) return 'Prices and labour';
    if (['BX.KLT.DINV.CD.WD', 'BN.CAB.XOKA.GD.ZS', 'FS.AST.PRVT.GD.ZS', 'FI.RES.TOTL.CD', 'BX.TRF.PWKR.CD.DT', 'DT.DOD.DECT.GN.ZS'].includes(code)) return 'Finance and external resilience';
    if (['NE.EXP.GNFS.CD', 'NE.IMP.GNFS.CD', 'NE.EXP.GNFS.CD+NE.IMP.GNFS.CD', 'NE.GDI.FTOT.ZS', 'NE.TRD.GNFS.ZS', 'NV.IND.MANF.ZS', 'IC.BUS.NDNS.ZS'].includes(code)) return 'Trade and production';
    if (['IT.NET.USER.ZS', 'IT.NET.BBND.P2', 'EG.ELC.ACCS.ZS'].includes(code)) return 'Infrastructure and digital access';
    return 'Human development';
};

const indicatorUnderlyingSource = (code: string): Pick<ContinentalIndicator, 'underlying_source' | 'underlying_source_url'> => {
    if (['IT.NET.USER.ZS', 'IT.NET.BBND.P2'].includes(code)) return { underlying_source: 'International Telecommunication Union World Telecommunication/ICT Indicators Database', underlying_source_url: 'https://datahub.itu.int/' };
    if (['SL.TLF.CACT.ZS', 'SL.UEM.TOTL.ZS'].includes(code)) return { underlying_source: 'International Labour Organization ILOSTAT modelled estimates', underlying_source_url: 'https://ilostat.ilo.org/data/' };
    if (['SH.H2O.BASW.ZS', 'SH.STA.BASS.ZS'].includes(code)) return { underlying_source: 'WHO/UNICEF Joint Monitoring Programme for Water Supply, Sanitation and Hygiene', underlying_source_url: 'https://washdata.org/data' };
    if (code === 'FI.RES.TOTL.CD') return { underlying_source: 'International Monetary Fund International Financial Statistics', underlying_source_url: 'https://data.imf.org/' };
    if (code === 'IC.BUS.NDNS.ZS') return { underlying_source: 'World Bank Entrepreneurship Database', underlying_source_url: 'https://www.worldbank.org/en/programs/entrepreneurship' };
    return { underlying_source: 'World Bank World Development Indicators', underlying_source_url: 'https://datatopics.worldbank.org/world-development-indicators/' };
};

const reading = (value: number, countries_reported: number, period_start: number, period_end: number): RegionalReading =>
    ({ value, countries_reported, period_start, period_end });
const rank = (country_code: string, country_name: string, region: string, year: number, value: number): ContinentalCountryRank =>
    ({ country_code, country_name, region, year, value });

export const CONTINENTAL_WDI_SNAPSHOT = {
    source_name: 'World Bank World Development Indicators' as const,
    source_url: 'https://datatopics.worldbank.org/world-development-indicators/' as const,
    retrieved_at: '2026-07-18T16:15:31.000Z',
    countries_in_scope: 54,
    methodology: 'Continental and regional totals sum each country’s latest verified observation; medians retain equal country weight and are not GDP-weighted. Each field carries its reporting-country count and observation range. Values from different years are never presented as a same-year national-accounts identity, and no indicator is converted into an investment score, forecast or recommendation.',
    indicators: [
        indicator('NY.GDP.MKTP.CD', 'Recorded economic output', 3146183362857.1, 'current US$', 'sum', 52, 2025, 2025, 'Sum of the latest reported nominal GDP values across African economies.', 'Current-dollar GDP is affected by inflation and exchange rates and does not measure welfare or investability.'),
        indicator('SP.POP.TOTL', 'Population represented', 1546877498, 'people', 'sum', 54, 2025, 2025, 'Total population across all 54 African countries in scope.', 'Population scale is not equivalent to addressable demand, purchasing power or formal-market size.'),
        indicator('NY.GDP.MKTP.KD.ZG', 'Median real GDP growth', 4.5, '%', 'country median', 52, 2025, 2025, 'The middle country-level real output growth reading across reporting economies.', 'A median gives each country equal weight and should not be read as continent-wide weighted growth.'),
        indicator('FP.CPI.TOTL.ZG', 'Median consumer inflation', 3.4, '%', 'country median', 51, 2019, 2025, 'The middle latest-reported annual consumer-price change across reporting economies.', 'Observation years vary and national CPI baskets, controls and measurement quality differ.'),
        indicator('BX.KLT.DINV.CD.WD', 'Recorded net FDI inflows', 64968236149.6, 'current US$', 'sum', 54, 2023, 2025, 'Sum of latest reported net foreign direct investment inflows.', 'FDI can be volatile, negative, transaction-driven or routed through holding structures; it is not committed project capital.'),
        indicator('NE.EXP.GNFS.CD', 'Recorded exports', 760615460683.4, 'current US$', 'sum', 49, 2023, 2025, 'Sum of latest reported exports of goods and services.', 'Different observation years and current-dollar valuation prevent a strict same-period continental total.'),
        indicator('NE.IMP.GNFS.CD', 'Recorded imports', 866805516288.3, 'current US$', 'sum', 49, 2023, 2025, 'Sum of latest reported imports of goods and services.', 'Different observation years and current-dollar valuation prevent a strict same-period continental total.'),
        indicator('NE.EXP.GNFS.CD+NE.IMP.GNFS.CD', 'Recorded trade difference', -106190055604.9, 'current US$', 'derived balance', 49, 2023, 2025, 'Exports less imports from the two recorded goods-and-services totals.', 'This is a derived cross-country record, not a synchronized continental balance-of-payments statement.'),
        indicator('NY.GDP.PCAP.CD', 'Median GDP per person', 1916, 'current US$ per person', 'country median', 52, 2025, 2025, 'The middle nominal GDP-per-capita reading across reporting economies.', 'GDP per person is not household income and conceals distribution, prices and informality.'),
        indicator('NE.GDI.FTOT.ZS', 'Median fixed-investment intensity', 21, '% of GDP', 'country median', 46, 2023, 2025, 'The middle gross fixed capital formation share across reporting countries.', 'The series combines public and private fixed assets and does not establish project quality or returns.'),
        indicator('BN.CAB.XOKA.GD.ZS', 'Median current-account balance', -3.5, '% of GDP', 'country median', 48, 2020, 2025, 'The middle external current-account position across reporting countries.', 'Observation years vary; deficits can reflect investment or vulnerability and require financing analysis.'),
        indicator('IT.NET.USER.ZS', 'Median internet use', 41.21139908, '% of population', 'country median', 51, 2025, 2025, 'The middle share of people using the internet across reporting African economies.', 'Usage does not establish connection quality, affordability, device access or commercial digital readiness.'),
        indicator('IT.NET.BBND.P2', 'Median fixed-broadband depth', 0.946513, 'subscriptions per 100 people', 'country median', 37, 2025, 2025, 'The middle fixed-broadband subscription rate across countries with a reported observation.', 'Subscriptions are not unique users; business-grade speed, resilience and cost require operator-level evidence.'),
        indicator('EG.ELC.ACCS.ZS', 'Median electricity access', 60.85, '% of population', 'country median', 54, 2025, 2025, 'The middle population-access rate across all African countries in scope.', 'Access does not measure reliability, available capacity, tariff, outage frequency or connection quality.'),
        indicator('SP.URB.TOTL.IN.ZS', 'Median urban population share', 45.699995, '% of population', 'country median', 54, 2025, 2025, 'The middle share of national populations living in urban areas.', 'Urban classification differs by country and is not a direct measure of income, density or addressable demand.'),
        indicator('SL.TLF.CACT.ZS', 'Median labour-force participation', 61.933, '% of population ages 15+', 'country median', 51, 2025, 2025, 'The middle labour-force participation rate across reporting economies.', 'Participation does not establish skill availability, productivity, formality, labour cost or underemployment.'),
        indicator('SL.UEM.TOTL.ZS', 'Median unemployment rate', 5.918, '% of labour force', 'country median', 51, 2025, 2025, 'The middle modelled unemployment reading across reporting African economies.', 'Definitions and informality matter; a low rate can coexist with underemployment and vulnerable work.'),
        indicator('FS.AST.PRVT.GD.ZS', 'Median private-sector bank credit', 19.7665001, '% of GDP', 'country median', 37, 2025, 2025, 'The middle bank-credit-to-private-sector ratio among reporting countries.', 'Credit depth does not establish access for a particular firm, borrower quality, pricing or non-bank finance.'),
        indicator('FI.RES.TOTL.CD', 'Recorded international reserves', 490612526690.1412, 'current US$', 'sum', 38, 2025, 2025, 'Sum of latest reported reserves including gold across countries with observations.', 'A cross-country sum is not a shared continental buffer; adequacy must be assessed against each country’s imports, debt and exchange-rate regime.'),
        indicator('BX.TRF.PWKR.CD.DT', 'Recorded personal remittances', 119154376848.43576, 'current US$', 'sum', 40, 2025, 2025, 'Sum of latest reported personal remittance receipts across reporting countries.', 'Channels, household distribution, informality and exchange-rate conversion differ; the total is not business revenue.'),
        indicator('DT.DOD.DECT.GN.ZS', 'Median external debt stock', 44.718837, '% of GNI', 'country median', 47, 2025, 2025, 'The middle external-debt-to-income ratio across reporting economies.', 'Maturity, currency, creditor, interest cost and public/private composition determine the practical risk.'),
        indicator('NE.TRD.GNFS.ZS', 'Median trade intensity', 61.5412453, '% of GDP', 'country median', 48, 2025, 2025, 'The middle exports-plus-imports share of GDP across reporting economies.', 'Trade intensity is not the ease, cost or profitability of a route and can be structurally high in small economies.'),
        indicator('NV.IND.MANF.ZS', 'Median manufacturing share', 9.101788, '% of GDP', 'country median', 44, 2025, 2025, 'The middle manufacturing value-added share across reporting economies.', 'This aggregate does not reveal subsector capability, capacity use, local content, productivity or margins.'),
        indicator('IC.BUS.NDNS.ZS', 'Median formal business-entry density', 1.060167, 'new registrations per 1,000 working-age people', 'country median', 40, 2025, 2025, 'The middle rate of new limited-liability registrations among reporting economies.', 'Registration is not survival, scale, informality reduction or proof that entry procedures are easy.'),
        indicator('SP.DYN.LE00.IN', 'Median life expectancy', 65.848, 'years', 'country median', 54, 2025, 2025, 'The middle life-expectancy-at-birth observation across all countries in scope.', 'This broad outcome is not a direct measure of workforce health, health-system capacity or a specific operating risk.'),
        indicator('SH.H2O.BASW.ZS', 'Median access to basic drinking water', 75.294796, '% of population', 'country median', 51, 2025, 2025, 'The middle population coverage of at least basic drinking-water services.', 'National access does not establish industrial water availability, continuity, quality or local network capacity.'),
        indicator('SH.STA.BASS.ZS', 'Median access to basic sanitation', 44.633989, '% of population', 'country median', 49, 2025, 2025, 'The middle population coverage of at least basic sanitation services.', 'National coverage can conceal large urban, rural and subnational gaps and does not establish service reliability.'),
    ],
    regions: [
        { region: 'North', country_count: 6, gdp: reading(1000424487515.9, 6, 2025, 2025), population: reading(275701352, 6, 2025, 2025), growth: reading(4.1, 6, 2025, 2025), inflation: reading(3.5, 6, 2022, 2025), fdi: reading(22099998294.2, 6, 2023, 2025), investment: reading(14.7, 6, 2024, 2025) },
        { region: 'West', country_count: 16, gdp: reading(718497633326.7, 16, 2025, 2025), population: reading(465397611, 16, 2025, 2025), growth: reading(5.9, 16, 2025, 2025), inflation: reading(1.9, 16, 2024, 2025), fdi: reading(16603674877.1, 16, 2024, 2025), investment: reading(22.3, 13, 2023, 2025) },
        { region: 'Central', country_count: 9, gdp: reading(348216076231.1, 9, 2025, 2025), population: reading(219525088, 9, 2025, 2025), growth: reading(3.1, 9, 2025, 2025), inflation: reading(2.7, 8, 2024, 2025), fdi: reading(6884983360, 9, 2024, 2025), investment: reading(16.4, 9, 2024, 2025) },
        { region: 'East', country_count: 14, gdp: reading(491766042890, 12, 2025, 2025), population: reading(415519249, 14, 2025, 2025), growth: reading(5.2, 12, 2025, 2025), inflation: reading(3.9, 12, 2024, 2025), fdi: reading(12477020227.6, 14, 2024, 2025), investment: reading(21, 11, 2025, 2025) },
        { region: 'Southern', country_count: 9, gdp: reading(587279122893.4, 9, 2025, 2025), population: reading(170734198, 9, 2025, 2025), growth: reading(1.9, 9, 2025, 2025), inflation: reading(4.3, 9, 2019, 2025), fdi: reading(6902559390.8, 9, 2024, 2025), investment: reading(21.5, 7, 2024, 2025) },
    ] as ContinentalRegion[],
    rankings: {
        largest_economies: [rank('ZA', 'South Africa', 'Southern', 2025, 427184325997.3), rank('EG', 'Egypt, Arab Republic of', 'North', 2025, 365254630179.7), rank('NG', 'Nigeria', 'West', 2025, 290794361542.1), rank('DZ', 'Algeria', 'North', 2025, 287031225987.7), rank('MA', 'Morocco', 'North', 2025, 182374250612.3), rank('KE', 'Kenya', 'East', 2025, 135941278878.8), rank('ET', 'Ethiopia', 'East', 2025, 126358758448.4), rank('AO', 'Angola', 'Central', 2025, 122174889423.6)],
        fastest_growth: [rank('LY', 'Libya', 'North', 2025, 13.4), rank('ET', 'Ethiopia', 'East', 2025, 9.8), rank('RW', 'Rwanda', 'East', 2025, 9.4), rank('ZW', 'Zimbabwe', 'Southern', 2025, 8.1), rank('BJ', 'Benin', 'West', 2025, 8.1), rank('GN', 'Guinea', 'West', 2025, 7.4), rank('NE', 'Niger', 'West', 2025, 7), rank('SN', 'Senegal', 'West', 2025, 6.7)],
        largest_fdi_inflows: [rank('EG', 'Egypt, Arab Republic of', 'North', 2025, 15452700000), rank('ET', 'Ethiopia', 'East', 2024, 4021755290), rank('NG', 'Nigeria', 'West', 2025, 4005360386.6), rank('MZ', 'Mozambique', 'Southern', 2024, 3508626212.2), rank('MA', 'Morocco', 'North', 2025, 3318381811.6), rank('UG', 'Uganda', 'East', 2024, 3257198201.8), rank('CI', "Côte d'Ivoire", 'West', 2024, 3121671772.6), rank('ZM', 'Zambia', 'Southern', 2024, 2359364621.2)],
    },
};
