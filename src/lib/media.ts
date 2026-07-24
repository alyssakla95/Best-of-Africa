// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA SERVICE
// R2 Storage and Image Handling
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

const KV_MEDIA_PREFIX = 'media:v1:';

export interface StoredMedia {
    body: ReadableStream | ArrayBuffer;
    contentType: string;
    etag: string;
}

function bytesToHex(bytes: ArrayBuffer): string {
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function putMedia(
    env: Env,
    key: string,
    data: ArrayBuffer | Uint8Array,
    contentType: string,
): Promise<void> {
    const bytes: ArrayBuffer = data instanceof Uint8Array
        ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
        : data;
    if (env.MEDIA) {
        await env.MEDIA.put(key, bytes, { httpMetadata: { contentType } });
        return;
    }
    if (!env.MEDIA_KV) throw new Error('No media storage binding is configured');

    const etag = bytesToHex(await crypto.subtle.digest('SHA-256', bytes));
    await Promise.all([
        env.MEDIA_KV.put(`${KV_MEDIA_PREFIX}${key}`, bytes),
        env.MEDIA_KV.put(
            `${KV_MEDIA_PREFIX}${key}:metadata`,
            JSON.stringify({ contentType, etag }),
        ),
    ]);
}

export async function getMedia(env: Env, key: string): Promise<StoredMedia | null> {
    if (env.MEDIA) {
        const object = await env.MEDIA.get(key);
        if (object) {
            return {
                body: object.body,
                contentType: object.httpMetadata?.contentType || 'application/octet-stream',
                etag: object.httpEtag,
            };
        }
    }
    if (!env.MEDIA_KV) return null;

    const [body, metadataRaw] = await Promise.all([
        env.MEDIA_KV.get(`${KV_MEDIA_PREFIX}${key}`, 'arrayBuffer'),
        env.MEDIA_KV.get(`${KV_MEDIA_PREFIX}${key}:metadata`),
    ]);
    if (!body) return null;
    let metadata: { contentType?: string; etag?: string } = {};
    try { metadata = metadataRaw ? JSON.parse(metadataRaw) : {}; } catch { /* use safe defaults */ }
    return {
        body,
        contentType: metadata.contentType || 'application/octet-stream',
        etag: metadata.etag || bytesToHex(await crypto.subtle.digest('SHA-256', body)),
    };
}

export async function deleteMedia(env: Env, key: string): Promise<void> {
    if (env.MEDIA) await env.MEDIA.delete(key);
    if (env.MEDIA_KV) {
        await Promise.all([
            env.MEDIA_KV.delete(`${KV_MEDIA_PREFIX}${key}`),
            env.MEDIA_KV.delete(`${KV_MEDIA_PREFIX}${key}:metadata`),
        ]);
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Upload Image to R2
// ───────────────────────────────────────────────────────────────────────────────
// Detect the real image type from magic bytes. Callers historically passed
// 'image/png' for Workers AI output that is actually JPEG; with nosniff set
// globally, browsers refuse to decode a mismatched declared type.
function sniffImageType(data: ArrayBuffer | Uint8Array): string | null {
    const b = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (b.length < 12) return null;
    if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg';
    if (b[0] === 0x89 && b[1] === 0x50) return 'image/png';
    if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return 'image/webp';
    return null;
}

export async function uploadImage(
    env: Env,
    key: string,
    data: ArrayBuffer | Uint8Array,
    contentType: string = 'image/jpeg'
): Promise<string> {
    try {
        await putMedia(env, key, data, sniffImageType(data) || contentType);

        // Return an ABSOLUTE URL to this worker's /assets route so the Pages
        // frontend (a different origin) can load the image. Falls back to a
        // relative path if PUBLIC_API_URL isn't configured.
        const base = ((env as Record<string, any>).PUBLIC_API_URL || '').replace(/\/$/, '');
        return base ? `${base}/assets/${key}` : `/assets/${key}`;
    } catch (error) {
        console.error(`Failed to upload image ${key}:`, error);
        throw error;
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Public URL
// ───────────────────────────────────────────────────────────────────────────────
export function getPublicUrl(key: string): string {
    return `/assets/${key}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Hero variants
//
// Generated heroes are 1024² (~170KB JPEG) but phones display them at ~390px —
// most of the LCP budget on article pages. A 768w JPEG variant (~60KB) is
// stored next to the original as `hero_768.jpg`; the /assets route serves it
// for `?w=768` requests and falls back to the original if it doesn't exist.
// ───────────────────────────────────────────────────────────────────────────────

export const HERO_VARIANT_WIDTH = 768;

/** Resize image bytes to a 768w JPEG using photon (wasm). Returns null on any failure. */
export async function makeHeroVariant(data: ArrayBuffer | Uint8Array): Promise<Uint8Array | null> {
    try {
        const { PhotonImage, resize, SamplingFilter } = await import('@cf-wasm/photon');
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        const img = PhotonImage.new_from_byteslice(bytes);
        try {
            const w = img.get_width();
            const h = img.get_height();
            if (w <= HERO_VARIANT_WIDTH) return null; // already small enough
            const nh = Math.round((h * HERO_VARIANT_WIDTH) / w);
            const resized = resize(img, HERO_VARIANT_WIDTH, nh, SamplingFilter.Lanczos3);
            try {
                // q62: photon's encoder is conservative — q75 was only ~14%
                // smaller than the 1024² original. These are soft AI images
                // shown under a gradient scrim; q62 reads identically.
                return resized.get_bytes_jpeg(62);
            } finally {
                resized.free();
            }
        } finally {
            img.free();
        }
    } catch (err) {
        console.error('[media] hero variant resize failed:', err);
        return null;
    }
}

/** Variant R2 key for a hero key, e.g. articles/{id}/hero.png → articles/{id}/hero_768.jpg */
export function heroVariantKey(key: string): string {
    return key.replace(/\/[^/]+$/, '/hero_768.jpg');
}

/**
 * Upload an article hero plus its 768w variant. Returns the public URL of the
 * original (the variant is addressed via ?w=768 on the same URL).
 */
export async function uploadArticleHero(
    env: Env,
    articleId: string,
    data: ArrayBuffer | Uint8Array
): Promise<string> {
    const key = `articles/${articleId}/hero.png`;
    const url = await uploadImage(env, key, data, 'image/png');
    const variant = await makeHeroVariant(data);
    if (variant) {
        await uploadImage(env, heroVariantKey(key), variant, 'image/jpeg');
    }
    return url;
}
