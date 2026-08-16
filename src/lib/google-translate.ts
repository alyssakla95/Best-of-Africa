import type { Env } from '../types';

export type GoogleTranslationTarget = 'fr' | 'ar' | 'de' | 'hi' | 'zh';

const decodeGoogleText = (value: string) => value.trim().replace(/&amp;/g, '&');

function googleRequest(texts: string[], target: GoogleTranslationTarget): RequestInit {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ q: texts, source: 'en', target, format: 'text', model: 'nmt' }),
    };
}

async function readGoogleResponse(response: Response, expected: number): Promise<string[]> {
    if (!response.ok) throw new Error('Google Cloud Translation returned ' + response.status);
    const body = await response.json<{ data?: { translations?: Array<{ translatedText?: string }> } }>();
    const translated = body.data?.translations;
    if (!translated || translated.length !== expected) {
        throw new Error('Google Cloud Translation returned an invalid batch');
    }
    return translated.map(item => decodeGoogleText(item.translatedText || ''));
}

async function requestGoogle(apiKey: string, texts: string[], target: GoogleTranslationTarget): Promise<string[]> {
    if (texts.reduce((sum, text) => sum + text.length, 0) > 20_000) {
        throw new Error('Google translation batch is too large');
    }
    const response = await fetch(
        'https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(apiKey),
        googleRequest(texts, target),
    );
    return readGoogleResponse(response, texts.length);
}

export async function translateWithGoogleCloud(
    env: Env, texts: string[], target: GoogleTranslationTarget,
): Promise<string[] | null> {
    if (!env.GOOGLE_TRANSLATE_API_KEY || !texts.length) return texts.length ? null : [];
    const output: string[] = [];
    for (let start = 0; start < texts.length;) {
        let end = start;
        let chars = 0;
        while (end < texts.length && chars + texts[end].length <= 20_000) chars += texts[end++].length;
        if (end === start) throw new Error('Google translation segment is too large');
        output.push(...await requestGoogle(env.GOOGLE_TRANSLATE_API_KEY, texts.slice(start, end), target));
        start = end;
    }
    return output;
}
