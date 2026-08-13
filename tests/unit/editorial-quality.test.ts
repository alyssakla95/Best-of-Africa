import { describe, expect, it } from 'vitest';
import {
    editorialApprovalFailure,
    MIN_SOURCE_EVIDENCE_CHARS,
    sourceEvidenceFailure,
} from '../../src/lib/editorial-quality';
import {
    automaticPublicationFailure,
    isRecoverableModerationState,
    MAX_AUTOMATED_REFINEMENTS,
    type ModerationResult,
} from '../../src/lib/moderation';

describe('editorial publication gate', () => {
    const passing = {
        qualityScore: 88,
        passed: true,
        issues: [] as string[],
        recommendation: 'approve' as const,
        sourceUrl: 'https://publisher.example/report',
    };

    it('accepts only a sourced, clean, high-scoring audit', () => {
        expect(editorialApprovalFailure(passing)).toBeNull();
    });

    it.each([
        [{ ...passing, passed: false }, 'did not pass'],
        [{ ...passing, qualityScore: 79 }, 'below 80'],
        [{ ...passing, issues: ['Unverified estimate'] }, 'issues remain'],
        [{ ...passing, sourceUrl: null }, 'source URL'],
    ])('blocks unsafe publication decisions', (decision, message) => {
        expect(editorialApprovalFailure(decision)).toContain(message);
    });

    it('does not obstruct rewrite or archival decisions', () => {
        expect(editorialApprovalFailure({ ...passing, recommendation: 'rewrite', passed: false })).toBeNull();
    });
});

describe('automated editorial publication gate', () => {
    const article = {
        title: 'Verified market development',
        summary: 'A source-linked account of the verified development, affected stakeholders and stated implementation timetable.',
        content: Array.from({ length: 900 }, () => 'reported').join(' '),
        investorBrief: Array.from({ length: 200 }, () => 'evidence').join(' '),
        sourceUrl: 'https://publisher.example/report',
    };
    const cleanAudit: ModerationResult = {
        status: 'approved',
        score: 0.88,
        findings: [],
    };

    it('publishes only a deep, sourced article with a clean 80+ audit', () => {
        expect(automaticPublicationFailure(article, cleanAudit)).toBeNull();
    });

    it.each([
        [{ ...article, content: 'too short' }, cleanAudit, 'Article depth'],
        [{ ...article, summary: null }, cleanAudit, 'reader summary'],
        [{ ...article, title: 'Broken \u00e2\u20ac\u2011 headline' }, cleanAudit, 'malformed character'],
        [{ ...article, investorBrief: 'too short' }, cleanAudit, 'Professional brief depth'],
        [{ ...article, sourceUrl: null }, cleanAudit, 'source URL'],
        [article, { ...cleanAudit, score: 0.79 }, 'below 80'],
        [article, {
            ...cleanAudit,
            findings: [{ type: 'source' as const, severity: 'high' as const, message: 'Unsupported figure' }],
        }, 'issues remain'],
    ])('keeps unsafe worker output quarantined', (candidate, moderation, message) => {
        expect(automaticPublicationFailure(candidate, moderation)).toContain(message);
    });
});

describe('source evidence generation gate', () => {
    it('rejects snippets before long-form generation spends model capacity', () => {
        expect(sourceEvidenceFailure('brief feed excerpt')).toContain('Insufficient source evidence');
    });

    it('accepts a substantive ingested source record', () => {
        expect(sourceEvidenceFailure('e'.repeat(MIN_SOURCE_EVIDENCE_CHARS))).toBeNull();
    });
});

describe('stale moderation recovery boundary', () => {
    it.each(['flagged', 'needs_review'])('allows %s only while a rewrite remains', status => {
        expect(isRecoverableModerationState(status, 0)).toBe(true);
        expect(isRecoverableModerationState(status, MAX_AUTOMATED_REFINEMENTS - 1)).toBe(true);
        expect(isRecoverableModerationState(status, MAX_AUTOMATED_REFINEMENTS)).toBe(false);
    });

    it.each(['pending', 'reviewing', 'approved'])('does not treat %s as a stale failure', status => {
        expect(isRecoverableModerationState(status, 0)).toBe(false);
    });
});
