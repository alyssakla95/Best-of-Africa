// ═══════════════════════════════════════════════════════════════════════════════
// INGESTION WORKER
// Scheduled worker for fetching news from sources
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, ContentGenerationMessage } from '../types';
import { extractPublisherImage, normalizeEditorialImageUrl } from '../lib/editorial-images';
import { sourceQualityProfile, TRUSTED_DISCOVERY_CATALOG } from '../lib/source-quality';

// ───────────────────────────────────────────────────────────────────────────────
// RSS Feed Parser (Simple)
// ───────────────────────────────────────────────────────────────────────────────
interface RSSItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    imageUrl: string | null;
    imageCredit: string | null;
    publisherName: string | null;
    publisherUrl: string | null;
}

// ───────────────────────────────────────────────────────────────────────────────
// Africa relevance gate — only ingest stories clearly about Africa.
// Discovery (Google News) and broad feeds occasionally surface non-African items
// (e.g. Ukraine/Crimea, Cyprus); requiring an explicit African keyword filters them
// out before they ever reach generation, and is why such items had a null country.
// ───────────────────────────────────────────────────────────────────────────────
const AFRICA_KEYWORDS = [
    'africa', 'african', 'sub-saharan', 'afrique', 'afrika',
    'algeria', 'egypt', 'libya', 'morocco', 'tunisia', 'mauritania', 'western sahara',
    'burundi', 'comoros', 'djibouti', 'eritrea', 'ethiopia', 'kenya', 'madagascar',
    'malawi', 'mauritius', 'mozambique', 'rwanda', 'seychelles', 'somalia', 'south sudan',
    'sudan', 'tanzania', 'uganda', 'zambia', 'zimbabwe',
    'benin', 'burkina faso', 'cape verde', 'cabo verde', "cote d'ivoire", "côte d'ivoire", 'ivory coast',
    'gambia', 'ghana', 'guinea', 'guinea-bissau', 'liberia', 'mali', 'niger', 'nigeria',
    'senegal', 'sierra leone', 'togo',
    'angola', 'cameroon', 'central african republic', 'chad', 'congo', 'drc',
    'democratic republic of congo', 'equatorial guinea', 'gabon', 'sao tome',
    'botswana', 'eswatini', 'swaziland', 'lesotho', 'namibia', 'south africa', 'africa south',
    'lagos', 'cairo', 'johannesburg', 'nairobi', 'casablanca', 'addis ababa', 'accra',
    'dar es salaam', 'kinshasa', 'luanda', 'algiers', 'abuja', 'kigali', 'dakar',
    // Additional high-signal African cities / regions (avoid false-negatives)
    'cape town', 'durban', 'pretoria', 'soweto', 'gauteng', 'limpopo', 'stellenbosch',
    'marrakech', 'marrakesh', 'rabat', 'tangier', 'fez', 'tunis', 'alexandria', 'giza',
    'ibadan', 'kano', 'port harcourt', 'abidjan', 'khartoum', 'douala', 'yaounde',
    'mombasa', 'kisumu', 'gqeberha', 'kampala', 'lusaka', 'harare', 'bulawayo', 'maputo', 'gaborone',
    'windhoek', 'kumasi', 'zanzibar', 'arusha', 'dodoma', 'freetown', 'monrovia', 'bamako',
    'maghreb', 'sahel', 'horn of africa', 'east africa', 'west africa', 'southern africa',
    'north africa', 'central africa', 'east african', 'west african',
    // Irregular demonyms the open-ended prefix match can NOT derive from the
    // country name ('morocco' matches 'moroccan'? No — the adjective drops the
    // final o). Regular ones (nigerian, kenyan, ghanaian…) need no entry.
    'moroccan', 'ivorian', 'somali', 'mozambican', 'burkinabe', 'comorian',
    'seychellois', 'malagasy', 'mauritian', 'swazi',
    // African subnational regions/provinces & more cities (further reduce false-negatives)
    'tshwane', 'niassa', 'kwazulu', 'mpumalanga', 'western cape', 'eastern cape', 'free state',
    'oromia', 'tigray', 'amhara', 'zanzibar', 'kaduna', 'enugu', 'ogun', 'rivers state',
    'lubumbashi', 'kisangani', 'mwanza', 'oran', 'sfax', 'kumasi', 'mombasa', 'nampula',
];

// Stories whose HEADLINE centres on these places are foreign coverage that only
// brushes Africa (e.g. "India slams Pakistan minister's remark on PM Modi's
// Seychelles honor" — a Delhi story that mentions Seychelles once). A single
// incidental African keyword must not admit them.
const FOREIGN_PRIMARY = [
    'india', 'indian', 'pakistan', 'pakistani', 'modi', 'new delhi', 'tamil nadu',
    'maldives', 'sri lanka', 'bangladesh', 'nepal', 'china', 'chinese', 'beijing',
    'russia', 'russian', 'ukraine', 'united states', 'america', 'washington',
    'europe', 'european union', 'brazil', 'indonesia', 'philippines',
    'france', 'french', 'paris', 'united kingdom', 'britain', 'british', 'england',
    'germany', 'german', 'spain', 'spanish', 'italy', 'italian', 'gibraltar',
    'australia', 'australian', 'new zealand', 'canada', 'canadian', 'japan', 'japanese',
    // Middle East — a wave of Iran coverage ("Tehran's Streets Beat with
    // Defiance", Mashhad, Strait of Hormuz) leaked through in July 2026
    // because none of these were vetoed.
    'iran', 'iranian', 'tehran', 'mashhad', 'khamenei', 'hormuz',
    'israel', 'israeli', 'gaza', 'palestinian', 'lebanon', 'beirut',
    'syria', 'syrian', 'iraq', 'iraqi', 'saudi', 'riyadh', 'qatar',
    'yemen', 'afghanistan', 'taliban',
];

const kwRegex = (kw: string) => new RegExp('\\b' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

export function isAfricanContent(title: string, content = ''): boolean {
    // Word-boundary on the leading edge (so "mali" doesn't match "normalize"),
    // but allow trailing letters so adjectives/demonyms still match
    // ("nigeria"→"nigerian", "morocco"→"moroccan", "benin"→"beninese").
    const titleL = title.toLowerCase();
    const bodyL = content.toLowerCase();

    const titleHits = AFRICA_KEYWORDS.filter(kw => kwRegex(kw).test(titleL)).length;
    const foreignTitle = FOREIGN_PRIMARY.some(kw => kwRegex(kw).test(titleL));

    // Headline names Africa and isn't centred elsewhere → in.
    if (titleHits >= 1 && !foreignTitle) return true;
    // Headline centred elsewhere needs multiple African signals to qualify
    // (kills the Modi-Seychelles / Tamil-Nadu class of leak).
    if (titleHits >= 2) return true;

    const bodyHits = AFRICA_KEYWORDS.filter(kw => kwRegex(kw).test(bodyL)).length;
    // No African headline: allow only clearly African bodies with no foreign
    // headline focus (two distinct keywords, e.g. two countries or country+city).
    if (!foreignTitle) return bodyHits >= 2;
    // Foreign-centred headline that still names an African place ("China
    // pledges $1bn for Kenya railway"): admit when the body is substantially
    // African too. The Modi-Seychelles class stays out — its body names the
    // African place once at most.
    if (titleHits >= 1) return bodyHits >= 2;
    return false;
}

const COUNTRY_DISCOVERY_ALIASES: Record<string, string[]> = {
    'cabo verde': ['cape verde'],
    "cote d'ivoire": ['ivory coast'],
    'democratic republic of congo': ['democratic republic of the congo', 'dr congo', 'drc', 'congo-kinshasa'],
    'democratic republic of the congo': ['democratic republic of congo', 'dr congo', 'drc', 'congo-kinshasa'],
    'republic of the congo': ['republic of congo', 'congo-brazzaville'],
    'eswatini': ['swaziland'],
    'sao tome and principe': ['sao tome'],
};

const normalizedDiscoveryText = (value: string) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’]/g, "'");

/** Google can ignore a quoted country when several site filters are ORed. */
export function mentionsTargetCountry(title: string, content: string, countryName: string): boolean {
    const haystack = normalizedDiscoveryText(`${title} ${content}`);
    const normalizedName = normalizedDiscoveryText(countryName);
    const aliases = COUNTRY_DISCOVERY_ALIASES[normalizedName] || [];
    return [normalizedName, ...aliases.map(normalizedDiscoveryText)].some(name => haystack.includes(name));
}

const STRONG_MARKET_EVIDENCE = [
    /\beconom(?:y|ic|ics)\b/, /\bbusiness(?:es)?\b/, /\bexports?\b/, /\bimports?\b/,
    /\binvest(?:ment|ments|or|ors|ing)\b/, /\bmarkets?\b/, /\bfinanc(?:e|es|ial|ing)\b/,
    /\bbanking\b/, /\bcompan(?:y|ies)\b/, /\bindustr(?:y|ies|ial)\b/, /\bmining\b/,
    /\bagricultur(?:e|al)\b/, /\btourism\b/, /\btechnolog(?:y|ies|ical)\b/, /\btelecom(?:s|munications)?\b/,
    /\bmanufactur(?:e|er|ers|ing)\b/, /\bcurrenc(?:y|ies)\b/, /\binflation\b/, /\bgdp\b/,
    /\bdebts?\b/, /\btax(?:es|ation)?\b/, /\bregulat(?:ion|ions|ory)\b/, /\bprocurement\b/,
    /\bemploy(?:ment|er|ers)\b/, /\bjobs?\b/, /\blogistics\b/, /\brevenues?\b/,
    /\bprofits?\b/, /\bearnings\b/, /\boutput\b/, /\bproductivity\b/,
];

const CONTEXTUAL_MARKET_EVIDENCE = [
    /\b(?:bilateral|continental|cross-border|export|goods|import|international|regional|services) trade\b/,
    /\btrade (?:agreement|balance|corridor|data|deal|deficit|figures|finance|flows?|pact|policy|route|surplus|tariffs?|volumes?)\b/,
    /\b(?:central|commercial|development|investment|reserve) banks?\b/,
    /\binfrastructure (?:finance|financing|investment|market|plan|plans|programme|programmes|project|projects|spending)\b/,
    /\benergy (?:capacity|finance|financing|investment|market|prices?|project|projects|sector|supply)\b/,
    /\b(?:economic|industrial|market|revenue|trade) growth\b/,
    /\b(?:economic|fiscal|industrial|investment|monetary|trade) policy\b/,
    /\b(?:infrastructure|investment|power|rail|road|solar|transport) projects?\b/,
    /\b(?:commercial|container|export|logistics|shipping|trade) ports?\b/,
];

const CORE_ECONOMIC_SIGNAL = /\b(?:business(?:es)?|econom(?:y|ic|ics)|earnings|financ(?:e|es|ial|ing)|gdp|inflation|invest(?:ment|ments|or|ors|ing)|markets?|profits?|revenues?|tax(?:es|ation)?)\b/;
const NON_MARKET_DOMINANT_CONTEXT = /\b(?:arms|cartels?|cocaine|crime|criminal|disease|drugs?|ebola|epidemic|fighting|humanitarian|meth|migrants?|outbreak|police|refugees?|trafficking|violence|war)\b/;

export function isMarketEvidence(title: string, content: string): boolean {
    const haystack = normalizedDiscoveryText(`${title} ${content}`);
    if (NON_MARKET_DOMINANT_CONTEXT.test(haystack) && !CORE_ECONOMIC_SIGNAL.test(haystack)) return false;
    return [...STRONG_MARKET_EVIDENCE, ...CONTEXTUAL_MARKET_EVIDENCE].some(pattern => pattern.test(haystack));
}

export async function parseRSS(url: string): Promise<RSSItem[]> {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'BestOfAfrica/1.0' },
        });

        if (!response.ok) return [];

        const xml = await response.text();
        const items: RSSItem[] = [];

        // Simple regex-based parsing (production would use proper XML parser)
        // RSS 1.0/RDF feeds (including Deutsche Welle) attach rdf:about to
        // <item>. Requiring the exact literal `<item>` silently returned zero.
        const itemRegex = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g;
        let match;

        while ((match = itemRegex.exec(xml)) !== null) {
            const itemXml = match[1];

            const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
            const link = itemXml.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/)?.[1] || '';
            const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || '';
            // WordPress-style feeds carry the full article body in
            // <content:encoded>; <description> is only a teaser. Prefer the
            // fuller text so generation has enough source evidence to audit.
            const encoded = itemXml.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i)?.[1] || '';
            const pubDate = itemXml.match(/<(?:pubDate|dc:date)>(.*?)<\/(?:pubDate|dc:date)>/i)?.[1] || '';
            const rawImage =
                itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] ||
                itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
                itemXml.match(/<enclosure[^>]+type=["']image\/[^"]+["'][^>]+url=["']([^"']+)["']/i)?.[1] ||
                itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i)?.[1] ||
                null;
            const imageCredit = itemXml.match(/<media:credit[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/media:credit>/i)?.[1]?.trim() || null;
            const publisherMatch = itemXml.match(/<source(?:\s+url=["']([^"']+)["'])?[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/i);

            if (title && link) {
                items.push({
                    title: decodeBasicEntities(title.replace(/<[^>]*>/g, '').trim()),
                    link: link.trim(),
                    description: (() => {
                        const body = decodeBasicEntities(encoded.replace(/<[^>]*>/g, '').trim());
                        const summary = decodeBasicEntities(description.replace(/<[^>]*>/g, '').trim());
                        return body.length > summary.length ? body : summary;
                    })(),
                    pubDate: pubDate.trim(),
                    imageUrl: normalizeEditorialImageUrl(rawImage, link.trim()),
                    imageCredit,
                    publisherName: publisherMatch?.[2]?.replace(/<[^>]*>/g, '').trim() || null,
                    publisherUrl: publisherMatch?.[1]?.trim() || null,
                });
            }
        }

        // Several high-quality publishers expose Atom rather than RSS. Treating
        // only <item> as valid silently excluded those feeds from the source mix.
        const entryRegex = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g;
        while ((match = entryRegex.exec(xml)) !== null) {
            const entryXml = match[1];
            const title = entryXml.match(/<title(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1] || '';
            const link = entryXml.match(/<link[^>]+(?:rel=["']alternate["'][^>]+)?href=["']([^"']+)["'][^>]*\/?\s*>/i)?.[1] || '';
            const description = entryXml.match(/<(?:summary|content)(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:summary|content)>/i)?.[1] || '';
            const pubDate = entryXml.match(/<(?:published|updated)>(.*?)<\/(?:published|updated)>/i)?.[1] || '';
            const rawImage = entryXml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)?.[1] || null;
            if (title && link) {
                items.push({
                    title: decodeBasicEntities(title.replace(/<[^>]*>/g, '').trim()),
                    link: link.trim(),
                    description: decodeBasicEntities(description.replace(/<[^>]*>/g, '').trim()),
                    pubDate: pubDate.trim(),
                    imageUrl: normalizeEditorialImageUrl(rawImage, link.trim()),
                    imageCredit: null,
                    publisherName: null,
                    publisherUrl: null,
                });
            }
        }

        return items.slice(0, 50); // Limit per source
    } catch (error) {
        console.error(`Failed to parse RSS ${url}:`, error);
        return [];
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Full Content Scraper
// Fetches and extracts main content from article URLs
// ───────────────────────────────────────────────────────────────────────────────
const decodeBasicEntities = (value: string) => value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

export function extractParagraphEvidence(html: string): string {
    return Array.from(html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi))
        .map(match => decodeBasicEntities(match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()))
        .filter(paragraph => paragraph.length >= 30)
        .join('\n\n')
        .trim();
}

/** Extract article candidates from a publisher's own listing page. */
export async function parseHTMLListing(url: string): Promise<RSSItem[]> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BestOfAfrica/1.0 (African Market Intelligence Platform)',
                'Accept': 'text/html,application/xhtml+xml',
            },
        });
        if (!response.ok) return [];

        const html = await response.text();
        const base = new URL(url);
        const seen = new Set<string>();
        const items: RSSItem[] = [];
        const anchorRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let match: RegExpExecArray | null;
        while ((match = anchorRegex.exec(html)) !== null) {
            let resolved: URL;
            try {
                resolved = new URL(decodeBasicEntities(match[1]), base);
            } catch {
                continue;
            }
            const isArticlePath = /\/(?:article|articles|news|pressroom|press-release|press-releases|news-and-events)\//i.test(resolved.pathname);
            if (resolved.hostname !== base.hostname || !isArticlePath || resolved.pathname === base.pathname) continue;
            resolved.hash = '';
            const articleUrl = resolved.toString();
            if (seen.has(articleUrl)) continue;
            const title = decodeBasicEntities(
                match[2]
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim(),
            );
            if (title.length < 20) continue;
            seen.add(articleUrl);
            items.push({
                title,
                link: articleUrl,
                description: '',
                pubDate: '',
                imageUrl: null,
                imageCredit: null,
                publisherName: null,
                publisherUrl: base.origin,
            });
        }
        return items.slice(0, 100);
    } catch (error) {
        console.error(`Failed to parse publisher listing ${url}:`, error);
        return [];
    }
}

interface CoverageCountry {
    name: string;
    recent_count: number;
}

/** Prefer valid evidence naming markets with the least recent output. */
export function rankCandidatesForCoverage<T extends { title: string; content: string }>(
    items: T[],
    countries: CoverageCountry[],
): T[] {
    const score = (item: T) => {
        const named = countries.filter(country => mentionsTargetCountry(item.title, item.content, country.name));
        if (!named.length) return Number.MAX_SAFE_INTEGER;
        return Math.min(...named.map(country => Number(country.recent_count || 0)));
    };
    return items
        .map((item, index) => ({ item, index, score: score(item) }))
        .sort((a, b) => a.score - b.score || a.index - b.index)
        .map(entry => entry.item);
}

async function scrapeFullContent(url: string): Promise<{ content: string | null; imageUrl: string | null; imageCredit: string | null }> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BestOfAfrica/1.0 (African News Intelligence Platform)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) return { content: null, imageUrl: null, imageCredit: null };

        const html = await response.text();
        const publisherImage = extractPublisherImage(html, url);

        // Extract main content using simple heuristics
        let content = '';

        // Try to find article content in common containers
        const contentPatterns = [
            /<article[^>]*>([\s\S]*?)<\/article>/i,
            /<div[^>]*class="[^"]*(?:article|content|post|entry|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<main[^>]*>([\s\S]*?)<\/main>/i,
        ];

        for (const pattern of contentPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                content = match[1];
                break;
            }
        }

        // Fallback: try to get body content
        if (!content) {
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
            content = bodyMatch?.[1] || '';
        }

        // Clean up the content
        content = content
            // Remove scripts and styles
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            // Remove common non-content elements
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
            .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
            // Remove comments
            .replace(/<!--[\s\S]*?-->/g, '')
            // Convert paragraphs to newlines
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            // Remove remaining HTML tags
            .replace(/<[^>]+>/g, '')
            // Decode HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

        // Nested layout containers often make the first regex match end at the
        // first inner </div>, leaving only a teaser. Aggregate semantic
        // paragraphs across the document and prefer that evidence when fuller.
        const paragraphEvidence = extractParagraphEvidence(html);
        if (paragraphEvidence.length > content.length) content = paragraphEvidence;

        // Only return if we have substantial content (at least 200 chars)
        return {
            content: content.length > 200 ? content.slice(0, 10000) : null,
            ...publisherImage,
        };

    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return { content: null, imageUrl: null, imageCredit: null };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// NewsAPI Fetcher
// ───────────────────────────────────────────────────────────────────────────────
interface NewsAPIArticle {
    title: string;
    url: string;
    description: string;
    publishedAt: string;
    source: { name: string };
}

async function fetchNewsAPI(apiKey: string, query: string): Promise<NewsAPIArticle[]> {
    try {
        const url = new URL('https://newsapi.org/v2/everything');
        url.searchParams.set('q', query);
        url.searchParams.set('language', 'en');
        url.searchParams.set('sortBy', 'publishedAt');
        url.searchParams.set('pageSize', '20');
        url.searchParams.set('apiKey', apiKey);

        const response = await fetch(url.toString());

        if (!response.ok) return [];

        const data = await response.json() as { articles: NewsAPIArticle[] };
        return data.articles || [];
    } catch (error) {
        console.error('Failed to fetch NewsAPI:', error);
        return [];
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Main Ingestion Function
// ───────────────────────────────────────────────────────────────────────────────
export async function ingestNews(env: Env): Promise<{ processed: number; queued: number }> {
    console.log('Starting news ingestion...');

    let processed = 0;
    let queued = 0;

    // Rotate through sources least-recently-fetched first, processing only a
    // bounded subset per invocation. Running every minute, this cycles full
    // coverage over a few minutes while keeping each run well under the Worker
    // subrequest / binding-call limits (which previously failed with
    // "Too many subrequests" when all ~82 sources were fetched at once).
    const SOURCES_PER_RUN = 6;
    const sourcesResult = await env.DB.prepare(`
    SELECT id, name, type, url, country_code, sector_id
    FROM sources
    WHERE is_active = 1
      AND (last_fetched_at IS NULL OR last_fetched_at <= datetime('now', '-' || COALESCE(fetch_interval_minutes, 60) || ' minutes'))
      AND id = (
        SELECT s2.id FROM sources s2
        WHERE s2.is_active = 1 AND s2.url = sources.url
        ORDER BY s2.created_at ASC, s2.id ASC LIMIT 1
      )
    ORDER BY
      CASE
        WHEN name IN (
          'UN Economic Commission for Africa', 'African Union', 'UN News Africa', 'World Trade Organization',
          'African Development Bank Group', 'African Development Bank News', 'World Bank Africa News',
          'International Monetary Fund News', 'UN Trade and Development News', 'International Finance Corporation Africa',
          'International Energy Agency Africa', 'International Renewable Energy Agency News', 'FAO Africa News'
        ) THEN 0
        WHEN name IN ('BBC Africa', 'Associated Press Africa', 'Financial Times Africa', 'The Economist Africa', 'The Guardian Africa',
                      'France 24 Africa', 'Deutsche Welle Africa', 'Al Jazeera', 'The Africa Report',
                      'African Business', 'The Conversation Africa', 'Semafor Africa', 'Daily Maverick', 'TechCabal') THEN 1
        WHEN name LIKE 'AllAfrica%' THEN 3
        ELSE 2
      END,
      last_fetched_at ASC
    LIMIT ?
  `).bind(SOURCES_PER_RUN).all();

    const sources = sourcesResult.results || [];
    const BATCH_SIZE = 6; // Process in parallel within the run

    // Per-invocation budgets (shared across fixed-source + discovery tasks) to
    // cap total fetches/DB writes and stay within Worker limits.
    const MAX_ITEMS_PER_SOURCE = 6;
    const MAX_NEW_ITEMS_PER_FIXED_SOURCE = 1;
    let scrapeBudget = 8;   // full-content scrapes (each is an extra fetch)
    let fixedItemBudget = 12;
    let discoveryItemBudget = 8;

    const fixedCoverage = await env.DB.prepare(`
        SELECT c.name, COUNT(a.id) AS recent_count
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code
          AND a.status IN ('published', 'pending_audit')
          AND a.created_at >= datetime('now', '-30 days')
        GROUP BY c.code, c.name
        ORDER BY recent_count ASC, c.name ASC
    `).all<CoverageCountry>();

    const fixedQualityMix = await env.DB.prepare(`
        SELECT COUNT(*) AS total_30d,
               SUM(CASE WHEN source_quality_tier = 2 THEN 1 ELSE 0 END) AS tier2_30d
        FROM articles
        WHERE status IN ('published', 'pending_audit')
          AND COALESCE(published_at, created_at) >= datetime('now', '-30 days')
    `).first<{ total_30d: number; tier2_30d: number }>();
    const fixedTier2Share = Number(fixedQualityMix?.total_30d || 0) > 0
        ? Number(fixedQualityMix?.tier2_30d || 0) / Number(fixedQualityMix?.total_30d || 1)
        : 0;

    const recordSourceYield = async (
        sourceId: string,
        stats: { items: number; qualified: number; duplicates: number; queued: number; error?: string | null },
    ) => {
        await env.DB.prepare(`
            INSERT INTO source_acquisition_yield
                (source_id, fetch_count, consecutive_zero_qualified, last_items_found,
                 last_qualified_found, last_duplicates_found, last_queued,
                 total_qualified_found, total_queued, last_error, last_fetched_at, last_productive_at)
            VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'),
                    CASE WHEN ? > 0 THEN datetime('now') ELSE NULL END)
            ON CONFLICT(source_id) DO UPDATE SET
                fetch_count = fetch_count + 1,
                consecutive_zero_qualified = CASE WHEN excluded.last_qualified_found > 0 THEN 0 ELSE consecutive_zero_qualified + 1 END,
                last_items_found = excluded.last_items_found,
                last_qualified_found = excluded.last_qualified_found,
                last_duplicates_found = excluded.last_duplicates_found,
                last_queued = excluded.last_queued,
                total_qualified_found = total_qualified_found + excluded.last_qualified_found,
                total_queued = total_queued + excluded.last_queued,
                last_error = excluded.last_error,
                last_fetched_at = datetime('now'),
                last_productive_at = CASE WHEN excluded.last_queued > 0 THEN datetime('now') ELSE last_productive_at END
        `).bind(
            sourceId,
            stats.qualified > 0 ? 0 : 1,
            stats.items,
            stats.qualified,
            stats.duplicates,
            stats.queued,
            stats.qualified,
            stats.queued,
            stats.error || null,
            stats.queued,
        ).run();
    };

    // Define the Fixed Sources Task
    const fixedSourcesTask = async () => {
        console.log(`Processing ${sources.length} fixed sources...`);
        for (let i = 0; i < sources.length; i += BATCH_SIZE) {
            const batch = sources.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (source: any) => {
                const s = source;
                let itemsFound = 0;
                let qualifiedFound = 0;
                let duplicatesFound = 0;
                let queuedFromSource = 0;
                try {
                    const sourceProfile = sourceQualityProfile(s.name, s.url, 'fixed');
                    if (sourceProfile.tier <= 1) {
                        await env.DB.prepare(`UPDATE sources SET last_fetched_at = datetime('now') WHERE id = ?`).bind(s.id).run();
                        console.warn(`[ingestion] Skipping non-independent source ${s.name}.`);
                        return;
                    }
                    if (sourceProfile.tier === 2 && fixedTier2Share >= 0.20) {
                        await env.DB.prepare(`UPDATE sources SET last_fetched_at = datetime('now') WHERE id = ?`).bind(s.id).run();
                        console.warn(`[ingestion] Pausing national source ${s.name}: the rolling national-source share is ${(fixedTier2Share * 100).toFixed(1)}%.`);
                        return;
                    }
                    let items: Array<{ title: string; url: string; content: string; publishedAt: string; imageUrl: string | null; imageCredit: string | null; publisherName: string | null; publisherUrl: string | null }> = [];

                    if (s.type === 'rss') {
                        const rssItems = await parseRSS(s.url);
                        items = rssItems.map(item => ({
                            title: item.title, url: item.link, content: item.description, publishedAt: item.pubDate, imageUrl: item.imageUrl, imageCredit: item.imageCredit, publisherName: item.publisherName, publisherUrl: item.publisherUrl,
                        }));
                    } else if (s.type === 'html') {
                        const listingItems = await parseHTMLListing(s.url);
                        items = listingItems.map(item => ({
                            title: item.title, url: item.link, content: item.description, publishedAt: item.pubDate, imageUrl: item.imageUrl, imageCredit: item.imageCredit, publisherName: item.publisherName, publisherUrl: item.publisherUrl,
                        }));
                    } else if (s.type === 'newsapi' && env.NEWS_API_KEY) {
                        const newsItems = await fetchNewsAPI(env.NEWS_API_KEY, s.url);
                        items = newsItems.map(item => ({
                            title: item.title, url: item.url, content: item.description || '', publishedAt: item.publishedAt, imageUrl: null, imageCredit: null, publisherName: item.source?.name || null, publisherUrl: null,
                        }));
                    }

                    itemsFound = items.length;
                    const qualifiedItems = rankCandidatesForCoverage(
                        items.filter(item =>
                            isAfricanContent(item.title, item.content)
                            && isMarketEvidence(item.title, item.content)
                        ),
                        fixedCoverage.results || [],
                    );
                    qualifiedFound = qualifiedItems.length;

                    // Filter the complete payload before applying the database
                    // budget so relevant evidence later in a broad feed is not
                    // silently excluded by feed order.
                    let acceptedFromSource = 0;
                    for (const item of qualifiedItems.slice(0, MAX_ITEMS_PER_SOURCE)) {
                        if (fixedItemBudget <= 0 || acceptedFromSource >= MAX_NEW_ITEMS_PER_FIXED_SOURCE) break;
                        // URL-level dedup is intentionally global: duplicate source
                        // rows must not turn one wire record into several articles.
                        const existing = await env.DB.prepare(`SELECT id FROM ingested_items WHERE external_id = ? LIMIT 1`).bind(item.url).first();
                        if (existing) {
                            duplicatesFound++;
                            continue;
                        }

                        // Strict Africa relevance gate (applies even to country-coded
                        // sources — a regional outlet can still run off-topic wire stories).
                        processed++;
                        fixedItemBudget--;
                        acceptedFromSource++;

                        let fullContent = item.content;
                        let imageUrl = item.imageUrl;
                        let imageCredit = item.imageCredit;
                        if (fullContent.length < 3000 && item.url && scrapeBudget > 0) {
                            scrapeBudget--;
                            try {
                                const scraped = await scrapeFullContent(item.url);
                                if (scraped.content) fullContent = scraped.content;
                                imageUrl ||= scraped.imageUrl;
                                imageCredit ||= scraped.imageCredit;
                            } catch (e) { /* Ignore */ }
                        }

                        const itemId = crypto.randomUUID();
                        await env.DB.prepare(`
                            INSERT INTO ingested_items (id, source_id, external_id, title, content, url, published_at, image_url, image_credit, image_source_url, publisher_name, publisher_url, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                        `).bind(itemId, s.id, item.url, item.title, fullContent, item.url, item.publishedAt || new Date().toISOString(), imageUrl, imageUrl ? (imageCredit || s.name) : null, imageUrl ? item.url : null, item.publisherName || s.name, item.publisherUrl || s.url).run();

                        await env.CONTENT_QUEUE.send({
                            type: 'generate_article', ingested_item_id: itemId, source_id: s.id, priority: 'normal',
                        });
                        queued++;
                        queuedFromSource++;
                    }
                    await env.DB.prepare(`UPDATE sources SET last_fetched_at = datetime('now') WHERE id = ?`).bind(s.id).run();
                    await recordSourceYield(s.id, {
                        items: itemsFound,
                        qualified: qualifiedFound,
                        duplicates: duplicatesFound,
                        queued: queuedFromSource,
                    });
                } catch (error) {
                    console.error(`Failed to process source ${s.name}:`, error);
                    try {
                        await recordSourceYield(s.id, {
                            items: itemsFound,
                            qualified: qualifiedFound,
                            duplicates: duplicatesFound,
                            queued: queuedFromSource,
                            error: error instanceof Error ? error.message.slice(0, 500) : 'Source acquisition failed',
                        });
                    } catch (metricError) {
                        console.error(`Failed to record source yield for ${s.name}:`, metricError);
                    }
                }
            }));
        }
    };

    // Define the Massive Scale Discovery Task (Google News)
    const discoveryTask = async () => {
        try {
            // Ensure the synthetic source row exists so FK constraints on ingested_items.source_id are satisfied.
            await env.DB.prepare(`
                INSERT INTO sources (id, name, type, url, is_active, fetch_interval_minutes)
                VALUES ('google-news-aggregator', 'Google News Aggregator', 'custom', 'https://news.google.com/rss', 1, 60)
                ON CONFLICT(id) DO NOTHING
            `).run();

            console.log('Starting Massive Scale Discovery with PRIORITY TARGETING...');

            // PRIORITY TARGETING: Query underserved countries first
            const underservedQuery = await env.DB.prepare(`
                SELECT c.code, c.name, c.region,
                       SUM(CASE WHEN a.status IN ('published', 'pending_audit')
                                 AND a.created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) AS article_count
                       , d.last_attempted_at
                FROM countries c
                LEFT JOIN articles a ON a.country_code = c.code
                LEFT JOIN coverage_discovery_state d ON d.country_code = c.code
                GROUP BY c.code, d.last_attempted_at
                ORDER BY article_count ASC,
                         COALESCE(d.last_attempted_at, '1970-01-01') ASC,
                         c.region ASC, c.name ASC
            `).all();

            const sectors = await env.DB.prepare('SELECT name FROM sectors').all();
            let discoveryCatalog: Array<{ domain: string; lane: string }> = [...TRUSTED_DISCOVERY_CATALOG];
            try {
                const configuredCatalog = await env.DB.prepare(`
                    SELECT domain, lane
                    FROM discovery_source_catalog
                    WHERE is_active = 1 AND quality_tier >= 3
                    ORDER BY quality_tier DESC, lane ASC, domain ASC
                `).all<{ domain: string; lane: string }>();
                if (configuredCatalog.results?.length) discoveryCatalog = configuredCatalog.results;
            } catch (error) {
                console.warn('[ingestion] Using the built-in discovery catalogue fallback.', error);
            }

            // Take the least-covered, least-recently-attempted country from every
            // region. Persisting attempts prevents a hard-to-source market from
            // permanently monopolising a regional slot while retaining a strict
            // all-country coverage objective.
            const minute = Math.floor(Date.now() / 60000);
            const byRegion = new Map<string, Array<{ code: string; name: string; article_count: number; last_attempted_at: string | null }>>();
            for (const country of (underservedQuery.results || []) as Array<{ code: string; name: string; region: string; article_count: number; last_attempted_at: string | null }>) {
                const group = byRegion.get(country.region) || [];
                group.push(country);
                byRegion.set(country.region, group);
            }
            const targetCountries = [...byRegion.values()].map(group => group[0]).filter(Boolean);
            await Promise.all(targetCountries.map(country => env.DB.prepare(`
                INSERT INTO coverage_discovery_state (country_code, last_attempted_at, attempt_count)
                VALUES (?, datetime('now'), 1)
                ON CONFLICT(country_code) DO UPDATE SET
                    last_attempted_at = datetime('now'),
                    attempt_count = attempt_count + 1
            `).bind(country.code).run()));
            const sectorList = (sectors.results || []).map((s: any) => s.name);
            const targetSector = sectorList[minute % Math.max(1, sectorList.length)];
            const sourcesForLanes = (lanes: string[]) => {
                const configured = discoveryCatalog.filter(source => lanes.includes(source.lane));
                if (configured.length) return configured;
                return TRUSTED_DISCOVERY_CATALOG.filter(source => lanes.includes(source.lane));
            };
            const countryPool = sourcesForLanes(['global-news', 'primary-evidence', 'markets', 'multilingual']);
            const globalNewsPool = sourcesForLanes(['global-news']);
            const primaryEvidencePool = sourcesForLanes(['primary-evidence']);
            const countryContextPool = sourcesForLanes(['markets', 'multilingual', 'africa-specialist']);
            const sectorPool = discoveryCatalog.filter(source =>
                ['sector-evidence', 'primary-evidence', 'markets'].includes(source.lane)
            );
            const domainWindow = (pool: Array<{ domain: string; lane: string }>, offset: number, size = 3) =>
                Array.from({ length: size }, (_, index) => pool[(offset + index) % pool.length].domain);
            const globalDomains = domainWindow(countryPool, minute % countryPool.length, 2);

            console.log(`PRIORITY COUNTRIES (underserved): ${targetCountries.map(country => country.name).join(', ')}`);

            const queries: Array<{ query: string; targetCountryCode?: string; targetCountryName?: string }> = [
                ...targetCountries.map((country, index) => {
                    // Each country search combines a global newsroom, a primary
                    // institution and a regional/market specialist. This avoids
                    // three adjacent catalogue entries representing one evidence
                    // type and gives every market triangulated acquisition paths.
                    const domains = [
                        globalNewsPool[(minute + index) % globalNewsPool.length].domain,
                        primaryEvidencePool[(minute + index * 3) % primaryEvidencePool.length].domain,
                        countryContextPool[(minute + index * 5) % countryContextPool.length].domain,
                    ];
                    return {
                        query: `(${domains.map(domain => `site:${domain}`).join(' OR ')}) "${country.name}" (economy OR business OR trade OR investment OR infrastructure) when:30d`,
                        targetCountryCode: country.code,
                        targetCountryName: country.name,
                    };
                }),
                ...(targetSector ? [{
                    query: `(${domainWindow(sectorPool, minute % sectorPool.length).map(domain => `site:${domain}`).join(' OR ')}) "${targetSector}" Africa (market OR trade OR investment OR policy) when:14d`,
                }] : []),
                ...globalDomains.map(domain => ({ query: `site:${domain} Africa economy trade investment markets when:14d` })),
            ];

            console.log(`Aggregating topics: ${queries.map(item => item.query).join(' | ')}`);

            await Promise.all(queries.map(async ({ query, targetCountryCode, targetCountryName }) => {
                try {
                    const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
                    const items = await parseRSS(googleNewsUrl);

                    let acceptedFromQuery = 0;
                    // Filter the full fetched set in memory before spending D1
                    // dedup calls on qualified country and market evidence.
                    const candidates = items.filter(item =>
                        (!targetCountryName || mentionsTargetCountry(item.title, item.description || '', targetCountryName))
                        && isAfricanContent(item.title, item.description || '')
                        && isMarketEvidence(item.title, item.description || '')
                        && sourceQualityProfile(item.publisherName, item.publisherUrl || item.link, 'discovery').tier >= 3
                    );
                    for (const item of candidates.slice(0, 12)) {
                        if (discoveryItemBudget <= 0 || acceptedFromQuery >= 1) break;
                        // Discovery results can drift off-topic — enforce the same Africa gate.
                        const publisherProfile = sourceQualityProfile(item.publisherName, item.publisherUrl || item.link, 'discovery');
                        if (publisherProfile.tier < 3) {
                            console.warn(`[ingestion] Discovery source rejected: ${item.publisherName || item.publisherUrl || 'unknown publisher'}.`);
                            continue;
                        }
                        const existing = await env.DB.prepare(`SELECT id FROM ingested_items WHERE external_id = ?`).bind(item.link).first();
                        if (existing) continue;

                        discoveryItemBudget--;
                        acceptedFromQuery++;
                        let fullContent = item.description || '';
                        let imageUrl = item.imageUrl;
                        let imageCredit = item.imageCredit;
                        if (fullContent.length < 500 && item.link && scrapeBudget > 0) {
                            scrapeBudget--;
                            try {
                                const scraped = await scrapeFullContent(item.link);
                                if (scraped.content) fullContent = scraped.content;
                                imageUrl ||= scraped.imageUrl;
                                imageCredit ||= scraped.imageCredit;
                            } catch (error) {
                                console.warn(`[ingestion] Discovery scrape failed for ${item.link}.`, error);
                            }
                        }

                        const itemId = crypto.randomUUID();
                        await env.DB.prepare(`
                            INSERT INTO ingested_items (id, source_id, external_id, title, content, url, published_at, image_url, image_credit, image_source_url, publisher_name, publisher_url, status)
                            VALUES (?, 'google-news-aggregator', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
                        `).bind(itemId, item.link, item.title, fullContent, item.link, item.pubDate || new Date().toISOString(), imageUrl, imageUrl ? (imageCredit || item.publisherName || 'Original reporting source') : null, imageUrl ? item.link : null, item.publisherName || 'Original reporting source', item.publisherUrl || item.link).run();

                        await env.CONTENT_QUEUE.send({
                            type: 'generate_article', ingested_item_id: itemId, source_id: 'google-news-aggregator', priority: 'normal',
                        });
                        if (targetCountryCode) {
                            await env.DB.prepare(`
                                UPDATE coverage_discovery_state
                                SET last_queued_at = datetime('now'), queued_count = queued_count + 1
                                WHERE country_code = ?
                            `).bind(targetCountryCode).run();
                        }
                        processed++;
                        queued++;
                    }
                } catch (e) {
                    console.error(`Discovery failed for query ${query}:`, e);
                }
            }));
        } catch (error) {
            console.error('Failed to execute Massive Scale Discovery:', error);
        }
    };

    // EXECUTE BOTH PIPELINES CONCURRENTLY
    // This ensures discovery never waits for RSS scraping to finish
    await Promise.all([
        fixedSourcesTask(),
        discoveryTask()
    ]);

    // Recover recent authoritative items that were rejected only because the
    // earlier scraper captured a teaser. This is deliberately bounded and
    // marks failed direct fetches terminally so inaccessible paywalls are not
    // retried every minute.
    if (scrapeBudget > 0) {
        const recoveryCandidates = await env.DB.prepare(`
            SELECT id, source_id, url, publisher_name, publisher_url, content
            FROM ingested_items
            WHERE status = 'rejected'
              AND rejection_reason LIKE 'Insufficient source evidence:%'
              AND created_at >= datetime('now', '-14 days')
            ORDER BY created_at DESC
            LIMIT 8
        `).all<Record<string, string | null>>();
        let recoveryAttempts = 0;
        for (const candidate of recoveryCandidates.results || []) {
            if (recoveryAttempts >= 2 || scrapeBudget <= 0) break;
            const profile = sourceQualityProfile(candidate.publisher_name, candidate.publisher_url || candidate.url, 'fixed');
            if (profile.tier < 3 || !candidate.url) continue;
            recoveryAttempts++;
            scrapeBudget--;
            const scraped = await scrapeFullContent(candidate.url);
            const recoveredContent = scraped.content || candidate.content || '';
            if (recoveredContent.replace(/\s+/g, ' ').trim().length >= 3000) {
                await env.DB.prepare(`
                    UPDATE ingested_items
                    SET content = ?, image_url = COALESCE(?, image_url),
                        image_credit = COALESCE(?, image_credit), status = 'pending', rejection_reason = NULL
                    WHERE id = ? AND status = 'rejected'
                `).bind(recoveredContent, scraped.imageUrl, scraped.imageCredit, candidate.id).run();
                await env.CONTENT_QUEUE.send({
                    type: 'generate_article',
                    ingested_item_id: candidate.id,
                    source_id: candidate.source_id || 'source-recovery',
                    priority: 'normal',
                });
                processed++;
                queued++;
            } else {
                await env.DB.prepare(`
                    UPDATE ingested_items
                    SET rejection_reason = ?
                    WHERE id = ? AND status = 'rejected'
                `).bind(
                    `Source recovery unavailable after direct fetch: ${recoveredContent.length} characters; 3000 required.`,
                    candidate.id,
                ).run();
            }
        }
    }

    console.log(`Ingestion complete: ${processed} processed, ${queued} queued`);
    return { processed, queued };
}

// ───────────────────────────────────────────────────────────────────────────────
// Default RSS Sources for Africa News
// Comprehensive coverage: General, Sector-specific, Country-specific
// ───────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SOURCES = [
    // ═══════════════════════════════════════════════════════════════════════════════
    // GENERAL AFRICAN NEWS
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'African Business', type: 'rss', url: 'https://african.business/feed/', sector_id: null, country_code: null },
    { name: 'The Africa Report', type: 'rss', url: 'https://www.theafricareport.com/feed/', sector_id: null, country_code: null },
    { name: 'AllAfrica', type: 'rss', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', sector_id: null, country_code: null },
    { name: 'CNBC Africa', type: 'rss', url: 'https://www.cnbcafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'BBC Africa', type: 'rss', url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', sector_id: null, country_code: null },
    { name: 'Associated Press Africa', type: 'html', url: 'https://apnews.com/hub/africa', sector_id: null, country_code: null },
    { name: 'Financial Times Africa', type: 'rss', url: 'https://www.ft.com/world/africa?format=rss', sector_id: 'finance', country_code: null },
    { name: 'The Economist Africa', type: 'rss', url: 'https://www.economist.com/middle-east-and-africa/rss.xml', sector_id: 'finance', country_code: null },
    { name: 'The Guardian Africa', type: 'rss', url: 'https://www.theguardian.com/world/africa/rss', sector_id: null, country_code: null },
    { name: 'France 24 Africa', type: 'rss', url: 'https://www.france24.com/en/africa/rss', sector_id: null, country_code: null },
    { name: 'Deutsche Welle Africa', type: 'rss', url: 'https://rss.dw.com/rdf/rss-en-africa', sector_id: null, country_code: null },
    { name: 'Al Jazeera', type: 'rss', url: 'https://www.aljazeera.com/xml/rss/all.xml', sector_id: null, country_code: null },
    { name: 'African Arguments', type: 'rss', url: 'https://africanarguments.org/feed/', sector_id: null, country_code: null },
    { name: 'Africa News', type: 'rss', url: 'https://www.africanews.com/rss', sector_id: null, country_code: null },
    { name: 'The Continent', type: 'rss', url: 'https://www.thecontinent.org/feed/', sector_id: null, country_code: null },
    { name: 'The Conversation Africa', type: 'rss', url: 'https://theconversation.com/africa/articles.atom', sector_id: null, country_code: null },
    { name: 'Semafor Africa', type: 'rss', url: 'https://www.semafor.com/feed/africa', sector_id: null, country_code: null },
    { name: 'Quartz Africa', type: 'rss', url: 'https://qz.com/africa/rss', sector_id: null, country_code: null },
    { name: 'UN Economic Commission for Africa', type: 'rss', url: 'https://www.uneca.org/rss.xml', sector_id: null, country_code: null },
    { name: 'African Union', type: 'rss', url: 'https://au.int/en/rss.xml', sector_id: null, country_code: null },
    { name: 'UN News Africa', type: 'rss', url: 'https://news.un.org/feed/subscribe/en/news/region/africa/feed/rss.xml', sector_id: null, country_code: null },
    { name: 'World Trade Organization', type: 'rss', url: 'https://www.wto.org/library/rss/latest_news_e.xml', sector_id: 'finance', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // BUSINESS & INVESTMENT
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'Ventures Africa', type: 'rss', url: 'https://venturesafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'How We Made It In Africa', type: 'rss', url: 'https://www.howwemadeitinafrica.com/feed/', sector_id: 'finance', country_code: null },
    { name: 'Africa Business Insider', type: 'rss', url: 'https://africa.businessinsider.com/feed', sector_id: 'finance', country_code: null },
    { name: 'African Private Equity', type: 'rss', url: 'https://www.africaprivateequity.co.za/feed/', sector_id: 'finance', country_code: null },
    { name: 'Afrik21', type: 'rss', url: 'https://www.afrik21.africa/en/feed/', sector_id: 'energy', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // TECHNOLOGY & STARTUPS
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'TechCabal', type: 'rss', url: 'https://techcabal.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'Disrupt Africa', type: 'rss', url: 'https://disrupt-africa.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'TechPoint Africa', type: 'rss', url: 'https://techpoint.africa/feed/', sector_id: 'technology', country_code: 'NG' },
    { name: 'Digest Africa', type: 'rss', url: 'https://digestafrica.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'IT News Africa', type: 'rss', url: 'https://www.itnewsafrica.com/feed/', sector_id: 'technology', country_code: null },
    { name: 'Techweez', type: 'rss', url: 'https://www.techweez.com/feed/', sector_id: 'technology', country_code: 'KE' },

    // ═══════════════════════════════════════════════════════════════════════════════
    // ENERGY & MINING
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'ESI Africa', type: 'rss', url: 'https://www.esi-africa.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'African Mining Brief', type: 'rss', url: 'https://africanminingbrief.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'Mining Review Africa', type: 'rss', url: 'https://www.miningreview.com/feed/', sector_id: 'energy', country_code: null },
    { name: 'Energy Voice Africa', type: 'rss', url: 'https://www.energyvoice.com/category/oilandgas/africa/feed/', sector_id: 'energy', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // AGRICULTURE
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'African Farming', type: 'rss', url: 'https://www.africanfarming.net/feed/', sector_id: 'agriculture', country_code: null },
    { name: 'Agribusiness Global', type: 'rss', url: 'https://www.agribusinessglobal.com/feed/', sector_id: 'agriculture', country_code: null },
    { name: 'Farmers Review Africa', type: 'rss', url: 'https://farmersreviewafrica.com/feed/', sector_id: 'agriculture', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // TOURISM & TRAVEL
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'Tourism Update', type: 'rss', url: 'https://www.tourismupdate.co.za/feed/', sector_id: 'tourism', country_code: 'ZA' },
    { name: 'VoyagesAfriq', type: 'rss', url: 'https://voyagesafriq.com/feed/', sector_id: 'tourism', country_code: null },

    // ═══════════════════════════════════════════════════════════════════════════════
    // COUNTRY-SPECIFIC
    // ═══════════════════════════════════════════════════════════════════════════════
    { name: 'BusinessDay Nigeria', type: 'rss', url: 'https://businessday.ng/feed/', sector_id: null, country_code: 'NG' },
    { name: 'Nairametrics', type: 'rss', url: 'https://nairametrics.com/feed/', sector_id: 'finance', country_code: 'NG' },
    { name: 'The Guardian Nigeria', type: 'rss', url: 'https://guardian.ng/feed/', sector_id: null, country_code: 'NG' },
    { name: 'Business Daily Africa', type: 'rss', url: 'https://www.businessdailyafrica.com/rss', sector_id: null, country_code: 'KE' },
    { name: 'The Standard Kenya', type: 'rss', url: 'https://www.standardmedia.co.ke/rss/', sector_id: null, country_code: 'KE' },
    { name: 'Fin24', type: 'rss', url: 'https://www.news24.com/fin24/rss', sector_id: 'finance', country_code: 'ZA' },
    { name: 'Business Insider SA', type: 'rss', url: 'https://www.businessinsider.co.za/feed', sector_id: null, country_code: 'ZA' },
    { name: 'Daily Maverick', type: 'rss', url: 'https://www.dailymaverick.co.za/dmrss/', sector_id: null, country_code: 'ZA' },
    { name: 'Moneyweb', type: 'rss', url: 'https://www.moneyweb.co.za/feed/', sector_id: 'finance', country_code: 'ZA' },
    { name: 'Egypt Independent', type: 'rss', url: 'https://www.egyptindependent.com/feed/', sector_id: null, country_code: 'EG' },
    { name: 'Daily News Egypt', type: 'rss', url: 'https://dailynewsegypt.com/feed/', sector_id: null, country_code: 'EG' },
    { name: 'Ahram Online', type: 'rss', url: 'https://english.ahram.org.eg/RSS/Main/News.xml', sector_id: null, country_code: 'EG' },
    { name: 'Ghana Business News', type: 'rss', url: 'https://www.ghanabusinessnews.com/feed/', sector_id: null, country_code: 'GH' },
    { name: 'The New Times Rwanda', type: 'rss', url: 'https://www.newtimes.co.rw/rss', sector_id: null, country_code: 'RW' },
    { name: 'Morocco World News', type: 'rss', url: 'https://www.moroccoworldnews.com/feed/', sector_id: null, country_code: 'MA' },
    { name: 'Zitamar News', type: 'rss', url: 'https://zitamar.com/feed/', sector_id: null, country_code: 'MZ' },
    { name: 'Club of Mozambique', type: 'rss', url: 'https://clubofmozambique.com/feed/', sector_id: null, country_code: 'MZ' },
];
