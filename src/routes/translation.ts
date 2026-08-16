import { Hono } from 'hono';
import type { Env } from '../types';
import { extractAIText, MODELS } from '../lib/ai';
import { throttle } from '../lib/ratelimit';
import { PUBLIC_INTERFACE_COPY, type PublicInterfaceCopyKey } from '../lib/interface-copy';

const router = new Hono<{ Bindings: Env }>();
// Portuguese is a code-owned editorial locale. It is intentionally excluded
// from this generated interface-copy endpoint.
const TARGETS = new Set(['fr', 'ar', 'de', 'hi', 'zh']);
const LANGUAGE_NAMES: Record<string, string> = {
    fr: 'French', ar: 'Modern Standard Arabic',
    de: 'German', hi: 'Hindi', zh: 'Simplified Chinese',
};

export function parseTranslationBatch(raw: string, expected: number): string[] | null {
    const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
        const parsed = JSON.parse(clean.slice(start, end + 1));
        const translations: unknown[] | null = Array.isArray(parsed?.translations) ? parsed.translations : null;
        if (!translations || translations.length !== expected || translations.some((value: unknown) => typeof value !== 'string' || !value.trim())) return null;
        return (translations as string[]).map((value: string) => value.trim());
    } catch {
        return null;
    }
}

async function translateWithPrimaryModel(env: Env, language: string, texts: string[]): Promise<string[] | null> {
    const numbered = texts.map((text, index) => ({ id: index, text }));
    const response = await (env.AI as Record<string, any>).run(MODELS.TEXT_GENERATION, {
        messages: [
            {
                role: 'system',
                content: `Translate every supplied interface or editorial string from English into ${LANGUAGE_NAMES[language]}. Use natural, publication-quality language appropriate for an African news and intelligence platform. Preserve names, dates, numbers, URLs, punctuation, list markers and meaning. Never summarize, omit, explain or add commentary. Return only JSON in exactly this shape: {"translations":["first translation","second translation"]}, preserving input order and count.`,
            },
            { role: 'user', content: JSON.stringify(numbered) },
        ],
        max_tokens: 6000,
        temperature: 0.1,
    });
    return parseTranslationBatch(extractAIText(response), texts.length);
}

function decodeGoogleText(value: string): string {
    return value
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

async function translateWithGoogleCloud(env: Env, language: string, texts: string[]): Promise<string[] | null> {
    if (!env.GOOGLE_TRANSLATE_API_KEY) return null;
    const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(env.GOOGLE_TRANSLATE_API_KEY)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ q: texts, source: 'en', target: language, format: 'text', model: 'nmt' }),
        },
    );
    if (!response.ok) {
        throw new Error(`Google Cloud Translation returned ${response.status}: ${(await response.text()).slice(0, 240)}`);
    }
    const body = await response.json<{
        data?: { translations?: Array<{ translatedText?: string }> };
    }>();
    const translated = body.data?.translations;
    if (!translated || translated.length !== texts.length || translated.some(item => !item.translatedText?.trim())) return null;
    return translated.map(item => decodeGoogleText(item.translatedText!.trim()));
}

async function translateWithFallback(env: Env, language: string, text: string): Promise<string> {
    const result = await (env.AI as Record<string, any>).run('@cf/meta/m2m100-1.2b', {
        text, source_lang: 'en', target_lang: language,
    });
    return String(result?.translated_text || text).trim() || text;
}

router.post('/interface', async c => {
    const limited = await throttle(c, 'translate-interface');
    if (limited) return limited;
    const body: { language?: string; keys?: unknown[] } = await c.req.json<{ language?: string; keys?: unknown[] }>().catch(() => ({}));
    const language = body.language || '';
    if (!TARGETS.has(language)) return c.json({ error: 'unsupported_language' }, 400);

    const requestedKeys = (Array.isArray(body.keys) ? body.keys : [])
        .filter((value): value is string => typeof value === 'string')
        .map(value => value.trim())
        .filter(Boolean)
        .slice(0, 24);
    if (requestedKeys.some(key => !(key in PUBLIC_INTERFACE_COPY))) {
        return c.json({ error: 'unsupported_interface_key' }, 400);
    }
    const keys = requestedKeys as PublicInterfaceCopyKey[];
    const texts = keys.map(key => PUBLIC_INTERFACE_COPY[key]);
    if (!texts.length) return c.json({ translations: [] });

    const cacheKeys = await Promise.all(texts.map(async text => `ui-translation:v3:${language}:${await hash(text)}`));
    const translations = await Promise.all(cacheKeys.map(key => c.env.CACHE.get(key)));
    const missingIndexes = translations.map((value, index) => value ? -1 : index).filter(index => index >= 0);

    if (missingIndexes.length) {
        const missingTexts = missingIndexes.map(index => texts[index]);
        let primary: string[] | null = null;
        if (c.env.GOOGLE_TRANSLATE_API_KEY) {
            try {
                primary = await translateWithGoogleCloud(c.env, language, missingTexts);
                if (!primary) throw new Error('Google Cloud Translation returned an invalid batch');
            } catch (error) {
                console.error(`[interface-translation] Google Cloud en -> ${language} failed`, error);
            }
        }
        if (!primary) {
            try {
                primary = await translateWithPrimaryModel(c.env, language, missingTexts);
                if (!primary) throw new Error('Workers primary translation returned an invalid batch');
            } catch (error) {
                console.error(`[interface-translation] Workers primary en -> ${language} failed`, error);
            }
        }
        if (primary) {
            await Promise.all(primary.map(async (translated, offset) => {
                const index = missingIndexes[offset];
                translations[index] = translated;
                await c.env.CACHE.put(cacheKeys[index], translated, { expirationTtl: 60 * 60 * 24 * 90 });
            }));
        } else {
            await Promise.all(missingIndexes.map(async index => {
                try {
                    const translated = await translateWithFallback(c.env, language, texts[index]);
                    translations[index] = translated;
                    await c.env.CACHE.put(cacheKeys[index], translated, { expirationTtl: 60 * 60 * 24 * 30 });
                } catch (fallbackError) {
                    console.error(`[interface-translation] fallback en -> ${language} failed`, fallbackError);
                    translations[index] = texts[index];
                }
            }));
        }
    }

    return c.json({ keys, translations: translations.map((value, index) => value || texts[index]) });
});

async function hash(value: string) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(bytes)).slice(0, 12).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export { router as translationRouter };
