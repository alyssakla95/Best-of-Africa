import { describe, expect, it } from 'vitest';
import { resolveEvidenceCountry } from '../../src/workers/generator';

describe('generation country evidence', () => {
    it('never substitutes provider feed scope for story-level evidence', () => {
        expect(resolveEvidenceCountry(null, 'worldbank-api', 'GM')).toBeNull();
        expect(resolveEvidenceCountry('TG', 'worldbank-api', 'GM')).toBe('TG');
        expect(resolveEvidenceCountry('MW', 'worldbank-api', 'ZA')).toBe('MW');
        expect(resolveEvidenceCountry(null, 'rss', 'NG')).toBeNull();
        expect(resolveEvidenceCountry('TG', 'rss', 'NG')).toBe('TG');
    });
});
