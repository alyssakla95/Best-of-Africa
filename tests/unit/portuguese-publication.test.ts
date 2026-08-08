import { describe, expect, it } from 'vitest';
import { normalisePortuguesePortugal1945, portugueseSectorName } from '../../src/lib/portuguese';
import { localizeArticleList } from '../../src/routes/articles';
import type { Env } from '../../src/types';

describe('Portuguese publication locale', () => {
    it('normalises Brazilian and post-1990 forms before serving stored copy', () => {
        expect(normalisePortuguesePortugal1945(
            'A diretora atualizada apresentou ações do setor econômico em uma infraestrutura de trilhões, com demanda dos usuários.',
        )).toBe(
            'A directora actualizada apresentou acções do sector económico numa infra-estrutura de biliões, com procura dos utilizadores.',
        );
    });

    it('preserves empty optional publication fields', () => {
        expect(normalisePortuguesePortugal1945(null)).toBeNull();
        expect(normalisePortuguesePortugal1945('')).toBe('');
    });

    it('covers every sector name returned by current market datasets', () => {
        expect(portugueseSectorName('Manufacturing & Industry')).toBe('Indústria transformadora e indústria');
    });

    it('serves an existing Portuguese record instead of forcing article lists back to English', async () => {
        const statement = {
            bind: () => statement,
            all: async () => ({ results: [{
                article_id: 'article-1',
                title: 'A diretora atual e o setor econômico',
                subtitle: 'Em uma infraestrutura',
                summary: 'A demanda dos usuários.',
            }] }),
        };
        const env = { DB: { prepare: () => statement } } as unknown as Env;
        const [article] = await localizeArticleList(env, [{ id: 'article-1', title: 'English title' }], 'pt');

        expect(article).toMatchObject({
            title: 'A directora actual e o sector económico',
            subtitle: 'Numa infra-estrutura',
            summary: 'A procura dos utilizadores.',
            title_language: 'pt',
        });
    });

    it('does not mix untranslated English cards into Portuguese article lists', async () => {
        const statement = {
            bind: () => statement,
            all: async () => ({ results: [] }),
        };
        const env = { DB: { prepare: () => statement } } as unknown as Env;
        const rows = [{ id: 'article-without-portuguese', title: 'English title' }];

        expect(await localizeArticleList(env, rows, 'pt')).toEqual([]);
        expect(await localizeArticleList(env, rows, 'en')).toEqual(rows);
    });

    it('requests Portuguese content from every reader endpoint', async () => {
        const fs = await import('node:fs/promises');
        const source = await fs.readFile('frontend/src/services/api.ts', 'utf8');
        const articleRoute = await fs.readFile('src/routes/articles.ts', 'utf8');
        const outlookRoute = await fs.readFile('src/routes/market-intel.ts', 'utf8');
        expect(source).toContain("['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(language)");
        expect(source).toContain("['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(lang)");
        expect(source).toContain('const localizedEndpoint = withReaderLanguage(endpoint)');
        expect(source).toContain("if (!params.has('lang')) params.set('lang', getReaderLanguage())");
        expect(source).toContain("search: (query: string) => readerRequest");
        expect(source).toContain("getCountryNarrative: (code: string) => readerRequest");
        expect(source).toContain('/outlook?lang=${getReaderLanguage()}');
        expect(articleRoute).toContain("articleContext(article.id)}:pt-PT-1945:v1");
        expect(articleRoute).toContain("Write every human-readable JSON value in natural European Portuguese from Portugal");
        expect(articleRoute).toContain("...(aiContext ? { ai_context: aiContext } : {})");
        expect(articleRoute).not.toContain("aiContext && reqLang !== 'pt'");
        expect(outlookRoute).toContain('zero registos publicados na janela documental');
    });
});
