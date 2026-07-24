import { describe, expect, it, vi } from 'vitest';
import { callConfiguredAI, countResponseWords, evaluateArticleDepth, extractAIText, fillNarrativeGap, generateArticle, isValidStructuredOutput, shouldExpandAIResponse } from '../../src/lib/ai';
import { createMockEnv } from '../mocks/env';

describe('AI response depth contract', () => {
    it('counts words and flags an underdeveloped reader-facing analysis', () => {
        expect(countResponseWords('one two\nthree')).toBe(3);
        expect(shouldExpandAIResponse('A short unsupported answer.', 'deep-analysis')).toBe(true);
        expect(shouldExpandAIResponse(Array.from({ length: 3199 }, () => 'word').join(' '), 'deep-analysis')).toBe(true);
        expect(shouldExpandAIResponse(Array.from({ length: 3200 }, () => 'word').join(' '), 'deep-analysis')).toBe(false);
        expect(shouldExpandAIResponse(Array.from({ length: 2199 }, () => 'word').join(' '), 'evidence-brief')).toBe(true);
        expect(shouldExpandAIResponse(Array.from({ length: 2200 }, () => 'word').join(' '), 'evidence-brief')).toBe(false);
        expect(shouldExpandAIResponse(Array.from({ length: 799 }, () => 'word').join(' '), 'reader-explainer')).toBe(true);
        expect(shouldExpandAIResponse(Array.from({ length: 800 }, () => 'word').join(' '), 'reader-explainer')).toBe(false);
        expect(shouldExpandAIResponse(Array.from({ length: 599 }, () => 'word').join(' '), 'spoken-brief')).toBe(true);
        expect(shouldExpandAIResponse(Array.from({ length: 600 }, () => 'word').join(' '), 'spoken-brief')).toBe(false);
    });

    it('does not force padding when the model identifies thin evidence', () => {
        const response = 'Insufficient evidence to substantiate the requested analysis. The source record lacks dates and primary documents.';
        expect(shouldExpandAIResponse(response, 'deep-analysis')).toBe(false);
    });

    it('blocks shallow Worker drafts at the publication boundary', () => {
        expect(evaluateArticleDepth('short article', 'short brief')).toEqual({ articleWords: 2, briefWords: 2, publishable: false });
        expect(evaluateArticleDepth(
            Array.from({ length: 900 }, () => 'article').join(' '),
            Array.from({ length: 200 }, () => 'brief').join(' '),
        ).publishable).toBe(true);
    });

    it('refuses to auto-publish a narrative gap without source evidence', async () => {
        const env = createMockEnv();
        await expect(fillNarrativeGap(env, 'Ghana', 'Technology')).rejects.toThrow('requires source-linked reporting evidence');
    });

    it('normalizes legacy, Chat Completions and Responses API output shapes', () => {
        expect(extractAIText({ response: 'legacy' })).toBe('legacy');
        expect(extractAIText({ choices: [{ message: { content: 'chat completion' } }] })).toBe('chat completion');
        expect(extractAIText({ output_text: 'responses api' })).toBe('responses api');
        expect(extractAIText({ output: [{ content: [{ type: 'output_text', text: 'nested response' }] }] })).toBe('nested response');
        expect(extractAIText({ choices: [{ message: { content: 'private planning\nassistantfinal## Published answer' } }] })).toBe('## Published answer');
        expect(extractAIText('hidden reasoning<|channel|>final<|message|>Visible answer')).toBe('Visible answer');
    });

    it('removes hidden deliberation while preserving the finished answer', () => {
        expect(extractAIText('<think>I should compare three approaches.</think>Published finding.')).toBe('Published finding.');
        expect(extractAIText('<analysis>Private scratch work.</analysis>\nFinal evidence brief.')).toBe('Final evidence brief.');
        expect(extractAIText('```reasoning\ninternal plan\n```\nDecision-ready conclusion.')).toBe('Decision-ready conclusion.');
    });

    it('runs one evidence-preserving expansion pass for a minimal first draft', async () => {
        const expanded = Array.from({ length: 2220 }, (_, index) => `word${index}`).join(' ');
        const run = vi.fn()
            .mockResolvedValueOnce({ response: 'The evidence shows a material change.' })
            .mockResolvedValueOnce({ response: expanded });
        const env = createMockEnv({ AI: { run } as any });

        const result = await callConfiguredAI(env, {
            prompt: 'Analyze supplied record [1].',
            max_tokens: 2000,
            response_profile: 'evidence-brief',
        });

        expect(result).toBe(expanded);
        expect(run).toHaveBeenCalledTimes(2);
        expect(run.mock.calls[0][0]).toBe('@cf/openai/gpt-oss-120b');
        expect(run.mock.calls[0][1].max_tokens).toBe(10000);
        expect(run.mock.calls[0][1].prompt).toContain('DEPTH AND EVIDENCE CONTRACT');
        expect(run.mock.calls[1][1].prompt).toContain('DRAFT TO REWRITE');
        expect(run.mock.calls[1][1].prompt).toContain('never pad or invent');
    });

    it('repairs a minimal structured response and preserves valid JSON-only output', async () => {
        const json = JSON.stringify({ summary: 'Detailed evidence', limitations: ['Source window'] });
        const expandedJson = JSON.stringify({
            summary: Array.from({ length: 920 }, (_, index) => `evidence${index}`).join(' '),
            limitations: ['Source window'],
        });
        const run = vi.fn()
            .mockResolvedValueOnce({ response: json })
            .mockResolvedValueOnce({ response: expandedJson });
        const env = createMockEnv({ AI: { run } as any });

        const result = await callConfiguredAI(env, {
            prompt: 'Return ONLY valid JSON using the supplied evidence.',
            max_tokens: 3200,
            response_profile: 'structured-analysis',
            structured_output: true,
        });

        expect(result).toBe(expandedJson);
        expect(() => JSON.parse(result)).not.toThrow();
        expect(run).toHaveBeenCalledTimes(2);
        expect(run.mock.calls[0][1].prompt).toContain('DEPTH AND EVIDENCE CONTRACT');
        expect(run.mock.calls[0][1].max_tokens).toBe(7000);
        expect(run.mock.calls[1][1].prompt).toContain('Output JSON only');
    });

    it('runs a bounded JSON repair when a detailed structured draft is malformed', async () => {
        const malformed = `{ "summary": "${Array.from({ length: 920 }, () => 'evidence').join(' ')}"`;
        const stillMalformed = `${malformed}, "limitations": [`;
        const repaired = JSON.stringify({ summary: Array.from({ length: 920 }, () => 'evidence').join(' '), limitations: ['bounded source window'] });
        const run = vi.fn()
            .mockResolvedValueOnce({ response: malformed })
            .mockResolvedValueOnce({ response: stillMalformed })
            .mockResolvedValueOnce({ response: repaired });
        const env = createMockEnv({ AI: { run } as any });

        const result = await callConfiguredAI(env, {
            prompt: 'Return the requested evidence schema as JSON.',
            response_profile: 'structured-analysis',
            structured_output: true,
        });

        expect(isValidStructuredOutput(result)).toBe(true);
        expect(run).toHaveBeenCalledTimes(3);
        expect(run.mock.calls[2][1].prompt).toContain('Repair the malformed structured response');
    });

    it('cannot be downgraded by stale provider config or external credentials', async () => {
        const run = vi.fn().mockResolvedValue({ response: 'Verified information.' });
        const env = createMockEnv({
            AI: { run } as any,
            ANTHROPIC_API_KEY: 'must-not-override-information-model',
            OPENAI_API_KEY: 'must-not-override-information-model',
        });
        await env.CACHE.put('zeroclaw:provider_config', JSON.stringify({
            providers: { anthropic: { api_key: 'stale-key' } },
            agents: { defaults: { provider: 'anthropic', model: 'stale-model' } },
        }));

        await callConfiguredAI(env, { prompt: 'Explain the supplied evidence.', max_tokens: 300 });

        expect(run).toHaveBeenCalledOnce();
        expect(run.mock.calls[0][0]).toBe('@cf/openai/gpt-oss-120b');
    });

    it('retains the expanded professional brief in generated article output', async () => {
        const content = Array.from({ length: 1810 }, (_, index) => `reporting${index}`).join(' ');
        const investorBrief = Array.from({ length: 275 }, (_, index) => `analysis${index}`).join(' ');
        const response = `TITLE: A fully reported story\nSUBTITLE: The documented people and mechanisms\nCONTENT:\n${content}\nSUMMARY: The records establish a documented change. They also show who was affected and what remains unresolved.\nINVESTOR_BRIEF: ${investorBrief}\nTAGS: evidence, reporting, Africa`;
        const run = vi.fn().mockResolvedValue({ response });
        const env = createMockEnv({ AI: { run } as any });

        const article = await generateArticle(env, 'Source title', 'Source record', 'Ghana', 'Technology');

        expect(article.content.split(/\s+/)).toHaveLength(1810);
        expect(article.investor_brief.split(/\s+/)).toHaveLength(275);
        expect(run.mock.calls[0][1].max_tokens).toBe(7000);
    });
});
