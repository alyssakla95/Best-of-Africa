import { describe, expect, it } from 'vitest';
import { normalisePortuguesePortugal1945 } from '../../src/lib/portuguese';
import { localizeArticleList } from '../../src/routes/articles';
import type { Env } from '../../src/types';

describe('Portuguese publication locale', () => {
    it('normalises Brazilian and post-1990 forms before serving stored copy', () => {
        expect(normalisePortuguesePortugal1945(
            'A diretora atual apresentou ações do setor econômico em uma infraestrutura de trilhões, com demanda dos usuários.',
        )).toBe(
            'A directora actual apresentou acções do sector económico numa infra-estrutura de biliões, com procura dos utilizadores.',
        );
    });

    it('preserves empty optional publication fields', () => {
        expect(normalisePortuguesePortugal1945(null)).toBeNull();
        expect(normalisePortuguesePortugal1945('')).toBe('');
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

    it('requests Portuguese content from reader endpoints while keeping generation disabled', async () => {
        const fs = await import('node:fs/promises');
        const source = await fs.readFile('frontend/src/services/api.ts', 'utf8');
        const articleRoute = await fs.readFile('src/routes/articles.ts', 'utf8');
        const outlookRoute = await fs.readFile('src/routes/market-intel.ts', 'utf8');
        expect(source).toContain("['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(language)");
        expect(source).toContain("['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(lang)");
        expect(source).toContain('/outlook?lang=${getReaderLanguage()}');
        expect(articleRoute).toContain("aiContext && reqLang !== 'pt'");
        expect(outlookRoute).toContain('zero registos publicados na janela documental');
    });
});
