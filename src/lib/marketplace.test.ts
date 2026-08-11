import { describe, expect, it } from 'vitest';
import {
    createSecureToken,
    publicProfile,
    rankSpecialistProfile,
    sha256,
    synchronizeProfileListing,
} from './marketplace';
import { hashPassword, verifyPassword } from './password';

describe('marketplace identity and public projection', () => {
    it('creates unguessable single-use token material and hashes it consistently', async () => {
        const first = createSecureToken();
        const second = createSecureToken();
        expect(first).not.toBe(second);
        expect(first.length).toBeGreaterThanOrEqual(40);
        expect(await sha256(first)).toMatch(/^[a-f0-9]{64}$/);
        expect(await sha256(first)).toBe(await sha256(first));
    });

    it('returns only explicitly public profile fields', () => {
        const projected = publicProfile({
            id: 'profile-1',
            slug: 'amina-1',
            display_name: 'Amina',
            headline: 'Trade specialist',
            biography: 'Biography',
            countries: '["Kenya"]',
            sectors: '["Trade"]',
            service_categories: '["Market entry"]',
            languages: '["English"]',
            credential_summary: 'Credentials',
            credential_links: '["https://example.com"]',
            verification_level: 'verified',
            verification_summary: 'Reviewed professional credentials and references.',
            founding_cohort: 1,
            listing_fee_waived: 1,
            work_email: 'private@example.com',
            screening_notes: 'private',
            stripe_customer_id: 'cus_private',
            conflicts_declaration: 'private',
        });
        expect(projected).toMatchObject({
            display_name: 'Amina',
            countries: ['Kenya'],
            credential_links: ['https://example.com'],
            verification_level: 'verified',
            founding_cohort: true,
        });
        expect(projected).not.toHaveProperty('work_email');
        expect(projected).not.toHaveProperty('screening_notes');
        expect(projected).not.toHaveProperty('stripe_customer_id');
        expect(projected).not.toHaveProperty('conflicts_declaration');
        expect(projected).not.toHaveProperty('listing_fee_waived');
    });

    it('allows approved profiles to list through a waiver or active subscription', async () => {
        let query = '';
        const statement = {
            bind: () => statement,
            run: async () => ({ success: true }),
        };
        await synchronizeProfileListing({
            DB: {
                prepare(sql: string) {
                    query = sql;
                    return statement;
                },
            } as unknown as D1Database,
        } as never, 'specialist-1');
        expect(query).toContain('listing_fee_waived = 1');
        expect(query).toContain("s.status = 'active'");
        expect(query).toContain('screening_status = \'approved\'');
    });
});

describe('deterministic specialist matching', () => {
    const request = {
        countries: '["Kenya","Ghana"]',
        sector: 'Agriculture',
        required_expertise: '["Market entry","Supply chain"]',
        preferred_languages: '["English"]',
    };

    it('scores exact overlaps with stable reasons', () => {
        const result = rankSpecialistProfile(request, {
            client_id: 'specialist-1',
            countries: '["Kenya"]',
            sectors: '["Agriculture"]',
            languages: '["English"]',
            service_categories: '["Market entry"]',
        });
        expect(result).toEqual({
            clientId: 'specialist-1',
            score: 100,
            reasons: ['country', 'sector', 'language', 'service_category'],
        });
        expect(rankSpecialistProfile(request, {
            client_id: 'specialist-1',
            countries: '["Kenya"]',
            sectors: '["Agriculture"]',
            languages: '["English"]',
            service_categories: '["Market entry"]',
        })).toEqual(result);
    });
});

describe('shared password utility', () => {
    it('hashes PBKDF2 passwords and rejects a different password', async () => {
        const stored = await hashPassword('a long specialist password');
        expect(stored).toMatch(/^pbkdf2-sha256\$/);
        await expect(verifyPassword('a long specialist password', stored))
            .resolves.toEqual({ valid: true, legacy: false });
        await expect(verifyPassword('wrong specialist password', stored))
            .resolves.toEqual({ valid: false, legacy: false });
    });

    it('accepts the legacy SHA-256 format for migration on login', async () => {
        const digest = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode('legacy password'),
        );
        const stored = Array.from(new Uint8Array(digest))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
        await expect(verifyPassword('legacy password', stored))
            .resolves.toEqual({ valid: true, legacy: true });
    });
});
