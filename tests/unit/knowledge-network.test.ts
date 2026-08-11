import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
    canRoleSubmitContribution,
    contributionNeedsSources,
    publicAuthorName,
    publicContribution,
} from '../../src/lib/knowledge-network';

describe('moderated knowledge network', () => {
    it('keeps contribution permissions narrow by account role', () => {
        expect(canRoleSubmitContribution('reader', 'reader_question')).toBe(true);
        expect(canRoleSubmitContribution('reader', 'field_signal')).toBe(false);
        expect(canRoleSubmitContribution('enterprise', 'enterprise_question')).toBe(true);
        expect(canRoleSubmitContribution('enterprise', 'expert_explanation')).toBe(false);
        expect(canRoleSubmitContribution('specialist', 'evidence_challenge')).toBe(true);
        expect(canRoleSubmitContribution('specialist', 'decision_reflection')).toBe(false);
    });

    it('requires sources for claims that challenge or report evidence', () => {
        expect(contributionNeedsSources('field_signal')).toBe(true);
        expect(contributionNeedsSources('evidence_challenge')).toBe(true);
        expect(contributionNeedsSources('reader_question')).toBe(false);
        expect(contributionNeedsSources('expert_explanation')).toBe(false);
    });

    it('does not expose reader or enterprise identity without explicit confirmation', () => {
        expect(publicAuthorName({ role: 'reader', clientName: 'Private Reader' })).toBe('BOA-Story reader');
        expect(publicAuthorName({ role: 'enterprise', organization: 'Private Company' })).toBe('Enterprise participant');
        expect(publicAuthorName({ role: 'enterprise', organization: 'Public Company', publicIdentityConfirmed: true })).toBe('Public Company');
        expect(publicAuthorName({ role: 'specialist', specialistName: 'Documented Specialist' })).toBe('Documented Specialist');
    });

    it('removes private moderation and identity fields from public projections', () => {
        const projected = publicContribution({
            id: 'one', title: 'Public title', author_client_id: 'private-client',
            moderation_notes: 'private review', moderated_by: 'admin',
            no_sensitive_data_confirmed: 1, public_identity_confirmed: 0,
        });
        expect(projected).toEqual({ id: 'one', title: 'Public title' });
    });

    it('ships explicit group, contribution, reaction, follow and membership tables', () => {
        const migration = readFileSync('migrations/0070_knowledge_network.sql', 'utf8');
        for (const table of [
            'knowledge_groups', 'knowledge_group_memberships', 'knowledge_contributions',
            'knowledge_reactions', 'knowledge_group_follows',
        ]) expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
        expect(migration).toContain("moderation_status TEXT NOT NULL DEFAULT 'pending'");
        expect(migration).toContain('no_sensitive_data_confirmed');
        expect(migration).toContain('public_identity_confirmed');
        expect(migration).toContain('review_notes TEXT');
    });
});
