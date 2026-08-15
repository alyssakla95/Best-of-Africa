import { describe, expect, it } from 'vitest';
import { resolveEvidenceCountry } from '../../src/workers/generator';
import { matchCountryByName } from '../../src/lib/ai';

describe('generation country evidence', () => {
    it('never substitutes provider feed scope for story-level evidence', () => {
        expect(resolveEvidenceCountry(null, 'worldbank-api', 'GM')).toBeNull();
        expect(resolveEvidenceCountry('TG', 'worldbank-api', 'GM')).toBe('TG');
        expect(resolveEvidenceCountry('MW', 'worldbank-api', 'ZA')).toBe('MW');
        expect(resolveEvidenceCountry(null, 'rss', 'NG')).toBeNull();
        expect(resolveEvidenceCountry('TG', 'rss', 'NG')).toBe('TG');
    });

    it('distinguishes Republic of Congo from Democratic Republic of Congo', () => {
        expect(matchCountryByName(
            'World Bank financing strengthens value chains in the Republic of Congo',
            'The programme supports producers in the Republic of Congo.',
        )).toBe('CG');
        expect(matchCountryByName(
            'Investment expands in the Democratic Republic of the Congo',
            'The programme concerns businesses in Kinshasa and DR Congo.',
        )).toBe('CD');
    });

    it('does not confuse the Gulf of Guinea region with Guinea', () => {
        expect(matchCountryByName(
            'World Bank expands jobs programme in the northern Gulf of Guinea',
            'The cross-border programme covers several coastal states in the Gulf of Guinea.',
        )).toBeNull();
    });
});
