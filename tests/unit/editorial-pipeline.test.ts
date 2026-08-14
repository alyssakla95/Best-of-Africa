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
        expect(moderation).toContain('(article.refinement_count || 0) < MAX_AUTOMATED_REFINEMENTS');
        expect(moderation).toContain("moderation_status = 'pending'");
        expect(moderation).toContain('last_audited_at = NULL');
    });

    it('recovers stale failed drafts without weakening or endlessly repeating the audit', () => {
        const moderation = read('src/lib/moderation.ts');
        expect(moderation).toContain(`a.moderation_status IN ('flagged', 'needs_review')`);
        expect(moderation).toContain('COALESCE(a.refinement_count, 0) < ${MAX_AUTOMATED_REFINEMENTS}');
        expect(moderation).toContain('a.last_audited_at <= datetime(\'now\', \'-${STALE_MODERATION_RECOVERY_HOURS} hours\')');
        expect(moderation).toContain(`recent.published_at >= datetime('now', '-30 days')`);
        expect(moderation).toContain(`a.country_code IS NOT NULL AND NOT EXISTS`);
        expect(moderation).toContain('LENGTH(TRIM(COALESCE(i.content, \'\'))) >= ${MIN_SOURCE_EVIDENCE_CHARS}');
        expect(moderation).toContain(`status = 'pending_audit'`);
        expect(moderation).toContain(`moderation_status IN ('pending', 'flagged', 'needs_review')`);
        expect(moderation).toContain(`moderation_notes = ?, last_audited_at = NULL`);
    });

    it('reports recoverable and exhausted editorial queues in deep health', () => {
        const system = read('src/routes/system.ts');
        expect(system).toContain(`name: 'editorial_publication_queue'`);
        expect(system).toContain('recoverableCountriesWithoutRecentEvidence');
        expect(system).toContain('exhaustedForHumanReview');
        expect(system).toContain('reacquisitionRequired');
    });

    it('does not let thin or exhausted drafts suppress country acquisition', () => {
        const ingestion = read('src/workers/ingestion.ts');
        expect(ingestion).toContain('WITH viable_recent AS');
        expect(ingestion).toContain('LENGTH(TRIM(COALESCE(evidence.content, \'\'))) >= 3000');
        expect(ingestion).toContain('a.moderation_status IN (\'pending\', \'reviewing\')');
        expect(ingestion).toContain('COALESCE(a.refinement_count, 0) < 2');
        const migration = read('migrations/0073_ingested_article_evidence_index.sql');
        expect(migration).toContain('idx_ingested_items_article_id');
        expect(migration).toContain('ON ingested_items(article_id)');
    });

    it('timestamps generation claims and safely recovers abandoned work', () => {
        const generator = read('src/workers/generator.ts');
        expect(generator).toContain("SET status = 'processing', processing_started_at = datetime('now')");
        expect(generator).toContain("processing_started_at < datetime('now', '-15 minutes')");
        expect(generator).toContain("processing_started_at IS NULL AND created_at < datetime('now', '-15 minutes')");
        expect(generator).toContain("Recovered stale processing claim");
        expect(generator).toContain("processing_started_at = NULL");

        const migration = read('migrations/0074_ingestion_processing_claims.sql');
        expect(migration).toContain('ADD COLUMN processing_started_at TEXT');
        expect(migration).toContain('idx_ingested_items_processing_claim');
        expect(migration).toContain("WHERE status = 'processing' AND article_id IS NULL");
    });

    it('distinguishes scheduled source checks from productive acquisition', () => {
        const system = read('src/routes/system.ts');
        expect(system).toContain('WHEN y.last_fetched_at IS NULL OR s.last_fetched_at > y.last_fetched_at');
        expect(system).toContain('THEN s.last_fetched_at ELSE y.last_fetched_at');
        expect(system).toContain('y.last_fetched_at AS last_acquisition_at');
        expect(system).toContain('isRecent(row.last_checked_at, cutoff24h)');
        expect(system).toContain('isRecent(row.last_acquisition_at, cutoff24h)');
        expect(system).toContain('isRecent(row.last_productive_at, cutoff30d)');
    });
});
