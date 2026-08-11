import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { authoritativeCountryResources, mergeOfficialResources } from '../../src/lib/country-resources';
import { processCountries } from '../../src/routes/countries';
import type { Country } from '../../src/types';

describe('country resource integrity', () => {
    it('provides real primary-data resources for every country code', () => {
        const resources = authoritativeCountryResources('DZ', 'Algeria');
        expect(resources).toHaveLength(3);
        expect(resources[0]).toMatchObject({
            name: 'Algeria - World Bank country data',
            url: 'https://data.worldbank.org/country/dz',
            source_type: 'official country dataset',
        });
        expect(resources.every(resource => resource.url.startsWith('https://'))).toBe(true);
    });

    it('admits only verified HTTPS portals with authoritative verification evidence', () => {
        const baseline = authoritativeCountryResources('NG', 'Nigeria');
        const merged = mergeOfficialResources(baseline, [
            {
                name: 'Verified investment authority',
                url: 'https://investment.example.gov/',
                source_type: 'verified official portal',
                verified_at: '2026-08-10T00:00:00Z',
                verification_source_url: 'https://data.worldbank.org/country/ng',
            },
            {
                name: 'Unverified portal',
                url: 'https://unverified.example/',
                source_type: 'verified official portal',
            },
            {
                name: 'Insecure portal',
                url: 'http://unsafe.example/',
                source_type: 'verified official portal',
                verified_at: '2026-08-10T00:00:00Z',
                verification_source_url: 'https://data.worldbank.org/country/ng',
            },
        ]);
        expect(merged.map(resource => resource.name)).toContain('Verified investment authority');
        expect(merged.map(resource => resource.name)).not.toContain('Unverified portal');
        expect(merged.map(resource => resource.name)).not.toContain('Insecure portal');
    });

    it('does not expose legacy portal claims, raw narrative markup or synthetic scores', () => {
        const processed = processCountries([{
            code: 'DZ', name: 'Algeria', region: 'North', capital: 'Algiers',
            population: 1, gdp_usd: 1, currency: 'DZD', languages: null,
            description: 'Country record', investment_highlights: '[]', tourism_highlights: null,
            flag_emoji: '', hero_image_url: null, visa_portal_url: 'https://evisa.td.gov.dz/',
            business_portal_url: 'https://legacy.example/', history_baobab_content: '# Legacy narrative',
            diplomacy_score: 50, image_strength_score: 0,
        } as unknown as Country])[0];

        expect(processed).not.toHaveProperty('visa_portal_url');
        expect(processed).not.toHaveProperty('business_portal_url');
        expect(processed).not.toHaveProperty('history_baobab_content');
        expect(processed).not.toHaveProperty('diplomacy_score');
        expect(processed).not.toHaveProperty('image_strength_score');
        expect(processed).not.toHaveProperty('hero_image_url');
        expect(processed.official_resources).toHaveLength(3);
        expect(processed.data_quality.legacy_portals_exposed).toBe(false);
    });

    it('ships an evidence-bearing verified-resource registry migration', () => {
        const migration = readFileSync('migrations/0069_verified_country_resources.sql', 'utf8');
        expect(migration).toContain('CREATE TABLE IF NOT EXISTS country_official_resources');
        expect(migration).toContain('verification_source_url TEXT NOT NULL');
        expect(migration).toContain('verified_at TEXT NOT NULL');
        expect(migration).toContain("status IN ('verified', 'withdrawn', 'review_due')");
    });

    it('versions the country-list cache when the public safety projection changes', () => {
        const cache = readFileSync('src/lib/cache.ts', 'utf8');
        expect(cache).toContain("COUNTRIES_LIST: 'countries:list:v2-verified-resources'");
    });
});
