import { afterEach, describe, expect, it, vi } from 'vitest';
import { backfillGoogleLegacyTranslations } from '../../src/lib/translate';
import { createMockEnv, createMockKVNamespace } from '../mocks/env';

afterEach(() => vi.unstubAllGlobals());

const article = {
    id: 'article-1', language: 'fr', title: 'Market evidence', subtitle: null,
    summary: null, content: 'Complete public market evidence for a published article.',
};

function refreshDatabase(sql: string[], writes: string[]): D1Database {
    return {
        prepare: (query: string) => {
            sql.push(query);
            const statement = {
                bind: () => statement,
                all: async () => ({
                    results: query.includes('t.created_at < ?') ? [article] : [],
                    success: true,
                }),
                first: async () => query.includes('FROM article_translations')
                    ? { ...article, quality: 1 }
                    : null,
                run: async () => {
                    if (query.includes('INSERT OR REPLACE')) writes.push(query);
                    return { success: true, meta: {} };
                },
            };
            return statement;
        },
    } as unknown as D1Database;
}

describe('Google translation activation refresh', () => {
    it('does nothing until the Google credential is configured', async () => {
        const env = createMockEnv();
        await expect(backfillGoogleLegacyTranslations(env, 2)).resolves.toBe(0);
    });

    it('records activation and replaces pre-activation quality rows through Google', async () => {
        const sql: string[] = [];
        const writes: string[] = [];
        const cache = createMockKVNamespace();
        vi.stubGlobal('fetch', vi.fn(async (_url, init?: RequestInit) => {
            const q = JSON.parse(String(init?.body)).q as string[];
            return new Response(JSON.stringify({
                data: { translations: q.map(translatedText => ({ translatedText })) },
            }));
        }));
        const env = createMockEnv({
            GOOGLE_TRANSLATE_API_KEY: 'configured',
            CACHE: cache,
            DB: refreshDatabase(sql, writes),
        });

        await expect(backfillGoogleLegacyTranslations(env, 1)).resolves.toBe(1);
        expect(await cache.get('translation:google:v1:activated_at')).toBeTruthy();
        expect(writes).toHaveLength(1);
        expect(sql.join(' ')).toContain('t.language');
    });
});
