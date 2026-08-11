export interface CountryOfficialResource {
    name: string;
    url: string;
    source_type: 'official country dataset' | 'verified official portal';
    verified_at?: string;
    verification_source_url?: string;
}

const AUTHORITATIVE_HOSTS = new Set([
    'data.worldbank.org',
    'www.imf.org',
    'imf.org',
    'comtradeplus.un.org',
]);

/**
 * Every country record receives durable, country-specific evidence links that
 * are owned by international primary-data providers. These links do not depend
 * on the legacy portal columns seeded in 2019, several of which were never
 * independently verified.
 */
export function authoritativeCountryResources(code: string, countryName: string): CountryOfficialResource[] {
    const normalizedCode = code.trim().toLowerCase();
    return [
        {
            name: `${countryName} - World Bank country data`,
            url: `https://data.worldbank.org/country/${normalizedCode}`,
            source_type: 'official country dataset',
        },
        {
            name: 'IMF DataMapper',
            url: 'https://www.imf.org/external/datamapper/',
            source_type: 'official country dataset',
        },
        {
            name: 'UN Comtrade',
            url: 'https://comtradeplus.un.org/',
            source_type: 'official country dataset',
        },
    ];
}

export function isSafeOfficialResourceUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && AUTHORITATIVE_HOSTS.has(url.hostname.toLowerCase());
    } catch {
        return false;
    }
}

export function mergeOfficialResources(
    baseline: CountryOfficialResource[],
    verified: CountryOfficialResource[],
): CountryOfficialResource[] {
    const resources = [...baseline];
    const seen = new Set(resources.map(resource => resource.url.toLowerCase()));
    for (const resource of verified) {
        if (!resource.verified_at || !resource.verification_source_url) continue;
        if (!isSafeOfficialResourceUrl(resource.verification_source_url)) continue;
        try {
            const url = new URL(resource.url);
            if (url.protocol !== 'https:' || seen.has(url.toString().toLowerCase())) continue;
            resources.push({ ...resource, url: url.toString() });
            seen.add(url.toString().toLowerCase());
        } catch {
            // Invalid URLs are data-quality failures and never reach readers.
        }
    }
    return resources;
}
