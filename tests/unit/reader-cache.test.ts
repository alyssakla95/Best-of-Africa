import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCached, getCachedValue } from '../../src/lib/cache';
import { createMockEnv } from '../mocks/env';

describe('instant reader cache', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('peeks at a generated server value without invoking its producer', async () => {
        const env = createMockEnv();
        const producer = vi.fn(async () => ({ finding: 'stored evidence' }));
        await getCached(env, 'article:brief', producer, { ttl: 60 });

        expect(await getCachedValue(env, 'article:brief')).toEqual({ finding: 'stored evidence' });
        expect(producer).toHaveBeenCalledTimes(1);
        expect(await getCachedValue(env, 'missing')).toBeNull();
    });

    it('does not expose an expired generated value as current', async () => {
        const env = createMockEnv();
        await env.CACHE.put('cache:expired', JSON.stringify({
            data: { finding: 'old evidence' },
            timestamp: Math.floor(Date.now() / 1000) - 120,
            ttl: 60,
        }));

        expect(await getCachedValue(env, 'expired')).toBeNull();
    });

    it('returns saved browser data immediately and refreshes it in the background', async () => {
        const entries = new Map<string, Response>();
        const openedCaches: string[] = [];
        const cache = {
            match: async (request: Request) => entries.get(request.url)?.clone(),
            put: async (request: Request, response: Response) => { entries.set(request.url, response.clone()); },
        };
        vi.stubGlobal('window', {
            location: { origin: 'https://boa.example' },
            caches: { open: async (name: string) => { openedCaches.push(name); return cache; }, delete: async () => true },
        });
        const { readThroughCache } = await import('../../frontend/src/lib/persistentQueryCache');

        await expect(readThroughCache('article:ghana', async () => ({ title: 'Stored edition' })))
            .resolves.toEqual({ title: 'Stored edition' });

        const refresh = vi.fn(async () => ({ title: 'Fresh edition' }));
        await expect(readThroughCache('article:ghana', refresh))
            .resolves.toEqual({ title: 'Stored edition' });
        expect(refresh).toHaveBeenCalledOnce();
        expect(openedCaches).toEqual(expect.arrayContaining(['boa-reader-data-v3']));
    });

    it('makes the service worker remove obsolete reader-data caches', async () => {
        const source = await import('node:fs/promises').then(fs => fs.readFile('frontend/public/sw.js', 'utf8'));
        expect(source).toContain("const CACHE_NAME = 'boa-shell-v5'");
        expect(source).toContain("name.startsWith('boa-reader-data-')");
        expect(source).toContain("const READER_CACHE_NAME = 'boa-reader-data-v3'");
        expect(source).toContain('client.navigate(client.url)');
    });
});
