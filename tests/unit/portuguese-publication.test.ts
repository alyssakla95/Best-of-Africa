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

    it('requests Portuguese content from reader endpoints while keeping generation disabled', async () => {
        const source = await import('node:fs/promises').then(fs => fs.readFile('frontend/src/services/api.ts', 'utf8'));
        expect(source).toContain("['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(language)");
        expect(source).toContain("['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(lang)");
    });
});
