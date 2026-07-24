import type { Env } from '../types';
import { extractOriginalArticleUrl, extractPublisherImage, normalizeEditorialImageUrl } from '../lib/editorial-images';

type SourceImageCandidate = {
    id: string;
    source_url: string;
};

const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 2_000_000;
const RETRY_AFTER_HOURS = 6;
const PAGE_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
};

type StoredSourceImage = {
    id: string;
    source_url: string;
    image_url: string;
    image_credit: string | null;
    image_source_url: string | null;
};

function safeSourceUrl(value: string): URL | null {
    try {
        const url = new URL(value.replace(/&#0*38;|&amp;/gi, '&'));
        if (!/^https?:$/.test(url.protocol)) return null;
        const host = url.hostname.toLowerCase();
        if (host === 'localhost' || host === '0.0.0.0' || host === '::1' || host.endsWith('.local')) return null;
        if (/^(?:10|127)\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return null;
        const private172 = host.match(/^172\.(\d+)\./);
        if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return null;
        return url;
    } catch {
        return null;
    }
}

export function publisherCredit(sourceUrl: string, explicitCredit?: string | null): string | null {
    const credit = explicitCredit?.replace(/\s+/g, ' ').trim();
    if (credit) return credit.slice(0, 240);

    const url = safeSourceUrl(sourceUrl);
    if (!url) return null;
    const publisher = url.hostname.replace(/^www\./i, '');
    return `Publisher image via ${publisher}`;
}

async function recoverCandidate(env: Env, candidate: SourceImageCandidate): Promise<boolean> {
    const source = safeSourceUrl(candidate.source_url);
    if (!source) {
        await markChecked(env, candidate.id, 'invalid-source');
        return false;
    }

    try {
        const response = await fetch(source, {
            redirect: 'follow',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: PAGE_HEADERS,
        });
        const contentType = response.headers.get('content-type') || '';
        const contentLength = Number(response.headers.get('content-length') || '0');
        if (!response.ok || !contentType.includes('text/html') || contentLength > MAX_HTML_BYTES) {
            await markChecked(env, candidate.id, `http-${response.status}`);
            return false;
        }

        let resolvedSource = response.url || source.toString();
        const html = (await response.text()).slice(0, MAX_HTML_BYTES);
        let image = extractPublisherImage(html, resolvedSource);

        // Aggregator pages sometimes expose only their logo while explicitly
        // linking the publisher's original article. Follow that acknowledged
        // source once and use its documentary image and page attribution.
        const originalUrl = !image.imageUrl ? extractOriginalArticleUrl(html, resolvedSource) : null;
        if (originalUrl) {
            const originalResponse = await fetch(originalUrl, {
                redirect: 'follow',
                signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
                headers: PAGE_HEADERS,
            });
            const originalType = originalResponse.headers.get('content-type') || '';
            const originalLength = Number(originalResponse.headers.get('content-length') || '0');
            if (originalResponse.ok && originalType.includes('text/html') && originalLength <= MAX_HTML_BYTES) {
                resolvedSource = originalResponse.url || originalUrl;
                const originalHtml = (await originalResponse.text()).slice(0, MAX_HTML_BYTES);
                image = extractPublisherImage(originalHtml, resolvedSource);
            } else if (!originalResponse.ok) {
                await markChecked(env, candidate.id, `http-${originalResponse.status}`);
                return false;
            }
        }
        const credit = image.imageUrl ? publisherCredit(resolvedSource, image.imageCredit) : null;
        if (!image.imageUrl || !credit) {
            await markChecked(env, candidate.id, 'no-publisher-image');
            return false;
        }

        await env.DB.prepare(`
            UPDATE articles
            SET hero_image_url = ?, image_credit = ?, image_source_url = ?,
                source_image_checked_at = datetime('now'), source_image_status = 'found'
            WHERE id = ?
        `).bind(image.imageUrl, credit, resolvedSource, candidate.id).run();
        return true;
    } catch (error) {
        const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'fetch-failed';
        await markChecked(env, candidate.id, reason);
        return false;
    }
}

async function markChecked(env: Env, id: string, status: string): Promise<void> {
    await env.DB.prepare(`
        UPDATE articles
        SET source_image_checked_at = datetime('now'), source_image_status = ?
        WHERE id = ?
    `).bind(status, id).run();
}

/**
 * Recover documentary photography from each story's original publisher page.
 * Each row is attempted once, newest first, so blocked publishers cannot starve
 * the archive. Failed rows remain image-free instead of receiving generic art.
 */
export async function backfillSourceImages(env: Env, batch = 8): Promise<{ checked: number; recovered: number }> {
    const limit = Math.max(1, Math.min(Math.trunc(batch), 12));
    const candidates = await env.DB.prepare(`
        SELECT id, source_url
        FROM articles
        WHERE status = 'published'
          AND source_url IS NOT NULL AND source_url != ''
          AND (hero_image_url IS NULL OR hero_image_url = '')
          AND (
              source_image_checked_at IS NULL
              OR (
                  source_image_checked_at <= datetime('now', '-${RETRY_AFTER_HOURS} hours')
                  AND source_image_status IN (
                      'http-403', 'http-429', 'http-500', 'http-502', 'http-503',
                      'http-504', 'http-521', 'http-525', 'timeout', 'fetch-failed'
                  )
              )
          )
        ORDER BY COALESCE(published_at, created_at) DESC, id ASC
        LIMIT ?
    `).bind(limit).all<SourceImageCandidate>();

    let recovered = 0;
    for (const candidate of candidates.results || []) {
        if (await recoverCandidate(env, candidate)) recovered += 1;
    }
    return { checked: candidates.results?.length || 0, recovered };
}

/**
 * Recover source images already captured from RSS or publisher metadata during
 * ingestion. Duplicate ingestion rows can contain different media completeness,
 * so this deliberately selects the most recent non-empty image for each URL.
 */
export async function backfillStoredSourceImages(env: Env, batch = 40): Promise<number> {
    const limit = Math.max(1, Math.min(Math.trunc(batch), 100));
    const rows = await env.DB.prepare(`
        SELECT a.id, a.source_url,
               (SELECT i.image_url FROM ingested_items i
                WHERE i.url = a.source_url AND i.image_url IS NOT NULL AND i.image_url != ''
                ORDER BY i.created_at DESC LIMIT 1) AS image_url,
               (SELECT i.image_credit FROM ingested_items i
                WHERE i.url = a.source_url AND i.image_url IS NOT NULL AND i.image_url != ''
                ORDER BY i.created_at DESC LIMIT 1) AS image_credit,
               (SELECT i.image_source_url FROM ingested_items i
                WHERE i.url = a.source_url AND i.image_url IS NOT NULL AND i.image_url != ''
                ORDER BY i.created_at DESC LIMIT 1) AS image_source_url
        FROM articles a
        WHERE a.status = 'published'
          AND a.source_url IS NOT NULL AND a.source_url != ''
          AND (a.hero_image_url IS NULL OR a.hero_image_url = '')
          AND EXISTS (
              SELECT 1 FROM ingested_items i
              WHERE i.url = a.source_url AND i.image_url IS NOT NULL AND i.image_url != ''
          )
        ORDER BY COALESCE(a.published_at, a.created_at) DESC, a.id ASC
        LIMIT ?
    `).bind(limit).all<StoredSourceImage>();

    let recovered = 0;
    for (const row of rows.results || []) {
        const imageUrl = normalizeEditorialImageUrl(row.image_url, row.source_url);
        const sourceUrl = safeSourceUrl(row.image_source_url || row.source_url)?.toString() || null;
        const credit = sourceUrl ? publisherCredit(sourceUrl, row.image_credit) : null;
        if (!imageUrl || !sourceUrl || !credit) continue;

        await env.DB.prepare(`
            UPDATE articles
            SET hero_image_url = ?, image_credit = ?, image_source_url = ?,
                source_image_checked_at = datetime('now'), source_image_status = 'found'
            WHERE id = ? AND (hero_image_url IS NULL OR hero_image_url = '')
        `).bind(imageUrl, credit, sourceUrl, row.id).run();
        recovered += 1;
    }
    return recovered;
}
