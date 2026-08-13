import { describe, expect, it } from 'vitest';
import { resolveEvidenceCountry } from '../../src/workers/generator';

describe('generation country evidence', () => {
    it('uses provider scope only when story-level classification is empty', () => {
        expect(resolveEvidenceCountry(null, 'worldbank-api', 'GM')).toBe('GM');
        expect(resolveEvidenceCountry('TG', 'worldbank-api', 'GM')).toBe('TG');
        expect(resolveEvidenceCountry(null, 'rss', 'NG')).toBeNull();
        expect(resolveEvidenceCountry('TG', 'rss', 'NG')).toBe('TG');
    });
});
