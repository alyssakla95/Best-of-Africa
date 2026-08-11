import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { openapiRouter } from '../../src/routes/openapi';

describe('Decision Room product contract', () => {
    const migration = readFileSync('migrations/0071_decision_rooms.sql', 'utf8');
    const route = readFileSync('src/routes/knowledge-network.ts', 'utf8');
    const pages = readFileSync('frontend/src/pages/DecisionRoomPages.tsx', 'utf8');
    const discovery = readFileSync('frontend/src/components/decision-rooms/DecisionRoomDiscovery.tsx', 'utf8');
    const app = readFileSync('frontend/src/App.tsx', 'utf8');

    it('separates rooms, reviewed evidence, invited participants and follows', () => {
        for (const table of ['decision_rooms', 'decision_room_items', 'decision_room_participants', 'decision_room_follows']) {
            expect(migration).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
        }
        expect(migration).toContain("visibility IN ('private', 'consented_public')");
        expect(migration).toContain("moderation_status TEXT NOT NULL DEFAULT 'pending'");
        expect(migration).toContain("'documented_outcome'");
    });

    it('requires Enterprise access and explicit consent before public submission', () => {
        expect(route).toContain("router.post('/rooms', requireMarketplaceEnterprise");
        expect(route).toContain("body.visibility === 'consented_public' && !body.public_consent_confirmed");
        expect(route).toContain("body.visibility === 'private' ? 'approved' : 'pending'");
    });

    it('keeps specialist participation invited and source-sensitive claims bounded', () => {
        expect(route).toContain("room.participant_status === 'accepted'");
        expect(route).toContain("['official_evidence', 'evidence_challenge', 'contradiction']");
        expect(route).toContain("requires at least one source URL");
        expect(route).toContain("moderation_status: 'pending'");
    });

    it('ships public, detail, private Enterprise and contextual interfaces', () => {
        for (const path of ['/decision-rooms', '/decision-rooms/:slug', '/enterprise/decision-rooms', '/enterprise/decision-rooms/:id']) {
            expect(app).toContain(`path=\"${path}\"`);
        }
        expect(pages).toContain('Trace what is known, interpreted and unresolved.');
        expect(pages).toContain('Documented outcome');
        expect(discovery).toContain('ContextualDecisionRooms');
        expect(pages).toContain('Private Enterprise room');
    });

    it('documents the public room API', async () => {
        const response = await openapiRouter.request('https://example.test/openapi.json');
        const spec = await response.json() as { paths: Record<string, unknown> };
        expect(Object.keys(spec.paths)).toEqual(expect.arrayContaining([
            '/knowledge/rooms', '/knowledge/rooms/{slug}',
            '/knowledge/rooms/{id}/items', '/knowledge/rooms/{id}/follow',
        ]));
    });
});
