// ═══════════════════════════════════════════════════════════════════════════════
// DIGEST WORKER
// Generates and sends -powered email digests
// Daily executive briefings and weekly sector roundups
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { callConfiguredAI } from '../lib/ai';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
interface DigestSubscription {
    id: string;
    email: string;
    frequency: 'daily' | 'weekly';
    regions: string[] | null;
    sectors: string[] | null;
    language: 'en' | 'fr' | 'ar' | 'pt';
}

interface DigestArticle {
    id: string;
    slug: string;
    title: string;
    summary: string;
    country_name: string;
    sector_name: string;
    published_at: string;
}


// Public origins for links inside emails. bestofafrica.com is unregistered —
// links must point at the live site, and unsubscribe at the backend endpoint
// (RFC 8058-style one-click) carrying the subscription id as the token.
const siteBase = (env: Env) => env.PUBLIC_SITE_URL || 'https://best-of-africa.pages.dev';
const unsubscribeUrl = (env: Env, subscriptionId: string) => {
    const apiBase = (env.PUBLIC_API_URL || '').replace(/\/$/, '');
    return apiBase ? `${apiBase}/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(subscriptionId)}` : '#';
};

// ───────────────────────────────────────────────────────────────────────────────
// Generate Daily Digest Content
// ───────────────────────────────────────────────────────────────────────────────
export async function generateDailyDigest(
    env: Env,
    subscription: DigestSubscription
): Promise<{ subject: string; html: string; text: string } | null> {

    // Get top articles from last 24 hours
    let query = `
        SELECT 
            a.id, a.slug, a.title, a.summary,
            c.name as country_name, s.name as sector_name,
            a.published_at
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'published'
          AND a.published_at > datetime('now', '-1 day')
    `;

    // Filter by regions if specified
    if (subscription.regions && subscription.regions.length > 0) {
        const regionPlaceholders = subscription.regions.map(() => '?').join(',');
        query += ` AND c.region IN (${regionPlaceholders})`;
    }

    // Filter by sectors if specified
    if (subscription.sectors && subscription.sectors.length > 0) {
        const sectorPlaceholders = subscription.sectors.map(() => '?').join(',');
        query += ` AND a.sector_id IN (${sectorPlaceholders})`;
    }

    query += ` ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC LIMIT 10`;

    const bindings: string[] = [];
    if (subscription.regions) bindings.push(...subscription.regions);
    if (subscription.sectors) bindings.push(...subscription.sectors);

    const articles = await env.DB.prepare(query).bind(...bindings).all<DigestArticle>();
    const articleList = articles.results || [];

    // Nothing matched the subscriber's filters — skip the send entirely. A
    // daily "no new articles" email is spam that trains readers to ignore us.
    if (articleList.length === 0) return null;

    // Generate summary of the day's news
    let aiSummary = '';
    try {
        const briefContext = articleList.slice(0, 10).map((a, i) =>
            `${i + 1}. "${a.title}" (${a.country_name}, ${a.published_at || 'date unavailable'}): ${a.summary?.slice(0, 800) || 'summary unavailable'}`
        ).join('\n');

        // RAG: Get Global Context
        let globalContext = '';
        try {
            const query = "Africa business headlines global market trends today";
            const embedding = await (env.AI as Record<string, any>).run('@cf/baai/bge-base-en-v1.5', { text: [query] });
            const vector = (embedding as Record<string, any>).data[0];
            const relevant = await env.VECTORS.query(vector, { topK: 3, returnMetadata: true });
            globalContext = relevant.matches.map(m => (m.metadata as Record<string, any>).title).join('; ');
        } catch (e) { }

        const prompt = `System: You are BOA-Story's executive evidence editor. Synthesize only the supplied reporting. Distinguish what the records say from your analysis, and never turn coverage volume into a market claim.

User: Global Context: ${globalContext}

Internal Coverage:
${briefContext}

Write a detailed daily briefing with: a direct lead; the most consequential dated developments and named actors; connections and tensions across countries or sectors; practical implications; counter-signals; coverage gaps; and three questions to verify next. Cite the numbered internal records inline. If the evidence is thin, identify exactly what is missing.`;
        aiSummary = (await callConfiguredAI(env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' })) || '';
    } catch (error) {
        console.error('Failed to generate AI summary for digest:', error);
    }

    // Generate HTML email
    const html = generateDigestHTML(articleList, aiSummary, 'daily', siteBase(env), unsubscribeUrl(env, subscription.id));
    const text = generateDigestText(articleList, aiSummary, 'daily');

    return {
        subject: `Africa Intelligence Daily: ${articleList.length} stories | ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html,
        text,
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Weekly Digest Content
// ───────────────────────────────────────────────────────────────────────────────
export async function generateWeeklyDigest(
    env: Env,
    subscription: DigestSubscription
): Promise<{ subject: string; html: string; text: string } | null> {

    // Get top articles from last 7 days
    const articles = await env.DB.prepare(`
        SELECT 
            a.id, a.slug, a.title, a.summary,
            c.name as country_name, s.name as sector_name,
            a.published_at
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'published'
          AND a.published_at > datetime('now', '-7 days')
        ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
        LIMIT 20
    `).all<DigestArticle>();

    const articleList = articles.results || [];
    if (articleList.length === 0) return null; // nothing this week — skip the send

    // Group by sector
    const bySector: Record<string, DigestArticle[]> = {};
    for (const article of articleList) {
        const sector = article.sector_name || 'General';
        if (!bySector[sector]) bySector[sector] = [];
        bySector[sector].push(article);
    }

    // Generate weekly summary
    let aiSummary = '';
    try {
        const sectorSummaries = Object.entries(bySector).map(([sector, arts]) =>
            `${sector}: ${arts.length} articles\n${arts.slice(0, 6).map((article, index) => `  ${index + 1}. ${article.title} (${article.country_name || 'country unavailable'}, ${article.published_at || 'date unavailable'}): ${(article.summary || 'summary unavailable').slice(0, 900)}`).join('\n')}`
        ).join('\n');

        // RAG: Get Weekly Global Context
        let globalContext = '';
        try {
            const query = "Africa business headlines major events this week";
            const embedding = await (env.AI as Record<string, any>).run('@cf/baai/bge-base-en-v1.5', { text: [query] });
            const vector = (embedding as Record<string, any>).data[0];
            const relevant = await env.VECTORS.query(vector, { topK: 5, returnMetadata: true });
            globalContext = relevant.matches.map(m => (m.metadata as Record<string, any>).title).join('; ');
        } catch (e) { }

        const prompt = `System: You are BOA-Story's weekly evidence editor. Use only the supplied records. Coverage count measures BOA-Story reporting activity, not economic performance. Separate facts, synthesis and uncertainty.

User: Major External Events: ${globalContext}

Our Sector Coverage:
${sectorSummaries}

Write a rigorous Week in Review covering: the week's central finding; a dated chronology; country and sector differences; named actors; mechanisms and consequences; counter-evidence; what BOA-Story covered heavily or missed; implications for operators and policymakers; source limitations; and a prioritized verification agenda. Cite the supplied story titles inline.`;
        aiSummary = (await callConfiguredAI(env, { prompt, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' })) || '';
    } catch (error) {
        console.error('Failed to generate AI summary for weekly digest:', error);
    }

    const html = generateWeeklyDigestHTML(bySector, aiSummary, siteBase(env), unsubscribeUrl(env, subscription.id));
    const text = generateDigestText(articleList, aiSummary, 'weekly');

    return {
        subject: `Africa Intelligence Weekly: Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html,
        text,
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Send Digest Email (via Resend or Email Workers)
// ───────────────────────────────────────────────────────────────────────────────
export async function sendDigestEmail(
    env: Env,
    to: string,
    subject: string,
    html: string,
    _text: string
): Promise<boolean> {
    // Delegate to the shared transactional sender (Cloudflare EMAIL binding →
    // Resend → MailChannels) so the digest lights up with the same domain
    // onboarding as OTP/welcome mail. The old local implementation only knew
    // Resend and, without a key, LOGGED the email and returned true — the cron
    // then reported "Sent digest to …" while delivering nothing.
    const { sendEmail } = await import('../lib/email');
    const sent = await sendEmail(env, { to, subject, html });
    if (!sent) console.error(`[digest] delivery failed for ${to}`);
    return sent;
}

// ───────────────────────────────────────────────────────────────────────────────
// Process All Subscriptions (Scheduled)
// ───────────────────────────────────────────────────────────────────────────────
export async function processDigests(env: Env, frequency: 'daily' | 'weekly'): Promise<void> {
    console.log(`Processing ${frequency} digests...`);

    const subscriptions = await env.DB.prepare(`
        SELECT id, email, frequency, regions, sectors, language
        FROM digest_subscriptions
        WHERE frequency = ? AND is_active = 1
    `).bind(frequency).all<DigestSubscription>();

    for (const sub of subscriptions.results || []) {
        try {
            const digest = frequency === 'daily'
                ? await generateDailyDigest(env, sub)
                : await generateWeeklyDigest(env, sub);
            if (!digest) continue; // nothing matched this subscriber's filters

            const sent = await sendDigestEmail(env, sub.email, digest.subject, digest.html, digest.text);
            if (sent) console.log(`Sent ${frequency} digest to ${sub.email}`);
        } catch (error) {
            console.error(`Failed to send digest to ${sub.email}:`, error);
        }
    }

    console.log(`Completed ${frequency} digest processing`);
}

// ───────────────────────────────────────────────────────────────────────────────
// HTML Templates
// ───────────────────────────────────────────────────────────────────────────────
function generateDigestHTML(articles: DigestArticle[], aiSummary: string, type: string, site: string, unsubUrl: string): string {
    const articleItems = articles.map(a => `
        <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #e5e5e5;">
                <a href="${site}/posts/${a.slug}" style="color: #0d6efd; text-decoration: none; font-weight: 600;">
                    ${a.title}
                </a>
                <div style="color: #666; font-size: 14px; margin-top: 4px;">
                    ${a.country_name || 'Africa'} • ${a.sector_name || 'General'}
                </div>
                <p style="color: #333; margin: 8px 0 0 0; font-size: 14px;">
                    ${a.summary?.slice(0, 150) || ''}...
                </p>
            </td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; text-align: center;">
            <h1 style="color: #d4af37; margin: 0; font-size: 24px;">BOA-Story</h1>
            <p style="color: #fff; margin: 8px 0 0 0; opacity: 0.8;">${type === 'daily' ? 'Daily' : 'Weekly'} Intelligence Digest</p>
        </div>
        
        ${aiSummary ? `
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #d4af37;">
            <h3 style="margin: 0 0 8px 0; color: #1a1a2e;">Executive Summary</h3>
            <p style="margin: 0; color: #333; line-height: 1.6;">${aiSummary}</p>
        </div>
        ` : ''}
        
        <div style="padding: 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                ${articleItems}
            </table>
        </div>
        
        <div style="background: #f8f9fa; padding: 16px; text-align: center; font-size: 12px; color: #666;">
            <a href="${site}" style="color: #0d6efd;">Visit BOA-Story</a> |
            <a href="${unsubUrl}" style="color: #0d6efd;">Unsubscribe</a>
        </div>
    </div>
</body>
</html>
    `;
}

function generateWeeklyDigestHTML(bySector: Record<string, DigestArticle[]>, aiSummary: string, site: string, unsubUrl: string): string {
    const sectorSections = Object.entries(bySector).map(([sector, articles]) => `
        <div style="margin: 20px 0;">
            <h3 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 8px;">${sector}</h3>
            ${articles.slice(0, 3).map(a => `
                <div style="margin: 12px 0;">
                    <a href="${site}/posts/${a.slug}" style="color: #0d6efd; text-decoration: none; font-weight: 600;">
                        ${a.title}
                    </a>
                    <span style="color: #666; font-size: 12px;"> • ${a.country_name || 'Africa'}</span>
                </div>
            `).join('')}
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; text-align: center;">
            <h1 style="color: #d4af37; margin: 0;">BOA-Story Weekly</h1>
        </div>
        
        ${aiSummary ? `
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #d4af37;">
            <h3 style="margin: 0 0 8px 0;">Week in Review</h3>
            <p style="margin: 0; line-height: 1.6;">${aiSummary}</p>
        </div>
        ` : ''}
        
        <div style="padding: 20px;">
            ${sectorSections}
        </div>
    </div>
</body>
</html>
    `;
}

function generateDigestText(articles: DigestArticle[], aiSummary: string, type: string): string {
    const header = `BOA-STORY ${type.toUpperCase()} DIGEST\n${'='.repeat(40)}\n\n`;
    const summary = aiSummary ? `EXECUTIVE SUMMARY:\n${aiSummary}\n\n` : '';
    const articleList = articles.map((a, i) =>
        `${i + 1}. ${a.title}\n   ${a.country_name || 'Africa'} | ${a.sector_name || 'General'}\n   ${a.summary?.slice(0, 100) || ''}...\n`
    ).join('\n');

    return header + summary + 'TOP STORIES:\n' + articleList;
}
