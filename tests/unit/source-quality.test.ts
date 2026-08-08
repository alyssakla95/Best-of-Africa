import { describe, expect, it } from 'vitest';
import { coverageAdmissionFailure, diversifyCoverageRows, sourceQualityProfile, TRUSTED_DISCOVERY_CATALOG, TRUSTED_DISCOVERY_DOMAINS } from '../../src/lib/source-quality';

describe('source quality and coverage admission', () => {
    it('distinguishes authoritative, established, national and aggregator sources', () => {
        expect(sourceQualityProfile('Reuters', 'https://reuters.com/world/africa', 'discovery').tier).toBe(4);
        expect(sourceQualityProfile('The Africa Report', null, 'discovery').tier).toBe(3);
        expect(sourceQualityProfile('Ghana Business News', null, 'discovery').tier).toBe(2);
        expect(sourceQualityProfile('AllAfrica · Liberia', null, 'fixed').tier).toBe(1);
        expect(sourceQualityProfile('Unknown Blog', null, 'discovery').tier).toBe(0);
        expect(sourceQualityProfile('Unknown Feed', 'https://example.test/feed', 'fixed').tier).toBe(0);
        expect(sourceQualityProfile('Whoever Markets', 'https://whoever.example', 'discovery').tier).toBe(0);
    });

    it('ships a broad trusted discovery pool', () => {
        expect(TRUSTED_DISCOVERY_DOMAINS.length).toBeGreaterThanOrEqual(45);
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('reuters.com');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('afdb.org');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('afreximbank.com');
        expect(new Set(TRUSTED_DISCOVERY_CATALOG.map(source => source.lane))).toEqual(new Set([
            'global-news', 'markets', 'primary-evidence', 'sector-evidence',
            'africa-specialist', 'multilingual',
        ]));
    });

    it('caps rolling country and publisher concentration', () => {
        expect(coverageAdmissionFailure({ total30d: 300, country30d: 159, source30d: 10, countryCode: 'NG', sourceName: 'Reuters', qualityTier: 4 }))
            .toContain('rolling country balance');
        expect(coverageAdmissionFailure({ total30d: 300, country30d: 2, source30d: 40, countryCode: 'BW', sourceName: 'Daily Maverick', qualityTier: 3 }))
            .toContain('rolling source balance');
        expect(coverageAdmissionFailure({ total30d: 300, country30d: 2, source30d: 2, countryCode: 'BW', sourceName: 'Reuters', qualityTier: 4 }))
            .toBeNull();
    });

    it('rejects aggregators and unknown discovery publishers as final evidence sources', () => {
        expect(coverageAdmissionFailure({ total30d: 20, country30d: 0, source30d: 0, countryCode: 'LR', sourceName: 'AllAfrica', qualityTier: 1 }))
            .toContain('source quality gate');
    });

    it('limits lower-tier national reporting after it has filled a country gap', () => {
        expect(coverageAdmissionFailure({
            total30d: 100,
            country30d: 1,
            source30d: 2,
            countryCode: 'GH',
            sourceName: 'Ghana Business News',
            qualityTier: 2,
            tier2Total30d: 20,
        })).toContain('source quality mix');
        expect(coverageAdmissionFailure({
            total30d: 100,
            country30d: 0,
            source30d: 2,
            countryCode: 'LR',
            sourceName: 'Verified Liberian outlet',
            qualityTier: 2,
            tier2Total30d: 20,
        })).toBeNull();
    });

    it('keeps visible lists diverse without backfilling from dominant publishers', () => {
        const rows = [
            { id: 1, country_code: 'NG', source_title: 'Reuters', source_quality_tier: 4 },
            { id: 2, country_code: 'NG', source_title: 'Reuters', source_quality_tier: 4 },
            { id: 3, country_code: 'NG', source_title: 'Reuters', source_quality_tier: 4 },
            { id: 4, country_code: 'ZA', source_title: 'The Africa Report', source_quality_tier: 3 },
            { id: 5, country_code: 'GH', source_title: 'The Africa Report', source_quality_tier: 3 },
            { id: 6, country_code: 'KE', source_title: 'Associated Press', source_quality_tier: 4 },
        ];
        expect(diversifyCoverageRows(rows, 6).map(row => row.id)).toEqual([1, 4, 6]);
    });

    it('limits verified-national sources to one fifth of a reader-facing list', () => {
        const rows = [
            { id: 1, country_code: 'GH', source_title: 'Ghana Business News', source_quality_tier: 2 },
            { id: 2, country_code: 'RW', source_title: 'The New Times Rwanda', source_quality_tier: 2 },
            { id: 3, country_code: 'KE', source_title: 'Reuters', source_quality_tier: 4 },
            { id: 4, country_code: 'ZA', source_title: 'Financial Times', source_quality_tier: 4 },
            { id: 5, country_code: 'MA', source_title: 'The Africa Report', source_quality_tier: 3 },
        ];
        expect(diversifyCoverageRows(rows, 5).map(row => row.id)).toEqual([1, 3, 4, 5]);
    });

    it('allows a country page to fill from distinct publishers without weakening source quality', () => {
        const rows = [
            { id: 1, country_code: 'KE', source_title: 'Reuters', source_quality_tier: 4 },
            { id: 2, country_code: 'KE', source_title: 'Associated Press', source_quality_tier: 4 },
            { id: 3, country_code: 'KE', source_title: 'The Africa Report', source_quality_tier: 3 },
            { id: 4, country_code: 'KE', source_title: 'The Standard Kenya', source_quality_tier: 2 },
            { id: 5, country_code: 'KE', source_title: 'Business Daily Africa', source_quality_tier: 3 },
        ];
        expect(diversifyCoverageRows(rows, 5, 5, 1).map(row => row.id)).toEqual([1, 2, 3, 4, 5]);
    });
});
