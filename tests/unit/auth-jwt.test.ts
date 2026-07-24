// ═══════════════════════════════════════════════════════════════════════════════
// JWT — regression tests
//
// verifyJWT is now the single verifier for member auth (the paywall used to
// carry its own copy). These tests pin the roundtrip, tamper rejection, and
// expiry behavior the paywall and OTP login depend on.
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { createJWT, verifyJWT } from '../../src/lib/auth';

const SECRET = 'test-secret-for-jwt-roundtrip';

describe('createJWT / verifyJWT', () => {
    it('roundtrips a subject', async () => {
        const token = await createJWT('member_abc123', SECRET, 3600);
        const payload = await verifyJWT(token, SECRET);
        expect(payload?.sub).toBe('member_abc123');
    });

    it('rejects a token signed with a different secret', async () => {
        const token = await createJWT('member_abc123', 'other-secret', 3600);
        expect(await verifyJWT(token, SECRET)).toBeNull();
    });

    it('rejects a tampered payload', async () => {
        const token = await createJWT('member_abc123', SECRET, 3600);
        const [h, p, s] = token.split('.');
        const forged = JSON.parse(atob(p));
        forged.sub = 'member_owner0000000001';
        const tampered = `${h}.${btoa(JSON.stringify(forged))}.${s}`;
        expect(await verifyJWT(tampered, SECRET)).toBeNull();
    });

    it('rejects an expired token', async () => {
        const token = await createJWT('member_abc123', SECRET, -10);
        expect(await verifyJWT(token, SECRET)).toBeNull();
    });

    it('rejects garbage', async () => {
        expect(await verifyJWT('not.a.jwt', SECRET)).toBeNull();
        expect(await verifyJWT('', SECRET)).toBeNull();
    });
});
