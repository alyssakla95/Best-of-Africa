// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION QUEUE RETRY SEMANTICS — regression tests
//
// processArticleTranslationJob must distinguish terminal quality failures from
// transient infrastructure failures: a model gate refusal (title/body/count or
// invalid output) is a poison message for THAT article, so after the queue has
// retried, the job stores a quality=-1 row holding the English source fields
// (a reader no-op that stops re-queueing) and resolves instead of throwing.
// Transient failures keep throwing so the queue retries them.
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { processArticleTranslationJob } from '../../src/lib/translate';
import type { Env } from '../../src/types';

// failBuild simulates a model outage (transient); invalidBuild simulates the
// model answering with unusable output (quality refusal).
interface TranslationRow {
    article_id: string;
    language: string;
    title: string;
    quality: number;
}

function createJobEnv(options: {
    article?: { title: string; subtitle: string | null; summary: string | null; content: string } | null;
    statusPhase?: string;
    failBuild?: boolean;
    invalidBuild?: boolean;
}) {
    const translations: TranslationRow[] = [];
    const cache = new Map<string, string>();
    if (options.statusPhase) {
        cache.set(
            'translation:status:v1:article-1:fr',
            JSON.stringify({ phase: options.statusPhase, updatedAt: new Date().toISOString() }),
        );
    }

    const db = {
        prepare(sql: string) {
            return {
                bind(...args: unknown[]) {
                    return {
                        async first() {
                            if (sql.includes('FROM articles')) return options.article ?? null;
                            return null;
                        },
                        async run() {
                            if (sql.includes('INSERT OR REPLACE INTO article_translations')) {
                                translations.push({
                                    article_id: String(args[1]),
                                    language: String(args[2]),
                                    title: String(args[3]),
                                    // The terminal path binds 7 values and
                                    // hardcodes quality -1 in the SQL.
                                    quality: sql.includes(', -1,') ? -1 : Number(args[7]),
                                });
                            }
                            return { success: true };
                        },
                    };
                },
            };
        },
    };

    const env = {
        DB: db,
        CACHE: {
            get: async (key: string) => cache.get(key) ?? null,
            put: async (key: string, value: string) => { cache.set(key, value); },
            delete: async (key: string) => { cache.delete(key); },
        },
        AI: {
            run: async () => {
                if (options.failBuild) throw new Error('model unavailable');
                if (options.invalidBuild) return { response: 'this is not the requested JSON batch' };
                return { response: '{"translations":["Bonjour le monde"]}' };
            },
        },
    } as unknown as Env;

    return { env, translations };
}

const ARTICLE = {
    title: 'Kenya signs regional energy compact',
    subtitle: null,
    summary: null,
    content: 'Kenya signed a regional energy compact with neighbours on Tuesday.',
};

describe('translation queue retry semantics', () => {
    it('treats a withdrawn article as a terminal no-op', async () => {
        const { env, translations } = createJobEnv({ article: null });
        await processArticleTranslationJob(env, { type: 'article_translation', articleId: 'article-1', language: 'fr' }, 1);
        expect(translations).toHaveLength(0);
    });

    it('throws on a first-attempt quality refusal so the queue retries', async () => {
        const { env } = createJobEnv({ article: ARTICLE, invalidBuild: true });
        await expect(
            processArticleTranslationJob(env, { type: 'article_translation', articleId: 'article-1', language: 'fr' }, 1),
        ).rejects.toThrow('Translation incomplete');
    });

    it('marks a persistent quality refusal as terminal quality=-1 instead of retrying forever', async () => {
        const { env, translations } = createJobEnv({ article: ARTICLE, invalidBuild: true });
        await processArticleTranslationJob(env, { type: 'article_translation', articleId: 'article-1', language: 'fr' }, 3);
        expect(translations).toHaveLength(1);
        expect(translations[0].quality).toBe(-1);
        // The refusal row must hold the English source fields so the reader
        // overlay treats it as a no-op rather than a degenerate translation.
        expect(translations[0].title).toBe(ARTICLE.title);
    });

    it('keeps throwing for transient model outages, never turning them terminal', async () => {
        const { env, translations } = createJobEnv({ article: ARTICLE, failBuild: true });
        await expect(
            processArticleTranslationJob(env, { type: 'article_translation', articleId: 'article-1', language: 'fr' }, 4),
        ).rejects.toThrow('Translation incomplete');
        expect(translations).toHaveLength(0);
    });
});
