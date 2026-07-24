// ═══════════════════════════════════════════════════════════════════════════════
// OPTIMIZER WORKER
// Self-optimization engine for content, headlines, format, and language
// Autonomous backend that continuously refines the editorial product
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, OptimizationMessage } from '../../types';
import { generateHeadlineVariants, fillNarrativeGap, MODELS } from '../../lib/ai';
import { findNarrativeGaps } from '../../lib/vectorize';
import { updateArticleEngagement } from '../../lib/analytics';


import { logRefinement } from './analytics';
import { generateSlug } from './helpers';

// ───────────────────────────────────────────────────────────────────────────────
// Fill Narrative Gaps
// ───────────────────────────────────────────────────────────────────────────────
export async function fillContentGaps(env: Env): Promise<void> {
    // Get countries with lowest coverage
    const lowCoverageCountries = await env.DB.prepare(`
    SELECT c.code, c.name, COUNT(a.id) as article_count
    FROM countries c
    LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
    GROUP BY c.code
    HAVING article_count < 3
    ORDER BY article_count ASC
    LIMIT 3
  `).all();

    // Get all sectors
    const sectors = await env.DB.prepare('SELECT id, name FROM sectors').all();
    const sectorList = (sectors.results || []) as { id: string; name: string }[];

    for (const country of lowCoverageCountries.results || []) {
        const c = country as Record<string, any>;

        // Find which sectors are missing for this country
        const existing = await env.DB.prepare(`
      SELECT DISTINCT sector_id FROM articles
      WHERE country_code = ? AND status = 'published'
    `).bind(c.code).all();

        const existingSectors = new Set((existing.results || []).map((e: any) => e.sector_id));
        const missingSectors = sectorList.filter(s => !existingSectors.has(s.id));

        if (missingSectors.length > 0) {
            // Generate article for first missing sector
            const sector = missingSectors[0];

            try {
                console.log(`Filling gap: ${c.name} - ${sector.name}`);

                const generated = await fillNarrativeGap(env, c.name, sector.name);

                // Create article
                const articleId = crypto.randomUUID();
                const slug = generateSlug(generated.title);
                const wordCount = generated.content.split(/\s+/).length;
                const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                await env.DB.prepare(`
          INSERT INTO articles (
            id, slug, title, subtitle, content, summary,
            country_code, sector_id, tags,
            meta_title, meta_description,
            reading_time_minutes,
            generation_model, generation_prompt_version,
            status, moderation_status, published_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_audit', 'pending', NULL)
        `).bind(
                    articleId,
                    slug,
                    generated.title,
                    generated.subtitle,
                    generated.content,
                    generated.summary,
                    c.code,
                    sector.id,
                    JSON.stringify(generated.tags),
                    generated.title,
                    generated.summary?.slice(0, 160),
                    readingTime,
                    MODELS.TEXT_GENERATION,
                    'v1-gap-fill'
                ).run();

                console.log(`Created gap-fill article: ${articleId}`);

            } catch (error) {
                console.error(`Failed to fill gap for ${c.name}/${sector.name}:`, error);
            }
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Optimize Content Formats Based on User Behavior
// ───────────────────────────────────────────────────────────────────────────────
export async function optimizeContentFormats(env: Env): Promise<void> {
    // Analyze which formats perform best per audience segment
    const formatPerformance = await env.DB.prepare(`
        SELECT 
            target_audience,
            format_type,
            AVG(engagement_score) as avg_engagement,
            COUNT(*) as article_count
        FROM articles
        WHERE status = 'published' AND published_at > datetime('now', '-30 days')
        GROUP BY target_audience, format_type
        HAVING article_count > 5
    `).all();

    // Store format optimization insights
    for (const row of formatPerformance.results || []) {
        const r = row as Record<string, any>;
        await env.DB.prepare(`
            INSERT OR REPLACE INTO optimization_config (key, value, description, updated_at)
            VALUES (?, ?, ?, datetime('now'))
        `).bind(
            `format_${r.target_audience}_best`,
            JSON.stringify({ format: r.format_type, avg_engagement: r.avg_engagement }),
            `Best performing format for ${r.target_audience} audience`
        ).run();
    }

    console.log('Updated format optimization insights');
}
