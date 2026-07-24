/**
 * OpenAlex Integration - Free Academic Research Data
 * No API key required
 */

import type { Env } from '../types';

export interface ResearchPaper {
    id: string;
    title: string;
    abstract?: string;
    publicationDate: string;
    citationCount: number;
    authors: { name: string; institution?: string }[];
    journal?: string;
    doi?: string;
    openAccessUrl?: string;
    topics: string[];
}

/**
 * Search for Africa-related research papers
 */
export async function searchAfricanResearch(
    env: Env,
    query: string,
    limit: number = 10
): Promise<ResearchPaper[]> {
    const cacheKey = `research:${query}:${limit}`;
    const cached = await env.CACHE.get(cacheKey, 'json') as ResearchPaper[] | null;
    if (cached) return cached;

    try {
        const url = new URL('https://api.openalex.org/works');
        url.searchParams.set('search', `${query} Africa`);
        url.searchParams.set('per_page', limit.toString());
        url.searchParams.set('sort', 'cited_by_count:desc');
        url.searchParams.set('filter', 'is_oa:true');

        const response = await fetch(url.toString(), {
            headers: { 'User-Agent': 'BestOfAfrica/1.0' }
        });

        if (!response.ok) return [];

        const data = await response.json() as Record<string, any>;
        const papers: ResearchPaper[] = (data.results || []).map((work: any) => ({
            id: work.id,
            title: work.title || 'Untitled',
            abstract: reconstructAbstract(work.abstract_inverted_index),
            publicationDate: work.publication_date || '',
            citationCount: work.cited_by_count || 0,
            authors: (work.authorships || []).slice(0, 3).map((a: any) => ({
                name: a.author?.display_name || 'Unknown',
                institution: a.institutions?.[0]?.display_name,
            })),
            journal: work.primary_location?.source?.display_name,
            doi: work.doi,
            openAccessUrl: work.open_access?.oa_url,
            topics: (work.concepts || []).slice(0, 5).map((c: any) => c.display_name),
        }));

        await env.CACHE.put(cacheKey, JSON.stringify(papers), { expirationTtl: 86400 });
        return papers;
    } catch {
        return [];
    }
}

/**
 * Get research for a specific country
 */
export async function getCountryResearch(
    env: Env,
    countryName: string,
    limit: number = 10
): Promise<ResearchPaper[]> {
    return searchAfricanResearch(env, countryName, limit);
}

/**
 * Get sector-specific research
 */
export async function getSectorResearch(
    env: Env,
    sector: string,
    limit: number = 10
): Promise<ResearchPaper[]> {
    const topicMap: Record<string, string> = {
        'energy': 'renewable energy',
        'agriculture': 'agriculture farming',
        'technology': 'technology digital',
        'finance': 'fintech banking',
        'mining': 'mining minerals',
        'healthcare': 'healthcare medicine',
    };
    const query = topicMap[sector.toLowerCase()] || sector;
    return searchAfricanResearch(env, query, limit);
}

/**
 * Format research for article enrichment
 */
export function formatResearchInsight(papers: ResearchPaper[]): string {
    if (papers.length === 0) return '';
    const top = papers[0];
    let insight = `**Research**: "${top.title}"`;
    if (top.authors[0]) insight += ` by ${top.authors[0].name}`;
    if (top.citationCount > 0) insight += `. ${top.citationCount} citations.`;
    return insight;
}

/**
 * Enrich article with relevant research
 */
export async function enrichWithResearchData(
    env: Env,
    countryName: string,
    sector?: string
): Promise<string | null> {
    const papers = sector
        ? await getSectorResearch(env, sector, 3)
        : await getCountryResearch(env, countryName, 3);
    if (papers.length === 0) return null;
    return formatResearchInsight(papers);
}

function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string {
    if (!invertedIndex) return '';
    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        for (const pos of positions) words.push([word, pos]);
    }
    words.sort((a, b) => a[1] - b[1]);
    return words.map(w => w[0]).join(' ').slice(0, 300);
}
