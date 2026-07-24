// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL LISTENING SERVICE
// Monitor Reddit, Google Trends, and social signals
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached } from './cache';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export interface SocialPost {
    source: 'reddit' | 'twitter' | 'news';
    title: string;
    content: string;
    url: string;
    author: string;
    score: number;
    comments: number;
    created_at: string;
}

export interface TrendingTopic {
    topic: string;
    country_code: string | null;
    volume: number; // Search interest 0-100
    rising: boolean;
}

// ───────────────────────────────────────────────────────────────────────────────
// Reddit Africa Communities
// ───────────────────────────────────────────────────────────────────────────────
const REDDIT_SUBREDDITS = [
    'africa',
    'africanews',
    'AfricanBusiness',
    'Nigeria',
    'Kenya',
    'southafrica',
    'Egypt',
    'Morocco',
    'ghana',
    'Ethiopia',
];

export async function getRedditPosts(
    env: Env,
    subreddit: string = 'africa',
    limit: number = 10
): Promise<SocialPost[]> {
    const cacheKey = `reddit:${subreddit}:${limit}`;

    return getCached(
        env,
        cacheKey,
        async () => {
            try {
                // Reddit's public JSON API (no auth required)
                const response = await fetch(
                    `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`,
                    {
                        headers: {
                            'User-Agent': 'BestOfAfrica/1.0 (by /u/bestofafrica)',
                            'Accept': 'application/json',
                        },
                    }
                );

                if (!response.ok) return [];

                const data = await response.json() as Record<string, any>;
                const posts: SocialPost[] = [];

                for (const child of data.data?.children || []) {
                    const post = child.data;
                    posts.push({
                        source: 'reddit',
                        title: post.title,
                        content: post.selftext?.slice(0, 500) || '',
                        url: `https://reddit.com${post.permalink}`,
                        author: post.author,
                        score: post.score,
                        comments: post.num_comments,
                        created_at: new Date(post.created_utc * 1000).toISOString(),
                    });
                }

                return posts;
            } catch (error) {
                console.error(`Reddit fetch failed for r/${subreddit}:`, error);
                return [];
            }
        },
        { ttl: 1800 } // Cache for 30 minutes
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Top Reddit Discussions Across Africa Subreddits
// ───────────────────────────────────────────────────────────────────────────────
export async function getTopAfricaDiscussions(
    env: Env,
    limit: number = 20
): Promise<SocialPost[]> {
    const allPosts: SocialPost[] = [];

    // Fetch from multiple subreddits in parallel
    const results = await Promise.allSettled(
        REDDIT_SUBREDDITS.slice(0, 5).map(sub => getRedditPosts(env, sub, 5))
    );

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allPosts.push(...result.value);
        }
    }

    // Sort by score and return top posts
    return allPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

// ───────────────────────────────────────────────────────────────────────────────
// Google Trends (Unofficial)
// ───────────────────────────────────────────────────────────────────────────────
const AFRICAN_GEO_CODES: Record<string, string> = {
    NG: 'NG', KE: 'KE', ZA: 'ZA', EG: 'EG', MA: 'MA',
    GH: 'GH', TZ: 'TZ', ET: 'ET', RW: 'RW', UG: 'UG',
};

export async function getTrendingSearches(
    env: Env,
    countryCode: string = 'ZA'
): Promise<TrendingTopic[]> {
    const cacheKey = `trends:${countryCode}`;

    return getCached(
        env,
        cacheKey,
        async () => {
            try {
                // Google Trends doesn't have a public API
                // This would need to use the unofficial API or scraping
                // For now, return placeholder structure

                // Alternative: Use SerpAPI or similar (requires API key)
                // Or scrape trends.google.com (risky)

                return [];
            } catch (error) {
                console.error('Google Trends fetch failed:', error);
                return [];
            }
        },
        { ttl: 3600 }
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Hacker News Africa Mentions
// ───────────────────────────────────────────────────────────────────────────────
export async function getHNAfricaMentions(
    env: Env,
    limit: number = 10
): Promise<SocialPost[]> {
    const cacheKey = `hn:africa:${limit}`;

    return getCached(
        env,
        cacheKey,
        async () => {
            try {
                // Search HN for Africa-related stories
                const response = await fetch(
                    `https://hn.algolia.com/api/v1/search?query=africa&tags=story&hitsPerPage=${limit}`,
                    { headers: { 'Accept': 'application/json' } }
                );

                if (!response.ok) return [];

                const data = await response.json() as Record<string, any>;
                const posts: SocialPost[] = [];

                for (const hit of data.hits || []) {
                    posts.push({
                        source: 'news',
                        title: hit.title,
                        content: '',
                        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
                        author: hit.author,
                        score: hit.points,
                        comments: hit.num_comments,
                        created_at: hit.created_at,
                    });
                }

                return posts;
            } catch (error) {
                console.error('HN fetch failed:', error);
                return [];
            }
        },
        { ttl: 3600 }
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Event Calendar Scraping
// ───────────────────────────────────────────────────────────────────────────────
export interface UpcomingEvent {
    name: string;
    date: string;
    location: string;
    country_code: string;
    url: string;
    sector: string | null;
}

export async function scrapeAfricaEvents(env: Env): Promise<UpcomingEvent[]> {
    // This would scrape event calendars from:
    // - African Development Bank events
    // - AU summits
    // - Industry conferences

    // For now, return empty (would need actual scraping implementation)
    return [];
}

// ───────────────────────────────────────────────────────────────────────────────
// Aggregate Social Signals for Topic
// ───────────────────────────────────────────────────────────────────────────────
export async function getSocialSignals(
    env: Env,
    topic: string
): Promise<{
    reddit_mentions: number;
    hn_mentions: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    top_posts: SocialPost[];
}> {
    // Search Reddit for topic
    const redditResults = await getRedditPosts(env, 'africa', 25);
    const redditMentions = redditResults.filter(p =>
        p.title.toLowerCase().includes(topic.toLowerCase())
    );

    // Search HN
    const hnResults = await getHNAfricaMentions(env, 25);
    const hnMentions = hnResults.filter(p =>
        p.title.toLowerCase().includes(topic.toLowerCase())
    );

    // Simple sentiment based on scores
    const allPosts = [...redditMentions, ...hnMentions];
    const avgScore = allPosts.reduce((sum, p) => sum + p.score, 0) / (allPosts.length || 1);

    return {
        reddit_mentions: redditMentions.length,
        hn_mentions: hnMentions.length,
        sentiment: avgScore > 50 ? 'positive' : avgScore > 10 ? 'neutral' : 'negative',
        top_posts: allPosts.sort((a, b) => b.score - a.score).slice(0, 5),
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Ingest Social Content for Processing
// ───────────────────────────────────────────────────────────────────────────────
export async function ingestSocialContent(env: Env): Promise<number> {
    console.log('Ingesting social content...');

    let ingested = 0;
    const discussions = await getTopAfricaDiscussions(env, 30);

    for (const post of discussions) {
        // Only process posts with substantial engagement
        if (post.score < 50) continue;

        // Check if already ingested
        const existing = await env.DB.prepare(`
            SELECT id FROM ingested_items WHERE external_id = ?
        `).bind(post.url).first();

        if (existing) continue;

        // Insert as ingested item for processing
        await env.DB.prepare(`
            INSERT INTO ingested_items (
                id, source_id, external_id, title, content, url, published_at, status
            ) VALUES (?, 'reddit', ?, ?, ?, ?, ?, 'pending')
        `).bind(
            crypto.randomUUID(),
            post.url,
            post.title,
            post.content,
            post.url,
            post.created_at
        ).run();

        ingested++;
    }

    console.log(`Ingested ${ingested} social posts`);
    return ingested;
}
