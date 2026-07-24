// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../../types';
import { generateHeadlineVariants, fillNarrativeGap } from '../../lib/ai';
import { findNarrativeGaps, indexArticle } from '../../lib/vectorize';
import { updateArticleEngagement } from '../../lib/analytics';


import { logRefinement } from './analytics';

// ───────────────────────────────────────────────────────────────────────────────
// Create A/B Headline Tests for Underperforming Content
// ───────────────────────────────────────────────────────────────────────────────
export async function createHeadlineTests(env: Env): Promise<void> {
    // Find published articles with low engagement that haven't been tested
    const candidates = await env.DB.prepare(`
    SELECT a.id, a.title, a.summary, a.engagement_score
    FROM articles a
    LEFT JOIN headline_tests ht ON a.id = ht.article_id
    WHERE a.status = 'published'
      AND a.engagement_score < 30
      AND a.published_at > datetime('now', '-14 days')
      AND ht.id IS NULL
    ORDER BY a.view_count DESC
    LIMIT 5
  `).all();

    for (const article of candidates.results || []) {
        const a = article as Record<string, any>;

        try {
            // Generate headline variants
            const variants = await generateHeadlineVariants(env, a.title, a.summary || '');

            if (variants.length >= 2) {
                // Create A/B test records
                const testIdA = crypto.randomUUID();
                const testIdB = crypto.randomUUID();

                await env.DB.prepare(`
          INSERT INTO headline_tests (id, article_id, variant, headline)
          VALUES (?, ?, 'A', ?), (?, ?, 'B', ?)
        `).bind(
                    testIdA, a.id, variants[0],
                    testIdB, a.id, variants[1]
                ).run();

                console.log(`Created A/B test for article: ${a.id}`);
            }
        } catch (error) {
            console.error(`Failed to create headline test for ${a.id}:`, error);
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Evaluate and Finalize Headline Tests
// ───────────────────────────────────────────────────────────────────────────────
export async function evaluateHeadlineTests(env: Env): Promise<void> {
    // Get tests with enough impressions to evaluate
    const tests = await env.DB.prepare(`
    SELECT article_id,
           GROUP_CONCAT(id || ':' || variant || ':' || impressions || ':' || clicks) as variants
    FROM headline_tests
    WHERE is_winner = 0
    GROUP BY article_id
    HAVING SUM(impressions) > 100
  `).all();

    for (const test of tests.results || []) {
        const t = test as Record<string, any>;
        const variants = t.variants.split(',').map((v: string) => {
            const [id, variant, impressions, clicks] = v.split(':');
            return {
                id,
                variant,
                impressions: parseInt(impressions),
                clicks: parseInt(clicks),
                ctr: parseInt(clicks) / Math.max(1, parseInt(impressions)),
            };
        });

        // Find winner (highest CTR)
        const sorted = variants.sort((a: any, b: any) => b.ctr - a.ctr);
        const winner = sorted[0];

        if (winner && winner.ctr > 0) {
            // Mark winner
            await env.DB.prepare(`
        UPDATE headline_tests SET is_winner = 1, ctr = ? WHERE id = ?
      `).bind(winner.ctr, winner.id).run();

            // Update article title with winning headline
            const winningHeadline = await env.DB.prepare(`
        SELECT headline FROM headline_tests WHERE id = ?
      `).bind(winner.id).first<{ headline: string }>();

            if (winningHeadline?.headline) {
                await env.DB.prepare(`
          UPDATE articles SET title = ?, updated_at = datetime('now') WHERE id = ?
        `).bind(winningHeadline.headline, t.article_id).run();

                console.log(`Applied winning headline for article: ${t.article_id}`);
            }
        }
    }
}
