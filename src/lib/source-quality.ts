export type SourceOrigin = 'fixed' | 'discovery';

export interface SourceQualityProfile {
    tier: 0 | 1 | 2 | 3 | 4;
    label: 'unknown' | 'aggregator' | 'verified-national' | 'established-specialist' | 'primary-or-global';
}

const PRIMARY_OR_GLOBAL = [
    'reuters', 'associated press', 'ap news', 'financial times', 'bloomberg', 'bbc',
    'african development bank', 'world bank', 'international monetary fund', 'imf',
    'united nations', 'un news', 'un economic commission for africa', 'uneca',
    'african union', 'world trade organization', 'wto', 'unctad', 'ifc',
    'afreximbank', 'africa centres for disease control', 'africa cdc',
];

const ESTABLISHED_SPECIALIST = [
    'the africa report', 'african business', 'the conversation africa', 'semafor africa',
    'daily maverick', 'techcabal', 'business daily africa', 'african arguments',
    'cnbs africa', 'cnbc africa', 'africa confidential', 'africa intelligence',
    'france 24', 'deutsche welle', 'dw africa', 'al jazeera', 'the guardian',
];

const VERIFIED_NATIONAL = [
    'businessday nigeria', 'ghana business news', 'the new times rwanda',
    'morocco world news', 'egypt independent', 'daily news egypt', 'ahram online',
    'the standard kenya', 'moneyweb', 'fin24', 'techpoint africa', 'techweez',
    'voyagesafriq', 'afrik21', 'esi africa', 'mining review africa',
];

const AGGREGATORS = ['allafrica', 'google news aggregator'];

const PRIMARY_DOMAINS = [
    'reuters.com', 'apnews.com', 'ft.com', 'bloomberg.com', 'bbc.com', 'bbc.co.uk',
    'afdb.org', 'worldbank.org', 'imf.org', 'un.org', 'uneca.org', 'au.int',
    'wto.org', 'unctad.org', 'ifc.org', 'afreximbank.com', 'africacdc.org',
];

const SPECIALIST_DOMAINS = [
    'theafricareport.com', 'african.business', 'theconversation.com', 'semafor.com',
    'dailymaverick.co.za', 'techcabal.com', 'businessdailyafrica.com',
    'africanarguments.org', 'cnnbcafrica.com', 'cnbcafrica.com', 'france24.com',
    'dw.com', 'aljazeera.com', 'theguardian.com',
];

const normalized = (value?: string | null) => (value || '').trim().toLowerCase();

export function sourceQualityProfile(name?: string | null, url?: string | null, origin: SourceOrigin = 'fixed'): SourceQualityProfile {
    const source = `${normalized(name)} ${normalized(url)}`;
    if (PRIMARY_OR_GLOBAL.some(value => source.includes(value)) || PRIMARY_DOMAINS.some(value => source.includes(value))) {
        return { tier: 4, label: 'primary-or-global' };
    }
    if (ESTABLISHED_SPECIALIST.some(value => source.includes(value)) || SPECIALIST_DOMAINS.some(value => source.includes(value))) {
        return { tier: 3, label: 'established-specialist' };
    }
    if (VERIFIED_NATIONAL.some(value => source.includes(value))) {
        return { tier: 2, label: 'verified-national' };
    }
    if (AGGREGATORS.some(value => source.includes(value))) {
        return { tier: 1, label: 'aggregator' };
    }
    return origin === 'fixed'
        ? { tier: 2, label: 'verified-national' }
        : { tier: 0, label: 'unknown' };
}

export const TRUSTED_DISCOVERY_DOMAINS = [
    'reuters.com', 'apnews.com', 'ft.com', 'bloomberg.com',
    'afdb.org', 'worldbank.org', 'imf.org', 'uneca.org', 'au.int',
    'unctad.org', 'wto.org', 'ifc.org', 'afreximbank.com', 'africacdc.org',
] as const;

export interface CoverageAdmissionInput {
    total30d: number;
    country30d: number;
    source30d: number;
    countryCode: string | null;
    sourceName: string;
    qualityTier: SourceQualityProfile['tier'];
}

export function coverageAdmissionFailure(input: CoverageAdmissionInput): string | null {
    if (input.qualityTier <= 1) {
        return `source quality gate: ${input.sourceName} is not an independently approved reporting source`;
    }

    const countryCap = Math.max(6, Math.ceil(input.total30d * 0.06));
    if (input.country30d >= countryCap) {
        return `rolling country balance: ${input.countryCode || 'continental/unclassified'} has ${input.country30d} of ${input.total30d} records (cap ${countryCap})`;
    }

    const sourceShare = input.qualityTier === 4 ? 0.12 : input.qualityTier === 3 ? 0.10 : 0.08;
    const sourceCap = Math.max(8, Math.ceil(input.total30d * sourceShare));
    if (input.source30d >= sourceCap) {
        return `rolling source balance: ${input.sourceName} has ${input.source30d} of ${input.total30d} records (cap ${sourceCap})`;
    }
    return null;
}

/** Preserve editorial order while applying hard reader-facing concentration caps. */
export function diversifyCoverageRows<T extends { country_code?: string | null; source_title?: string | null }>(
    rows: T[],
    limit: number,
    maxPerCountry = 2,
    maxPerPublisher = 2,
): T[] {
    const picked: T[] = [];
    const countryCounts = new Map<string, number>();
    const publisherCounts = new Map<string, number>();
    for (const row of rows) {
        if (picked.length >= limit) break;
        const country = row.country_code || 'continental/unclassified';
        const publisher = (row.source_title || 'unattributed').trim().toLowerCase();
        if ((countryCounts.get(country) || 0) >= maxPerCountry) continue;
        if ((publisherCounts.get(publisher) || 0) >= maxPerPublisher) continue;
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
        publisherCounts.set(publisher, (publisherCounts.get(publisher) || 0) + 1);
        picked.push(row);
    }
    return picked;
}
