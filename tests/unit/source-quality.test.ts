import { describe, expect, it } from 'vitest';
import { coverageAdmissionFailure, sourceQualityProfile, TRUSTED_DISCOVERY_DOMAINS } from '../../src/lib/source-quality';

describe('source quality and coverage admission', () => {
    it('distinguishes authoritative, established, national and aggregator sources', () => {
        expect(sourceQualityProfile('Reuters', 'https://reuters.com/world/africa', 'discovery').tier).toBe(4);
        expect(sourceQualityProfile('The Africa Report', null, 'discovery').tier).toBe(3);
        expect(sourceQualityProfile('Ghana Business News', null, 'discovery').tier).toBe(2);
        expect(sourceQualityProfile('AllAfrica · Liberia', null, 'fixed').tier).toBe(1);
        expect(sourceQualityProfile('Unknown Blog', null, 'discovery').tier).toBe(0);
    });

    it('ships a broad trusted discovery pool', () => {
        expect(TRUSTED_DISCOVERY_DOMAINS.length).toBeGreaterThanOrEqual(12);
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('reuters.com');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('afdb.org');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('afreximbank.com');
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
});
