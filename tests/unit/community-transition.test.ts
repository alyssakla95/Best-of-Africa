import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { openapiRouter } from '../../src/routes/openapi';

describe('consent-led community transition contract', () => {
    const migration = readFileSync('migrations/0072_community_transition_program.sql', 'utf8');
    const routes = readFileSync('src/routes/knowledge-network.ts', 'utf8');
    const pages = readFileSync('frontend/src/pages/CommunityTransitionPages.tsx', 'utf8');
    const admin = readFileSync('frontend/src/components/admin/AdminCommunityTransitions.tsx', 'utf8');
    const app = readFileSync('frontend/src/App.tsx', 'utf8');

    it('stores applications, programmes, invitations and voluntary activations separately', () => {
        for (const table of ['community_transition_applications', 'community_transition_programs', 'community_transition_invitations', 'community_transition_activations']) {
            expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
        }
        expect(migration).toContain('authority_confirmed INTEGER NOT NULL CHECK (authority_confirmed = 1)');
        expect(migration).toContain('no_member_data_confirmed INTEGER NOT NULL CHECK (no_member_data_confirmed = 1)');
        expect(migration).toContain('consent_confirmed INTEGER NOT NULL CHECK (consent_confirmed = 1)');
    });

    it('keeps applications private and publishes only reviewed programmes', () => {
        expect(routes).toContain("router.post('/transitions/apply'");
        expect(routes).toContain("p.status IN ('open', 'completed') AND p.published_at IS NOT NULL");
        expect(routes).toContain("router.patch('/admin/transition-applications/:id', requireAdmin");
        expect(routes).not.toContain('work_email: String(row.work_email)');
    });

    it('does not expose invitation tokens from public transition detail', () => {
        const publicDetail = routes.slice(routes.indexOf("router.get('/transitions/:slug'"), routes.indexOf("router.post('/transitions/apply'"));
        expect(publicDetail).not.toContain('community_transition_invitations');
        expect(publicDetail).not.toContain('token');
        expect(routes).toContain("router.post('/transitions/invitations/:token/activate', requireClientAuth");
    });

    it('activates by explicit consent and follows the receiving circle without copying external data', () => {
        expect(routes).toContain("consent_confirmed: z.literal(true)");
        expect(routes).toContain('INSERT INTO knowledge_group_follows');
        expect(pages).toContain('No membership list, private post or personal profile is copied from another platform.');
        expect(pages).toContain('BOA does not copy your external profile or posts.');
    });

    it('ships public launch, transition detail and administrator stewardship review', () => {
        expect(app).toContain('path="/community-transition"');
        expect(app).toContain('path="/community-transition/:slug"');
        expect(pages).toContain('BOA Circle Launchpad');
        expect(admin).toContain('Required private stewardship and consent review');
        expect(admin).toContain('Invitation token created and copied');
    });

    it('documents the public transition API', async () => {
        const response = await openapiRouter.request('https://example.test/openapi.json');
        const spec = await response.json() as { paths: Record<string, unknown> };
        expect(Object.keys(spec.paths)).toEqual(expect.arrayContaining([
            '/knowledge/transitions', '/knowledge/transitions/apply',
            '/knowledge/transitions/{slug}', '/knowledge/transitions/invitations/{token}/activate',
        ]));
    });
});
