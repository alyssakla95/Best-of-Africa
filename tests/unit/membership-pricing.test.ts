import { describe, expect, it } from 'vitest';
import { tierFromPayment } from '../../src/routes/members';

describe('membership payment tier mapping', () => {
    it('maps the published monthly prices to the correct access tier', () => {
        expect(tierFromPayment(4)).toBe('basic');
        expect(tierFromPayment(9)).toBe('premium');
        expect(tierFromPayment(19)).toBe('enterprise');
    });

    it('prefers the Ko-fi level name when the payment amount is ambiguous', () => {
        expect(tierFromPayment(19, 'Reader Member')).toBe('basic');
        expect(tierFromPayment(4, 'Sustaining Member')).toBe('premium');
        expect(tierFromPayment(9, 'Founding Backer')).toBe('enterprise');
    });
});
