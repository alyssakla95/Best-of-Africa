import { describe, expect, it } from 'vitest';
import { createNarrationScript, generateAudioNarration, splitNarrationText } from '../../src/lib/audio';
import { createMockEnv } from '../mocks/env';

describe('audio narration script', () => {
    it('turns editorial markdown into natural spoken prose', () => {
        const script = createNarrationScript(
            'Growth & Jobs: Kenya vs. Ghana',
            '## The shift\n> Investment rose **12.5%**.\n\n| Market | Change |\n| --- | --- |\n| Kenya | 8% |\nRead [the report](https://example.com) at https://example.com/full.',
        );
        expect(script).toContain("From BOA-Story, here is today's briefing.");
        expect(script).toContain('Growth and Jobs: Kenya versus Ghana');
        expect(script).toContain('Investment rose 12.5 percent.');
        expect(script).toContain('Kenya, 8 percent');
        expect(script).not.toMatch(/[#*|]|https?:\/\//);
    });

    it('splits a full article into complete sentence-sized TTS segments', () => {
        const source = Array.from({ length: 80 }, (_, index) => `Sentence ${index + 1} explains a documented market change and its effect on readers.`).join(' ');
        const chunks = splitNarrationText(source, 420);
        expect(chunks.length).toBeGreaterThan(5);
        expect(chunks.every(chunk => chunk.length <= 420)).toBe(true);
        expect(chunks.join(' ')).toBe(source);
    });
});

describe('audio provider selection', () => {
    const mp3 = () => {
        const bytes = new Uint8Array(2048);
        bytes.set([0x49, 0x44, 0x33]);
        return bytes.buffer;
    };

    it('uses Aura 2 and records the real provider and cache version', async () => {
        const calls: Array<{ model: string; options: Record<string, unknown> }> = [];
        let bound: unknown[] = [];
        const statement = {
            bind: (...values: unknown[]) => { bound = values; return statement; },
            run: async () => ({ success: true }),
        };
        const env = createMockEnv({
            AI: { run: async (model: string, options: Record<string, unknown>) => {
                calls.push({ model, options });
                return mp3();
            } } as unknown as Ai,
            DB: { prepare: () => statement } as unknown as D1Database,
            PUBLIC_API_URL: 'https://api.example.com',
        });

        const result = await generateAudioNarration(env, 'article-1', 'A title', 'A concise summary.');

        expect(calls).toEqual([{
            model: '@cf/deepgram/aura-2-en',
            options: expect.objectContaining({ encoding: 'mp3', bit_rate: 48000, speaker: 'athena' }),
        }]);
        expect(result?.audioUrl).toBe('https://api.example.com/assets/audio/article-1.mp3?v=3');
        expect(bound).toEqual([result?.audioUrl, 5, 2048, 'aura-2', 'article-1']);
    });

    it('falls back to Aura 1 without calling MeloTTS', async () => {
        const calls: string[] = [];
        const statement = { bind: () => statement, run: async () => ({ success: true }) };
        const env = createMockEnv({
            AI: { run: async (model: string) => {
                calls.push(model);
                if (model.includes('aura-2')) throw new Error('temporary outage');
                return mp3();
            } } as unknown as Ai,
            DB: { prepare: () => statement } as unknown as D1Database,
        });

        expect(await generateAudioNarration(env, 'article-2', 'Title', 'Summary.')).not.toBeNull();
        expect(calls).toEqual(['@cf/deepgram/aura-2-en', '@cf/deepgram/aura-1']);
        expect(calls.some(model => model.includes('melotts'))).toBe(false);
    });

    it('synthesizes every segment of a long article instead of truncating it', async () => {
        const calls: Array<Record<string, unknown>> = [];
        const statement = { bind: () => statement, run: async () => ({ success: true }) };
        const env = createMockEnv({
            AI: { run: async (_model: string, options: Record<string, unknown>) => {
                calls.push(options);
                return mp3();
            } } as unknown as Ai,
            DB: { prepare: () => statement } as unknown as D1Database,
        });
        const content = Array.from({ length: 140 }, (_, index) => `Sentence ${index + 1} preserves the complete documented record for narration.`).join(' ');

        const result = await generateAudioNarration(env, 'article-long', 'Full report', content);

        expect(result).not.toBeNull();
        expect(calls.length).toBeGreaterThan(3);
        expect(calls.every(options => String(options.text).length <= 1800)).toBe(true);
        expect(result!.durationSeconds).toBeGreaterThan(60);
    });
});
