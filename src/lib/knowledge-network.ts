export const KNOWLEDGE_CONTRIBUTION_TYPES = [
    'field_signal',
    'expert_explanation',
    'evidence_challenge',
    'enterprise_question',
    'reader_question',
    'country_perspective',
    'sector_perspective',
    'decision_reflection',
] as const;

export type KnowledgeContributionType = typeof KNOWLEDGE_CONTRIBUTION_TYPES[number];
export type KnowledgeAuthorRole = 'reader' | 'specialist' | 'enterprise' | 'editorial';

const ROLE_TYPES: Record<KnowledgeAuthorRole, readonly KnowledgeContributionType[]> = {
    reader: ['reader_question'],
    enterprise: ['enterprise_question', 'decision_reflection'],
    specialist: [
        'field_signal', 'expert_explanation', 'evidence_challenge', 'country_perspective',
        'sector_perspective', 'reader_question',
    ],
    editorial: KNOWLEDGE_CONTRIBUTION_TYPES,
};

export function canRoleSubmitContribution(role: KnowledgeAuthorRole, type: KnowledgeContributionType): boolean {
    return ROLE_TYPES[role].includes(type);
}

export function contributionNeedsSources(type: KnowledgeContributionType): boolean {
    return type === 'field_signal' || type === 'evidence_challenge';
}

export function publicAuthorName(input: {
    role: KnowledgeAuthorRole;
    specialistName?: string | null;
    organization?: string | null;
    clientName?: string | null;
    publicIdentityConfirmed?: boolean;
}): string {
    if (input.role === 'specialist' && input.specialistName) return input.specialistName;
    if (input.publicIdentityConfirmed && input.role === 'enterprise' && input.organization) return input.organization;
    if (input.publicIdentityConfirmed && input.clientName) return input.clientName;
    if (input.role === 'enterprise') return 'Enterprise participant';
    if (input.role === 'editorial') return 'BOA-Story editorial desk';
    return 'BOA-Story reader';
}

export function publicContribution<T extends Record<string, unknown>>(row: T) {
    const {
        author_client_id: _authorClientId,
        moderation_notes: _moderationNotes,
        moderated_by: _moderatedBy,
        no_sensitive_data_confirmed: _noSensitiveDataConfirmed,
        public_identity_confirmed: _publicIdentityConfirmed,
        ...safe
    } = row;
    return safe;
}
