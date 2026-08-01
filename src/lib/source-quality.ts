export type SourceOrigin = 'fixed' | 'discovery';

export interface SourceQualityProfile {
    tier: 0 | 1 | 2 | 3 | 4;
    label: 'unknown' | 'aggregator' | 'verified-national' | 'established-specialist' | 'primary-or-global';
}

const PRIMARY_OR_GLOBAL = [
    'reuters', 'associated press', 'ap news', 'financial times', 'bloomberg', 'bbc',
    'the economist', 's&p global', 'fitch ratings', "moody's", 'moodys',
    'african development bank', 'world bank', 'international monetary fund', 'imf',
    'united nations', 'un news', 'un economic commission for africa', 'uneca',
    'african union', 'world trade organization', 'wto', 'unctad', 'ifc',
    'afreximbank', 'africa centres for disease control', 'africa cdc',
    'international energy agency', 'iea', 'international renewable energy agency', 'irena',
    'international labour organization', 'ilo', 'food and agriculture organization', 'fao',
    'un industrial development organization', 'unido', 'international trade centre',
    'united nations development programme', 'undp', 'world health organization', 'who',
    'european investment bank', 'eib', 'european bank for reconstruction and development', 'ebrd',
    'organisation for economic co-operation and development', 'oecd', 'un tourism', 'miga',
];

const ESTABLISHED_SPECIALIST = [
    'the africa report', 'african business', 'the conversation africa', 'semafor africa',
    'daily maverick', 'techcabal', 'business daily africa', 'african arguments',
    'cnbs africa', 'cnbc africa', 'africa confidential', 'africa intelligence',
    'france 24', 'deutsche welle', 'dw africa', 'al jazeera', 'the guardian',
    'africanews', 'jeune afrique', 'radio france internationale', 'rfi',
    'lusa', 'rtp africa', 'oxford business group', 'institute for security studies',
    'the continent', 'disrupt africa',
];

const VERIFIED_NATIONAL = [
    'businessday nigeria', 'ghana business news', 'the new times rwanda',
    'morocco world news', 'egypt independent', 'daily news egypt', 'ahram online',
    'the standard kenya', 'moneyweb', 'fin24', 'techpoint africa', 'techweez',
    'voyagesafriq', 'afrik21', 'esi africa', 'mining review africa',
    'the guardian nigeria', 'zitamar news', 'club of mozambique',
    'ventures africa', 'how we made it in africa', 'african private equity',
    'african mining brief', 'energy voice africa', 'african farming',
    'agribusiness global', 'farmers review africa', 'tourism update',
];

const AGGREGATORS = ['allafrica', 'google news aggregator'];

const PRIMARY_DOMAINS = [
    'reuters.com', 'apnews.com', 'ft.com', 'bloomberg.com', 'bbc.com', 'bbc.co.uk',
    'economist.com', 'spglobal.com', 'fitchratings.com', 'moodys.com',
    'afdb.org', 'worldbank.org', 'imf.org', 'un.org', 'uneca.org', 'au.int',
    'wto.org', 'unctad.org', 'ifc.org', 'afreximbank.com', 'africacdc.org',
    'miga.org', 'iea.org', 'irena.org', 'ilo.org', 'fao.org', 'unido.org',
    'intracen.org', 'undp.org', 'who.int', 'eib.org', 'ebrd.com', 'oecd.org',
    'untourism.int',
];

const SPECIALIST_DOMAINS = [
    'theafricareport.com', 'african.business', 'theconversation.com', 'semafor.com',
    'dailymaverick.co.za', 'techcabal.com', 'businessdailyafrica.com',
    'africanarguments.org', 'cnnbcafrica.com', 'cnbcafrica.com', 'france24.com',
    'dw.com', 'aljazeera.com', 'theguardian.com', 'africanews.com',
    'jeuneafrique.com', 'rfi.fr', 'lusa.pt', 'rtp.pt', 'oxfordbusinessgroup.com',
    'issafrica.org',
];

const normalized = (value?: string | null) => (value || '').trim().toLowerCase();
const trustedNameMatch = (source: string, value: string) => {
    if (value.length > 4) return source.includes(value);
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(source);
};

export function sourceQualityProfile(name?: string | null, url?: string | null, _origin: SourceOrigin = 'fixed'): SourceQualityProfile {
    const source = `${normalized(name)} ${normalized(url)}`;
    if (PRIMARY_OR_GLOBAL.some(value => trustedNameMatch(source, value)) || PRIMARY_DOMAINS.some(value => source.includes(value))) {
        return { tier: 4, label: 'primary-or-global' };
    }
    if (ESTABLISHED_SPECIALIST.some(value => trustedNameMatch(source, value)) || SPECIALIST_DOMAINS.some(value => source.includes(value))) {
        return { tier: 3, label: 'established-specialist' };
    }
    if (VERIFIED_NATIONAL.some(value => trustedNameMatch(source, value))) {
        return { tier: 2, label: 'verified-national' };
    }
    if (AGGREGATORS.some(value => trustedNameMatch(source, value))) {
        return { tier: 1, label: 'aggregator' };
    }
    return { tier: 0, label: 'unknown' };
}

export const TRUSTED_DISCOVERY_CATALOG = [
    { domain: 'reuters.com', lane: 'global-news' },
    { domain: 'apnews.com', lane: 'global-news' },
    { domain: 'ft.com', lane: 'global-news' },
    { domain: 'bloomberg.com', lane: 'global-news' },
    { domain: 'bbc.com', lane: 'global-news' },
    { domain: 'economist.com', lane: 'global-news' },
    { domain: 'spglobal.com', lane: 'markets' },
    { domain: 'fitchratings.com', lane: 'markets' },
    { domain: 'moodys.com', lane: 'markets' },
    { domain: 'afdb.org', lane: 'primary-evidence' },
    { domain: 'worldbank.org', lane: 'primary-evidence' },
    { domain: 'imf.org', lane: 'primary-evidence' },
    { domain: 'uneca.org', lane: 'primary-evidence' },
    { domain: 'au.int', lane: 'primary-evidence' },
    { domain: 'unctad.org', lane: 'primary-evidence' },
    { domain: 'wto.org', lane: 'primary-evidence' },
    { domain: 'ifc.org', lane: 'primary-evidence' },
    { domain: 'miga.org', lane: 'primary-evidence' },
    { domain: 'afreximbank.com', lane: 'primary-evidence' },
    { domain: 'africacdc.org', lane: 'primary-evidence' },
    { domain: 'iea.org', lane: 'sector-evidence' },
    { domain: 'irena.org', lane: 'sector-evidence' },
    { domain: 'ilo.org', lane: 'sector-evidence' },
    { domain: 'fao.org', lane: 'sector-evidence' },
    { domain: 'unido.org', lane: 'sector-evidence' },
    { domain: 'intracen.org', lane: 'sector-evidence' },
    { domain: 'undp.org', lane: 'sector-evidence' },
    { domain: 'who.int', lane: 'sector-evidence' },
    { domain: 'eib.org', lane: 'markets' },
    { domain: 'ebrd.com', lane: 'markets' },
    { domain: 'oecd.org', lane: 'markets' },
    { domain: 'untourism.int', lane: 'sector-evidence' },
    { domain: 'theafricareport.com', lane: 'africa-specialist' },
    { domain: 'african.business', lane: 'africa-specialist' },
    { domain: 'theconversation.com', lane: 'africa-specialist' },
    { domain: 'semafor.com', lane: 'africa-specialist' },
    { domain: 'cnbcafrica.com', lane: 'africa-specialist' },
    { domain: 'africanews.com', lane: 'multilingual' },
    { domain: 'france24.com', lane: 'multilingual' },
    { domain: 'dw.com', lane: 'multilingual' },
    { domain: 'aljazeera.com', lane: 'multilingual' },
    { domain: 'rfi.fr', lane: 'multilingual' },
    { domain: 'jeuneafrique.com', lane: 'multilingual' },
    { domain: 'lusa.pt', lane: 'multilingual' },
    { domain: 'rtp.pt', lane: 'multilingual' },
    { domain: 'oxfordbusinessgroup.com', lane: 'markets' },
    { domain: 'issafrica.org', lane: 'africa-specialist' },
] as const;

export const TRUSTED_DISCOVERY_DOMAINS = TRUSTED_DISCOVERY_CATALOG.map(source => source.domain);

export interface CoverageAdmissionInput {
    total30d: number;
    country30d: number;
    source30d: number;
    countryCode: string | null;
    sourceName: string;
    qualityTier: SourceQualityProfile['tier'];
    tier2Total30d?: number;
}

export function coverageAdmissionFailure(input: CoverageAdmissionInput): string | null {
    if (input.qualityTier <= 1) {
        return `source quality gate: ${input.sourceName} is not an independently approved reporting source`;
    }

    // National outlets add indispensable local evidence, but they may not
    // become the platform's default evidence layer. Always allow them to fill
    // a genuinely thin country; otherwise cap their collective share.
    if (
        input.qualityTier === 2
        && input.total30d >= 24
        && input.country30d >= 2
        && (input.tier2Total30d || 0) / input.total30d >= 0.20
    ) {
        return 'source quality mix: verified national reporting has reached its 20% rolling ceiling';
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
