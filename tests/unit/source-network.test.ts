import { describe, expect, it } from 'vitest';
import { summarizeSourceNetwork, type SourceNetworkRow } from '../../src/lib/source-network';

const row = (overrides: Partial<SourceNetworkRow>): SourceNetworkRow => ({
    id: 'source',
    name: 'Example source',
    type: 'rss',
    url: 'https://example.com/feed',
    country_code: null,
    last_fetched_at: null,
    last_productive_at: null,
    total_queued: 0,
    ...overrides,
});

describe('source network evidence', () => {
    it('separates configured lanes from recently productive sources', () => {
        const snapshot = summarizeSourceNetwork([
            row({ id: 'ug', name: 'World Bank Group · Uganda', type: 'worldbank-api', url: 'https://webapi.worldbank.org/search?ug', country_code: 'UG', last_productive_at: '2026-08-08 10:00:00' }),
            row({ id: 'ci', name: "World Bank Group · Côte d'Ivoire", type: 'worldbank-api', url: 'https://webapi.worldbank.org/search?ci', country_code: 'CI' }),
            row({ id: 'old', name: 'International specialist', url: 'https://reuters.com/africa', last_productive_at: '2026-06-01 10:00:00' }),
        ], new Date('2026-08-09T12:00:00Z'));

        expect(snapshot).toMatchObject({
            active_direct_sources: 3,
            productive_direct_sources_30d: 1,
            official_country_lanes: 2,
            official_country_lanes_productive_30d: 1,
            countries_with_official_lanes: 2,
            latest_productive_at: '2026-08-08 10:00:00',
        });
    });
});
