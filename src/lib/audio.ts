import type { Env } from '../types';
import { getCached } from './cache';
import { callConfiguredAI } from './ai';
import { putMedia } from './media';

type TtsProvider = 'elevenlabs' | 'aura-2' | 'aura-1';

function base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function audioBytes(result: unknown): Promise<ArrayBuffer | Uint8Array | null> {
    if (result instanceof ReadableStream) return new Response(result).arrayBuffer();
    if (result instanceof ArrayBuffer) return result;
    if (typeof result === 'string') return base64ToBytes(result);
    if (result && typeof result === 'object' && 'audio' in result) {
        const encoded = (result as { audio?: unknown }).audio;
        if (typeof encoded === 'string') return base64ToBytes(encoded);
    }
    return null;
}

function looksLikeMp3(value: ArrayBuffer | Uint8Array): boolean {
    const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    if (bytes.byteLength < 1024) return false;
    return (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)
        || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
}

export function splitNarrationText(text: string, maxCharacters = 1800): string[] {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return [];
    const sentences = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [normalized];
    const chunks: string[] = [];
    let current = '';

    for (const sentenceValue of sentences) {
        let sentence = sentenceValue.trim();
        while (sentence.length > maxCharacters) {
            if (current) { chunks.push(current); current = ''; }
            let splitAt = sentence.lastIndexOf(' ', maxCharacters);
            if (splitAt < Math.floor(maxCharacters * 0.6)) splitAt = maxCharacters;
            chunks.push(sentence.slice(0, splitAt).trim());
            sentence = sentence.slice(splitAt).trim();
        }
        if (!sentence) continue;
        if (current && current.length + sentence.length + 1 > maxCharacters) {
            chunks.push(current);
            current = sentence;
        } else {
            current = current ? `${current} ${sentence}` : sentence;
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

function withoutLeadingId3(bytes: Uint8Array): Uint8Array {
    if (bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return bytes;
    const size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) | ((bytes[8] & 0x7f) << 7) | (bytes[9] & 0x7f);
    const offset = Math.min(bytes.length, size + 10);
    return bytes.slice(offset);
}

function combineMp3Segments(values: Array<ArrayBuffer | Uint8Array>): Uint8Array {
    const segments = values.map((value, index) => {
        const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
        return index === 0 ? bytes : withoutLeadingId3(bytes);
    });
    const combined = new Uint8Array(segments.reduce((total, segment) => total + segment.byteLength, 0));
    let offset = 0;
    for (const segment of segments) { combined.set(segment, offset); offset += segment.byteLength; }
    return combined;
}

async function synthesizeNarration(
    env: Env,
    text: string,
): Promise<{ audio: ArrayBuffer | Uint8Array; provider: TtsProvider } | null> {
    if (env.ELEVENLABS_API_KEY) {
        const voiceId = env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                Accept: 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': env.ELEVENLABS_API_KEY,
            },
            body: JSON.stringify({
                text: text.slice(0, 4000),
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.42,
                    similarity_boost: 0.78,
                    style: 0.18,
                    use_speaker_boost: true,
                },
            }),
        });
        if (response.ok) {
            const audio = await response.arrayBuffer();
            if (looksLikeMp3(audio)) return { audio, provider: 'elevenlabs' };
        } else {
            console.warn('[TTS] ElevenLabs failed:', response.status, (await response.text()).slice(0, 160));
        }
    }

    // Aura 2 is context-aware and materially more natural than Aura 1. Aura 1
    // remains a reliable fallback; the dead, robotic MeloTTS model does not.
    for (const model of [
        { name: '@cf/deepgram/aura-2-en', provider: 'aura-2' as const },
        { name: '@cf/deepgram/aura-1', provider: 'aura-1' as const },
    ]) {
        try {
            const result = await (env.AI as Record<string, any>).run(model.name, {
                text: text.slice(0, 2000),
                speaker: 'athena',
                encoding: 'mp3',
                bit_rate: 48000,
            });
            const audio = await audioBytes(result);
            if (audio && looksLikeMp3(audio)) return { audio, provider: model.provider };
            console.warn(`[TTS] ${model.name} returned invalid or empty audio`);
        } catch (error) {
            console.warn(`[TTS] ${model.name} failed:`, String(error).slice(0, 160));
        }
    }
    return null;
}

export async function generateAudioNarration(
    env: Env,
    articleId: string,
    title: string,
    content: string,
): Promise<{ audioUrl: string; durationSeconds: number } | null> {
    try {
        const narrationText = createNarrationScript(title, content);
        const chunks = splitNarrationText(narrationText);
        if (!chunks.length) return null;
        const generatedSegments: Array<{ audio: ArrayBuffer | Uint8Array; provider: TtsProvider }> = [];
        for (const chunk of chunks) {
            const generated = await synthesizeNarration(env, chunk);
            if (!generated) return null; // Never publish a deceptively partial narration.
            generatedSegments.push(generated);
        }
        const audio = combineMp3Segments(generatedSegments.map(segment => segment.audio));
        const provider = generatedSegments[0].provider;

        const audioKey = `audio/${articleId}.mp3`;
        const durationSeconds = Math.ceil((narrationText.split(/\s+/).length / 150) * 60);
        await putMedia(env, audioKey, audio, 'audio/mpeg');

        const base = ((env as Record<string, any>).PUBLIC_API_URL || '').replace(/\/$/, '');
        const path = base ? `${base}/assets/${audioKey}` : `/assets/${audioKey}`;
        const audioUrl = `${path}?v=3`;

        await env.DB.prepare(`
            UPDATE articles
            SET audio_url = ?, audio_duration_seconds = ?, audio_file_size = ?,
                audio_regen = 3, audio_provider = ?
            WHERE id = ?
        `).bind(audioUrl, durationSeconds, audio.byteLength, provider, articleId).run();

        return { audioUrl, durationSeconds };
    } catch (error) {
        console.error('Audio narration generation failed:', error);
        return null;
    }
}

export function createNarrationScript(title: string, content: string): string {
    const clean = (value: string) => value
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
        .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
        .replace(/^[-*]\s+/gm, '')
        .replace(/^>\s?/gm, '')
        .replace(/^\|?\s*[-:]+(?:\s*\|\s*[-:]+)+\s*\|?$/gm, '')
        .replace(/\|/g, ', ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\b(\d+(?:\.\d+)?)%/g, '$1 percent')
        .replace(/\bvs\.?/gi, 'versus')
        .replace(/&/g, ' and ')
        .replace(/^\s*,\s*|\s*,\s*$/gm, '')
        .replace(/\s*,\s*/g, ', ')
        .replace(/([.!?]),/g, '$1')
        .replace(/\s+([,.;:!?])/g, '$1')
        .replace(/([.!?])(?=[A-Z])/g, '$1 ')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return `From BOA-Story, here is today's briefing. ${clean(title)}. ${clean(content)}`;
}

export async function generateBriefAudio(
    env: Env,
    countryCode: string,
    date: string,
): Promise<{ audioUrl: string; transcript: string } | null> {
    return getCached(env, `brief_audio:v5:${countryCode}:${date}`, async () => {
        const articles = await env.DB.prepare(`
            SELECT title, summary FROM articles
            WHERE country_code = ? AND status = 'published' AND date(published_at) = ?
            ORDER BY (engagement_score * 1.0 / ((julianday('now') - julianday(published_at)) + 1)) DESC
            LIMIT 8
        `).bind(countryCode, date).all();
        if (!articles.results?.length) return null;

        const country = await env.DB.prepare('SELECT name FROM countries WHERE code = ?')
            .bind(countryCode).first<{ name: string }>();
        const evidence = (articles.results as Array<{ title: string; summary?: string | null }>)
            .map((article, index) => `[${index + 1}] ${article.title}\n${article.summary || 'Summary unavailable.'}`)
            .join('\n\n');
        const transcript = await callConfiguredAI(env, {
            prompt: `System: You are BOA-Story's audio briefing editor. Use only the numbered records. Write for the ear in natural, human sentences. Do not read citation symbols, markdown, URLs or section labels aloud. Do not infer national conditions, market growth or stability from the records.

User: Write a 600-900 word spoken briefing for ${country?.name || countryCode} dated ${date}. Open with the date and direct lead, connect the stories through chronology and named actors, explain documented mechanisms and why the developments matter, distinguish allegations from established facts, include counter-signals and evidence limitations, and close with three specific things listeners should watch next. No preamble about being an AI.

RECORDS:
${evidence}`,
            max_tokens: 1800,
            temperature: 0.25,
            response_profile: 'spoken-brief',
        });
        if (!transcript.trim()) return null;
        const generated = await synthesizeNarration(env, transcript);
        if (!generated) return null;

        const audioKey = `briefs/${countryCode}/${date}.mp3`;
        await putMedia(env, audioKey, generated.audio, 'audio/mpeg');
        const base = ((env as Record<string, any>).PUBLIC_API_URL || '').replace(/\/$/, '');
        const path = base ? `${base}/assets/${audioKey}` : `/assets/${audioKey}`;
        return { audioUrl: `${path}?v=5`, transcript };
    }, { ttl: 86400 });
}

export async function getArticleAudio(
    env: Env,
    articleId: string,
): Promise<{ audioUrl: string; durationSeconds: number } | null> {
    const article = await env.DB.prepare(`
        SELECT audio_url, audio_duration_seconds FROM articles WHERE id = ?
    `).bind(articleId).first<{ audio_url: string | null; audio_duration_seconds: number | null }>();
    if (!article?.audio_url) return null;
    return { audioUrl: article.audio_url, durationSeconds: article.audio_duration_seconds || 0 };
}
