// ═══════════════════════════════════════════════════════════════════════════════
// WIKIPEDIA SERVICE
// Free contextual data for countries, companies, and topics
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached } from './cache';

const WIKIPEDIA_API = 'https://en.wikipedia.org/api/rest_v1';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export interface WikiSummary {
    title: string;
    extract: string;
    description: string;
    thumbnail_url: string | null;
    page_url: string;
}

export interface WikiSection {
    title: string;
    content: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Page Summary
// ───────────────────────────────────────────────────────────────────────────────
export async function getWikiSummary(
    env: Env,
    title: string
): Promise<WikiSummary | null> {
    const cacheKey = `wiki:summary:${title.toLowerCase().replace(/\s+/g, '_')}`;

    return getCached(
        env,
        cacheKey,
        async () => {
            try {
                const encodedTitle = encodeURIComponent(title);
                const response = await fetch(
                    `${WIKIPEDIA_API}/page/summary/${encodedTitle}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'BOA-Story/1.0 (+https://best-of-africa.pages.dev/contact)',
                        },
                    }
                );

                if (!response.ok) return null;

                const data = await response.json() as Record<string, any>;

                return {
                    title: data.title,
                    extract: data.extract,
                    description: data.description || '',
                    thumbnail_url: data.thumbnail?.source || null,
                    page_url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`,
                };
            } catch (error) {
                console.error(`Wikipedia lookup failed for "${title}":`, error);
                return null;
            }
        },
        { ttl: 86400 * 7 } // Cache for 7 days
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Country Info
// ───────────────────────────────────────────────────────────────────────────────
const COUNTRY_WIKI_TITLES: Record<string, string> = {
    NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', EG: 'Egypt',
    MA: 'Morocco', GH: 'Ghana', TZ: 'Tanzania', ET: 'Ethiopia',
    RW: 'Rwanda', UG: 'Uganda', SN: 'Senegal', CI: 'Ivory Coast',
    AO: 'Angola', MZ: 'Mozambique', CM: 'Cameroon', CD: 'Democratic Republic of the Congo',
    DZ: 'Algeria', TN: 'Tunisia', SD: 'Sudan', ZM: 'Zambia', ZW: 'Zimbabwe',
};

export async function getCountryWikiInfo(
    env: Env,
    countryCode: string
): Promise<WikiSummary | null> {
    const title = COUNTRY_WIKI_TITLES[countryCode];
    if (!title) return null;

    return getWikiSummary(env, title);
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Sector Context
// ───────────────────────────────────────────────────────────────────────────────
const SECTOR_WIKI_TOPICS: Record<string, string[]> = {
    technology: ['Technology in Africa', 'Mobile banking in Africa', 'African tech startups'],
    finance: ['Banking in Africa', 'African Development Bank', 'Fintech in Africa'],
    energy: ['Energy in Africa', 'Renewable energy in Africa', 'Oil industry in Africa'],
    agriculture: ['Agriculture in Africa', 'Food security in Africa'],
    tourism: ['Tourism in Africa', 'Ecotourism'],
    infrastructure: ['Infrastructure in Africa', 'Transport in Africa'],
    manufacturing: ['Industrialisation in Africa', 'Manufacturing in Africa'],
    healthcare: ['Healthcare in Africa', 'Health in Africa'],
};

export async function getSectorWikiContext(
    env: Env,
    sectorId: string
): Promise<WikiSummary[]> {
    const topics = SECTOR_WIKI_TOPICS[sectorId] || [];
    const summaries: WikiSummary[] = [];

    for (const topic of topics.slice(0, 2)) { // Limit to 2 topics
        const summary = await getWikiSummary(env, topic);
        if (summary) {
            summaries.push(summary);
        }
    }

    return summaries;
}

// ───────────────────────────────────────────────────────────────────────────────
// Search Wikipedia
// ───────────────────────────────────────────────────────────────────────────────
export async function searchWiki(
    env: Env,
    query: string,
    limit: number = 5
): Promise<{ title: string; description: string }[]> {
    try {
        const response = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${limit}&format=json`,
            {
                headers: {
                    'User-Agent': 'BestOfAfrica/1.0',
                },
            }
        );

        if (!response.ok) return [];

        const data = await response.json() as Record<string, any>;

        return (data.query?.search || []).map((item: any) => ({
            title: item.title,
            description: item.snippet.replace(/<[^>]+>/g, ''), // Strip HTML
        }));
    } catch (error) {
        console.error('Wikipedia search failed:', error);
        return [];
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Enrich Article with Wikipedia Context
// ───────────────────────────────────────────────────────────────────────────────
export async function enrichWithWikiContext(
    env: Env,
    article: {
        title: string;
        country_code: string | null;
        sector_id: string | null;
    }
): Promise<{
    country_context: WikiSummary | null;
    sector_context: WikiSummary[];
    related_topics: { title: string; description: string }[];
}> {
    const [countryContext, sectorContext, relatedTopics] = await Promise.all([
        article.country_code ? getCountryWikiInfo(env, article.country_code) : null,
        article.sector_id ? getSectorWikiContext(env, article.sector_id) : [],
        searchWiki(env, article.title, 3),
    ]);

    return {
        country_context: countryContext,
        sector_context: sectorContext,
        related_topics: relatedTopics,
    };
}
