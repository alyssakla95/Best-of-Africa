import { describe, expect, it } from 'vitest';
import { calculateSectorPerformance, SECTOR_PERFORMANCE_SERIES } from '../../src/lib/sector-performance';
import { BUNDLED_WDI_SECTOR_DIMENSIONS } from '../../src/data/sector-performance-wdi-dimensions';

const record = (code: string, name: string, year: number, value: number) => ({
    country: { id: code, value: name },
    date: String(year),
    value,
});

describe('official sector performance aggregation', () => {
    it('calculates median growth, acceleration, breadth and dispersion from country observations', () => {
        const agriculture = SECTOR_PERFORMANCE_SERIES.find(series => series.sector_id === 'agriculture')!;
        const result = calculateSectorPerformance(agriculture, [
            record('NG', 'Nigeria', 2024, 4), record('NG', 'Nigeria', 2023, 2),
            record('KE', 'Kenya', 2024, 6), record('KE', 'Kenya', 2023, 7),
            record('ZA', 'South Africa', 2024, -1), record('ZA', 'South Africa', 2023, -3),
            // The all-country endpoint also returns regional aggregates. They
            // must never enter the 54-market calculations.
            record('1W', 'World', 2024, 100), record('1W', 'World', 2023, -100),
        ]);

        expect(result).toMatchObject({
            headline_value: 4,
            comparison_value: 2,
            improving_markets_pct: 66.7,
            positive_markets_pct: 66.7,
            countries_reported: 3,
            period_start: 2024,
            period_end: 2024,
            direction: 'accelerating',
        });
        expect(result?.leaders[0]).toMatchObject({ country_code: 'KE', value: 6 });
        expect(result?.laggards[0]).toMatchObject({ country_code: 'ZA', value: -1 });
    });

    it('derives year-over-year performance from three official level observations', () => {
        const healthcare = SECTOR_PERFORMANCE_SERIES.find(series => series.sector_id === 'healthcare')!;
        const result = calculateSectorPerformance(healthcare, [
            record('MA', 'Morocco', 2024, 120), record('MA', 'Morocco', 2023, 100), record('MA', 'Morocco', 2022, 80),
            record('TN', 'Tunisia', 2024, 90), record('TN', 'Tunisia', 2023, 100), record('TN', 'Tunisia', 2022, 100),
        ]);

        expect(result?.headline_value).toBe(5);
        expect(result?.comparison_value).toBe(-7.5);
        expect(result?.positive_markets_pct).toBe(50);
        expect(result?.direction).toBe('slowing');
    });

    it('uses the current WDI travel-services share series for tourism performance', () => {
        const tourism = SECTOR_PERFORMANCE_SERIES.find(series => series.sector_id === 'tourism')!;
        expect(tourism).toMatchObject({
            indicator_code: 'BX.GSR.TRVL.ZS',
            mode: 'level_change',
            headline_unit: '% of service exports',
        });
    });

    it('does not manufacture a sector result from insufficient observations', () => {
        const finance = SECTOR_PERFORMANCE_SERIES.find(series => series.sector_id === 'finance')!;
        expect(calculateSectorPerformance(finance, [record('GH', 'Ghana', 2024, 12)])).toBeNull();
    });

    it('provides three source-linked structural or operating dimensions for every sector', () => {
        expect(Object.keys(BUNDLED_WDI_SECTOR_DIMENSIONS)).toHaveLength(8);
        for (const dimensions of Object.values(BUNDLED_WDI_SECTOR_DIMENSIONS)) {
            expect(dimensions).toHaveLength(5);
            for (const dimension of dimensions) {
                expect(dimension.countries_reported).toBeGreaterThan(0);
                expect(dimension.coverage_pct).toBeGreaterThan(0);
                expect(dimension.period_end).toBeGreaterThanOrEqual(dimension.period_start);
                expect(dimension.interpretation.length).toBeGreaterThan(30);
                expect(dimension.caveat.length).toBeGreaterThan(30);
                expect(dimension.source_url).toContain(dimension.indicator_code);
            }
        }
    });
});
