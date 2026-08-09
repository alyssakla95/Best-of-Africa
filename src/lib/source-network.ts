import type { Env } from '../types';
import { sourceQualityProfile } from './source-quality';

export interface SourceNetworkRow {
    id: string;
    name: string;
    type: string;
    url: string;
    country_code: string | null;
    last_fetched_at: string | null;
    last_productive_at: string | null;
    total_queued: number | null;
}

export interface SourceNetworkSnapshot {
    active_direct_sources: number;
    productive_direct_sources_30d: number;
    active_primary_or_global_sources: number;
    productive_primary_or_global_sources_30d: number;
    official_country_lanes: number;
    official_country_lanes_productive_30d: number;
    countries_with_official_lanes: number;
    latest_productive_at: string;
    methodology: string;
}

const asUtc = (value: string | null) => value
    ? Date.parse(value.endsWith('Z') ? value : `${value}Z`)
    : NaN;

export function summarizeSourceNetwork(rows: SourceNetworkRow[], now = new Date()): SourceNetworkSnapshot {
    const cutoff30d = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const productive = rows.filter(row => {
        const timestamp = asUtc(row.last_productive_at);
        return Number.isFinite(timestamp) && timestamp >= cutoff30d;
    });
    const primary = rows.filter(row => sourceQualityProfile(row.name, row.url, 'fixed').tier === 4);
    const productivePrimary = productive.filter(row => sourceQualityProfile(row.name, row.url, 'fixed').tier === 4);
    const officialCountryLanes = rows.filter(row => row.type === 'worldbank-api' && row.country_code);
    const productiveOfficialCountryLanes = productive.filter(row => row.type === 'worldbank-api' && row.country_code);
    const latestProductiveAt = rows
        .map(row => row.last_productive_at)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => asUtc(b) - asUtc(a))[0] || 'No qualifying direct-source record observed in the rolling 30-day window';

    return {
        active_direct_sources: rows.length,
        productive_direct_sources_30d: productive.length,
        active_primary_or_global_sources: primary.length,
        productive_primary_or_global_sources_30d: productivePrimary.length,
        official_country_lanes: officialCountryLanes.length,
        official_country_lanes_productive_30d: productiveOfficialCountryLanes.length,
        countries_with_official_lanes: new Set(officialCountryLanes.map(row => row.country_code)).size,
        latest_productive_at: latestProductiveAt,
        methodology: 'An active source is configured for direct acquisition. A productive source has supplied at least one qualifying record during the last 30 days. Official country lanes query the provider by country; they do not imply that every country has a recent publication.',
    };
}

export async function getSourceNetworkSnapshot(env: Env): Promise<SourceNetworkSnapshot> {
    const result = await env.DB.prepare(`
        SELECT s.id, s.name, s.type, s.url, s.country_code,
               y.last_fetched_at, y.last_productive_at, y.total_queued
        FROM sources s
        LEFT JOIN source_acquisition_yield y ON y.source_id = s.id
        WHERE s.is_active = 1
          AND s.type IN ('rss', 'html', 'newsapi', 'worldbank-api')
        ORDER BY s.name, s.id
    `).all<SourceNetworkRow>();
    return summarizeSourceNetwork(result.results || []);
}
