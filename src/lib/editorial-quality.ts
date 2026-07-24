export interface EditorialAuditDecision {
    qualityScore: number;
    passed: boolean;
    issues: string[];
    recommendation: 'approve' | 'rewrite' | 'delete';
    sourceUrl?: string | null;
}

export const MIN_SOURCE_EVIDENCE_CHARS = 3000;

export function sourceEvidenceFailure(sourceContent?: string | null): string | null {
    const evidenceChars = (sourceContent || '').replace(/\s+/g, ' ').trim().length;
    if (evidenceChars < MIN_SOURCE_EVIDENCE_CHARS) {
        return `Insufficient source evidence: ${evidenceChars} characters; ${MIN_SOURCE_EVIDENCE_CHARS} are required for long-form generation.`;
    }
    return null;
}

export function editorialApprovalFailure(decision: EditorialAuditDecision): string | null {
    if (decision.recommendation !== 'approve') return null;
    if (!decision.passed) return 'The audit did not pass.';
    if (decision.qualityScore < 80) return 'The quality score is below 80.';
    if (decision.issues.length > 0) return 'Unresolved audit issues remain.';
    if (!decision.sourceUrl?.trim()) return 'A verifiable source URL is required.';
    return null;
}
