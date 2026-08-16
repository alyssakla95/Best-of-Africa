import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { parseTranslationBatch } from '../../src/routes/translation';
import { translationRouter } from '../../src/routes/translation';
import { autoTranslateArticle, isReaderTranslationLanguage, LANGUAGE_CONFIG, parseLongTranslationBatch, READER_TRANSLATION_LANGUAGES, translateLongText } from '../../src/lib/translate';
import { createMockEnv } from '../mocks/env';
import { PUBLIC_INTERFACE_COPY as workerInterfaceCopy } from '../../src/lib/interface-copy';
import { PUBLIC_INTERFACE_COPY as browserInterfaceCopy } from '../../frontend/src/i18n/interface-copy';
import { translateWithGoogleCloud } from '../../src/lib/google-translate';

afterEach(() => vi.unstubAllGlobals());

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

    it('keeps the browser request catalogue identical to the Worker allow-list', () => {
        expect(browserInterfaceCopy).toEqual(workerInterfaceCopy);
    });

    it('uses Google Cloud Translation for allow-listed public interface keys', async () => {
        const externalFetch = vi.fn(async () => new Response(JSON.stringify({
            data: { translations: [{ translatedText: 'Lesen' }, { translatedText: 'Märkte &amp; Daten' }] },
        }), { headers: { 'Content-Type': 'application/json' } }));
        vi.stubGlobal('fetch', externalFetch);
        const env = createMockEnv({
            GOOGLE_TRANSLATE_API_KEY: 'test-google-key',
            AI: { run: vi.fn(async () => { throw new Error('Workers fallback should not run'); }) } as unknown as Ai,
        });
        const app = new Hono<{ Bindings: typeof env }>();
        app.route('/translate', translationRouter);

        const response = await app.fetch(new Request('http://localhost/translate/interface', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                language: 'de',
                keys: ['journey.read.label', 'journey.markets.description'],
            }),
        }), env);

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            keys: ['journey.read.label', 'journey.markets.description'],
            translations: ['Lesen', 'Märkte & Daten'],
        });
        expect(externalFetch).toHaveBeenCalledOnce();
        const [url, init] = externalFetch.mock.calls[0];
        expect(String(url)).toContain('translation.googleapis.com/language/translate/v2');
        expect(JSON.parse(String(init?.body))).toEqual({
            q: ['Read', 'Compare countries, sectors and continental market evidence.'],
            source: 'en',
            target: 'de',
            format: 'text',
            model: 'nmt',
        });
    });

    it('rejects unknown interface keys before contacting an external provider', async () => {
        const externalFetch = vi.fn();
        vi.stubGlobal('fetch', externalFetch);
        const env = createMockEnv({ GOOGLE_TRANSLATE_API_KEY: 'test-google-key' });
        const app = new Hono<{ Bindings: typeof env }>();
        app.route('/translate', translationRouter);

        const response = await app.fetch(new Request('http://localhost/translate/interface', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'fr', keys: ['private.user.text'] }),
        }), env);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'unsupported_interface_key' });
        expect(externalFetch).not.toHaveBeenCalled();
    });

    it('parses a complete long-form translation batch and rejects a partial one', () => {
        expect(parseLongTranslationBatch('{"translations":["Eins","Zwei"]}', 2)).toEqual(['Eins', 'Zwei']);
        expect(parseLongTranslationBatch('{"translations":["Eins"]}', 2)).toBeNull();
    });

    it('covers every language offered by the application', () => {
        expect(Object.keys(LANGUAGE_CONFIG).sort()).toEqual(['ar', 'de', 'en', 'fr', 'hi', 'pt', 'zh']);
    });

    it('uses one reader-locale allow-list for both queue producers and consumers', () => {
        expect(READER_TRANSLATION_LANGUAGES).toEqual(['pt', 'fr', 'ar', 'de', 'hi', 'zh']);
        expect(isReaderTranslationLanguage('pt')).toBe(true);
        expect(isReaderTranslationLanguage('en')).toBe(false);
        expect(isReaderTranslationLanguage('')).toBe(false);
    });

    it('queues quality-gated full-article translations for every reader locale', async () => {
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

    it('repairs a singleton translation when the model cannot format JSON', async () => {
        let calls = 0;
        const source = `English infrastructure evidence ${'documents a complete market observation. '.repeat(30)}`;
        const translated = source.replace('English', 'Français');
        const env = createMockEnv({
            AI: {
                run: async (_model: string, options: { messages: Array<{ content: string }> }) => {
                    calls++;
                    const system = options.messages[0].content;
                    return system.includes('no JSON wrapper')
                        ? { response: translated }
                        : { response: 'not valid JSON' };
                },
            } as unknown as Ai,
        });

        const result = await translateLongText(env, source, 'fr');

        expect(calls).toBe(2);
        expect(result).toBe(translated.trim());
    });

    it('uses Google first for public non-Portuguese article bodies', async () => {
        const source = `English evidence ${'documents a complete market observation. '.repeat(30)}`;
        const translated = source.replace('English', 'French');
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
            data: { translations: [{ translatedText: translated }] },
        }))));
        const run = vi.fn();
        const env = createMockEnv({ GOOGLE_TRANSLATE_API_KEY: 'key', AI: { run } as unknown as Ai });
        await expect(translateLongText(env, source, 'fr')).resolves.toBe(translated.trim());
        expect(run).not.toHaveBeenCalled();
    });

    it('batches long public translations within Google request limits', async () => {
        const texts = ['a'.repeat(12_000), 'b'.repeat(12_000)];
        const externalFetch = vi.fn(async (_url, init?: RequestInit) => {
            const q = JSON.parse(String(init?.body)).q as string[];
            return new Response(JSON.stringify({ data: { translations: q.map(translatedText => ({ translatedText })) } }));
        });
        vi.stubGlobal('fetch', externalFetch);
        const env = createMockEnv({ GOOGLE_TRANSLATE_API_KEY: 'key' });
        await expect(translateWithGoogleCloud(env, texts, 'de')).resolves.toEqual(texts);
        expect(externalFetch).toHaveBeenCalledTimes(2);
    });

    it('normalises long-form Portuguese output to the pre-1990 Portugal locale before storage', async () => {
        const source = 'The current sector defined a project and objective for economic activity.';
        const externalFetch = vi.fn();
        vi.stubGlobal('fetch', externalFetch);
        const env = createMockEnv({
            GOOGLE_TRANSLATE_API_KEY: 'key',
            AI: {
                run: async () => ({
                    response: JSON.stringify({
                        translations: ['O setor atual definiu um projeto e objetivo para a atividade econômica.'],
                    }),
                }),
            } as unknown as Ai,
        });

        await expect(translateLongText(env, source, 'pt')).resolves.toBe(
            'O sector actual definiu um projecto e objectivo para a actividade económica.',
        );
        expect(externalFetch).not.toHaveBeenCalled();
    });
});
