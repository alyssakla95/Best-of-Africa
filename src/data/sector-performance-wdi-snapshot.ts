// Derived from the official World Bank WDI bulk CSV release retrieved 18 July 2026.
// The live WDI API remains the refresh authority; this verified snapshot prevents
// an upstream outage from making the market-performance product unavailable.
type Point = { country_code: string; country_name: string; observation_year: number; value: number };
type Metrics = {
    headline_value: number; comparison_value: number; improving_markets_pct: number;
    positive_markets_pct: number; countries_reported: number; continent_coverage_pct: number;
    period_start: number; period_end: number; dispersion_low: number; dispersion_high: number;
    leaders: Point[]; laggards: Point[]; direction: 'accelerating' | 'slowing' | 'steady';
};

const point = (country_code: string, country_name: string, observation_year: number, value: number): Point =>
    ({ country_code, country_name, observation_year, value });

export const BUNDLED_WDI_SECTOR_METRICS: Record<string, Metrics> = {
    agriculture: {
        headline_value: 3.7, comparison_value: 0.2, improving_markets_pct: 54.9, positive_markets_pct: 96.1,
        countries_reported: 51, continent_coverage_pct: 94.4, period_start: 2025, period_end: 2025,
        dispersion_low: 1.7, dispersion_high: 6.8, direction: 'steady',
        leaders: [point('ZM', 'Zambia', 2025, 51.1), point('ZW', 'Zimbabwe', 2025, 25.9), point('ZA', 'South Africa', 2025, 17.4), point('BF', 'Burkina Faso', 2025, 11.6), point('TN', 'Tunisia', 2025, 10.3)],
        laggards: [point('NA', 'Namibia', 2025, -3.3), point('LS', 'Lesotho', 2025, -2.5), point('SZ', 'Eswatini', 2025, 0.7), point('ST', 'São Tomé and Principe', 2025, 0.7), point('GA', 'Gabon', 2025, 0.8)],
    },
    energy: {
        headline_value: 4.6, comparison_value: 1.4, improving_markets_pct: 64.7, positive_markets_pct: 88.2,
        countries_reported: 51, continent_coverage_pct: 94.4, period_start: 2025, period_end: 2025,
        dispersion_low: 1.8, dispersion_high: 7.8, direction: 'accelerating',
        leaders: [point('LY', 'Libya', 2025, 17.4), point('SN', 'Senegal', 2025, 16.7), point('DJ', 'Djibouti', 2025, 15.3), point('ET', 'Ethiopia', 2025, 13), point('SC', 'Seychelles', 2025, 13)],
        laggards: [point('GQ', 'Equatorial Guinea', 2025, -13.6), point('BW', 'Botswana', 2025, -7.8), point('TG', 'Togo', 2025, -3.2), point('NA', 'Namibia', 2025, -3.1), point('ZA', 'South Africa', 2025, -1.6)],
    },
    finance: {
        headline_value: 16.5, comparison_value: 0.1, improving_markets_pct: 51, positive_markets_pct: 51,
        countries_reported: 51, continent_coverage_pct: 94.4, period_start: 2019, period_end: 2025,
        dispersion_low: 9.6, dispersion_high: 24.3, direction: 'steady',
        leaders: [point('ZA', 'South Africa', 2024, 89.4), point('MA', 'Morocco', 2024, 77.8), point('MU', 'Mauritius', 2025, 72), point('TN', 'Tunisia', 2025, 57.7), point('NA', 'Namibia', 2024, 55.1)],
        laggards: [point('SS', 'South Sudan', 2025, 3.2), point('SO', 'Somalia, Fed. Rep.', 2024, 5.4), point('SL', 'Sierra Leone', 2025, 5.5), point('SD', 'Sudan', 2022, 5.6), point('GQ', 'Equatorial Guinea', 2023, 5.8)],
    },
    healthcare: {
        headline_value: 4.2, comparison_value: 5.3, improving_markets_pct: 61.1, positive_markets_pct: 66.7,
        countries_reported: 54, continent_coverage_pct: 100, period_start: 2023, period_end: 2023,
        dispersion_low: -5.1, dispersion_high: 12.3, direction: 'accelerating',
        leaders: [point('LY', 'Libya', 2023, 65.6), point('SS', 'South Sudan', 2023, 51.5), point('CG', 'Congo, Republic of', 2023, 42.2), point('SO', 'Somalia, Fed. Rep.', 2023, 37.1), point('DZ', 'Algeria', 2023, 29.4)],
        laggards: [point('AO', 'Angola', 2023, -26.8), point('NG', 'Nigeria', 2023, -25.4), point('SD', 'Sudan', 2023, -18.1), point('KM', 'Comoros', 2023, -17.7), point('EG', 'Egypt, Arab Republic of', 2023, -17.6)],
    },
    infrastructure: {
        headline_value: 6.6, comparison_value: 0.5, improving_markets_pct: 57.8, positive_markets_pct: 77.8,
        countries_reported: 45, continent_coverage_pct: 83.3, period_start: 2023, period_end: 2025,
        dispersion_low: 1.2, dispersion_high: 10.7, direction: 'accelerating',
        leaders: [point('GN', 'Guinea', 2025, 26), point('ST', 'São Tomé and Principe', 2025, 22.2), point('SL', 'Sierra Leone', 2025, 19.7), point('TD', 'Chad', 2025, 18.8), point('GH', 'Ghana', 2024, 13.8)],
        laggards: [point('TG', 'Togo', 2023, -19.8), point('CD', 'Congo, Democratic Republic of', 2025, -16.4), point('GQ', 'Equatorial Guinea', 2025, -10.7), point('NA', 'Namibia', 2025, -8.3), point('EG', 'Egypt, Arab Republic of', 2025, -6.2)],
    },
    manufacturing: {
        headline_value: 4, comparison_value: 0.9, improving_markets_pct: 60.4, positive_markets_pct: 87.5,
        countries_reported: 48, continent_coverage_pct: 88.9, period_start: 2020, period_end: 2025,
        dispersion_low: 1.4, dispersion_high: 7.1, direction: 'accelerating',
        leaders: [point('DJ', 'Djibouti', 2024, 15.6), point('SC', 'Seychelles', 2025, 13), point('EG', 'Egypt, Arab Republic of', 2025, 11.2), point('AO', 'Angola', 2025, 10.5), point('ET', 'Ethiopia', 2025, 10.3)],
        laggards: [point('GQ', 'Equatorial Guinea', 2025, -12.7), point('CF', 'Central African Republic', 2023, -10.3), point('MZ', 'Mozambique', 2025, -3.8), point('NA', 'Namibia', 2025, -2.9), point('ZA', 'South Africa', 2025, -1.2)],
    },
    technology: {
        headline_value: 40.7, comparison_value: 1, improving_markets_pct: 88.7, positive_markets_pct: 88.7,
        countries_reported: 53, continent_coverage_pct: 98.1, period_start: 2019, period_end: 2024,
        dispersion_low: 25.1, dispersion_high: 63.4, direction: 'accelerating',
        leaders: [point('MA', 'Morocco', 2024, 91.2), point('SC', 'Seychelles', 2024, 87.8), point('LY', 'Libya', 2024, 82), point('ZA', 'South Africa', 2024, 78.4), point('DZ', 'Algeria', 2024, 77.4)],
        laggards: [point('SS', 'South Sudan', 2019, 6.7), point('BI', 'Burundi', 2024, 8.6), point('UG', 'Uganda', 2024, 8.9), point('TD', 'Chad', 2024, 12.6), point('CF', 'Central African Republic', 2024, 13.8)],
    },
    tourism: {
        headline_value: 39.3, comparison_value: 0.3, improving_markets_pct: 56.2, positive_markets_pct: 56.2,
        countries_reported: 48, continent_coverage_pct: 88.9, period_start: 2020, period_end: 2025,
        dispersion_low: 13.7, dispersion_high: 53.6, direction: 'accelerating',
        leaders: [point('GM', 'Gambia, The', 2024, 89.8), point('ST', 'São Tomé and Principe', 2024, 80.8), point('CV', 'Cabo Verde', 2025, 78.3), point('KM', 'Comoros', 2023, 72.9), point('SD', 'Sudan', 2022, 68.7)],
        laggards: [point('MR', 'Mauritania', 2024, 1.5), point('BI', 'Burundi', 2025, 2.2), point('DZ', 'Algeria', 2024, 3), point('CG', 'Congo, Republic of', 2021, 3.1), point('DJ', 'Djibouti', 2024, 4.4)],
    },
};
