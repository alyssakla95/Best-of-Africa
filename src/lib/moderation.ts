import type { Env } from '../types';
import { callConfiguredAI } from './ai';

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
    sourceUrl?: string
): Promise<ModerationResult> {
    console.log(`Moderating content: "${title.slice(0, 50)}..."`);

    // 1. -Powered Fact-Checking & Bias Analysis
    const moderationPrompt = `
        As an Senior Editorial Auditor for "BOA-Story Intelligence", analyze the following AI-generated article.
        
        ARTICLE TITLE: ${title}
        CONTENT: ${content.slice(0, 3000)}
        
        TASK:
        1. Identify any questionable factual claims.
        2. Evaluate the tone (must be professional, authoritative, and non-hedging).
        3. Flag any potential "AI-isms" or repetitive phrasing.
        
        OUTPUT FORMAT: JSON
        {
            "status": "approved" | "flagged" | "needs_review",
            "score": 0.0 to 1.0 (confidence),
            "findings": [
                { "type": "fact-check" | "tone" | "bias", "severity": "low"|"medium"|"high", "message": "...", "suggestion": "..." }
            ]
        }
    `;

    try {
        const prompt = `System: You are a rigorous Editorial Auditor. Your goal is to catch hallucinations and ensure platform credibility.\n\nUser: ${moderationPrompt}`;
        const aiResponseRaw = await callConfiguredAI(env, { prompt, max_tokens: 1000, temperature: 0.2 });

        const jsonMatch = aiResponseRaw.match(/\{.*\}/s);
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponseRaw);

        // Clean up status based on score threshold if necessary
        if (result.score < 0.7 && result.status === 'approved') {
            result.status = 'needs_review';
        }

        return result as ModerationResult;

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
