/**
 * Press Release Aggregator - Free Company Announcements
 * Fetches press releases from multiple free RSS sources
 * No API key required
 */

import type { Env } from '../types';

export interface PressRelease {
    id: string;
    title: string;
    company?: string;
    summary: string;
    publishedAt: string;
    sourceUrl: string;
    source: string;
    countries: string[];
    sectors: string[];
}

// Free press release RSS feeds with African coverage
const PRESS_RELEASE_FEEDS = [
    { name: 'PR Newswire Africa', url: 'https://www.prnewswire.com/rss/africa-news.rss' },
    { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtTWw==' },
    { name: 'GlobeNewswire', url: 'https://www.globenewswire.com/RSSFeed/region/africa/feedType/rss' },
    { name: 'AllAfrica Press', url: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf' },
];

// African country detection
const AFRICAN_COUNTRIES = [
    'Nigeria', 'South Africa', 'Kenya', 'Egypt', 'Morocco', 'Ghana', 'Ethiopia',
    'Tanzania', 'Uganda', 'Senegal', 'Rwanda', 'Tunisia', 'Algeria', 'Angola',
    'Cameroon', 'Zambia', 'Zimbabwe', 'Mozambique', 'Botswana', 'Namibia', 'DRC',
];

// Sector keywords
const SECTOR_KEYWORDS: Record<string, string[]> = {
    'Energy': ['oil', 'gas', 'solar', 'wind', 'power', 'electricity', 'renewable'],
    'Finance': ['bank', 'fintech', 'payment', 'insurance', 'investment', 'crypto'],
    'Technology': ['tech', 'software', 'digital', 'AI', 'startup', 'innovation'],
    'Mining': ['mining', 'gold', 'diamond', 'copper', 'mineral', 'extraction'],
    'Agriculture': ['farm', 'agri', 'crop', 'food', 'cocoa', 'coffee', 'livestock'],
    'Healthcare': ['health', 'pharma', 'hospital', 'medical', 'vaccine', 'clinic'],
    'Telecom': ['telecom', 'mobile', 'network', '5G', 'broadband', 'internet'],
    'Infrastructure': ['infrastructure', 'construction', 'road', 'port', 'rail'],
};

/**
 * Fetch press releases from all sources
 */
export async function fetchPressReleases(
    env: Env,
    limit: number = 20
): Promise<PressRelease[]> {
    const cacheKey = `press:all:${limit}`;
    const cached = await env.CACHE.get(cacheKey, 'json') as PressRelease[] | null;
    if (cached) return cached;

    const allReleases: PressRelease[] = [];

    for (const feed of PRESS_RELEASE_FEEDS) {
        try {
            const response = await fetch(feed.url, {
                headers: { 'User-Agent': 'BestOfAfrica/1.0' }
            });

            if (!response.ok) continue;

            const text = await response.text();
            const releases = parseRSSFeed(text, feed.name);
            allReleases.push(...releases);
        } catch {
            // Skip failed feeds
        }
    }

    // Sort by date, newest first
    allReleases.sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const result = allReleases.slice(0, limit);
    await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 }); // 1 hour cache
    return result;
}

/**
 * Get press releases for a specific country
 */
export async function getCountryPressReleases(
    env: Env,
    countryName: string,
    limit: number = 10
): Promise<PressRelease[]> {
    const all = await fetchPressReleases(env, 50);
    return all
        .filter(pr => pr.countries.includes(countryName) ||
            pr.title.toLowerCase().includes(countryName.toLowerCase()) ||
            pr.summary.toLowerCase().includes(countryName.toLowerCase()))
        .slice(0, limit);
}

/**
 * Get press releases for a specific sector
 */
export async function getSectorPressReleases(
    env: Env,
    sector: string,
    limit: number = 10
): Promise<PressRelease[]> {
    const all = await fetchPressReleases(env, 50);
    return all
        .filter(pr => pr.sectors.includes(sector))
        .slice(0, limit);
}

/**
 * Get company-specific press releases
 */
export async function getCompanyPressReleases(
    env: Env,
    companyName: string,
    limit: number = 10
): Promise<PressRelease[]> {
    const all = await fetchPressReleases(env, 50);
    const lowerName = companyName.toLowerCase();
    return all
        .filter(pr =>
            pr.company?.toLowerCase().includes(lowerName) ||
            pr.title.toLowerCase().includes(lowerName))
        .slice(0, limit);
}

/**
 * Format press release for article enrichment
 */
export function formatPressReleaseInsight(releases: PressRelease[]): string {
    if (releases.length === 0) return '';

    const latest = releases[0];
    let insight = `**Latest Announcement**: "${latest.title}"`;
    if (latest.company) insight += ` - ${latest.company}`;
    insight += ` (${formatDate(latest.publishedAt)})`;

    if (releases.length > 1) {
        insight += `. ${releases.length - 1} more recent announcements.`;
    }

    return insight;
}

/**
 * Enrich article with relevant press releases
 */
export async function enrichWithPressReleases(
    env: Env,
    countryName: string,
    sector?: string
): Promise<string | null> {
    let releases: PressRelease[];

    if (sector) {
        releases = await getSectorPressReleases(env, sector, 3);
    } else {
        releases = await getCountryPressReleases(env, countryName, 3);
    }

    if (releases.length === 0) return null;
    return formatPressReleaseInsight(releases);
}

// Helper: Parse RSS feed
function parseRSSFeed(xml: string, sourceName: string): PressRelease[] {
    const releases: PressRelease[] = [];

    // Simple regex-based parsing for RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];

        const title = extractTag(item, 'title');
        const description = extractTag(item, 'description');
        const link = extractTag(item, 'link');
        const pubDate = extractTag(item, 'pubDate');

        if (!title) continue;

        const fullText = `${title} ${description}`.toLowerCase();

        // Detect countries mentioned
        const countries = AFRICAN_COUNTRIES.filter(country =>
            fullText.includes(country.toLowerCase())
        );

        // Detect sectors
        const sectors: string[] = [];
        for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
            if (keywords.some(kw => fullText.includes(kw))) {
                sectors.push(sector);
            }
        }

        // Extract company name (heuristic: first capitalized phrase)
        const companyMatch = title.match(/^([A-Z][a-zA-Z\s&]+?)(?:\s+Announces|\s+Reports|\s+Launches|\s+Partners|:)/);

        releases.push({
            id: generateId(title),
            title: cleanHtml(title),
            company: companyMatch?.[1]?.trim(),
            summary: cleanHtml(description).slice(0, 300),
            publishedAt: pubDate || new Date().toISOString(),
            sourceUrl: link || '',
            source: sourceName,
            countries,
            sectors,
        });
    }

    return releases;
}

function extractTag(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match?.[1] || match?.[2] || '';
}

function cleanHtml(text: string): string {
    return text
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function generateId(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
}

function formatDate(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'Recent';
    }
}
