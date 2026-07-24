import { describe, expect, it } from 'vitest';
import { editorialApprovalFailure } from '../../src/lib/editorial-quality';

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
