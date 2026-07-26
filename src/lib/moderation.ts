import type { Env } from '../types';
import {
    callConfiguredAI,
    countResponseWords,
    MIN_PUBLISHABLE_ARTICLE_WORDS,
    MIN_PUBLISHABLE_INVESTOR_BRIEF_WORDS,
    repairArticleFromAudit,
} from './ai';
import { editorialApprovalFailure } from './editorial-quality';
import { indexArticle } from './vectorize';
import { onArticlePublished } from './alerts';
import { autoPostArticle } from './social';
import { generateAudioNarration } from './audio';
import { autoTranslateArticle } from './translate';

export interface ModerationResult {
    status: 'approved' | 'flagged' | 'needs_review';
    score: number;
    findings: Array<{
        type: 'fact-check' | 'tone' | 'bias' | 'source';
        severity: 'low' | 'medium' | 'high';
        message: string;
        suggestion?: string;
    }>;
    technicalFailure?: boolean;
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
${(sourceContent || '').slice(0, 18000)}

FINISHED ARTICLE TITLE: ${title}
FINISHED ARTICLE:
${content.slice(0, 16000)}

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

Return no more than six findings, ordered by severity. Keep each message under 300 characters and each suggestion under 240 characters. Use status "approved" only with score at least 0.8 and an empty findings array.`;

    try {
        const aiResponseRaw = await callConfiguredAI(env, {
            prompt: moderationPrompt,
            max_tokens: 4000,
            temperature: 0,
            structured_output: true,
            response_format: {
                type: 'json_schema',
                json_schema: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', enum: ['approved', 'flagged', 'needs_review'] },
                        score: { type: 'number', minimum: 0, maximum: 1 },
                        findings: {
                            type: 'array',
                            maxItems: 6,
                            items: {
                                type: 'object',
                                properties: {
                                    type: { type: 'string', enum: ['fact-check', 'tone', 'bias', 'source'] },
                                    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                                    message: { type: 'string' },
                                    suggestion: { type: 'string' },
                                },
                                required: ['type', 'severity', 'message'],
                            },
                        },
                    },
                    required: ['status', 'score', 'findings'],
                },
            },
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
        const detail = err instanceof Error ? err.message : String(err);
        return {
            status: 'needs_review',
            score: 0.5,
            technicalFailure: true,
            findings: [{
                type: 'source',
                severity: 'medium',
                message: `Automated moderation engine failed to respond: ${detail.slice(0, 500)}`
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
    subtitle: string | null;
    refinement_count: number | null;
}

/**
 * Audits a deliberately small batch of generated stories and publishes only
 * clean, fully sourced passes. Failed audits remain quarantined for review.
 */
export async function auditPendingArticles(env: Env, limit = 1): Promise<{ reviewed: number; published: number }> {
    const rows = await env.DB.prepare(`
        SELECT a.id, a.slug, a.title, a.subtitle, a.summary, a.content, a.ai_investor_brief,
               a.source_url, a.source_title, a.country_code, a.sector_id,
               a.hero_image_url, a.ai_social_post, a.refinement_count, s.name AS sector_name,
               i.content AS source_content
        FROM articles a
        LEFT JOIN sectors s ON s.id = a.sector_id
        LEFT JOIN ingested_items i ON i.article_id = a.id
        WHERE a.status = 'pending_audit'
          AND a.moderation_status = 'pending'
          AND a.last_audited_at IS NULL
          AND i.content IS NOT NULL
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
        if (moderation.technicalFailure) {
            await env.DB.prepare(`
                UPDATE articles
                SET moderation_status = 'pending', moderation_score = ?,
                    moderation_notes = ?, updated_at = datetime('now')
                WHERE id = ?
            `).bind(
                moderation.score,
                JSON.stringify({ technical_failure: true, findings: moderation.findings }),
                article.id,
            ).run();
            continue;
        }
        const failure = automaticPublicationFailure({
            content: article.content,
            investorBrief: article.ai_investor_brief,
            sourceUrl: article.source_url,
        }, moderation);

        if (failure) {
            if ((article.refinement_count || 0) < 2 && article.source_content) {
                try {
                    const repaired = await repairArticleFromAudit(
                        env,
                        article.source_title || article.title,
                        article.source_content,
                        {
                            title: article.title,
                            subtitle: article.subtitle,
                            content: article.content,
                            summary: article.summary,
                            investorBrief: article.ai_investor_brief,
                        },
                        moderation.findings,
                    );
                    await env.DB.prepare(`
                        UPDATE articles
                        SET title = ?, subtitle = ?, content = ?, summary = ?,
                            ai_investor_brief = ?, tags = ?, reading_time_minutes = ?,
                            -- Remediation replaces the article text, so any prior
                            -- narration is stale: clear it and let the
                            -- post-approval follow-up narrate the final content.
                            audio_url = NULL, audio_duration_seconds = NULL,
                            audio_file_size = NULL, audio_regen = NULL,
                            audio_provider = NULL,
                            refinement_count = COALESCE(refinement_count, 0) + 1,
                            moderation_status = 'pending', moderation_score = 1,
                            moderation_notes = ?, last_audited_at = NULL,
                            updated_at = datetime('now')
                        WHERE id = ? AND status = 'pending_audit'
                    `).bind(
                        repaired.title,
                        repaired.subtitle || null,
                        repaired.content,
                        repaired.summary || null,
                        repaired.investor_brief,
                        JSON.stringify(repaired.tags),
                        Math.max(1, Math.ceil(countResponseWords(repaired.content) / 200)),
                        JSON.stringify({ remediated_from: { failure, findings: moderation.findings } }),
                        article.id,
                    ).run();
                    console.log(`[automated-editorial] Remediated ${article.id}; queued for independent re-audit.`);
                    continue;
                } catch (repairError) {
                    console.error(`[automated-editorial] Remediation failed for ${article.id}:`, repairError);
                }
            }
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
            generateAudioNarration(env, article.id, article.title, article.content),
            autoTranslateArticle(env, article.id, {
                title: article.title,
                subtitle: article.subtitle,
                summary: article.summary,
                content: article.content,
                country_code: article.country_code,
            }),
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
