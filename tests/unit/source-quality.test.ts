import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { coverageAdmissionFailure, diversifyCoveragePage, diversifyCoverageRows, sourceQualityProfile, TRUSTED_DISCOVERY_CATALOG, TRUSTED_DISCOVERY_DOMAINS } from '../../src/lib/source-quality';

describe('source quality and coverage admission', () => {
    it('distinguishes authoritative, established, national and aggregator sources', () => {
        expect(sourceQualityProfile('Reuters', 'https://reuters.com/world/africa', 'discovery').tier).toBe(4);
        expect(sourceQualityProfile('Radio France Internationale', 'https://www.rfi.fr/fr/economie/rss', 'fixed').tier).toBe(3);
        expect(sourceQualityProfile('The Africa Report', null, 'discovery').tier).toBe(3);
        expect(sourceQualityProfile('Economic Community of West African States', 'https://ecowas.int/news', 'discovery').tier).toBe(4);
        expect(sourceQualityProfile('Ghana Business News', null, 'discovery').tier).toBe(2);
        expect(sourceQualityProfile('AllAfrica · Liberia', null, 'fixed').tier).toBe(1);
        expect(sourceQualityProfile('Unknown Blog', null, 'discovery').tier).toBe(0);
        expect(sourceQualityProfile('Unknown Feed', 'https://example.test/feed', 'fixed').tier).toBe(0);
        expect(sourceQualityProfile('Whoever Markets', 'https://whoever.example', 'discovery').tier).toBe(0);
    });

    it('ships a broad trusted discovery pool', () => {
        expect(TRUSTED_DISCOVERY_DOMAINS.length).toBeGreaterThanOrEqual(60);
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('reuters.com');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('afdb.org');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('afreximbank.com');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('ecowas.int');
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('comesa.int');
        expect(new Set(TRUSTED_DISCOVERY_CATALOG.map(source => source.lane))).toEqual(new Set([
            'global-news', 'markets', 'primary-evidence', 'sector-evidence',
            'africa-specialist', 'multilingual',
        ]));
    });

    it('uses productive first-party feeds and recovers ECOWAS after its Worker response becomes usable', () => {
        const migration = readFileSync('migrations/0060_productive_regional_feeds.sql', 'utf8');
        const ecowasMigration = readFileSync('migrations/0061_disable_unproductive_ecowas_direct.sql', 'utf8');
        const ecowasRecovery = readFileSync('migrations/0085_reactivate_productive_ecowas_feed.sql', 'utf8');
        expect(migration).toContain('https://www.ecowas.int/feed/');
        expect(migration).toContain('https://www.comesa.int/feed/');
        expect(migration).toMatch(/is_active\s*=\s*0[\s\S]*primary-sadc-news/);
        expect(ecowasMigration).toMatch(/is_active\s*=\s*0[\s\S]*primary-ecowas-news/);
        expect(ecowasRecovery).toContain('https://www.ecowas.int/feed/');
        expect(ecowasRecovery).toMatch(/is_active\s*=\s*1[\s\S]*primary-ecowas-news/);
        expect(ecowasRecovery).toContain('consecutive_zero_qualified = 0');
        expect(ecowasRecovery).toContain("last_fetched_at = datetime('now', '-2 days')");
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('ecowas.int');
    });

    it('uses the official AfDB feed that carries full article evidence', () => {
        const migration = readFileSync('migrations/0075_afdb_full_evidence_feed.sql', 'utf8');
        const cooldown = readFileSync('migrations/0076_reset_afdb_acquisition_cooldown.sql', 'utf8');
        const retry = readFileSync('migrations/0077_retry_afdb_with_feed_headers.sql', 'utf8');
        const disabled = readFileSync('migrations/0078_disable_worker_blocked_afdb_feed.sql', 'utf8');
        expect(migration).toContain("type = 'rss'");
        expect(migration).toContain('https://www.afdb.org/en/rss.xml');
        expect(migration).toContain('last_fetched_at = NULL');
        expect(migration).toContain("id = 'primary-afdb-news'");
        expect(cooldown).toContain('consecutive_zero_qualified = 0');
        expect(cooldown).toContain("last_fetched_at = datetime('now', '-2 days')");
        expect(cooldown).toContain("source_id = 'primary-afdb-news'");
        expect(retry).toContain("last_fetched_at = datetime('now', '-2 days')");
        expect(retry).toContain("source_id = 'primary-afdb-news'");
        expect(disabled).toContain('is_active = 0');
        expect(disabled).toContain("id = 'primary-afdb-news'");
        expect(TRUSTED_DISCOVERY_DOMAINS).toContain('afdb.org');
    });

    it('caps rolling country and publisher concentration', () => {
        expect(coverageAdmissionFailure({ total30d: 300, country30d: 159, source30d: 10, countryCode: 'NG', sourceName: 'Reuters', qualityTier: 4 }))
            .toContain('rolling country balance');
        expect(coverageAdmissionFailure({ total30d: 300, country30d: 2, source30d: 40, countryCode: 'BW', sourceName: 'Daily Maverick', qualityTier: 3, tier4Total30d: 200 }))
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

    it('requires global or primary evidence to be the majority of the rolling window', () => {
        expect(coverageAdmissionFailure({
            total30d: 100,
            country30d: 1,
            source30d: 1,
            countryCode: 'KE',
            sourceName: 'The Africa Report',
            qualityTier: 3,
            tier4Total30d: 40,
        })).toContain('at least 55%');
        expect(coverageAdmissionFailure({
            total30d: 100,
            country30d: 0,
            source30d: 1,
            countryCode: 'LR',
            sourceName: 'The Africa Report',
            qualityTier: 3,
            tier4Total30d: 40,
        })).toBeNull();
        expect(coverageAdmissionFailure({
            total30d: 100,
            country30d: 2,
            source30d: 1,
            countryCode: 'KE',
            sourceName: 'Reuters',
            qualityTier: 4,
            tier4Total30d: 40,
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

    it('builds diversified pages without repeating records from an earlier page', () => {
        const rows = [
            { id: 1, country_code: 'KE', source_title: 'Reuters', source_quality_tier: 4 },
            { id: 2, country_code: 'ZA', source_title: 'Financial Times', source_quality_tier: 4 },
            { id: 3, country_code: 'GH', source_title: 'African Business', source_quality_tier: 3 },
            { id: 4, country_code: 'MA', source_title: 'BBC Africa', source_quality_tier: 4 },
            { id: 5, country_code: 'EG', source_title: 'Associated Press', source_quality_tier: 4 },
            { id: 6, country_code: 'RW', source_title: 'The Africa Report', source_quality_tier: 3 },
        ];
        const first = diversifyCoveragePage(rows, 1, 3);
        const second = diversifyCoveragePage(rows, 2, 3);
        expect(first.map(row => row.id)).toEqual([1, 2, 3]);
        expect(second.map(row => row.id)).toEqual([4, 5, 6]);
        expect(second.some(row => first.includes(row))).toBe(false);
    });
});
