// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA SERVICE
// Auto-posting to Twitter/X when new articles are published
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { publicSiteBase } from './public-url';

// ───────────────────────────────────────────────────────────────────────────────
// Format Article as Tweet
// ───────────────────────────────────────────────────────────────────────────────
export function formatTweet(article: {
    title: string;
    summary: string | null;
    country_code: string | null;
    sector_name: string | null;
    slug: string;
}, siteBase = 'https://best-of-africa.pages.dev'): string {
    // Max tweet length is 280 chars
    const url = `${siteBase.replace(/\/$/, '')}/posts/${encodeURIComponent(article.slug)}`;
    const urlLength = 23; // t.co shortens all URLs to 23 chars

    // Country flag emoji mapping (subset)
    const flags: Record<string, string> = {
        NG: '🇳🇬', KE: '🇰🇪', ZA: '🇿🇦', EG: '🇪🇬', MA: '🇲🇦', GH: '🇬🇭',
        TZ: '🇹🇿', RW: '🇷🇼', ET: '🇪🇹', UG: '🇺🇬', SN: '🇸🇳', CI: '🇨🇮',
        AO: '🇦🇴', MZ: '🇲🇿', CM: '🇨🇲', CD: '🇨🇩', DZ: '🇩🇿', TN: '🇹🇳',
    };

    const flag = article.country_code ? flags[article.country_code] || '🌍' : '🌍';

    // Sector hashtags
    const sectorTags: Record<string, string> = {
        technology: '#AfricaTech',
        finance: '#AfricaFinance',
        energy: '#AfricaEnergy',
        agriculture: '#Agribusiness',
        tourism: '#VisitAfrica',
        infrastructure: '#AfricaInfra',
        manufacturing: '#MadeInAfrica',
        healthcare: '#AfricaHealth',
    };

    const sectorTag = article.sector_name ? sectorTags[article.sector_name.toLowerCase()] || '' : '';

    // Calculate available space for title
    const suffix = `\n\n${flag} ${sectorTag} #Africa\n${url}`;
    const suffixLength = suffix.length - url.length + urlLength;
    const maxTitleLength = 280 - suffixLength - 5;

    // Truncate title if needed
    let title = article.title;
    if (title.length > maxTitleLength) {
        title = title.slice(0, maxTitleLength - 3) + '...';
    }

    return `${title}${suffix}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Post to Twitter/X
// ───────────────────────────────────────────────────────────────────────────────
export async function postToTwitter(
    env: Env,
    tweet: string
): Promise<{ success: boolean; tweet_id?: string; error?: string }> {
    // Check for Twitter credentials
    const twitterApiKey = (env as Record<string, any>).TWITTER_API_KEY;
    const twitterApiSecret = (env as Record<string, any>).TWITTER_API_SECRET;
    const twitterAccessToken = (env as Record<string, any>).TWITTER_ACCESS_TOKEN;
    const twitterAccessSecret = (env as Record<string, any>).TWITTER_ACCESS_SECRET;

    if (!twitterApiKey || !twitterAccessToken) {
        console.log('[TWITTER] No API keys configured, skipping post');
        console.log('[TWITTER] Would post:', tweet);
        return { success: true, tweet_id: 'simulated' };
    }

    try {
        // Twitter API v2 requires OAuth 1.0a signature
        // This is a simplified version - full implementation would use oauth-1.0a library

        const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // In production, this would be a proper OAuth signature
                'Authorization': `Bearer ${twitterAccessToken}`,
            },
            body: JSON.stringify({ text: tweet }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[TWITTER] API error:', error);
            return { success: false, error };
        }

        const data = await response.json() as { data: { id: string } };
        return { success: true, tweet_id: data.data.id };

    } catch (error) {
        console.error('[TWITTER] Failed to post:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Auto-Post Article on Publish
// ───────────────────────────────────────────────────────────────────────────────
export async function autoPostArticle(
    env: Env,
    article: {
        id: string;
        title: string;
        summary: string | null;
        country_code: string | null;
        sector_name: string | null;
        slug: string;
        ai_social_post?: string; // Added field
    }
): Promise<void> {
    // 1. Try to use Pre-Calculated Post (from Ingestion Engine)
    let tweet = article.ai_social_post;

    // 2. Fallback: Generate if missing
    if (!tweet) {
        tweet = formatTweet(article, publicSiteBase(env));
    }

    console.log(`[SOCIAL] Auto-posting article: ${article.id}`);

    const result = await postToTwitter(env, tweet);

    if (result.success) {
        // Log the post
        await env.DB.prepare(`
            INSERT INTO social_posts (id, article_id, platform, post_id, content, posted_at)
            VALUES (?, ?, 'twitter', ?, ?, datetime('now'))
        `).bind(
            crypto.randomUUID(),
            article.id,
            result.tweet_id || null,
            tweet
        ).run();

        console.log(`[SOCIAL] Posted to Twitter: ${result.tweet_id}`);
    } else {
        console.error(`[SOCIAL] Failed to post: ${result.error}`);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Queue Handler for Delayed Posts
// ───────────────────────────────────────────────────────────────────────────────
export async function processSocialQueue(
    env: Env,
    message: { type: string; article_id: string }
): Promise<void> {
    if (message.type !== 'social_post') return;

    const article = await env.DB.prepare(`
        SELECT a.id, a.title, a.summary, a.country_code, a.slug, s.name as sector_name
        FROM articles a
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.id = ?
    `).bind(message.article_id).first<Parameters<typeof autoPostArticle>[1]>();

    if (article) {
        await autoPostArticle(env, article);
    }
}
