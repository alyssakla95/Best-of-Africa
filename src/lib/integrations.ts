// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS SERVICE
// LinkedIn, Slack/Teams, and external platform integrations
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { publicArticleUrl, publicSiteBase } from './public-url';

// ───────────────────────────────────────────────────────────────────────────────
// LinkedIn Posting
// ───────────────────────────────────────────────────────────────────────────────
export async function postToLinkedIn(
    env: Env,
    article: {
        id: string;
        title: string;
        summary: string | null;
        slug: string;
        country_name: string | null;
        sector_name: string | null;
    }
): Promise<{ success: boolean; post_id?: string }> {
    const accessToken = (env as Record<string, any>).LINKEDIN_ACCESS_TOKEN;

    if (!accessToken) {
        console.log('[LINKEDIN] No access token configured');
        return { success: true }; // Silently skip
    }

    // Format LinkedIn post
    const articleUrl = publicArticleUrl(env, article.slug);
    const hashtags = [
        '#Africa',
        '#AfricaBusiness',
        article.sector_name ? `#${article.sector_name.replace(/\s+/g, '')}` : null,
        article.country_name ? `#${article.country_name.replace(/\s+/g, '')}` : null,
    ].filter(Boolean).join(' ');

    const text = `${article.title}\n\n${article.summary || ''}\n\n${hashtags}\n\n${articleUrl}`;

    try {
        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify({
                author: 'urn:li:organization:COMPANY_ID', // Replace with actual
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: { text },
                        shareMediaCategory: 'ARTICLE',
                        media: [{
                            status: 'READY',
                            originalUrl: articleUrl,
                        }],
                    },
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                },
            }),
        });

        if (!response.ok) {
            console.error('[LINKEDIN] API error:', await response.text());
            return { success: false };
        }

        const data = await response.json() as { id: string };

        // Log to database
        await env.DB.prepare(`
            INSERT INTO social_posts (id, article_id, platform, post_id, content, posted_at)
            VALUES (?, ?, 'linkedin', ?, ?, datetime('now'))
        `).bind(crypto.randomUUID(), article.id, data.id, text).run();

        return { success: true, post_id: data.id };

    } catch (error) {
        console.error('[LINKEDIN] Post failed:', error);
        return { success: false };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Slack Webhook Notifications
// ───────────────────────────────────────────────────────────────────────────────
export async function sendSlackAlert(
    env: Env,
    article: {
        title: string;
        summary: string | null;
        slug: string;
        country_name: string | null;
        sector_name: string | null;
    }
): Promise<boolean> {
    const webhookUrl = (env as Record<string, any>).SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('[SLACK] No webhook URL configured');
        return true;
    }

    const articleUrl = publicArticleUrl(env, article.slug);

    const payload = {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: '📰 New Article Published',
                    emoji: true,
                },
            },
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*<${articleUrl}|${article.title}>*`,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Country:*\n${article.country_name || 'Africa'}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Sector:*\n${article.sector_name || 'General'}`,
                    },
                ],
            },
            {
                type: 'section',
                text: {
                    type: 'plain_text',
                    text: article.summary?.slice(0, 300) || 'No summary available',
                },
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: 'Read Article',
                        },
                        url: articleUrl,
                    },
                ],
            },
        ],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return response.ok;
    } catch (error) {
        console.error('[SLACK] Webhook failed:', error);
        return false;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Microsoft Teams Webhook
// ───────────────────────────────────────────────────────────────────────────────
export async function sendTeamsAlert(
    env: Env,
    article: {
        title: string;
        summary: string | null;
        slug: string;
        country_name: string | null;
        sector_name: string | null;
    }
): Promise<boolean> {
    const webhookUrl = (env as Record<string, any>).TEAMS_WEBHOOK_URL;

    if (!webhookUrl) return true;

    const articleUrl = publicArticleUrl(env, article.slug);

    const payload = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: 'D4AF37',
        summary: article.title,
        sections: [{
            activityTitle: article.title,
            activitySubtitle: `${article.country_name || 'Africa'} | ${article.sector_name || 'General'}`,
            activityImage: `${publicSiteBase(env)}/logo.png`,
            facts: [{
                name: 'Summary',
                value: article.summary?.slice(0, 200) || 'New article published',
            }],
            markdown: true,
        }],
        potentialAction: [{
            '@type': 'OpenUri',
            name: 'Read Article',
            targets: [{ os: 'default', uri: articleUrl }],
        }],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        return response.ok;
    } catch (error) {
        console.error('[TEAMS] Webhook failed:', error);
        return false;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Google Calendar Event (for Summits)
// ───────────────────────────────────────────────────────────────────────────────
export function generateCalendarEvent(event: {
    title: string;
    description: string;
    date: string;
    location: string;
}): { icsContent: string; googleUrl: string } {
    const startDate = new Date(event.date);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // +1 day

    const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // ICS format
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//BOA-Story//Events//EN',
        'BEGIN:VEVENT',
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
        `LOCATION:${event.location}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');

    // Google Calendar URL
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${formatDate(startDate).replace('Z', '')}/${formatDate(endDate).replace('Z', '')}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;

    return { icsContent, googleUrl };
}

// ───────────────────────────────────────────────────────────────────────────────
// Broadcast to All Configured Channels
// ───────────────────────────────────────────────────────────────────────────────
export async function broadcastToChannels(
    env: Env,
    article: {
        id: string;
        title: string;
        summary: string | null;
        slug: string;
        country_name: string | null;
        sector_name: string | null;
    }
): Promise<void> {
    await Promise.allSettled([
        postToLinkedIn(env, article),
        sendSlackAlert(env, article),
        sendTeamsAlert(env, article),
    ]);
}
