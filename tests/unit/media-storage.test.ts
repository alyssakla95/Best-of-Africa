import { describe, expect, it, vi } from 'vitest';
import { deleteMedia, getMedia, putMedia } from '../../src/lib/media';
import type { Env } from '../../src/types';

function createTrackingR2() {
    const store = new Map<string, { data: ArrayBuffer; contentType: string }>();
    const bucket = {
        put: vi.fn(async (key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }) => {
            store.set(key, { data: value, contentType: options?.httpMetadata?.contentType || '' });
        }),
        get: vi.fn(async (key: string) => {
            const item = store.get(key);
            if (!item) return null;
            return {
                body: new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(new Uint8Array(item.data));
                        controller.close();
                    },
                }),
                httpMetadata: { contentType: item.contentType },
                httpEtag: `r2-etag-${key}`,
            };
        }),
        delete: vi.fn(async (key: string) => { store.delete(key); }),
    } as unknown as R2Bucket;
    return { store, bucket: bucket as unknown as R2Bucket };
}

function createTrackingKV() {
    const store = new Map<string, unknown>();
    const namespace = {
        get: async (key: string) => store.get(key) ?? null,
        put: async (key: string, value: unknown) => { store.set(key, value); },
        delete: async (key: string) => { store.delete(key); },
    };
    return { store, namespace: namespace as unknown as KVNamespace };
}

const envWith = (parts: Partial<Env>): Env => parts as Env;

describe('portable media storage', () => {
    it('prefers the R2 binding and records the content type', async () => {
        const r2 = createTrackingR2();
        const kv = createTrackingKV();
        const env = envWith({ MEDIA: r2.bucket, MEDIA_KV: kv.namespace });

        await putMedia(env, 'audio/a1.mp3', new TextEncoder().encode('audio-bytes'), 'audio/mpeg');

        expect(r2.bucket.put).toHaveBeenCalledTimes(1);
        expect(kv.store.size).toBe(0);

        const stored = await getMedia(env, 'audio/a1.mp3');
        expect(stored?.contentType).toBe('audio/mpeg');
        expect(stored?.etag).toBe('r2-etag-audio/a1.mp3');
        expect(stored?.body).toBeInstanceOf(ReadableStream);

        await deleteMedia(env, 'audio/a1.mp3');
        expect(r2.store.size).toBe(0);
        expect(kv.store.has('media:v1:audio/a1.mp3')).toBe(false);
        expect(kv.store.has('media:v1:audio/a1.mp3:metadata')).toBe(false);
    });

    it('falls back to KV with a sha-256 etag when R2 is not bound', async () => {
        const kv = createTrackingKV();
        const env = envWith({ MEDIA_KV: kv.namespace });
        const bytes = new TextEncoder().encode('portable image bytes');

        await putMedia(env, 'heroes/h1.jpg', bytes, 'image/jpeg');

        const metadata = JSON.parse(String(kv.store.get('media:v1:heroes/h1.jpg:metadata')));
        expect(metadata.contentType).toBe('image/jpeg');
        expect(metadata.etag).toMatch(/^[0-9a-f]{64}$/);

        const stored = await getMedia(env, 'heroes/h1.jpg');
        expect(stored?.contentType).toBe('image/jpeg');
        expect(stored?.etag).toBe(metadata.etag);
        expect(stored?.body).toBeInstanceOf(ArrayBuffer);
        expect(new TextDecoder().decode(stored?.body as ArrayBuffer)).toBe('portable image bytes');
    });

    it('reads through to KV when the R2 object is missing', async () => {
        const r2 = createTrackingR2();
        const kv = createTrackingKV();
        const env = envWith({ MEDIA: r2.bucket, MEDIA_KV: kv.namespace });

        await putMedia(envWith({ MEDIA_KV: kv.namespace }), 'briefs/ke/2026-07-24.mp3', new Uint8Array([1, 2, 3]), 'audio/mpeg');

        const stored = await getMedia(env, 'briefs/ke/2026-07-24.mp3');
        expect(stored?.contentType).toBe('audio/mpeg');
        expect(stored?.body).toBeInstanceOf(ArrayBuffer);
    });

    it('derives the etag from the bytes when KV metadata is unreadable', async () => {
        const kv = createTrackingKV();
        const env = envWith({ MEDIA_KV: kv.namespace });
        const bytes = new TextEncoder().encode('orphan bytes');
        kv.store.set('media:v1:orphan.bin', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        kv.store.set('media:v1:orphan.bin:metadata', '{not json');

        const stored = await getMedia(env, 'orphan.bin');
        expect(stored?.contentType).toBe('application/octet-stream');
        expect(stored?.etag).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns null for unknown keys and rejects writes without any binding', async () => {
        const kv = createTrackingKV();
        await expect(getMedia(envWith({ MEDIA_KV: kv.namespace }), 'missing.png')).resolves.toBeNull();
        await expect(getMedia(envWith({}), 'missing.png')).resolves.toBeNull();
        await expect(putMedia(envWith({}), 'x.bin', new Uint8Array([0]), 'application/octet-stream'))
            .rejects.toThrow('No media storage binding is configured');
    });
});
