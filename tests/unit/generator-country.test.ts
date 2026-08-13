import { describe, expect, it } from 'vitest';
import { resolveEvidenceCountry } from '../../src/workers/generator';

describe('generation country evidence', () => {
    it('gives exact provider-filtered evidence precedence over probabilistic classification', () => {
        expect(resolveEvidenceCountry(null, 'worldbank-api', 'GM')).toBe('GM');
        expect(resolveEvidenceCountry('TG', 'worldbank-api', 'GM')).toBe('GM');
        expect(resolveEvidenceCountry(null, 'rss', 'NG')).toBeNull();
        expect(resolveEvidenceCountry('TG', 'rss', 'NG')).toBe('TG');
    });
});
