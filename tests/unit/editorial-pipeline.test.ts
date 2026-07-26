import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('generated article publication boundary', () => {
    it.each([
        'src/workers/generator.ts',
        'src/routes/agent-webhooks.ts',
        'src/workers/optimizer.ts',
        'src/lib/optimizer/content-gaps.ts',
    ])('quarantines generated content in %s', path => {
        const source = read(path);
        expect(source).toContain("'pending_audit'");
        expect(source).not.toMatch(/VALUES[\s\S]{0,500}'published',\s*datetime\('now'\)/);
    });

    it('does not append unrelated country enrichment to generated articles', () => {
        const source = read('src/workers/generator.ts');
        expect(source).not.toContain('fullEnrich');
    });

    it('uses bounded source-grounded remediation before a failed draft can publish', () => {
        const moderation = read('src/lib/moderation.ts');
        expect(moderation).toContain('repairArticleFromAudit');
        expect(moderation).toContain('max_tokens: 4000');
        expect(moderation).toContain('maxItems: 6');
        expect(moderation).toContain('(article.refinement_count || 0) < 2');
        expect(moderation).toContain("moderation_status = 'pending'");
        expect(moderation).toContain('last_audited_at = NULL');
    });
});
