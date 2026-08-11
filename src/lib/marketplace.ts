import type { Env } from '../types';

export function parseStringArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
    if (typeof value !== 'string') return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === 'string')
            : [];
    } catch {
        return [];
    }
}

export async function sha256(value: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function createSecureToken(bytes = 32): string {
    const random = crypto.getRandomValues(new Uint8Array(bytes));
    let binary = '';
    for (const byte of random) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function appendMarketplaceAudit(
    env: Env,
    event: {
        actorType: 'admin' | 'specialist' | 'enterprise' | 'stripe' | 'system';
        actorId?: string;
        entityType: string;
        entityId: string;
        eventType: string;
        fromStatus?: string | null;
        toStatus?: string | null;
        notes?: string | null;
    },
): Promise<void> {
    await env.DB.prepare(`
        INSERT INTO marketplace_audit_events (
            id, actor_type, actor_id, entity_type, entity_id, event_type,
            from_status, to_status, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        crypto.randomUUID(),
        event.actorType,
        event.actorId || null,
        event.entityType,
        event.entityId,
        event.eventType,
        event.fromStatus || null,
        event.toStatus || null,
        event.notes || null,
    ).run();
}

export async function synchronizeProfileListing(env: Env, clientId: string): Promise<void> {
    await env.DB.prepare(`
        UPDATE specialist_profiles
        SET is_listed = CASE
                WHEN screening_status = 'approved'
                 AND (
                    (
                        listing_fee_waived = 1
                        AND (
                            listing_fee_waived_until IS NULL
                            OR listing_fee_waived_until > datetime('now')
                        )
                    )
                    OR EXISTS (
                        SELECT 1 FROM specialist_subscriptions s
                        WHERE s.client_id = specialist_profiles.client_id
                          AND s.status = 'active'
                    )
                 )
                THEN 1 ELSE 0
            END,
            listed_at = CASE
                WHEN screening_status = 'approved'
                 AND (
                    (
                        listing_fee_waived = 1
                        AND (
                            listing_fee_waived_until IS NULL
                            OR listing_fee_waived_until > datetime('now')
                        )
                    )
                    OR EXISTS (
                        SELECT 1 FROM specialist_subscriptions s
                        WHERE s.client_id = specialist_profiles.client_id
                          AND s.status = 'active'
                    )
                 )
                THEN COALESCE(listed_at, datetime('now')) ELSE NULL
            END,
            updated_at = datetime('now')
        WHERE client_id = ?
    `).bind(clientId).run();
}

export function publicProfile(row: Record<string, unknown>): Record<string, unknown> {
    return {
        id: row.id,
        slug: row.slug,
        display_name: row.display_name,
        organization: row.organization,
        headline: row.headline,
        biography: row.biography,
        countries: parseStringArray(row.countries),
        sectors: parseStringArray(row.sectors),
        service_categories: parseStringArray(row.service_categories),
        languages: parseStringArray(row.languages),
        credential_summary: row.credential_summary,
        credential_links: parseStringArray(row.credential_links),
        indicative_pricing: row.indicative_pricing,
        availability: row.availability,
        verification_level: row.verification_level || 'boa_specialist',
        verification_summary: row.verification_summary || null,
        founding_cohort: Boolean(row.founding_cohort),
        listed_at: row.listed_at,
    };
}

export function rankSpecialistProfile(
    request: Record<string, unknown>,
    profile: Record<string, unknown>,
): { clientId: string; score: number; reasons: string[] } {
    const requestedCountries = new Set(parseStringArray(request.countries).map(value => value.toLowerCase()));
    const requestedExpertise = new Set(parseStringArray(request.required_expertise).map(value => value.toLowerCase()));
    const requestedLanguages = new Set(parseStringArray(request.preferred_languages).map(value => value.toLowerCase()));
    const overlap = (items: string[], requested: Set<string>) =>
        items.reduce((count, item) => count + (requested.has(item.toLowerCase()) ? 1 : 0), 0);
    const country = overlap(parseStringArray(profile.countries), requestedCountries);
    const language = overlap(parseStringArray(profile.languages), requestedLanguages);
    const expertise = overlap(parseStringArray(profile.service_categories), requestedExpertise);
    const sector = parseStringArray(profile.sectors)
        .some(value => value.toLowerCase() === String(request.sector).toLowerCase()) ? 1 : 0;
    return {
        clientId: String(profile.client_id),
        score: country * 25 + sector * 30 + language * 15 + expertise * 30,
        reasons: [
            country && 'country',
            sector && 'sector',
            language && 'language',
            expertise && 'service_category',
        ].filter((value): value is string => Boolean(value)),
    };
}
