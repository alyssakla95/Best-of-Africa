// ═══════════════════════════════════════════════════════════════════════════════
// GENERATOR WORKER
// Queue consumer for article generation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env, ContentGenerationMessage } from '../types';
import { generateArticle as generateArticleContent, identifyCountry, identifySector, generateArticleImage, buildHeroPrompt, ARTICLE_PROMPT_VERSION, MODELS, callConfiguredAI, classifySectorEvidence } from '../lib/ai';
import { getMedia, uploadImage, uploadArticleHero, makeHeroVariant, heroVariantKey } from '../lib/media';
import { generateAudioNarration } from '../lib/audio';
import { checkContentIntegrity } from '../lib';
import { publisherNameForArticle } from '../lib/source-attribution';
import { sourceEvidenceFailure } from '../lib/editorial-quality';
import { coverageAdmissionFailure, sourceQualityProfile } from '../lib/source-quality';
import { readerSummary, repairReaderText } from '../lib/reader-text';


// ───────────────────────────────────────────────────────────────────────────────
// Main Generation Function (Queue Consumer)
// ───────────────────────────────────────────────────────────────────────────────
export async function generateArticleFromQueue(
    data: Record<string, unknown>,
    env: Env
): Promise<void> {
    const message = data as unknown as ContentGenerationMessage;

    if (message.type !== 'generate_article') return;

    console.log(`Processing article generation for item: ${message.ingested_item_id}`);

    try {
        // Get ingested item
        const item = await env.DB.prepare(`
      SELECT i.*, s.country_code as source_country, s.sector_id as source_sector, s.name as source_name
      FROM ingested_items i
      LEFT JOIN sources s ON i.source_id = s.id
      WHERE i.id = ?
    `).bind(message.ingested_item_id).first();

        if (!item) {
            console.error('Ingested item not found:', message.ingested_item_id);
            return;
        }

        // Claim atomically. Recovery can enqueue the same pending row again on a
        // later tick; only one consumer may spend generation capacity on it.
        const claim = await env.DB.prepare(`
      UPDATE ingested_items SET status = 'processing' WHERE id = ? AND status = 'pending'
    `).bind(message.ingested_item_id).run();
        if ((claim.meta?.changes || 0) === 0) {
            console.log(`[generator] Skipping already-claimed item: ${message.ingested_item_id}`);
            return;
        }

        const itemData = item as Record<string, any>;
        const evidenceFailure = sourceEvidenceFailure(itemData.content);
        if (evidenceFailure) {
            await env.DB.prepare(
                "UPDATE ingested_items SET status = 'rejected', rejection_reason = ? WHERE id = ?"
            ).bind(evidenceFailure, message.ingested_item_id).run();
            console.warn(`[generator] ${evidenceFailure}`);
            return;
        }

        // Classify the story itself. A publisher's home country or default beat is
        // provenance, not evidence that every syndicated story concerns that market.
        const countryCode = await identifyCountry(env, itemData.title || '', itemData.content || '');
        const sectorId = await identifySector(env, itemData.title || '', itemData.content || '');
        const publisherName = publisherNameForArticle(itemData);
        const quality = sourceQualityProfile(
            publisherName,
            itemData.publisher_url || itemData.url,
            itemData.source_id === 'google-news-aggregator' ? 'discovery' : 'fixed',
        );

        // Rolling admission guard. Lifetime totals let a short, intense publisher
        // or country spike dominate for weeks; the decision must use the current
        // 30-day editorial window and it must constrain publishers independently.
        const coverage = await env.DB.prepare(`
            SELECT COUNT(*) AS total_30d,
                   SUM(CASE WHEN ((? IS NULL AND country_code IS NULL) OR country_code = ?) THEN 1 ELSE 0 END) AS country_30d,
                   SUM(CASE WHEN LOWER(COALESCE(source_title, '')) = LOWER(?) THEN 1 ELSE 0 END) AS source_30d,
                   SUM(CASE WHEN source_quality_tier = 2 THEN 1 ELSE 0 END) AS tier2_30d,
                   SUM(CASE WHEN source_quality_tier = 4 THEN 1 ELSE 0 END) AS tier4_30d
            FROM articles
            WHERE status IN ('published', 'pending_audit')
              AND COALESCE(published_at, created_at) >= datetime('now', '-30 days')
        `).bind(countryCode, countryCode, publisherName).first<Record<string, number>>();
        const admissionFailure = coverageAdmissionFailure({
            total30d: Number(coverage?.total_30d || 0),
            country30d: Number(coverage?.country_30d || 0),
            source30d: Number(coverage?.source_30d || 0),
            countryCode: countryCode || null,
            sourceName: publisherName,
            qualityTier: quality.tier,
            tier2Total30d: Number(coverage?.tier2_30d || 0),
            tier4Total30d: Number(coverage?.tier4_30d || 0),
        });
        if (admissionFailure) {
            await env.DB.prepare(
                "UPDATE ingested_items SET status = 'rejected', rejection_reason = ? WHERE id = ?"
            ).bind(admissionFailure, message.ingested_item_id).run();
            console.log(`[generator] ${admissionFailure}`);
            return;
        }

        // Get country and sector names for prompt
        let countryName = null;
        let sectorName = null;

        if (countryCode) {
            const country = await env.DB.prepare('SELECT name FROM countries WHERE code = ?').bind(countryCode).first();
            countryName = (country as Record<string, any>)?.name;
        }

        if (sectorId) {
            const sector = await env.DB.prepare('SELECT name FROM sectors WHERE id = ?').bind(sectorId).first();
            sectorName = (sector as Record<string, any>)?.name;
        }

        // Direct generation on the backend using the enforced information model.
        console.log(`Generating article synchronously on the backend using ${MODELS.TEXT_GENERATION}...`);

        // Generate article content
        const generated = await generateArticleContent(
            env,
            itemData.title || '',
            itemData.content || '',
            countryName ?? null,
            sectorName ?? null,
        );

        if (!generated?.title || !generated?.content) {
            throw new Error('generateArticle returned empty title or content');
        }

        const articleId = crypto.randomUUID();
        const readingTime = Math.max(1, Math.ceil(generated.content.split(/\s+/).length / 200));
        const slug = generateSlug(generated.title);

        await env.DB.prepare(`
            INSERT INTO articles (
                id, slug, title, subtitle, content, summary,
                country_code, sector_id, tags,
                reading_time_minutes, source_url, source_title, source_published_at,
                source_quality_tier,
                hero_image_url, image_credit, image_source_url,
                generation_model, generation_prompt_version, ai_investor_brief,
                status, moderation_status, published_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_audit', 'pending', NULL, datetime('now'))
        `).bind(
            articleId, slug,
            repairReaderText(generated.title),
            generated.subtitle ? repairReaderText(generated.subtitle) : null,
            repairReaderText(generated.content),
            readerSummary(generated.content, generated.summary),
            countryCode ?? null,
            sectorId    ?? null,
            generated.tags ? JSON.stringify(generated.tags) : '[]',
            readingTime,
            itemData.url           ?? null,
            publisherName,
            itemData.published_at  ?? null,
            quality.tier,
            itemData.image_url ?? null,
            itemData.image_url ? (itemData.image_credit || itemData.source_name) : null,
            itemData.image_url ? (itemData.image_source_url || itemData.url) : null,
            MODELS.TEXT_GENERATION,
            ARTICLE_PROMPT_VERSION,
            generated.investor_brief,
        ).run();

        // Mark as completed
        await env.DB.prepare(`
            UPDATE ingested_items SET status = 'completed', article_id = ? WHERE id = ?
        `).bind(articleId, message.ingested_item_id).run();

        console.log(`Successfully generated article pending editorial audit: ${articleId} from item: ${message.ingested_item_id}`);

        // Async preparation tasks. Search indexing and distribution wait for approval.
        // We do this in the background so it doesn't block the queue consumer.
        // For queue consumers, waitUntil is not explicitly needed if the worker stays alive,
        // but we'll await them to ensure they complete within the generous queue limits.
        // Audio narration ships with the article (the UI shows Listen buttons on
        // every card — audio must exist, not be a member-gated maybe).
        // Audio and translations wait for the independent source-grounded
        // publication audit so they always reflect the final approved text.

    } catch (error) {
        console.error('Article generation failed:', error);
        const failure = error instanceof Error ? error.message : 'Unknown error';
        const previous = await env.DB.prepare(
            'SELECT rejection_reason FROM ingested_items WHERE id = ?'
        ).bind(message.ingested_item_id).first<{ rejection_reason: string | null }>();
        const priorAttempts = Number(previous?.rejection_reason?.match(/^generation attempt (\d+)\//)?.[1] || 0);
        const attempt = priorAttempts + 1;
        const terminal = attempt >= 5;

        await env.DB.prepare(`
            UPDATE ingested_items
            SET status = ?, rejection_reason = ?
            WHERE id = ?
        `).bind(
            terminal ? 'rejected' : 'pending',
            `generation attempt ${attempt}/5: ${failure}`.slice(0, 1000),
            message.ingested_item_id
        ).run();
        if (!terminal) throw error;
    }
}

/**
 * Repair bounded historical reader records that predate the current summary
 * and encoding gates. The query self-terminates once no affected rows remain.
 */
export async function backfillReaderText(env: Env, batch = 8): Promise<number> {
    const rows = await env.DB.prepare(`
        SELECT id, title, subtitle, summary, content
        FROM articles
        WHERE status = 'published'
          AND (summary IS NULL OR length(trim(summary)) = 0)
        ORDER BY published_at DESC, id DESC
        LIMIT ?
    `).bind(Math.max(1, Math.min(batch, 25))).all<{
        id: string; title: string; subtitle: string | null; summary: string | null; content: string;
    }>();

    let repaired = 0;
    for (const article of rows.results || []) {
        const title = repairReaderText(article.title);
        const subtitle = article.subtitle ? repairReaderText(article.subtitle) : null;
        const content = repairReaderText(article.content);
        const summary = readerSummary(content, article.summary);
        const narrationChanged = title !== article.title || content !== article.content;
        await env.DB.prepare(`
            UPDATE articles
            SET title = ?, subtitle = ?, summary = ?, content = ?,
                audio_regen = CASE WHEN ? THEN 1 ELSE audio_regen END,
                updated_at = datetime('now')
            WHERE id = ?
        `).bind(title, subtitle, summary, content, narrationChanged ? 1 : 0, article.id).run();
        if (narrationChanged) {
            await env.DB.prepare('DELETE FROM article_translations WHERE article_id = ?').bind(article.id).run();
        }
        repaired += 1;
    }
    return repaired;
}

// Alias for queue handler compatibility
export const generateArticle = generateArticleFromQueue;

// ───────────────────────────────────────────────────────────────────────────────
// Pending-item Recovery (Cron)
//
// Items are inserted as 'pending' and immediately enqueued to CONTENT_QUEUE. If
// the generation step is down (e.g. Workers AI quota exhausted → circuit breaker
// OPEN), those queue messages fail and dead-letter, leaving the ingested_item
// stranded at 'pending' forever — and dedup stops re-ingestion from re-queuing it.
// This re-enqueues the oldest stranded items in a small bounded batch so the
// backlog drains automatically once generation capacity returns.
// ───────────────────────────────────────────────────────────────────────────────
export async function recoverPendingItems(env: Env, limit = 10): Promise<number> {
    // Don't flood the queue while text generation is down (breaker OPEN) — there's
    // no point re-enqueuing into a failing AI. Resumes automatically once the
    // breaker closes (AI capacity restored).
    try {
        const cb = await env.CACHE.get('cb:ai-text-gen', 'json') as { state?: string } | null;
        if (cb?.state === 'OPEN') {
            console.log('[generator] Skipping recovery: ai-text-gen breaker is OPEN.');
            return 0;
        }
    } catch { /* KV unavailable — proceed */ }

    const stranded = await env.DB.prepare(`
        SELECT id, source_id
        FROM ingested_items
        WHERE status = 'pending'
          AND article_id IS NULL
          AND created_at < datetime('now', '-15 minutes')
        ORDER BY LENGTH(COALESCE(content, '')) DESC, created_at ASC
        LIMIT ?
    `).bind(limit).all<{ id: string; source_id: string }>();

    const rows = stranded.results || [];
    for (const r of rows) {
        await env.CONTENT_QUEUE.send({
            type: 'generate_article', ingested_item_id: r.id, source_id: r.source_id, priority: 'normal',
        });
    }
    if (rows.length) console.log(`[generator] Re-enqueued ${rows.length} stranded pending item(s).`);
    return rows.length;
}

// ───────────────────────────────────────────────────────────────────────────────
// Hero-image backfill (Cron — every minute, small batch)
//
// A third of the archive was published while Workers AI image generation was
// over quota, leaving hero_image_url empty (the UI shows category fallbacks).
// This works newest-first so the most-visible articles get real imagery first,
// and stops the batch on the first failure (model unavailable / breaker open)
// so it never burns the budget in a down period. Self-terminates once the
// backlog is empty.
// ───────────────────────────────────────────────────────────────────────────────
export async function backfillHeroImages(env: Env, batch = 5): Promise<number> {
    // Retained as a compatibility no-op for older scheduled deployments.
    // BOA no longer generates or backfills synthetic editorial photography.
    void env; void batch;
    return 0;
    /* c8 ignore start */
    const rows = await env.DB.prepare(`
        SELECT id, title, summary, sector_id
        FROM articles INDEXED BY idx_articles_hero_missing
        WHERE status = 'published' AND (hero_image_url IS NULL OR hero_image_url = '')
        ORDER BY published_at DESC
        LIMIT ?
    `).bind(batch).all<{ id: string; title: string; summary: string | null; sector_id: string | null }>();

    let done = 0;
    for (const a of rows.results || []) {
        try {
            const imagePrompt = buildHeroPrompt(a.title, a.sector_id, a.summary);
            const imageBuffer = await generateArticleImage(env, imagePrompt);
            if (!imageBuffer) break; // model unavailable — retry next cron tick
            const imageUrl = await uploadArticleHero(env, a.id, imageBuffer!);
            if (imageUrl) {
                await env.DB.prepare('UPDATE articles SET hero_image_url = ?, hero_variant = 1 WHERE id = ?').bind(imageUrl, a.id).run();
                done++;
            }
        } catch (err) {
            console.error('[backfill-hero] failed for', a.id, err);
            break;
        }
    }
    if (done) console.log(`[backfill-hero] Generated ${done} hero image(s).`);
    return done;
}

// ───────────────────────────────────────────────────────────────────────────────
// Hero regeneration (Cron — every minute, small batch)
//
// The archive's heroes were generated by SDXL-lightning (plastic AI-stock
// look); the pipeline now uses FLUX.1-schnell (verified photographic quality).
// Regenerates hero_regen=0 articles MOST-VISIBLE FIRST (curated, then by
// views, then recency) so the front of the site improves within hours while
// the long tail follows. Marks rows even when generation is skipped-as-done
// only on success; on model failure it stops the batch and retries next tick.
// Self-terminates when the whole archive is flux-era.
// ───────────────────────────────────────────────────────────────────────────────
export async function regenerateHeroImages(env: Env, batch = 5): Promise<number> {
    // Retained as a compatibility no-op for older scheduled deployments.
    void env; void batch;
    return 0;
    /* c8 ignore start */
    const rows = await env.DB.prepare(`
        SELECT id, title, summary, sector_id
        FROM articles INDEXED BY idx_articles_regen_pending
        WHERE status = 'published' AND (hero_regen IS NULL OR hero_regen = 0)
        ORDER BY curated DESC, view_count DESC, published_at DESC
        LIMIT ?
    `).bind(batch).all<{ id: string; title: string; summary: string | null; sector_id: string | null }>();

    let done = 0;
    for (const a of rows.results || []) {
        try {
            const imagePrompt = buildHeroPrompt(a.title, a.sector_id, a.summary);
            const imageBuffer = await generateArticleImage(env, imagePrompt);
            if (!imageBuffer) break; // model unavailable — retry next cron tick
            const imageUrl = await uploadArticleHero(env, a.id, imageBuffer!);
            if (imageUrl) {
                await env.DB.prepare(
                    'UPDATE articles SET hero_image_url = ?, hero_variant = 1, hero_regen = 1 WHERE id = ?'
                ).bind(imageUrl, a.id).run();
                done++;
            }
        } catch (err) {
            console.error('[regen-hero] failed for', a.id, err);
            break;
        }
    }
    if (done) console.log(`[regen-hero] Regenerated ${done} hero image(s).`);
    return done;
}

// ───────────────────────────────────────────────────────────────────────────────
// Hero-variant backfill (Cron — every minute, small batch)
//
// Articles whose heroes predate variant generation ship a 1024² (~170KB) image
// to phones. This walks hero_variant=0 articles newest-first, resizes the
// stored original to the 768w JPEG variant, and marks the row. No AI involved;
// self-terminates when every hero has a variant.
// ───────────────────────────────────────────────────────────────────────────────
export async function backfillHeroVariants(env: Env, batch = 4): Promise<number> {
    const rows = await env.DB.prepare(`
        SELECT id, hero_image_url
        FROM articles INDEXED BY idx_articles_variant_missing
        WHERE status = 'published'
          AND hero_image_url LIKE '%/assets/articles/%'
          AND (hero_variant IS NULL OR hero_variant = 0)
        ORDER BY published_at DESC
        LIMIT ?
    `).bind(batch).all<{ id: string; hero_image_url: string }>();

    let done = 0;
    for (const a of rows.results || []) {
        try {
            const key = decodeURIComponent(a.hero_image_url.replace(/^.*\/assets\//, ''));
            const obj = await getMedia(env, key);
            if (obj) {
                const bytes = new Uint8Array(
                    obj.body instanceof ArrayBuffer
                        ? obj.body
                        : await new Response(obj.body).arrayBuffer()
                );
                const variant = await makeHeroVariant(bytes);
                if (variant) await uploadImage(env, heroVariantKey(key), variant, 'image/jpeg');
                // Mark done even when no variant was produced (source ≤768w or
                // undecodable) so the cron never loops on the same rows.
            }
            await env.DB.prepare('UPDATE articles SET hero_variant = 1 WHERE id = ?').bind(a.id).run();
            done++;
        } catch (err) {
            console.error('[backfill-variant] failed for', a.id, err);
            break;
        }
    }
    if (done) console.log(`[backfill-variant] Processed ${done} hero variant(s).`);
    return done;
}

// ───────────────────────────────────────────────────────────────────────────────
// Audio-narration backfill (Cron — every minute, small batch)
// ───────────────────────────────────────────────────────────────────────────────
// Sector Backfill (Cron — per-minute, self-terminating)
//
// ~6k older articles predate sector assignment (sector_id NULL), making them
// invisible to sector filters, trends and kickers. Classify newest-first with
// the text model; stories that fit no business sector (sports, culture,
// politics, human interest) get the honest 'general' sector — a real sectors
// row, so the FK holds and the article permanently leaves the NULL queue.
// ───────────────────────────────────────────────────────────────────────────────
const SECTOR_IDS = ['tourism', 'energy', 'agriculture', 'technology', 'infrastructure', 'finance', 'manufacturing', 'healthcare'];

export async function backfillSectors(env: Env, batch = 8): Promise<number> {
    const rows = await env.DB.prepare(`
        SELECT id, title, summary FROM articles INDEXED BY idx_articles_sector_missing
        WHERE status = 'published' AND sector_id IS NULL
        ORDER BY published_at DESC
        LIMIT ?
    `).bind(batch).all<{ id: string; title: string; summary: string | null }>();

    let done = 0;
    for (const a of rows.results || []) {
        try {
            const { MODELS } = await import('../lib/ai');
            const res = await (env.AI as Record<string, any>).run(MODELS.FAST_TEXT_GENERATION, {
                messages: [
                    { role: 'system', content: 'Classify the news item into exactly one sector id from: tourism, energy, agriculture, technology, infrastructure, finance, manufacturing, healthcare. If none fits (sports, culture, politics, human interest), reply none. Reply with the single word only.' },
                    { role: 'user', content: `${a.title}\n\n${(a.summary || '').slice(0, 300)}` },
                ],
                max_tokens: 8,
                temperature: 0,
            });
            const out = String((res as Record<string, any>)?.response || '').toLowerCase();
            const sector = SECTOR_IDS.find(s => out.includes(s)) || 'general';
            await env.DB.prepare('UPDATE articles SET sector_id = ? WHERE id = ?').bind(sector, a.id).run();
            done++;
        } catch (err) {
            console.error('[backfill-sectors] failed for', a.id, err);
            break; // model unavailable — retry next tick
        }
    }
    if (done) console.log(`[backfill-sectors] Classified ${done} article(s).`);
    return done;
}

type SectorAuditRow = {
    id: string;
    title: string;
    summary: string | null;
    content: string | null;
    sector_id: string;
};

const AUDITABLE_SECTORS = new Set([...SECTOR_IDS, 'general']);

/**
 * Re-audit legacy sector assignments in bounded batches. Strong deterministic
 * evidence is accepted immediately. Ambiguous rows are reviewed together by
 * the configured deep-analysis provider; only high-confidence results become
 * eligible for sector statistics. Everything else remains visible as an
 * article but is explicitly excluded from sector-level evidence counts.
 */
export async function auditHistoricalSectorAssignments(
    env: Env,
    batch = 12,
): Promise<{ checked: number; qualified: number; corrected: number; needsReview: number }> {
    const limit = Math.max(1, Math.min(Math.trunc(batch), 16));
    const rows = await env.DB.prepare(`
        SELECT id, title, summary, content, sector_id
        FROM articles INDEXED BY idx_articles_sector_review_queue
        WHERE status = 'published'
          AND sector_id IS NOT NULL
          AND sector_id != ''
          AND sector_reviewed_at IS NULL
        ORDER BY published_at DESC, id ASC
        LIMIT ?
    `).bind(limit).all<SectorAuditRow>();
    const candidates = rows.results || [];
    if (!candidates.length) return { checked: 0, qualified: 0, corrected: 0, needsReview: 0 };

    const statements: D1PreparedStatement[] = [];
    const ambiguous: SectorAuditRow[] = [];
    let qualified = 0;
    let corrected = 0;
    let needsReview = 0;

    for (const row of candidates) {
        const evidence = classifySectorEvidence(row.title, `${row.summary || ''}\n${(row.content || '').slice(0, 2400)}`);
        if (!evidence.confident || !evidence.sector) {
            ambiguous.push(row);
            continue;
        }
        const confidence = Math.min(0.99, 0.82 + Math.min(0.17, evidence.bestScore / 100));
        if (row.sector_id !== evidence.sector) corrected += 1;
        qualified += 1;
        statements.push(env.DB.prepare(`
            UPDATE articles
            SET sector_assignment_previous = CASE WHEN sector_id != ? THEN sector_id ELSE sector_assignment_previous END,
                sector_id = ?, sector_assignment_method = 'keyword_evidence_review',
                sector_assignment_confidence = ?, sector_reviewed_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
        `).bind(evidence.sector, evidence.sector, confidence, row.id));
    }

    if (ambiguous.length) {
        const records = ambiguous.map(row => ({
            id: row.id,
            current_sector: row.sector_id,
            title: repairReaderText(row.title),
            evidence: repairReaderText(`${row.summary || ''} ${(row.content || '').slice(0, 900)}`),
        }));
        try {
            const raw = await callConfiguredAI(env, {
                prompt: `Review the sector assignment of every source-grounded business record below. Choose exactly one sector from tourism, energy, agriculture, technology, infrastructure, finance, manufacturing, healthcare, general. Use general for politics, sport, culture, personalities or cross-cutting material without enough evidence for one economic sector. Return only a JSON array of objects with id, sector, confidence (0 to 1). Do not infer a sector from a single incidental word.\n\n${JSON.stringify(records)}`,
                max_tokens: 2200,
                temperature: 0,
                response_profile: 'deep-analysis',
                structured_output: true,
            });
            const json = raw.match(/\[[\s\S]*\]/)?.[0] || '[]';
            const decisions = JSON.parse(json) as Array<{ id?: string; sector?: string; confidence?: number }>;
            const byId = new Map(decisions.map(decision => [String(decision.id || ''), decision]));
            for (const row of ambiguous) {
                const decision = byId.get(row.id);
                const sector = String(decision?.sector || '').toLowerCase();
                const confidence = Number(decision?.confidence || 0);
                if (AUDITABLE_SECTORS.has(sector) && confidence >= 0.82) {
                    if (row.sector_id !== sector) corrected += 1;
                    qualified += 1;
                    statements.push(env.DB.prepare(`
                        UPDATE articles
                        SET sector_assignment_previous = CASE WHEN sector_id != ? THEN sector_id ELSE sector_assignment_previous END,
                            sector_id = ?, sector_assignment_method = 'deep_editorial_review',
                            sector_assignment_confidence = ?, sector_reviewed_at = datetime('now'),
                            updated_at = datetime('now')
                        WHERE id = ?
                    `).bind(sector, sector, Math.min(0.99, confidence), row.id));
                } else {
                    needsReview += 1;
                    statements.push(env.DB.prepare(`
                        UPDATE articles
                        SET sector_assignment_method = 'needs_editorial_review',
                            sector_assignment_confidence = 0,
                            sector_reviewed_at = datetime('now')
                        WHERE id = ?
                    `).bind(row.id));
                }
            }
        } catch (error) {
            console.error('[sector-assignment-audit] deep review failed', error);
            // Leave ambiguous rows unreviewed so the next scheduled tick retries.
        }
    }

    if (statements.length) await env.DB.batch(statements);
    const checked = statements.length;
    if (checked) console.log(`[sector-assignment-audit] checked=${checked} qualified=${qualified} corrected=${corrected} needsReview=${needsReview}`);
    return { checked, qualified, corrected, needsReview };
}

// ───────────────────────────────────────────────────────────────────────────────
// Audio Backfill (Cron — per-minute, self-terminating)
//
// Audio was member-gated and on-demand only, and its stored URLs pointed at the
// disabled r2.dev subdomain — so despite Listen buttons on every card, zero
// articles had working audio. Narrates the summary (short, cheap) newest-first;
// self-terminates when every published article has audio.
// ───────────────────────────────────────────────────────────────────────────────
export async function backfillAudio(env: Env, batch = 3): Promise<number> {
    const rows = await env.DB.prepare(`
        SELECT id, title, summary, content
        FROM articles INDEXED BY idx_articles_audio_missing
        WHERE status = 'published' AND (audio_url IS NULL OR audio_url = '')
        ORDER BY published_at DESC
        LIMIT ?
    `).bind(Math.max(batch, batch * 3)).all<{ id: string; title: string; summary: string | null; content: string | null }>();

    let done = 0;
    for (const a of rows.results || []) {
        try {
            const res = await generateAudioNarration(env, a.id, a.title, a.content || a.summary || '');
            if (!res) continue; // A single difficult article must not starve the queue.
            done++;
            if (done >= batch) break;
        } catch (err) {
            console.error('[backfill-audio] failed for', a.id, err);
            continue;
        }
    }
    if (done) console.log(`[backfill-audio] Narrated ${done} article(s).`);
    return done;
}

// ───────────────────────────────────────────────────────────────────────────────
// Audio Regeneration (Cron — per-minute, self-terminating)
//
// The first 5,680 narrations were MeloTTS — robotic, and the model died
// server-side on 2026-07-09. Re-narrate them with the Deepgram Aura voice,
// newest-first (they are the articles readers actually play), overwriting the
// same R2 key so existing audio URLs keep working. Runs INSTEAD of the
// coverage backfill each tick until the regen queue drains — fixing the voice
// on audible articles beats adding audio to ones nobody has reached yet.
// ───────────────────────────────────────────────────────────────────────────────
export async function regenerateAudio(env: Env, batch = 3): Promise<number> {
    const rows = await env.DB.prepare(`
        SELECT id, title, summary, content
        FROM articles INDEXED BY idx_articles_audio_regen
        WHERE status = 'published' AND audio_url IS NOT NULL AND (audio_regen IS NULL OR audio_regen < 2)
        ORDER BY published_at DESC
        LIMIT ?
    `).bind(Math.max(batch, batch * 3)).all<{ id: string; title: string; summary: string | null; content: string | null }>();

    let done = 0;
    for (const a of rows.results || []) {
        try {
            const res = await generateAudioNarration(env, a.id, a.title, a.content || a.summary || '');
            if (!res) continue; // Keep the archive moving when one item fails.
            done++;
            if (done >= batch) break;
        } catch (err) {
            console.error('[regen-audio] failed for', a.id, err);
            continue;
        }
    }
    if (done) console.log(`[regen-audio] Re-narrated ${done} article(s) with Aura 2.`);
    return done;
}

// ───────────────────────────────────────────────────────────────────────────────
// Stale Task Fallback (Cron — every 2 minutes)
//
// ZeroClaw is an external that polls //tasks/pending. If it goes
// offline, generate_article tasks pile up in agent_tasks with no one to claim
// them. This function is the self-sufficient fallback: after a 15-minute grace
// window it claims up to 3 tasks internally and runs the full generation +
// enrichment pipeline without any external dependency.
// ───────────────────────────────────────────────────────────────────────────────
export async function processStaleArticleTasks(env: Env): Promise<void> {
    // 1. Find generate_article tasks that ZeroClaw hasn't claimed after 15 min
    const staleTasks = await env.DB.prepare(`
        SELECT id, payload, retry_count
        FROM agent_tasks
        WHERE type = 'generate_article'
          AND status = 'pending'
          AND created_at < datetime('now', '-15 minutes')
          AND (expires_at IS NULL OR expires_at <= datetime('now'))
        ORDER BY priority DESC, created_at ASC
        LIMIT 3
    `).all<{ id: string; payload: string; retry_count: number }>();

    if (staleTasks.results.length === 0) return;

    console.log(`[generator] Claiming ${staleTasks.results.length} stale task(s) for internal generation.`);

    for (const task of staleTasks.results) {
        // 2. Lock the task: mark processing + set a 10-minute processing TTL
        await env.DB.prepare(`
            UPDATE agent_tasks
            SET status = 'processing',
                updated_at = datetime('now'),
                expires_at = datetime('now', '+10 minutes')
            WHERE id = ? AND status = 'pending'
        `).bind(task.id).run();

        let payload: Record<string, any>;
        try {
            payload = JSON.parse(task.payload);
        } catch {
            console.error(`[generator] Task ${task.id} has unparseable payload — failing permanently.`);
            await env.DB.prepare(`
                UPDATE agent_tasks
                SET status = 'failed', error_message = 'Invalid JSON payload', completed_at = datetime('now')
                WHERE id = ?
            `).bind(task.id).run();
            continue;
        }

        try {
            // 3. Generate article content
            const generated = await generateArticleContent(
                env,
                payload.title || '',
                payload.content || '',
                payload.country_name ?? null,
                payload.sector_name ?? null,
            );

            if (!generated?.title || !generated?.content) {
                throw new Error('generateArticle returned empty title or content');
            }

            const countryCode = await identifyCountry(env, payload.title || '', payload.content || '');
            const sectorId = await identifySector(env, payload.title || '', payload.content || '');

            const articleId = crypto.randomUUID();
            const readingTime = Math.ceil(generated.content.split(/\s+/).length / 200);
            const slug = generateSlug(generated.title);

            await env.DB.prepare(`
                INSERT INTO articles (
                    id, slug, title, subtitle, content, summary,
                    country_code, sector_id, tags,
                    reading_time_minutes, source_url, source_title, source_published_at,
                    generation_model, generation_prompt_version,
                    status, moderation_status, published_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_audit', 'pending', NULL, datetime('now'))
            `).bind(
                articleId, slug,
                generated.title,
                generated.subtitle ?? null,
                generated.content,
                generated.summary ?? null,
                countryCode,
                sectorId,
                generated.tags ? JSON.stringify(generated.tags) : '[]',
                readingTime,
                payload.url           ?? null,
                payload.title         ?? null,
                payload.published_at  ?? null,
                MODELS.TEXT_GENERATION,
                ARTICLE_PROMPT_VERSION,
            ).run();

            // 4. Image generation (independent — failure does not block article)
            if (false) try {
                const imagePrompt = buildHeroPrompt(generated.title, payload.sector_id ?? null, generated.summary);
                const imageBuffer = await generateArticleImage(env, imagePrompt);
                if (imageBuffer) {
                    const imageUrl = await uploadArticleHero(env, articleId, imageBuffer!);
                    if (imageUrl) {
                        await env.DB.prepare(
                            'UPDATE articles SET hero_image_url = ?, hero_variant = 1 WHERE id = ?'
                        ).bind(imageUrl, articleId).run();
                    }
                } else {
                    console.warn(`[generator] Image generation returned null for article ${articleId}`);
                }
            } catch (imgErr) {
                console.error(`[generator] Image generation failed for article ${articleId}:`, imgErr);
            }

            // 5. Translation (independent — failure does not block article)
            // 6. Mark task done. Media, translations, search indexing and
            // distribution wait for publication approval.
            await env.DB.prepare(`
                UPDATE agent_tasks
                SET status = 'completed',
                    result = ?,
                    completed_at = datetime('now'),
                    updated_at = datetime('now')
                WHERE id = ?
            `).bind(JSON.stringify({ article_id: articleId, generated_internally: true }), task.id).run();

            if (payload.ingested_item_id) {
                await env.DB.prepare(`
                    UPDATE ingested_items SET status = 'completed' WHERE id = ?
                `).bind(payload.ingested_item_id).run();
            }

            console.log(`[generator] Internally generated article ${articleId} from stale task ${task.id}.`);

        } catch (err) {
            console.error(`[generator] Internal generation failed for task ${task.id}:`, err);

            const newRetryCount = (task.retry_count ?? 0) + 1;
            const maxRetries = 3;

            if (newRetryCount >= maxRetries) {
                // Permanent failure — exhausted retries
                await env.DB.prepare(`
                    UPDATE agent_tasks
                    SET status = 'failed',
                        retry_count = ?,
                        error_message = ?,
                        completed_at = datetime('now'),
                        updated_at = datetime('now')
                    WHERE id = ?
                `).bind(
                    newRetryCount,
                    err instanceof Error ? err.message : String(err),
                    task.id
                ).run();

                if (payload.ingested_item_id) {
                    await env.DB.prepare(`
                        UPDATE ingested_items SET status = 'rejected', rejection_reason = ? WHERE id = ?
                    `).bind('Internal generation exhausted retries', payload.ingested_item_id).run();
                }
            } else {
                // Back off exponentially before the next internal retry attempt
                const backoffSeconds = Math.pow(4, newRetryCount) * 30; // 120s / 480s
                await env.DB.prepare(`
                    UPDATE agent_tasks
                    SET status = 'pending',
                        retry_count = ?,
                        error_message = ?,
                        expires_at = datetime('now', '+' || ? || ' seconds'),
                        updated_at = datetime('now')
                    WHERE id = ?
                `).bind(
                    newRetryCount,
                    err instanceof Error ? err.message : String(err),
                    backoffSeconds,
                    task.id
                ).run();
            }
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
function generateSlug(title: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);

    // Add timestamp suffix for uniqueness
    const suffix = Date.now().toString(36).slice(-4);
    return `${base}-${suffix}`;
}
