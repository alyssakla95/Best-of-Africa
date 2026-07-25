// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../types';
import { generateHeadlineVariants, fillNarrativeGap, MODELS } from '../lib/ai';
import { findNarrativeGaps, indexArticle } from '../lib/vectorize';
import { updateArticleEngagement } from '../lib/analytics';


import { updateEngagementScores, refreshDashboards, updateCountryScores, logRefinement } from '../lib/optimizer/analytics';
import { createHeadlineTests, evaluateHeadlineTests } from '../lib/optimizer/headlines';
import { fillContentGaps, optimizeContentFormats } from '../lib/optimizer/content-gaps';
import { populateMarketMetrics, populateNarrativeStrategies, generateDynamicSectorSummaries, generateHomePageDynamicContent, generateSystemicDynamicContent, generatePageSpecificContent, generateMarketingContent, generateEventDescriptions, saveConfig } from '../lib/optimizer/market-data';
import { generateSlug } from '../lib/optimizer/helpers';

// ───────────────────────────────────────────────────────────────────────────────
// Main Optimization Function (Scheduled - Every 6 Hours)
// This is the "intelligence loop" that makes the platform self-improving
// ───────────────────────────────────────────────────────────────────────────────
export async function optimizeContent(env: Env): Promise<void> {
    console.log('[optimizer] Starting autonomous content optimization...');

    const steps: Array<{ name: string; fn: () => Promise<unknown> }> = [
        { name: 'updateEngagementScores',        fn: () => updateEngagementScores(env) },
        { name: 'createHeadlineTests',            fn: () => createHeadlineTests(env) },
        { name: 'evaluateHeadlineTests',          fn: () => evaluateHeadlineTests(env) },
        { name: 'fillContentGaps',                fn: () => fillContentGaps(env) },
        { name: 'refreshDashboards',              fn: () => refreshDashboards(env) },
        { name: 'optimizeContentFormats',         fn: () => optimizeContentFormats(env) },
        { name: 'updateCountryScores',            fn: () => updateCountryScores(env) },
        { name: 'populateMarketMetrics',          fn: () => populateMarketMetrics(env) },
        { name: 'populateNarrativeStrategies',    fn: () => populateNarrativeStrategies(env) },
        { name: 'generateDynamicSectorSummaries', fn: () => generateDynamicSectorSummaries(env) },
        { name: 'generateHomePageDynamicContent', fn: () => generateHomePageDynamicContent(env) },
        { name: 'generateSystemicDynamicContent', fn: () => generateSystemicDynamicContent(env) },
        { name: 'generatePageSpecificContent',    fn: () => generatePageSpecificContent(env) },
        { name: 'generateMarketingContent',       fn: () => generateMarketingContent(env) },
        { name: 'generateEventDescriptions',      fn: () => generateEventDescriptions(env) },
    ];

    const results: Record<string, 'ok' | 'error'> = {};

    for (const step of steps) {
        try {
            await step.fn();
            results[step.name] = 'ok';
        } catch (err) {
            results[step.name] = 'error';
            console.error(`[optimizer] Step "${step.name}" failed:`, err);
            // Continue — one broken step must not abort the rest
        }
    }

    const failed = Object.entries(results).filter(([, v]) => v === 'error').map(([k]) => k);
    if (failed.length > 0) {
        console.warn(`[optimizer] Completed with ${failed.length} failed step(s): ${failed.join(', ')}`);
    } else {
        console.log('[optimizer] All steps completed successfully.');
    }
}


// ───────────────────────────────────────────────────────────────────────────────
// Process Optimization Task (Queue Consumer)
// ───────────────────────────────────────────────────────────────────────────────
export async function processOptimizationTask(
    data: Record<string, unknown>,
    env: Env
): Promise<void> {
    const message = data as unknown as OptimizationMessage;

    try {
        if (message.type === 'optimize_headline' && message.article_id) {
            const article = await env.DB.prepare(
                'SELECT id, title, summary FROM articles WHERE id = ?'
            ).bind(message.article_id).first();

            if (article) {
                const a = article as Record<string, any>;
                const variants = await generateHeadlineVariants(env, a.title, a.summary || '');

                if (variants.length >= 2) {
                    await env.DB.prepare(`
                        INSERT INTO headline_tests (id, article_id, variant, headline)
                        VALUES (?, ?, 'A', ?), (?, ?, 'B', ?)
                    `).bind(
                        crypto.randomUUID(), a.id, variants[0],
                        crypto.randomUUID(), a.id, variants[1]
                    ).run();
                }
            }
        } else if (message.type === 'fill_narrative_gap' && message.country_code && message.sector_id) {
            const country = await env.DB.prepare(
                'SELECT name FROM countries WHERE code = ?'
            ).bind(message.country_code).first();
            const sector = await env.DB.prepare(
                'SELECT name FROM sectors WHERE id = ?'
            ).bind(message.sector_id).first();

            if (country && sector) {
                const generated = await fillNarrativeGap(
                    env,
                    (country as Record<string, any>).name,
                    (sector as Record<string, any>).name
                );

                const articleId = crypto.randomUUID();
                const slug = generateSlug(generated.title);

                await env.DB.prepare(`
                    INSERT INTO articles (
                        id, slug, title, subtitle, content, summary,
                        country_code, sector_id, tags, generation_model,
                        status, moderation_status, published_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_audit', 'pending', NULL)
                `).bind(
                    articleId, slug,
                    generated.title, generated.subtitle,
                    generated.content, generated.summary,
                    message.country_code, message.sector_id,
                    JSON.stringify(generated.tags), MODELS.TEXT_GENERATION
                ).run();
            }
        } else {
            console.warn('[optimizer] Unknown message type or missing fields:', message.type);
        }
    } catch (err) {
        console.error('[optimizer] processOptimizationTask failed for message type:', message.type, err);
        // Propagate failure so Cloudflare Queues can apply its retry policy.
        throw err;
    }
}
