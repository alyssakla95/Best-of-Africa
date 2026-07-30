import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { articlesRouter } from '../../src/routes/articles';
import type { Env } from '../../src/types';

const ARTICLE_ID = '11111111-1111-4111-8111-111111111111';

function mediaKV(): KVNamespace {
    const store = new Map<string, unknown>();
    return {
        get: vi.fn(async (key: string, type?: string) => {
            const value = store.get(key);
            if (value === undefined) return null;
            if (type === 'arrayBuffer') return value;
            return value;
        }),
        put: vi.fn(async (key: string, value: unknown) => { store.set(key, value); }),
        delete: vi.fn(async (key: string) => { store.delete(key); }),
    } as unknown as KVNamespace;
}

function envFor(heroImageUrl: string | null): Env {
    const statement = {
        bind: vi.fn(() => statement),
        first: vi.fn(async () => heroImageUrl ? {
            hero_image_url: heroImageUrl,
            image_source_url: 'https://publisher.example/report',
        } : null),
    };
    return {
        DB: { prepare: vi.fn(() => statement) } as unknown as D1Database,
        MEDIA_KV: mediaKV(),
    } as Env;
}

describe('publisher image cache', () => {
    let app: Hono;

    beforeEach(() => {
        app = new Hono();
        app.route('/', articlesRouter);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('stores a successful publisher image and serves the second request without refetching', async () => {
        const upstream = vi.fn(async (_url: URL, init?: RequestInit) => {
            expect(new Headers(init?.headers).get('referer')).toBe('https://publisher.example/report');
            return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
                headers: { 'Content-Type': 'image/jpeg', 'Content-Length': '4' },
            });
        });
        vi.stubGlobal('fetch', upstream);
        const env = envFor('https://cdn.publisher.example/story.jpg');

        const first = await app.fetch(new Request(`http://localhost/${ARTICLE_ID}/image`), env);
        const second = await app.fetch(new Request(`http://localhost/${ARTICLE_ID}/image`), env);

        expect(first.status).toBe(200);
        expect(first.headers.get('content-type')).toBe('image/jpeg');
        expect(first.headers.get('cache-control')).toContain('stale-while-revalidate');
        expect(first.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
        expect(second.status).toBe(200);
        expect(upstream).toHaveBeenCalledTimes(1);
    });

    it('never makes a publisher failure cacheable', async () => {
        const upstream = vi.fn(async () => new Response('forbidden', { status: 403 }));
        vi.stubGlobal('fetch', upstream);
        const env = envFor('https://publisher.example/blocked.jpg');

        const first = await app.fetch(new Request(`http://localhost/${ARTICLE_ID}/image`), env);
        const second = await app.fetch(new Request(`http://localhost/${ARTICLE_ID}/image`), env);

        expect(first.status).toBe(502);
        expect(first.headers.get('cache-control')).toBe('no-store');
        expect(second.status).toBe(502);
        expect(upstream).toHaveBeenCalledTimes(2);
    });

    it('rejects missing and non-HTTPS image records without an upstream request', async () => {
        const upstream = vi.fn();
        vi.stubGlobal('fetch', upstream);

        const missing = await app.fetch(new Request(`http://localhost/${ARTICLE_ID}/image`), envFor(null));
        const insecure = await app.fetch(
            new Request(`http://localhost/${ARTICLE_ID}/image`),
            envFor('http://publisher.example/story.jpg'),
        );

        expect(missing.status).toBe(404);
        expect(insecure.status).toBe(404);
        expect(missing.headers.get('cache-control')).toBe('no-store');
        expect(upstream).not.toHaveBeenCalled();
    });
});
