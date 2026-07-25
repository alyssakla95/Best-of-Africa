import { describe, expect, it } from 'vitest';
import { parseTranslationBatch } from '../../src/routes/translation';
import { autoTranslateArticle, LANGUAGE_CONFIG, parseLongTranslationBatch, translateLongText } from '../../src/lib/translate';
import { createMockEnv } from '../mocks/env';

describe('publication-quality translation batches', () => {
    it('accepts a complete ordered translation payload', () => {
        expect(parseTranslationBatch(
            '{"translations":["Premier texte","Deuxième texte"]}',
            2,
        )).toEqual(['Premier texte', 'Deuxième texte']);
    });

    it('accepts a fenced payload without exposing the fence', () => {
        expect(parseTranslationBatch(
            '```json\n{"translations":["Olá"]}\n```',
            1,
        )).toEqual(['Olá']);
    });

    it('rejects partial batches so strings cannot silently disappear', () => {
        expect(parseTranslationBatch('{"translations":["Nur eins"]}', 2)).toBeNull();
    });

    it('parses a complete long-form translation batch and rejects a partial one', () => {
        expect(parseLongTranslationBatch('{"translations":["Eins","Zwei"]}', 2)).toEqual(['Eins', 'Zwei']);
        expect(parseLongTranslationBatch('{"translations":["Eins"]}', 2)).toBeNull();
    });

    it('covers every language offered by the application', () => {
        expect(Object.keys(LANGUAGE_CONFIG).sort()).toEqual(['ar', 'de', 'en', 'fr', 'hi', 'pt', 'zh']);
    });

    it('queues complete full-article translations for every reader locale', async () => {
        const queued: Array<Record<string, unknown>> = [];
        const env = createMockEnv({
            TRANSLATION_QUEUE: {
                send: async (message: Record<string, unknown>) => {
                    queued.push(message);
                },
            } as unknown as Queue,
        });

        await autoTranslateArticle(env, 'article-1', {
            title: 'A title',
            subtitle: 'A subtitle',
            summary: 'A summary',
            content: 'The complete article body.',
        });

        expect(queued).toHaveLength(6);
        expect(queued.every((message) => message.type === 'article_translation')).toBe(true);
        expect(queued.map((message) => message.language).sort()).toEqual(['ar', 'de', 'fr', 'hi', 'pt', 'zh']);
        expect(queued.every((message) => message.articleId === 'article-1')).toBe(true);
    });

    it('splits a malformed large translation batch and preserves every chunk', async () => {
        let calls = 0;
        const env = createMockEnv({
            AI: {
                run: async (_model: string, options: { messages: Array<{ content: string }> }) => {
                    calls++;
                    const inputs = JSON.parse(options.messages[1].content) as Array<{ text: string }>;
                    if (inputs.length > 1) return { response: '{"translations":["partial"]}' };
                    return { response: JSON.stringify({ translations: [inputs[0].text.replace('English', 'Français')] }) };
                },
            } as unknown as Ai,
        });
        const source = [
            `English market evidence ${'supports a complete translated paragraph. '.repeat(45)}`,
            `English trade evidence ${'supports another complete translated paragraph. '.repeat(45)}`,
        ].join('\n\n');

        const result = await translateLongText(env, source, 'fr');

        expect(calls).toBeGreaterThan(2);
        expect(result).toContain('Français market evidence');
        expect(result).toContain('Français trade evidence');
    });
});
