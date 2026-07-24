import { Hono } from 'hono';
import type { Env } from '../types';
import { generateCountryBrief, storeReport } from '../lib/reports';
import { matchCountryByName } from '../lib/ai';

const router = new Hono<{ Bindings: Env }>();

// Auth guard for dev endpoints (defined here before first use)
const devAuthGuard = async (c: any, next: () => Promise<void>) => {
    const secret = c.req.header('X-Dev-Secret');
    const expectedSecret = (c.env as Record<string, any>).DEV_SECRET;

    // If DEV_SECRET is not set, DENY access (safe by default)
    if (!expectedSecret) {
        console.warn('DEV_SECRET not set - blocking dev endpoint access');
        return c.json({ error: 'forbidden', message: 'DEV_SECRET not configured. Dev endpoints are disabled.' }, 403);
    }

    if (secret !== expectedSecret) {
        return c.json({ error: 'unauthorized', message: 'Invalid or missing X-Dev-Secret header' }, 401);
    }

    return next();
};

// Re-tag existing articles' country_code using the deterministic name matcher.
// Batched (offset/limit) to stay within worker limits. Pass ?dryRun=1 to preview.
// Only overwrites when a country name is confidently found AND differs from the
// stored code — never nulls an existing value.
router.post('/retag-countries', devAuthGuard, async (c) => {
    const url = new URL(c.req.url);
    const dryRun = url.searchParams.get('dryRun') === '1';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '1000', 10) || 1000, 2000);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10) || 0;

    const res = await c.env.DB.prepare(
        'SELECT id, title, summary, tags, country_code FROM articles ORDER BY rowid LIMIT ? OFFSET ?'
    ).bind(limit, offset).all();

    const items = (res.results || []) as Array<Record<string, any>>;
    let changed = 0;
    const samples: Array<Record<string, any>> = [];

    for (const a of items) {
        let tagText = '';
        try {
            const t = JSON.parse(a.tags || '[]');
            if (Array.isArray(t)) tagText = t.join(' ');
        } catch { /* ignore */ }

        const matched = matchCountryByName(a.title || '', `${a.summary || ''} ${tagText}`);
        if (matched && matched !== a.country_code) {
            if (samples.length < 25) samples.push({ from: a.country_code, to: matched, title: String(a.title || '').slice(0, 50) });
            if (!dryRun) {
                await c.env.DB.prepare('UPDATE articles SET country_code = ? WHERE id = ?').bind(matched, a.id).run();
            }
            changed++;
        }
    }

    return c.json({
        dryRun,
        offset,
        scanned: items.length,
        changed,
        nextOffset: offset + items.length,
        done: items.length < limit,
        samples,
    });
});

// Translation-regeneration diagnostic: run one quality=0 row through the
// pipeline and report exactly what the model returned and which gate fired.
router.post('/test-translate', devAuthGuard, async (c) => {
    const { MODELS } = await import('../lib/ai');
    const { looksDegenerate } = await import('../lib/translate');
    const row = await c.env.DB.prepare(`
        SELECT t.id tid, t.language, a.title, a.content
        FROM article_translations t JOIN articles a ON a.id = t.article_id
        WHERE t.quality = 0 AND a.status='published'
        ORDER BY a.published_at DESC LIMIT 1
    `).first() as Record<string, any> | null;
    if (!row) return c.json({ ok: false, reason: 'no rows' });

    const langNames: Record<string, string> = { fr: 'French', ar: 'Modern Standard Arabic', pt: 'Portuguese' };
    const chunk = (row.content || '').split(/\n\n+/).slice(0, 3).join('\n\n').slice(0, 1400);
    const prompt = `Translate the following news text into ${langNames[row.language] || row.language}. Preserve the markdown formatting exactly (headings, **bold**, lists). Output ONLY the translation, no preamble.\n\n${chunk}`;
    let raw: unknown = null; let err: string | null = null;
    try {
        raw = await (c.env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
            messages: [
                { role: 'system', content: `You are a professional news translator. Translate the user's text into ${langNames[row.language] || row.language}. Preserve the markdown formatting exactly. Output ONLY the translation — no preamble, no notes.` },
                { role: 'user', content: chunk },
            ],
            max_tokens: 1400, temperature: 0.2,
        });
    } catch (e) { err = String(e); }
    const out = ((raw as Record<string, any>)?.response || '').trim();
    return c.json({
        lang: row.language,
        srcLen: chunk.length,
        err,
        rawKeys: raw ? Object.keys(raw as object) : null,
        outLen: out.length,
        outSample: out.slice(0, 300),
        degenerate: out ? looksDegenerate(chunk, out) : null,
    });
});

// Direct image-model smoke test: returns byte count + magic bytes so model
// swaps can be verified without waiting for the generation pipeline.
router.post('/test-image', devAuthGuard, async (c) => {
    return c.json({ error: 'gone', message: 'Synthetic editorial image generation is permanently disabled.' }, 410);
    /* compatibility code below is intentionally unreachable */
    const { generateArticleImage } = await import('../lib/ai');
    const t0 = Date.now();
    const buf = await generateArticleImage(c.env, 'African market street at golden hour.');
    if (!buf) return c.json({ ok: false, ms: Date.now() - t0 }, 500);
    const head = Array.from(new Uint8Array(buf!.slice(0, 4))).map(b => b.toString(16).padStart(2, '0')).join('');
    return c.json({ ok: true, bytes: buf!.byteLength, magic: head, ms: Date.now() - t0 });
});

router.get('/generate-reports', devAuthGuard, async (c) => {
    const report = await generateCountryBrief(c.env, 'ZA');
    // Save to DB
    const id = await storeReport(c.env, report, "<html>placeholder</html>");
    return c.json({ success: true, report_id: id, report });
});

// Dev endpoint to trigger optimization worker (populates market_metrics, narrative_strategies)
router.post('/trigger-optimization', devAuthGuard, async (c) => {
    const { optimizeContent } = await import('../workers/optimizer');
    await optimizeContent(c.env);
    return c.json({ success: true, message: 'Optimization complete - market_metrics and narrative_strategies populated' });
});

// Probe a TTS model directly (MeloTTS went 3043 server-side on 2026-07-09,
// freezing the audio pipeline — this measures candidates for the fallback).
router.post('/test-tts', devAuthGuard, async (c) => {
    const model = c.req.query('model') || '@cf/myshell-ai/melotts';
    const text = 'Nairobi is building a new financial district, and investors are paying attention.';
    const t0 = Date.now();
    try {
        const res = await (c.env.AI as Record<string, any>).run(
            model,
            model.includes('melotts') ? { prompt: text, lang: 'en' } : { text },
        );
        let bytes = 0; let kind: string = typeof res;
        if (res instanceof ReadableStream) {
            const buf = await new Response(res).arrayBuffer();
            bytes = buf.byteLength; kind = 'stream';
            (globalThis as Record<string, any>).__ttsHead = [...new Uint8Array(buf.slice(0, 4))].map(b => b.toString(16).padStart(2, '0')).join('');
        } else if (res && typeof res === 'object' && 'audio' in res) {
            bytes = atob((res as Record<string, string>).audio).length; kind = 'base64';
        } else if (res instanceof ArrayBuffer) {
            bytes = res.byteLength; kind = 'arraybuffer';
        }
        return c.json({ ok: bytes > 0, model, kind, bytes, head: (globalThis as Record<string, any>).__ttsHead || null, ms: Date.now() - t0 });
    } catch (e) {
        return c.json({ ok: false, model, error: String(e).slice(0, 300), ms: Date.now() - t0 });
    }
});

// Backfill articles.audio_file_size from R2 object metadata (podcast feeds
// need a real enclosure byte length; historical uploads never stored one).
// Paginated by R2 list cursor; DB.batch keeps each call to two subrequests.
router.post('/audio-sizes', devAuthGuard, async (c) => {
    const cursor = c.req.query('cursor') || undefined;
    if (!c.env.MEDIA) {
        return c.json({ error: 'audio-sizes backfill requires the R2 MEDIA binding; the KV fallback cannot list keys' }, 503);
    }
    const listed = await c.env.MEDIA.list({ prefix: 'audio/', limit: 500, cursor });
    const stmts = [];
    for (const obj of listed.objects) {
        const m = obj.key.match(/^audio\/(.+)\.mp3$/);
        if (!m) continue;
        stmts.push(c.env.DB.prepare(
            'UPDATE articles SET audio_file_size = ? WHERE id = ? AND (audio_file_size IS NULL OR audio_file_size = 0)'
        ).bind(obj.size, m[1]));
    }
    if (stmts.length) await c.env.DB.batch(stmts);
    const truncated = 'truncated' in listed ? listed.truncated : false;
    return c.json({
        listed: listed.objects.length,
        updates_attempted: stmts.length,
        cursor: truncated && 'cursor' in listed ? listed.cursor : null,
    });
});

// Dev endpoint to REQUEUE all pending items for processing
router.post('/requeue-pending', devAuthGuard, async (c) => {
    const pending = await c.env.DB.prepare(`
        SELECT id, source_id FROM ingested_items WHERE status = 'pending'
    `).all();

    let queued = 0;
    for (const item of (pending.results || [])) {
        const i = item as Record<string, any>;
        await c.env.CONTENT_QUEUE.send({
            type: 'generate_article',
            ingested_item_id: i.id,
            source_id: i.source_id || 'manual',
            priority: 'normal',
        });
        queued++;
    }

    return c.json({ success: true, queued, message: `Queued ${queued} pending items for AI processing.` });
});

// Dev endpoint to SEED sources and TRIGGER ingestion
router.post('/seed-and-trigger', devAuthGuard, async (c) => {
    const { DEFAULT_SOURCES, ingestNews } = await import('../workers/ingestion');

    let added = 0;
    for (const source of DEFAULT_SOURCES) {
        const id = crypto.randomUUID();
        const exists = await c.env.DB.prepare('SELECT id FROM sources WHERE url = ?').bind(source.url).first();
        if (!exists) {
            await c.env.DB.prepare(`
                INSERT INTO sources (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
                VALUES (?, ?, ?, ?, ?, ?, 1, 30)
            `).bind(id, source.name, source.type, source.url, source.country_code, source.sector_id).run();
            added++;
        }
    }

    // Trigger Ingestion
    const result = await ingestNews(c.env);

    return c.json({
        success: true,
        seeded: added,
        ingestion: result,
        message: `Seeded ${added} new sources and triggered ingestion.`
    });
});

// Dev endpoint to trigger stale task generation
router.post('/force-stale', devAuthGuard, async (c) => {
    try {
        const { processStaleArticleTasks } = await import('../workers/generator');
        await processStaleArticleTasks(c.env);
        return c.json({ success: true, message: 'Processed stale tasks.' });
    } catch (e: any) {
        return c.json({ success: false, error: e.message, stack: e.stack });
    }
});

// Dev endpoint to BACKFILL vector embeddings for search
router.post('/backfill-vectors', devAuthGuard, async (c) => {
    const { indexArticle } = await import('../lib/vectorize');

    // Get articles without embeddings
    const articles = await c.env.DB.prepare(`
        SELECT id, title, content, country_code, sector_id, published_at 
        FROM articles 
        WHERE embedding_id IS NULL 
        LIMIT 50
    `).all();

    let indexed = 0;
    let errors = 0;

    for (const article of (articles.results || []) as any[]) {
        try {
            const chunkCount = await indexArticle(c.env, article.id, article.title, article.content, {
                country_code: article.country_code,
                sector_id: article.sector_id,
                published_at: article.published_at,
            });

            await c.env.DB.prepare(`
                UPDATE articles SET embedding_id = ?, chunk_count = ? WHERE id = ?
            `).bind(article.id, chunkCount, article.id).run();

            indexed++;
        } catch (err) {
            console.error(`Failed to index ${article.id}:`, err);
            errors++;
        }
    }

    return c.json({
        success: true,
        indexed,
        errors,
        remaining: (articles.results?.length || 0) - indexed,
        message: `Indexed ${indexed} articles for semantic search.`
    });
});

// Dev endpoint to CLEANUP old ingested items (completed/rejected older than 7 days)
router.post('/cleanup', devAuthGuard, async (c) => {
    const result = await c.env.DB.prepare(`
        DELETE FROM ingested_items 
        WHERE status IN ('completed', 'rejected') 
        AND created_at < datetime('now', '-7 days')
    `).run();

    return c.json({
        success: true,
        deleted: result.meta?.changes || 0,
        message: `Cleaned up old ingested items.`
    });
});

export { router as devRouter };
