// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION SERVICE
// Multi-language content support for every language exposed by the reader UI.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { normalisePortuguesePortugal1945 } from './portuguese';

// Supported target languages for African audiences
export type SupportedLanguage = 'en' | 'fr' | 'ar' | 'pt' | 'de' | 'hi' | 'zh';
export type GeneratedTranslationLanguage = Exclude<SupportedLanguage, 'en'>;
export type ReaderTranslationLanguage = GeneratedTranslationLanguage;

export const LANGUAGE_CONFIG: Record<SupportedLanguage, { name: string; regions: string[] }> = {
    en: { name: 'English', regions: ['Southern', 'East', 'West'] },
    fr: { name: 'French', regions: ['West', 'Central', 'North'] },
    ar: { name: 'Arabic', regions: ['North'] },
    pt: { name: 'Portuguese', regions: ['Southern'] },
    de: { name: 'German', regions: [] },
    hi: { name: 'Hindi', regions: [] },
    zh: { name: 'Simplified Chinese', regions: [] },
};

// Countries by primary language
export const LANGUAGE_COUNTRIES: Record<SupportedLanguage, string[]> = {
    en: ['NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'ZM', 'ZW', 'BW', 'MW', 'RW'],
    fr: ['SN', 'CI', 'CM', 'CD', 'CG', 'GA', 'BF', 'ML', 'NE', 'TG', 'BJ', 'GN', 'MR', 'DZ', 'TN', 'MA'],
    ar: ['EG', 'MA', 'DZ', 'TN', 'LY', 'SD'],
    pt: ['AO', 'MZ', 'CV', 'GW', 'ST'],
    de: [],
    hi: [],
    zh: [],
};

// ───────────────────────────────────────────────────────────────────────────────
// Translate Text
// ───────────────────────────────────────────────────────────────────────────────
export async function translateText(
    env: Env,
    text: string,
    targetLang: GeneratedTranslationLanguage,
    sourceLang: SupportedLanguage = 'en'
): Promise<string> {
    if (sourceLang === targetLang) return text;
    if (!text || text.trim().length === 0) return text;

    try {
        // Workers translation model
        const response = await (env.AI as Record<string, any>).run('@cf/meta/m2m100-1.2b', {
            text: text.slice(0, 5000), // Limit input size
            source_lang: sourceLang,
            target_lang: targetLang,
        });

        const translated = String((response as Record<string, any>).translated_text || text);
        return targetLang === 'pt' ? (normalisePortuguesePortugal1945(translated) || translated) : translated;
    } catch (error) {
        console.error(`Translation failed (${sourceLang} → ${targetLang}):`, error);
        return text; // Return original on failure
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Translate Article
// ───────────────────────────────────────────────────────────────────────────────
export async function translateArticle(
    env: Env,
    article: {
        title: string;
        subtitle?: string | null;
        summary?: string | null;
        content: string;
    },
    targetLang: GeneratedTranslationLanguage
): Promise<{
    title: string;
    subtitle: string | null;
    summary: string | null;
    content: string;
}> {
    // Translate in parallel for efficiency
    const [title, subtitle, summary, content] = await Promise.all([
        translateText(env, article.title, targetLang),
        article.subtitle ? translateText(env, article.subtitle, targetLang) : Promise.resolve(null),
        article.summary ? translateText(env, article.summary, targetLang) : Promise.resolve(null),
        translateText(env, article.content, targetLang),
    ]);

    return { title, subtitle, summary, content };
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Recommended Language for Country
// ───────────────────────────────────────────────────────────────────────────────
export function getRecommendedLanguage(countryCode: string): SupportedLanguage {
    for (const [lang, countries] of Object.entries(LANGUAGE_COUNTRIES)) {
        if (countries.includes(countryCode)) {
            return lang as SupportedLanguage;
        }
    }
    return 'en'; // Default to English
}

// ───────────────────────────────────────────────────────────────────────────────
// Store Translation in Database
// ───────────────────────────────────────────────────────────────────────────────
export async function storeTranslation(
    env: Env,
    articleId: string,
    lang: SupportedLanguage,
    translated: {
        title: string;
        subtitle: string | null;
        summary: string | null;
        content: string;
    }
): Promise<void> {
    const id = crypto.randomUUID();

    await env.DB.prepare(`
        INSERT OR REPLACE INTO article_translations (
            id, article_id, language, title, subtitle, summary, content, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        id,
        articleId,
        lang,
        translated.title,
        translated.subtitle,
        translated.summary,
        translated.content
    ).run();
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Translation from Database
// ───────────────────────────────────────────────────────────────────────────────
export async function getTranslation(
    env: Env,
    articleId: string,
    lang: SupportedLanguage
): Promise<{
    title: string;
    subtitle: string | null;
    summary: string | null;
    content: string;
    quality: number;
} | null> {
    const result = await env.DB.prepare(`
        SELECT title, subtitle, summary, content, quality
        FROM article_translations
        WHERE article_id = ? AND language = ?
    `).bind(articleId, lang).first();

    if (!result) return null;

    const r = result as Record<string, any>;
    return {
        title: r.title,
        subtitle: r.subtitle,
        summary: r.summary,
        content: r.content,
        quality: Number(r.quality ?? 0),
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Long-form translation with the large model + degeneracy gate
//
// m2m100 (above) is fine for titles/summaries but collapses on long markdown:
// its stored bodies are 200-800 char stumps and repetition loops. These
// helpers translate bodies chunk-by-chunk with the main text model and refuse
// to accept output that looks degenerate — a failed check means we keep
// serving English rather than store garbage.
// ───────────────────────────────────────────────────────────────────────────────

const LANG_NAMES: Record<string, string> = {
    fr: 'French', ar: 'Modern Standard Arabic',
    pt: 'European Portuguese (Portugal), using the orthography preceding the 1990 Orthographic Agreement',
    de: 'German', hi: 'Hindi', zh: 'Simplified Chinese',
};

const normaliseTranslationOutput = (value: string, targetLang: ReaderTranslationLanguage): string =>
    targetLang === 'pt' ? (normalisePortuguesePortugal1945(value) || value) : value;

/** Max recurrence of any 24-char window (sampled every 12 chars). */
function maxWindowRepeat(text: string): number {
    const counts = new Map<string, number>();
    let max = 0;
    for (let i = 0; i + 24 <= text.length; i += 12) {
        const k = text.slice(i, i + 24);
        const n = (counts.get(k) || 0) + 1;
        counts.set(k, n);
        if (n > max) max = n;
    }
    return max;
}

/**
 * True when a translation looks broken: empty, wildly wrong length, or looping.
 * Repetition is judged RELATIVE to the source — article bodies legitimately
 * contain repeated markdown (table separator rows from enrichment), and a
 * faithful translation preserves them; only repetition well beyond the
 * source's own level indicates a model loop.
 */
export function looksDegenerate(source: string, out: string, targetLang?: SupportedLanguage): boolean {
    const o = (out || '').trim();
    if (!o) return true;
    // Chinese conveys the same prose in materially fewer Unicode characters
    // than English. Keep the strict default for alphabetic-script languages,
    // but do not misclassify complete Chinese translations as truncations.
    const minimumRatio = targetLang === 'zh'
        ? 0.18
        : targetLang === 'ar' || targetLang === 'hi'
            ? 0.25
            : 0.35;
    if (o.length < source.length * minimumRatio || o.length > source.length * 2.5) return true;
    const srcRep = maxWindowRepeat(source);
    const outRep = maxWindowRepeat(o);
    return outRep >= Math.max(5, srcRep * 2 + 2);
}

export function parseLongTranslationBatch(raw: string, expected: number): string[] | null {
    const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
        const parsed = JSON.parse(clean.slice(start, end + 1));
        const translations: unknown[] | null = Array.isArray(parsed?.translations) ? parsed.translations : null;
        if (!translations || translations.length !== expected) return null;
        if (translations.some(value => typeof value !== 'string' || !value.trim())) return null;
        return (translations as string[]).map(value => value.trim());
    } catch {
        return null;
    }
}

// Returns undefined when the model itself failed (transient infrastructure),
// null when the model answered but the output failed validation (quality).
async function llmTranslateBatch(
    env: Env,
    texts: string[],
    targetLang: ReaderTranslationLanguage,
): Promise<string[] | null | undefined> {
    if (!texts.length) return [];
    const { extractAIText, hasProcessLeakage, MODELS } = await import('./ai');
    try {
        const res = await (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            messages: [
                {
                    role: 'system',
                    content: `You are a professional news translator. Translate every supplied text from English into ${LANG_NAMES[targetLang] || targetLang}. Preserve all facts, names, dates, numbers, URLs and markdown formatting exactly. Never summarize, omit, explain or add commentary. Return only JSON in exactly this shape: {"translations":["first translation","second translation"]}, preserving input order and count.`,
                },
                { role: 'user', content: JSON.stringify(texts.map((text, id) => ({ id, text }))) },
            ],
            // The reasoning model shares this allowance between its reasoning
            // and final JSON. One batched call avoids partial multi-call jobs.
            max_tokens: 12000,
            temperature: 0.1,
        });
        const parsed = parseLongTranslationBatch(extractAIText(res), texts.length);
        if (!parsed) return null;
        // A structurally valid batch can still smuggle model commentary into a
        // translation string; reject the whole batch rather than publish it.
        return parsed.some(value => hasProcessLeakage(value))
            ? null
            : parsed.map(value => normaliseTranslationOutput(value, targetLang));
    } catch (e) {
        console.error('[translate] llm batch failed:', e);
        return undefined;
    }
}

async function llmTranslate(env: Env, text: string, targetLang: ReaderTranslationLanguage): Promise<string | null> {
    const translated = await llmTranslateBatch(env, [text], targetLang);
    return translated?.[0] || null;
}

async function llmTranslateBatchResilient(
    env: Env,
    texts: string[],
    targetLang: ReaderTranslationLanguage,
): Promise<string[] | null | undefined> {
    const translated = await llmTranslateBatch(env, texts, targetLang);
    if (translated || translated === undefined) return translated;
    if (texts.length === 1) {
        try {
            const { extractAIText, hasProcessLeakage, MODELS } = await import('./ai');
            const response = await (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
                messages: [
                    {
                        role: 'system',
                        content: `Translate the supplied English text into ${LANG_NAMES[targetLang] || targetLang}. Preserve every fact, name, date, number, URL, paragraph and markdown element. Do not summarize or explain. Return only the translated text with no JSON wrapper, label or code fence.`,
                    },
                    { role: 'user', content: texts[0] },
                ],
                max_tokens: 7000,
                temperature: 0.1,
            });
            const repaired = extractAIText(response).trim()
                .replace(/^```(?:markdown|text)?\s*/i, '')
                .replace(/\s*```$/i, '');
            if (
                repaired
                && !hasProcessLeakage(repaired)
                && !looksDegenerate(texts[0], repaired, targetLang)
                && !/^(translation|translated text|here is)\s*:/i.test(repaired)
                && !(repaired.length < 200 && /\b(json|translation|translated|request|cannot|unable)\b/i.test(repaired))
            ) {
                return [normaliseTranslationOutput(repaired, targetLang)];
            }
        } catch (error) {
            console.error('[translate] single-text repair failed:', error);
            return undefined;
        }
        return null;
    }
    const middle = Math.ceil(texts.length / 2);
    const left = await llmTranslateBatchResilient(env, texts.slice(0, middle), targetLang);
    if (!left) return left;
    const right = await llmTranslateBatchResilient(env, texts.slice(middle), targetLang);
    return right ? [...left, ...right] : right;
}

/** Split markdown into paragraph-aligned chunks of ~1400 chars. */
function chunkMarkdown(md: string, max = 1400): string[] {
    const parts = md.split(/\n\n+/);
    const chunks: string[] = [];
    let cur = '';
    for (const p of parts) {
        if (cur && cur.length + p.length + 2 > max) { chunks.push(cur); cur = p; }
        else cur = cur ? `${cur}\n\n${p}` : p;
    }
    if (cur) chunks.push(cur);
    return chunks;
}

/**
 * Translate a full article body with the large model. Returns null if the
 * model is unavailable OR any chunk fails the degeneracy check.
 */
export async function translateLongText(
    env: Env,
    text: string,
    targetLang: ReaderTranslationLanguage
): Promise<string | null> {
    const chunks = chunkMarkdown(text);
    // A structurally invalid large JSON response is a model formatting
    // failure, not evidence that the translation itself is impossible.
    const out = await llmTranslateBatchResilient(env, chunks, targetLang);
    if (!out || out.length !== chunks.length) return null;
    if (out.some((translation, index) => looksDegenerate(chunks[index], translation, targetLang))) return null;
    return out.join('\n\n');
}

/** Build and persist the full, quality-gated translation a reader requested. */
export async function ensureArticleTranslation(
    env: Env,
    articleId: string,
    article: { title: string; subtitle?: string | null; summary?: string | null; content: string },
    targetLang: ReaderTranslationLanguage,
): Promise<boolean> {
    const existing = await getTranslation(env, articleId, targetLang);
    if (existing?.quality === 1 && existing.content) return true;

    const lockKey = `translation:building:v1:${articleId}:${targetLang}`;
    if (await env.CACHE.get(lockKey)) return false;
    await env.CACHE.put(lockKey, '1', { expirationTtl: 10 * 60 });
    try {
        await recordTranslationStatus(env, articleId, targetLang, { phase: 'started' });
        const bodyChunks = chunkMarkdown(article.content || '');
        const sourceTexts = [
            article.title,
            ...(article.subtitle ? [article.subtitle] : []),
            ...(article.summary ? [article.summary] : []),
            ...bodyChunks,
        ];
        const translated = await llmTranslateBatchResilient(env, sourceTexts, targetLang);
        if (translated === undefined) {
            // Infrastructure failure — retryable, never a terminal refusal.
            await recordTranslationStatus(env, articleId, targetLang, {
                phase: 'model-unavailable',
                inputs: sourceTexts.length,
            });
            return false;
        }
        if (!translated) {
            await recordTranslationStatus(env, articleId, targetLang, {
                phase: 'model-output-invalid',
                inputs: sourceTexts.length,
                sourceChars: sourceTexts.reduce((sum, value) => sum + value.length, 0),
            });
            return false;
        }

        let cursor = 0;
        const title = translated[cursor++];
        const subtitle = article.subtitle ? translated[cursor++] : null;
        const summary = article.summary ? translated[cursor++] : null;
        const translatedBodyChunks = translated.slice(cursor);
        if (looksDegenerate(article.title, title, targetLang)) {
            await recordTranslationStatus(env, articleId, targetLang, {
                phase: 'title-gate', sourceChars: article.title.length, outputChars: title.length,
            });
            return false;
        }
        if (translatedBodyChunks.length !== bodyChunks.length) {
            await recordTranslationStatus(env, articleId, targetLang, {
                phase: 'body-count-gate', expected: bodyChunks.length, received: translatedBodyChunks.length,
            });
            return false;
        }
        const rejectedBodyIndex = translatedBodyChunks.findIndex((value, index) =>
            looksDegenerate(bodyChunks[index], value, targetLang)
        );
        if (rejectedBodyIndex >= 0) {
            await recordTranslationStatus(env, articleId, targetLang, {
                phase: 'body-gate',
                index: rejectedBodyIndex,
                sourceChars: bodyChunks[rejectedBodyIndex].length,
                outputChars: translatedBodyChunks[rejectedBodyIndex].length,
            });
            return false;
        }
        const content = translatedBodyChunks.join('\n\n');
        if (!content) return false;

        await env.DB.prepare(`
            INSERT OR REPLACE INTO article_translations
                (id, article_id, language, title, subtitle, summary, content, quality, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        `).bind(
            crypto.randomUUID(), articleId, targetLang, title,
            subtitle || article.subtitle || null,
            summary || article.summary || null,
            content,
        ).run();
        await recordTranslationStatus(env, articleId, targetLang, {
            phase: 'complete', sourceChars: article.content.length, outputChars: content.length,
        });
        return true;
    } catch (error) {
        console.error(`[translate] requested translation failed for ${articleId} (${targetLang})`, error);
        return false;
    } finally {
        await env.CACHE.delete(lockKey);
    }
}

export interface ArticleTranslationQueueMessage {
    type: 'article_translation';
    articleId: string;
    language: ReaderTranslationLanguage;
}

const READER_TRANSLATION_LANGUAGES: readonly ReaderTranslationLanguage[] = [
    'pt', 'fr', 'ar', 'de', 'hi', 'zh',
];

function queuedTranslationKey(articleId: string, language: ReaderTranslationLanguage): string {
    return `translation:queued:v2:${articleId}:${language}`;
}

function translationStatusKey(articleId: string, language: ReaderTranslationLanguage): string {
    return `translation:status:v1:${articleId}:${language}`;
}

async function recordTranslationStatus(
    env: Env,
    articleId: string,
    language: ReaderTranslationLanguage,
    status: Record<string, unknown>,
): Promise<void> {
    await env.CACHE.put(
        translationStatusKey(articleId, language),
        JSON.stringify({ ...status, updatedAt: new Date().toISOString() }),
        { expirationTtl: 24 * 60 * 60 },
    );
}

/** Queue a full translation without making the reader wait for the model. */
export async function enqueueArticleTranslation(
    env: Env,
    articleId: string,
    language: ReaderTranslationLanguage,
): Promise<boolean> {
    const key = queuedTranslationKey(articleId, language);
    if (await env.CACHE.get(key)) return false;

    await env.CACHE.put(key, '1', { expirationTtl: 60 * 60 });
    try {
        const message: ArticleTranslationQueueMessage = {
            type: 'article_translation',
            articleId,
            language,
        };
        await env.TRANSLATION_QUEUE.send(message);
        return true;
    } catch (error) {
        await env.CACHE.delete(key);
        throw error;
    }
}

/** Run one queued full-article translation with queue-level retries. */
export async function processArticleTranslationJob(
    env: Env,
    message: ArticleTranslationQueueMessage,
    attempts = 1,
): Promise<void> {
    const article = await env.DB.prepare(`
        SELECT title, subtitle, summary, content
        FROM articles
        WHERE id = ? AND status = 'published'
        LIMIT 1
    `).bind(message.articleId).first<{
        title: string;
        subtitle: string | null;
        summary: string | null;
        content: string;
    }>();

    // A withdrawn story is a terminal no-op, not a poison message.
    if (!article) {
        await env.CACHE.delete(queuedTranslationKey(message.articleId, message.language));
        return;
    }

    const complete = await ensureArticleTranslation(env, message.articleId, article, message.language);
    if (!complete) {
        // Distinguish terminal quality refusals from transient infrastructure
        // failures. Gate phases mean the model produced unusable output for
        // THIS article; once the message has been retried, further attempts
        // re-run the same content against the same gates. Store a quality=-1
        // row holding the English source fields (the same convention as the
        // backfill: a no-op for readers that stops re-queueing) and ack.
        const statusRaw = await env.CACHE.get(translationStatusKey(message.articleId, message.language));
        let phase: string | undefined;
        try { phase = statusRaw ? (JSON.parse(statusRaw) as Record<string, unknown>).phase as string | undefined : undefined; }
        catch { phase = undefined; }
        const qualityRefusal = phase === 'model-output-invalid' || phase === 'title-gate'
            || phase === 'body-count-gate' || phase === 'body-gate';
        if (qualityRefusal && attempts >= 3) {
            await env.DB.prepare(`
                INSERT OR REPLACE INTO article_translations
                    (id, article_id, language, title, subtitle, summary, content, quality, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, -1, datetime('now'))
            `).bind(
                crypto.randomUUID(), message.articleId, message.language,
                article.title, article.subtitle, article.summary, article.content,
            ).run();
            console.warn(`[translate] terminal quality refusal for ${message.articleId} (${message.language}, phase ${phase}) — marked -1 after ${attempts} attempts`);
        } else {
            throw new Error(`Translation incomplete for ${message.articleId} (${message.language})`);
        }
    }

    await env.CACHE.delete(queuedTranslationKey(message.articleId, message.language));
}

/**
 * Regenerate stored translations (quality=0 → 1) newest-article-first with the
 * large model; short fields and the body are all redone in one pass. Rows whose
 * output fails the degeneracy gate are marked quality=-1 (skipped, no loop).
 *
 * Once no quality=0 rows remain, spare batch capacity moves to historical
 * coverage: articles that predate automatic translation
 * and have no translation row at all get one created, newest-first, through
 * the same model and gate. Gate refusals are stored as quality=-1 rows holding
 * the ENGLISH source fields (the shorts overlay serves any-quality rows, so a
 * refused row must be a no-op, not a degenerate title) — and the -1 row keeps
 * the article from being retried every tick. Self-terminates when both the
 * legacy rows and the coverage gap are exhausted.
 */
export async function backfillTranslations(env: Env, batch = 2): Promise<number> {
    const portugueseDone = await backfillMissingPortugueseTranslations(env, batch);
    const remainingBatch = batch - portugueseDone;
    if (remainingBatch <= 0) {
        console.log(`[translate] Generated ${portugueseDone} Portuguese translation(s).`);
        return portugueseDone;
    }

    const rows = await env.DB.prepare(`
        SELECT t.id AS tid, t.article_id AS aid, t.language, a.title, a.subtitle, a.summary, a.content
        FROM article_translations t
        JOIN articles a ON a.id = t.article_id
        WHERE (
            t.quality = 0
            OR (t.quality = -1 AND t.created_at < datetime('now', '-6 hours'))
        ) AND a.status = 'published'
        ORDER BY a.published_at DESC
        LIMIT ?
    `).bind(remainingBatch).all<{ tid: string; aid: string; language: ReaderTranslationLanguage; title: string; subtitle: string | null; summary: string | null; content: string }>();

    let done = portugueseDone;
    for (const r of rows.results || []) {
        try {
            const ok = await ensureArticleTranslation(
                env,
                r.aid,
                { title: r.title, subtitle: r.subtitle, summary: r.summary, content: r.content || '' },
                r.language,
            );
            if (!ok) {
                await env.DB.prepare("UPDATE article_translations SET quality = -1, created_at = datetime('now') WHERE id = ?").bind(r.tid).run();
                console.warn(`[translate] quality-gated output for ${r.tid} (${r.language}) — marked -1`);
                continue;
            }
            done++;
        } catch (e) {
            console.error('[translate] backfill failed for', r.tid, e);
            break;
        }
    }

    const spare = remainingBatch - (rows.results?.length || 0);
    if (spare > 0) done += await backfillMissingTranslations(env, spare);

    if (done) console.log(`[translate] Regenerated ${done} translation(s).`);
    return done;
}

/** Restore Portuguese publication continuity before lower-priority archive work. */
async function backfillMissingPortugueseTranslations(env: Env, batch: number): Promise<number> {
    const DONE_FLAG = 'translate:portuguese-publication:v1:coverage_done';
    if (await env.CACHE.get(DONE_FLAG)) return 0;

    const missing = await env.DB.prepare(`
        SELECT a.id AS aid, a.title, a.subtitle, a.summary, a.content
        FROM articles a
        WHERE a.status = 'published'
          AND NOT EXISTS (
              SELECT 1 FROM article_translations t
              WHERE t.article_id = a.id AND t.language = 'pt'
          )
        ORDER BY a.published_at DESC, a.view_count DESC
        LIMIT ?
    `).bind(batch).all<{ aid: string; title: string; subtitle: string | null; summary: string | null; content: string }>();

    if (!(missing.results || []).length) {
        await env.CACHE.put(DONE_FLAG, '1', { expirationTtl: 60 * 60 });
        return 0;
    }

    let done = 0;
    for (const article of missing.results || []) {
        const complete = await ensureArticleTranslation(env, article.aid, article, 'pt');
        if (!complete) break;
        done++;
    }
    return done;
}

/** Phase 2: fill every reader locale, newest and most-read articles first. */
async function backfillMissingTranslations(env: Env, batch: number): Promise<number> {
    // Once coverage is complete the anti-join below scans every covered
    // article and finds nothing — every minute, forever. Park the sweep for
    // 6h whenever it comes back empty; new articles are translated at
    // enrichment time anyway, so the backfill only needs occasional passes.
    const DONE_FLAG = 'translate:all-reader-locales:v3:coverage_done';
    if (await env.CACHE.get(DONE_FLAG)) return 0;

    const missing = await env.DB.prepare(`
        SELECT a.id AS aid, l.lang, a.title, a.subtitle, a.summary, a.content
        FROM articles a
        -- json_each avoids a compound SELECT (D1 rejects UNION ALL chains).
        CROSS JOIN (SELECT value AS lang FROM json_each('["pt","fr","ar","de","hi","zh"]')) l
        WHERE a.status = 'published'
          AND NOT EXISTS (
              SELECT 1 FROM article_translations t
              WHERE t.article_id = a.id AND t.language = l.lang
          )
        ORDER BY CASE l.lang WHEN 'pt' THEN 0 ELSE 1 END, a.published_at DESC, a.view_count DESC, l.lang ASC
        LIMIT ?
    `).bind(batch).all<{ aid: string; lang: ReaderTranslationLanguage; title: string; subtitle: string | null; summary: string | null; content: string }>();

    if ((missing.results || []).length === 0) {
        await env.CACHE.put(DONE_FLAG, '1', { expirationTtl: 6 * 3600 });
        return 0;
    }

    let done = 0;
    for (const r of missing.results || []) {
        try {
            const [title, subtitle, summary] = await Promise.all([
                llmTranslate(env, r.title, r.lang),
                r.subtitle ? llmTranslate(env, r.subtitle, r.lang) : Promise.resolve(null),
                r.summary ? llmTranslate(env, r.summary, r.lang) : Promise.resolve(null),
            ]);
            if (title === null) break; // model unavailable — retry next tick
            const content = await translateLongText(env, r.content || '', r.lang);
            const ok = !!content && !looksDegenerate(r.title, title, r.lang);

            await env.DB.prepare(`
                INSERT OR REPLACE INTO article_translations
                    (id, article_id, language, title, subtitle, summary, content, quality, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `).bind(
                crypto.randomUUID(), r.aid, r.lang,
                ok ? title : r.title,
                ok ? subtitle : r.subtitle,
                ok ? summary : r.summary,
                ok ? content : (r.content || ''),
                ok ? 1 : -1,
            ).run();

            if (ok) done++;
            else console.warn(`[translate] degenerate output for article ${r.aid} (${r.lang}) — stored as -1`);
        } catch (e) {
            console.error('[translate] coverage backfill failed for', r.aid, e);
            break;
        }
    }
    return done;
}

// ───────────────────────────────────────────────────────────────────────────────
// Auto-Translate for Target Audiences
// Called after article generation to create translations
// ───────────────────────────────────────────────────────────────────────────────
export async function autoTranslateArticle(
    env: Env,
    articleId: string,
    _article: {
        title: string;
        subtitle?: string | null;
        summary?: string | null;
        content: string;
        country_code?: string | null;
    }
): Promise<void> {
    const queued = await Promise.allSettled(READER_TRANSLATION_LANGUAGES.map((language) =>
        enqueueArticleTranslation(env, articleId, language)
    ));
    queued.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(
                `Failed to queue article ${articleId} for ${READER_TRANSLATION_LANGUAGES[index]}`,
                result.reason,
            );
        }
    });
}
