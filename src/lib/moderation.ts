import type { Env } from '../types';
import {
    callConfiguredAI,
    countResponseWords,
    MIN_PUBLISHABLE_ARTICLE_WORDS,
    MIN_PUBLISHABLE_INVESTOR_BRIEF_WORDS,
} from './ai';
import { editorialApprovalFailure } from './editorial-quality';
import { indexArticle } from './vectorize';
import { onArticlePublished } from './alerts';
import { autoPostArticle } from './social';

export interface ModerationResult {
    status: 'approved' | 'flagged' | 'needs_review';
    score: number;
    findings: Array<{
        type: 'fact-check' | 'tone' | 'bias' | 'source';
        severity: 'low' | 'medium' | 'high';
        message: string;
        suggestion?: string;
    }>;
}

/**
 * Checks article content for factual accuracy, tone alignment, and source credibility
 */
export async function checkContentIntegrity(
    env: Env,
    title: string,
    content: string,
    sourceUrl?: string,
    sourceTitle?: string,
    sourceContent?: string,
): Promise<ModerationResult> {
    console.log(`Moderating content: "${title.slice(0, 50)}..."`);

    const moderationPrompt = `Act as BOA-Story's final publication auditor. Compare the finished article with the supplied source record. Do not reward confident prose: approve only when every material name, date, number, quotation, causal statement and attributed claim is supported by the source record. Calibrated uncertainty is required wherever the record is incomplete.

SOURCE TITLE: ${sourceTitle || 'Not supplied'}
SOURCE URL: ${sourceUrl || 'Not supplied'}
SOURCE RECORD:
${(sourceContent || '').slice(0, 7000)}

FINISHED ARTICLE TITLE: ${title}
FINISHED ARTICLE:
${content.slice(0, 9000)}

Check factual support, attribution, chronology, unsupported extrapolation, misleading certainty, repetition, templated phrasing and whether the article remains faithful to the source. A thin source cannot support added background unless that background appears in the supplied record. Return JSON only:
{
  "status": "approved" | "flagged" | "needs_review",
  "score": 0.0,
  "findings": [
    {
      "type": "fact-check" | "tone" | "bias" | "source",
      "severity": "low" | "medium" | "high",
      "message": "specific publication issue",
      "suggestion": "specific correction"
    }
  ]
}

Use status "approved" only with score at least 0.8 and an empty findings array.`;

    try {
        const aiResponseRaw = await callConfiguredAI(env, {
            prompt: moderationPrompt,
            max_tokens: 1800,
            temperature: 0.1,
            structured_output: true,
        });

        const jsonMatch = aiResponseRaw.match(/\{.*\}/s);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponseRaw);
        const rawScore = Number(result.score);
        const score = Math.max(0, Math.min(1, rawScore > 1 ? rawScore / 100 : rawScore));
        const findings = Array.isArray(result.findings)
            ? result.findings.filter((finding: unknown) => finding && typeof finding === 'object')
            : [];
        const requestedStatus = ['approved', 'flagged', 'needs_review'].includes(result.status)
            ? result.status as ModerationResult['status']
            : 'needs_review';
        const status = requestedStatus === 'approved' && (score < 0.8 || findings.length > 0)
            ? 'needs_review'
            : requestedStatus;

        return { status, score, findings } as ModerationResult;

    } catch (err) {
        console.error('Moderation failed, defaulting to manual review required:', err);
        return {
            status: 'needs_review',
            score: 0.5,
            findings: [{
                type: 'source',
                severity: 'medium',
                message: 'Automated moderation engine failed to respond.'
            }]
        };
    }
}

export interface AuditableArticle {
    content: string;
    investorBrief?: string | null;
    sourceUrl?: string | null;
}

export function automaticPublicationFailure(
    article: AuditableArticle,
    moderation: ModerationResult,
): string | null {
    const articleWords = countResponseWords(article.content);
    if (articleWords < MIN_PUBLISHABLE_ARTICLE_WORDS) {
        return `Article depth is ${articleWords} words; ${MIN_PUBLISHABLE_ARTICLE_WORDS} are required.`;
    }
    const briefWords = countResponseWords(article.investorBrief || '');
    if (briefWords < MIN_PUBLISHABLE_INVESTOR_BRIEF_WORDS) {
        return `Professional brief depth is ${briefWords} words; ${MIN_PUBLISHABLE_INVESTOR_BRIEF_WORDS} are required.`;
    }

    return editorialApprovalFailure({
        qualityScore: moderation.score * 100,
        passed: moderation.status === 'approved',
        issues: moderation.findings.map(finding => finding.message),
        recommendation: 'approve',
        sourceUrl: article.sourceUrl,
    });
}

interface PendingAuditArticle {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    content: string;
    ai_investor_brief: string | null;
    source_url: string | null;
    source_title: string | null;
    source_content: string | null;
    country_code: string | null;
    sector_id: string | null;
    sector_name: string | null;
    hero_image_url: string | null;
    ai_social_post: string | null;
}

/**
 * Audits a deliberately small batch of generated stories and publishes only
 * clean, fully sourced passes. Failed audits remain quarantined for review.
 */
export async function auditPendingArticles(env: Env, limit = 1): Promise<{ reviewed: number; published: number }> {
    const rows = await env.DB.prepare(`
        SELECT a.id, a.slug, a.title, a.summary, a.content, a.ai_investor_brief,
               a.source_url, a.source_title, a.country_code, a.sector_id,
               a.hero_image_url, a.ai_social_post, s.name AS sector_name,
               i.content AS source_content
        FROM articles a
        LEFT JOIN sectors s ON s.id = a.sector_id
        LEFT JOIN ingested_items i ON i.article_id = a.id
        WHERE a.status = 'pending_audit'
          AND a.moderation_status = 'pending'
          AND a.last_audited_at IS NULL
        ORDER BY LENGTH(COALESCE(i.content, '')) DESC, a.created_at ASC
        LIMIT ?
    `).bind(Math.max(1, Math.min(limit, 5))).all<PendingAuditArticle>();

    let published = 0;
    for (const article of rows.results || []) {
        await env.DB.prepare(
            "UPDATE articles SET moderation_status = 'reviewing', updated_at = datetime('now') WHERE id = ? AND moderation_status = 'pending'"
        ).bind(article.id).run();

        const moderation = await checkContentIntegrity(
            env,
            article.title,
            article.content,
            article.source_url || undefined,
            article.source_title || undefined,
            article.source_content || undefined,
        );
        const failure = automaticPublicationFailure({
            content: article.content,
            investorBrief: article.ai_investor_brief,
            sourceUrl: article.source_url,
        }, moderation);

        if (failure) {
            await env.DB.prepare(`
                UPDATE articles
                SET moderation_status = ?, moderation_score = ?, moderation_notes = ?,
                    last_audited_at = datetime('now'), updated_at = datetime('now')
                WHERE id = ?
            `).bind(
                moderation.status === 'flagged' ? 'flagged' : 'needs_review',
                moderation.score,
                JSON.stringify({ failure, findings: moderation.findings }),
                article.id,
            ).run();
            continue;
        }

        await env.DB.prepare(`
            UPDATE articles
            SET status = 'published', moderation_status = 'approved',
                moderation_score = ?, moderation_notes = '[]',
                last_audited_at = datetime('now'), reviewed_at = datetime('now'),
                published_at = COALESCE(published_at, datetime('now')),
                updated_at = datetime('now')
            WHERE id = ? AND status = 'pending_audit'
        `).bind(moderation.score, article.id).run();
        published += 1;

        const followUps = await Promise.allSettled([
            indexArticle(env, article.id, article.title, article.content, {
                country_code: article.country_code ?? undefined,
                sector_id: article.sector_id ?? undefined,
            }),
            onArticlePublished(env, article),
            autoPostArticle(env, {
                ...article,
                ai_social_post: article.ai_social_post || undefined,
            }),
        ]);
        followUps.forEach(result => {
            if (result.status === 'rejected') {
                console.error(`[automated-editorial] Follow-up failed for ${article.id}:`, result.reason);
            }
        });
    }

    return { reviewed: (rows.results || []).length, published };
}

/**
 * Calculates current credibility score for a news source
 */
export async function getSourceCredibility(env: Env, sourceId: string): Promise<number> {
    const stats = await env.DB.prepare(`
        SELECT 
            AVG(moderation_score) as avg_score,
            COUNT(*) as total_articles
        FROM articles 
        WHERE source_url IN (SELECT url FROM sources WHERE id = ?)
    `).bind(sourceId).first<{ avg_score: number | null }>();

    return stats?.avg_score ?? 1.0; // Default to 1.0 for new sources
}
