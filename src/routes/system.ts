import { Hono } from 'hono';
import type { Env } from '../types';
import { sourceQualityProfile } from '../lib/source-quality';

const router = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// WebSocket: Real-time live stream (forwards to Durable Object)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/live/stream', async (c) => {
    const id = c.env.LIVE_COUNTER.idFromName('global');
    const stub = c.env.LIVE_COUNTER.get(id);

    // Forward the request to the Durable Object
    // The DO will handle the WebSocket upgrade
    return stub.fetch(c.req.raw);
});

// GET /live/status - Get current live stats without WebSocket
router.get('/live/status', async (c) => {
    const id = c.env.LIVE_COUNTER.idFromName('global');
    const stub = c.env.LIVE_COUNTER.get(id);

    // Fetch current state via HTTP
    const response = await stub.fetch(new Request('https://internal/get'));
    const data = await response.json();

    return c.json(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /contact - Contact form submission
// ───────────────────────────────────────────────────────────────────────────────
router.post('/contact', async (c) => {
    // Per-IP throttle — this endpoint writes unauthenticated input to D1 and
    // feeds the operator inbox; without a limit it's a spam funnel.
    const { throttle } = await import('../lib/ratelimit');
    const limited = await throttle(c, 'contact');
    if (limited) return limited;

    const body = await c.req.json();
    const { name, organization, email, inquiry_type, message } = body;

    if (!name || !email || !message) {
        return c.json({ error: 'validation_error', message: 'Name, email, and message are required' }, 400);
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json({ error: 'validation_error', message: 'A valid email address is required' }, 400);
    }

    if (String(name).length > 200 || String(email).length > 320 || String(message).length > 10000) {
        return c.json({ error: 'validation_error', message: 'Submission exceeds allowed field lengths' }, 400);
    }

    // Store in database
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO contact_submissions (id, name, organization, email, inquiry_type, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, name, organization || '', email, inquiry_type || 'General', message).run();

    return c.json({ success: true, id, message: 'Thank you for your inquiry. We will respond shortly.' });
});

// ───────────────────────────────────────────────────────────────────────────────
// Audience Stats (for SponsoredPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats/audience', async (c) => {
    const stats = await c.env.DB.prepare(`
        SELECT
            COUNT(DISTINCT id) as total_articles,
            SUM(CASE WHEN published_at >= datetime('now', '-30 days') THEN COALESCE(view_count, 0) ELSE 0 END) as page_views_30d,
            COUNT(DISTINCT country_code) as countries_covered
        FROM articles
        WHERE status = 'published'
    `).first();

    return c.json({
        page_views_30d: Number((stats as Record<string, unknown>)?.page_views_30d || 0),
        countries_covered: (stats as Record<string, any>)?.countries_covered || 0,
        total_articles: (stats as Record<string, any>)?.total_articles || 0,
        methodology: 'Page views are first-party article view events recorded during the latest 30 days. They are not divided or transformed into an estimate of unique monthly readers.',
        updated_at: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// System Status (for Footer API Status link)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/status', async (c) => {
    const startTime = Date.now();
    let dbStatus = 'ok';

    try {
        await c.env.DB.prepare('SELECT 1').first();
    } catch {
        dbStatus = 'error';
    }

    const responseTime = Date.now() - startTime;

    return c.json({
        status: dbStatus === 'ok' ? 'operational' : 'degraded',
        version: c.env.API_VERSION || '2.4.0',
        services: {
            database: dbStatus,
            api: 'ok',
            search: 'ok',
        },
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// Deep Health Check - Comprehensive system diagnostics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/health', async (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: c.env.API_VERSION || '2.4.0',
        environment: c.env.ENVIRONMENT || 'development',
    });
});

interface HealthCheckResult {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTimeMs: number;
    message?: string;
    details?: Record<string, unknown>;
}

router.get('/health/deep', async (c) => {
    const startTime = Date.now();
    const checks: HealthCheckResult[] = [];

    // Check Database
    const dbStart = Date.now();
    try {
        const dbResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM articles').first();
        checks.push({
            name: 'database',
            status: 'healthy',
            responseTimeMs: Date.now() - dbStart,
            details: { articleCount: (dbResult as Record<string, number>)?.count || 0 },
        });
    } catch (error) {
        checks.push({
            name: 'database',
            status: 'unhealthy',
            responseTimeMs: Date.now() - dbStart,
            message: error instanceof Error ? error.message : 'Database connection failed',
        });
    }

    const marketplaceStart = Date.now();
    try {
        const schema = await c.env.DB.prepare(`
            SELECT COUNT(*) AS count FROM sqlite_master
            WHERE type = 'table' AND name IN (
                'specialist_invites', 'specialist_applications', 'specialist_profiles',
                'specialist_subscriptions', 'stripe_webhook_events',
                'marketplace_client_access', 'specialist_requests',
                'specialist_matches', 'specialist_proposals', 'marketplace_audit_events',
                'specialist_interest_registrations'
            )
        `).first<{ count: number }>();
        const standing = await c.env.DB.prepare(`
            SELECT
                SUM(CASE WHEN founding_cohort = 1 THEN 1 ELSE 0 END) AS founding_count,
                SUM(CASE WHEN listing_fee_waived = 1 THEN 1 ELSE 0 END) AS waived_count
            FROM specialist_profiles
        `).first<{ founding_count: number; waived_count: number }>();
        const enabled = c.env.MARKETPLACE_ENABLED === 'true';
        const stripeConfigured = Boolean(
            c.env.STRIPE_SECRET_KEY
            && c.env.STRIPE_WEBHOOK_SECRET
            && c.env.STRIPE_SPECIALIST_PRICE_ID,
        );
        const schemaReady = Number(schema?.count || 0) === 11;
        checks.push({
            name: 'specialist_marketplace',
            status: schemaReady ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - marketplaceStart,
            message: !schemaReady
                ? 'Marketplace migration is not fully applied'
                : undefined,
            details: {
                enabled,
                schemaReady,
                stripeConfigured,
                foundingCount: Number(standing?.founding_count || 0),
                waivedCount: Number(standing?.waived_count || 0),
            },
        });
    } catch (error) {
        checks.push({
            name: 'specialist_marketplace',
            status: 'degraded',
            responseTimeMs: Date.now() - marketplaceStart,
            message: error instanceof Error ? error.message : 'Marketplace health check failed',
        });
    }

    const knowledgeStart = Date.now();
    try {
        const schema = await c.env.DB.prepare(`
            SELECT COUNT(*) AS count FROM sqlite_master
            WHERE type = 'table' AND name IN (
                'knowledge_groups', 'knowledge_group_memberships', 'knowledge_contributions',
                'knowledge_reactions', 'knowledge_group_follows', 'decision_rooms',
                'decision_room_items', 'decision_room_participants', 'decision_room_follows',
                'community_transition_applications', 'community_transition_programs',
                'community_transition_invitations', 'community_transition_activations'
            )
        `).first<{ count: number }>();
        const schemaReady = Number(schema?.count || 0) === 13;
        let activity = { active_groups: 0, approved_contributions: 0, pending_contributions: 0, approved_memberships: 0, public_rooms: 0, private_rooms: 0, pending_room_items: 0, documented_outcomes: 0, open_transitions: 0, transition_activations: 0 };
        if (schemaReady) {
            const measured = await c.env.DB.prepare(`
                SELECT
                    (SELECT COUNT(*) FROM knowledge_groups WHERE is_active = 1) AS active_groups,
                    (SELECT COUNT(*) FROM knowledge_contributions WHERE moderation_status = 'approved') AS approved_contributions,
                    (SELECT COUNT(*) FROM knowledge_contributions WHERE moderation_status = 'pending') AS pending_contributions,
                    (SELECT COUNT(*) FROM knowledge_group_memberships WHERE status = 'approved') AS approved_memberships,
                    (SELECT COUNT(*) FROM decision_rooms WHERE visibility = 'consented_public' AND moderation_status = 'approved') AS public_rooms,
                    (SELECT COUNT(*) FROM decision_rooms WHERE visibility = 'private') AS private_rooms,
                    (SELECT COUNT(*) FROM decision_room_items WHERE moderation_status = 'pending') AS pending_room_items,
                    (SELECT COUNT(*) FROM decision_room_items WHERE moderation_status = 'approved' AND item_type = 'documented_outcome') AS documented_outcomes,
                    (SELECT COUNT(*) FROM community_transition_programs WHERE status = 'open') AS open_transitions,
                    (SELECT COUNT(*) FROM community_transition_activations) AS transition_activations
            `).first<typeof activity>();
            if (measured) activity = measured;
        }
        checks.push({
            name: 'knowledge_network',
            status: schemaReady ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - knowledgeStart,
            message: schemaReady ? undefined : 'Knowledge-network migration is not fully applied',
            details: { schemaReady, ...activity },
        });
    } catch (error) {
        checks.push({
            name: 'knowledge_network',
            status: 'degraded',
            responseTimeMs: Date.now() - knowledgeStart,
            message: error instanceof Error ? error.message : 'Knowledge-network health check failed',
        });
    }

    // Check KV Cache
    const cacheStart = Date.now();
    try {
        const testKey = `health:${Date.now()}`;
        await c.env.CACHE.put(testKey, 'ok', { expirationTtl: 60 });
        const value = await c.env.CACHE.get(testKey);
        await c.env.CACHE.delete(testKey);
        checks.push({
            name: 'kv_cache',
            status: value === 'ok' ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - cacheStart,
        });
    } catch (error) {
        checks.push({
            name: 'kv_cache',
            status: 'unhealthy',
            responseTimeMs: Date.now() - cacheStart,
            message: error instanceof Error ? error.message : 'KV cache unavailable',
        });
    }

    // Check Rate Limit KV
    const rateLimitStart = Date.now();
    try {
        await c.env.RATE_LIMIT.put('health:test', '1', { expirationTtl: 60 });
        checks.push({
            name: 'rate_limit',
            status: 'healthy',
            responseTimeMs: Date.now() - rateLimitStart,
        });
    } catch (error) {
        checks.push({
            name: 'rate_limit',
            status: 'unhealthy',
            responseTimeMs: Date.now() - rateLimitStart,
            message: error instanceof Error ? error.message : 'Rate limit KV unavailable',
        });
    }

    // Check media storage used by article narration and locally stored assets.
    const mediaStart = Date.now();
    try {
        const { deleteMedia, getMedia, putMedia } = await import('../lib/media');
        const key = `health/${crypto.randomUUID()}.txt`;
        await putMedia(c.env, key, new TextEncoder().encode('ok'), 'text/plain');
        const stored = await getMedia(c.env, key);
        await deleteMedia(c.env, key);
        checks.push({
            name: 'media_storage',
            status: stored ? 'healthy' : 'unhealthy',
            responseTimeMs: Date.now() - mediaStart,
            details: { provider: c.env.MEDIA ? 'r2' : c.env.MEDIA_KV ? 'kv' : 'none' },
        });
    } catch (error) {
        checks.push({
            name: 'media_storage',
            status: 'unhealthy',
            responseTimeMs: Date.now() - mediaStart,
            message: error instanceof Error ? error.message : 'Media storage unavailable',
        });
    }

    // Check whether scheduled workers are producing the outputs promised by
    // the reader UI, not merely whether their underlying bindings respond.
    const outputStart = Date.now();
    try {
        const output = await c.env.DB.prepare(`
            SELECT
                (SELECT COUNT(*) FROM articles WHERE status = 'published') AS published,
                (SELECT COUNT(*) FROM articles WHERE status = 'published' AND audio_url IS NOT NULL AND audio_url != '') AS audio,
                (SELECT COUNT(*) FROM article_translations WHERE quality = 1) AS translations,
                (SELECT COUNT(*) FROM generated_reports) AS reports
        `).first<{ published: number; audio: number; translations: number; reports: number }>();
        const published = Number(output?.published || 0);
        const audio = Number(output?.audio || 0);
        const translations = Number(output?.translations || 0);
        const reports = Number(output?.reports || 0);
        const expectedTranslations = published * 5;
        // Backfills run continuously, so 100% audio+translation coverage is never
        // stable. Degrade only when output is genuinely absent or far behind.
        const sufficient = published > 0 && translations >= expectedTranslations * 0.5;
        checks.push({
            name: 'worker_outputs',
            status: sufficient ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - outputStart,
            details: { published, audio, translations, expectedTranslations, reports },
        });
    } catch (error) {
        checks.push({
            name: 'worker_outputs',
            status: 'unhealthy',
            responseTimeMs: Date.now() - outputStart,
            message: error instanceof Error ? error.message : 'Worker output check failed',
        });
    }

    // Publication throughput is distinct from ingestion throughput. Surface
    // drafts that can still be repaired separately from exhausted quarantine
    // records so operators can see whether evidence is moving to readers.
    const editorialQueueStart = Date.now();
    try {
        const queue = await c.env.DB.prepare(`
            SELECT
                SUM(CASE WHEN moderation_status = 'pending' AND last_audited_at IS NULL THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN moderation_status IN ('flagged', 'needs_review')
                          AND COALESCE(refinement_count, 0) < 2
                          AND last_audited_at <= datetime('now', '-6 hours')
                          AND EXISTS (
                              SELECT 1 FROM ingested_items evidence
                              WHERE evidence.article_id = articles.id
                                AND LENGTH(TRIM(COALESCE(evidence.content, ''))) >= 3000
                          )
                         THEN 1 ELSE 0 END) AS recoverable,
                SUM(CASE WHEN moderation_status IN ('flagged', 'needs_review')
                          AND COALESCE(refinement_count, 0) >= 2
                         THEN 1 ELSE 0 END) AS exhausted,
                COUNT(DISTINCT CASE WHEN moderation_status IN ('flagged', 'needs_review')
                          AND COALESCE(refinement_count, 0) < 2
                          AND last_audited_at <= datetime('now', '-6 hours')
                          AND EXISTS (
                              SELECT 1 FROM ingested_items evidence
                              WHERE evidence.article_id = articles.id
                                AND LENGTH(TRIM(COALESCE(evidence.content, ''))) >= 3000
                          )
                          AND NOT EXISTS (
                              SELECT 1 FROM articles recent
                              WHERE recent.status = 'published'
                                AND recent.country_code = articles.country_code
                                AND recent.published_at >= datetime('now', '-30 days')
                          ) THEN country_code END) AS recoverable_missing_countries,
                MIN(CASE WHEN moderation_status IN ('flagged', 'needs_review')
                          AND COALESCE(refinement_count, 0) < 2
                          AND EXISTS (
                              SELECT 1 FROM ingested_items evidence
                              WHERE evidence.article_id = articles.id
                                AND LENGTH(TRIM(COALESCE(evidence.content, ''))) >= 3000
                          )
                         THEN last_audited_at END) AS oldest_recoverable_audit,
                SUM(CASE WHEN moderation_status IN ('flagged', 'needs_review')
                          AND COALESCE(refinement_count, 0) < 2
                          AND NOT EXISTS (
                              SELECT 1 FROM ingested_items evidence
                              WHERE evidence.article_id = articles.id
                                AND LENGTH(TRIM(COALESCE(evidence.content, ''))) >= 3000
                          ) THEN 1 ELSE 0 END) AS reacquisition_required
            FROM articles
            WHERE status = 'pending_audit'
        `).first<Record<string, string | number | null>>();
        const pending = Number(queue?.pending || 0);
        const recoverable = Number(queue?.recoverable || 0);
        checks.push({
            name: 'editorial_publication_queue',
            status: pending + recoverable <= 12 ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - editorialQueueStart,
            message: pending + recoverable <= 12
                ? undefined
                : 'The source-grounded publication and repair queue is above its operating threshold.',
            details: {
                pending,
                recoverable,
                exhaustedForHumanReview: Number(queue?.exhausted || 0),
                reacquisitionRequired: Number(queue?.reacquisition_required || 0),
                recoverableCountriesWithoutRecentEvidence: Number(queue?.recoverable_missing_countries || 0),
                oldestRecoverableAudit: queue?.oldest_recoverable_audit,
                recoveryPolicy: 'Only drafts backed by at least 3,000 source characters can enter bounded rewriting. Thin-source records are preserved for substantive reacquisition, and no record is approved by age or retry count.',
            },
        });
    } catch (error) {
        checks.push({
            name: 'editorial_publication_queue',
            status: 'unhealthy',
            responseTimeMs: Date.now() - editorialQueueStart,
            message: error instanceof Error ? error.message : 'Editorial publication queue check failed',
        });
    }

    // Sector labels affect coverage ledgers and related-story navigation. Track
    // the historical re-audit explicitly so an unreviewed taxonomy cannot look
    // like finished market evidence.
    const sectorAuditStart = Date.now();
    try {
        const audit = await c.env.DB.prepare(`
            SELECT COUNT(*) AS assigned,
                   SUM(CASE WHEN sector_reviewed_at IS NOT NULL THEN 1 ELSE 0 END) AS reviewed,
                   SUM(CASE WHEN sector_assignment_confidence >= 0.82 THEN 1 ELSE 0 END) AS qualified,
                   SUM(CASE WHEN sector_assignment_method = 'needs_editorial_review' THEN 1 ELSE 0 END) AS needs_review,
                   SUM(CASE WHEN sector_assignment_method IN ('keyword_evidence_review', 'deep_editorial_review') THEN 1 ELSE 0 END) AS evidence_reviewed,
                   SUM(CASE WHEN sector_assignment_previous IS NOT NULL THEN 1 ELSE 0 END) AS corrected
            FROM articles
            WHERE status = 'published' AND sector_id IS NOT NULL AND sector_id != ''
        `).first<Record<string, number | null>>();
        const assigned = Number(audit?.assigned || 0);
        const reviewed = Number(audit?.reviewed || 0);
        const complete = assigned === 0 || reviewed >= assigned;
        checks.push({
            name: 'sector_assignment_audit',
            status: complete ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - sectorAuditStart,
            message: complete ? undefined : 'Historical sector assignments are still being checked against their article evidence.',
            details: {
                assigned,
                reviewed,
                pending: Math.max(0, assigned - reviewed),
                qualified: Number(audit?.qualified || 0),
                needsEditorialReview: Number(audit?.needs_review || 0),
                evidenceReviewed: Number(audit?.evidence_reviewed || 0),
                corrected: Number(audit?.corrected || 0),
                minimumConfidenceForSectorStatistics: 0.82,
            },
        });
    } catch (error) {
        checks.push({
            name: 'sector_assignment_audit',
            status: 'unhealthy',
            responseTimeMs: Date.now() - sectorAuditStart,
            message: error instanceof Error ? error.message : 'Sector assignment audit check failed',
        });
    }

    // Coverage health is an output invariant. A running ingestion cron is not
    // healthy when one country or publisher dominates the evidence window.
    const diversityStart = Date.now();
    try {
        const diversity = await c.env.DB.prepare(`
            WITH recent AS (
                SELECT a.country_code,
                       COALESCE(NULLIF(a.source_title, ''), 'unattributed') AS source_title,
                       a.source_quality_tier,
                       c.region
                FROM articles a
                LEFT JOIN countries c ON c.code = a.country_code
                WHERE a.status = 'published' AND a.published_at >= datetime('now', '-30 days')
            ),
            country_counts AS (
                SELECT COALESCE(country_code, 'continental/unclassified') AS name, COUNT(*) AS n
                FROM recent GROUP BY country_code ORDER BY n DESC LIMIT 1
            ),
            source_counts AS (
                SELECT source_title AS name, COUNT(*) AS n
                FROM recent GROUP BY source_title ORDER BY n DESC LIMIT 1
            ),
            region_counts AS (
                SELECT COALESCE(region, 'continental/unclassified') AS name, COUNT(*) AS n
                FROM recent GROUP BY region ORDER BY n DESC LIMIT 1
            )
            SELECT COUNT(*) AS total,
                   COUNT(DISTINCT country_code) AS countries,
                   COUNT(DISTINCT source_title) AS publishers,
                   COUNT(DISTINCT region) AS regions,
                   SUM(CASE WHEN source_quality_tier = 4 THEN 1 ELSE 0 END) AS tier4_count,
                   SUM(CASE WHEN source_quality_tier = 3 THEN 1 ELSE 0 END) AS tier3_count,
                   SUM(CASE WHEN source_quality_tier = 2 THEN 1 ELSE 0 END) AS tier2_count,
                   (SELECT COUNT(*) FROM discovery_source_catalog WHERE is_active = 1) AS approved_discovery_domains,
                   (SELECT COUNT(*) FROM countries target
                    WHERE NOT EXISTS (
                      SELECT 1 FROM articles evidence
                      WHERE evidence.country_code = target.code
                        AND evidence.status = 'published'
                        AND evidence.published_at >= datetime('now', '-30 days')
                    )) AS countries_without_recent_evidence,
                   (SELECT COUNT(*) FROM ingested_items blocked
                    WHERE blocked.status = 'rejected'
                      AND blocked.created_at >= datetime('now', '-24 hours')
                      AND blocked.rejection_reason LIKE 'rolling country balance:%') AS country_balance_blocks_24h,
                   (SELECT COUNT(*) FROM ingested_items blocked
                    WHERE blocked.status = 'rejected'
                      AND blocked.created_at >= datetime('now', '-24 hours')
                      AND blocked.rejection_reason LIKE 'rolling source balance:%') AS source_balance_blocks_24h,
                   (SELECT COUNT(*) FROM ingested_items blocked
                    WHERE blocked.status = 'rejected'
                      AND blocked.created_at >= datetime('now', '-24 hours')
                      AND blocked.rejection_reason LIKE 'source quality mix:%') AS quality_mix_blocks_24h,
                   (SELECT name FROM country_counts) AS top_country,
                   COALESCE((SELECT n FROM country_counts), 0) AS top_country_count,
                   (SELECT name FROM source_counts) AS top_publisher,
                   COALESCE((SELECT n FROM source_counts), 0) AS top_publisher_count,
                   (SELECT name FROM region_counts) AS top_region,
                   COALESCE((SELECT n FROM region_counts), 0) AS top_region_count
            FROM recent
        `).first<Record<string, string | number | null>>();
        const total = Number(diversity?.total || 0);
        const countryShare = total ? Number(diversity?.top_country_count || 0) / total : 0;
        const publisherShare = total ? Number(diversity?.top_publisher_count || 0) / total : 0;
        const regionShare = total ? Number(diversity?.top_region_count || 0) / total : 0;
        const tier4Share = total ? Number(diversity?.tier4_count || 0) / total : 0;
        const tier2Share = total ? Number(diversity?.tier2_count || 0) / total : 0;
        const balanced = total === 0 || (
            Number(diversity?.countries || 0) >= 54
            && Number(diversity?.regions || 0) >= 5
            && Number(diversity?.publishers || 0) >= 20
            && countryShare <= 0.04
            && publisherShare <= 0.08
            && regionShare <= 0.38
            && tier4Share >= 0.50
            && tier2Share <= 0.20
        );
        checks.push({
            name: 'coverage_diversity',
            status: balanced ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - diversityStart,
            message: balanced ? undefined : 'The rolling evidence window has not yet met the all-country, publisher and global-source quality standard.',
            details: {
                windowDays: 30,
                total,
                countries: Number(diversity?.countries || 0),
                publishers: Number(diversity?.publishers || 0),
                regions: Number(diversity?.regions || 0),
                approvedDiscoveryDomains: Number(diversity?.approved_discovery_domains || 0),
                topCountry: diversity?.top_country,
                topCountryShare: Number(countryShare.toFixed(3)),
                topPublisher: diversity?.top_publisher,
                topPublisherShare: Number(publisherShare.toFixed(3)),
                topRegion: diversity?.top_region,
                topRegionShare: Number(regionShare.toFixed(3)),
                primaryOrGlobalShare: Number(tier4Share.toFixed(3)),
                establishedSpecialistShare: Number((total ? Number(diversity?.tier3_count || 0) / total : 0).toFixed(3)),
                verifiedNationalShare: Number(tier2Share.toFixed(3)),
                unresolvedDeficits: {
                    countriesWithoutRecentEvidence: Number(diversity?.countries_without_recent_evidence || 0),
                },
                balancingActions24h: {
                    countryConcentrationBlocked: Number(diversity?.country_balance_blocks_24h || 0),
                    publisherConcentrationBlocked: Number(diversity?.source_balance_blocks_24h || 0),
                    sourceQualityMixBlocked: Number(diversity?.quality_mix_blocks_24h || 0),
                },
                acquisitionPolicy: 'Each fixed-source run reserves fetch capacity for underserved exact-country lanes and underrepresented authoritative cross-market publishers. Publication remains subject to independent country, publisher and source-tier caps.',
                healthyThresholds: {
                    minimumCountries: 54,
                    minimumRegions: 5,
                    minimumPublishers: 20,
                    maximumCountryShare: 0.04,
                    maximumPublisherShare: 0.08,
                    maximumRegionShare: 0.38,
                    minimumPrimaryOrGlobalShare: 0.50,
                    maximumVerifiedNationalShare: 0.20,
                },
            },
        });
    } catch (error) {
        checks.push({
            name: 'coverage_diversity',
            status: 'unhealthy',
            responseTimeMs: Date.now() - diversityStart,
            message: error instanceof Error ? error.message : 'Coverage diversity check failed',
        });
    }

    // A configured source is not counted as operational until acquisition has
    // observed it and it has supplied qualifying evidence. This prevents a
    // large catalogue of broken or inaccessible URLs from masquerading as a
    // broad source network.
    const acquisitionStart = Date.now();
    try {
        const acquisition = await c.env.DB.prepare(`
            SELECT s.name, s.url,
                   COALESCE(y.last_fetched_at, s.last_fetched_at) AS last_checked_at,
                   y.last_fetched_at AS last_acquisition_at, y.last_qualified_found,
                   y.last_productive_at, y.last_error, y.total_queued
            FROM sources s
            LEFT JOIN source_acquisition_yield y ON y.source_id = s.id
            WHERE s.is_active = 1 AND s.type IN ('rss', 'html', 'newsapi', 'worldbank-api')
              AND s.id = (
                SELECT canonical.id FROM sources canonical
                WHERE canonical.is_active = 1 AND canonical.url = s.url
                ORDER BY canonical.created_at ASC, canonical.id ASC LIMIT 1
              )
        `).all<Record<string, string | number | null>>();
        const acquisitionRows = acquisition.results || [];
        const activeSources = acquisitionRows.length;
        const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
        const cutoff30d = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const isRecent = (value: string | number | null | undefined, cutoff: number) => {
            const timestamp = typeof value === 'string' ? Date.parse(value.endsWith('Z') ? value : `${value}Z`) : NaN;
            return Number.isFinite(timestamp) && timestamp >= cutoff;
        };
        // A source can be inspected and deliberately paused before a network
        // fetch when the national-source mix is already above its ceiling.
        // That is current scheduler evidence, not missing telemetry. Productive
        // thresholds below still rely exclusively on real queued acquisition.
        const measuredSources = acquisitionRows.filter(row => row.last_checked_at).length;
        const measured24h = acquisitionRows.filter(row => isRecent(row.last_checked_at, cutoff24h)).length;
        const acquired24h = acquisitionRows.filter(row => isRecent(row.last_acquisition_at, cutoff24h)).length;
        const qualifyingLatest = acquisitionRows.filter(row => Number(row.last_qualified_found || 0) > 0).length;
        const productiveRows = acquisitionRows.filter(row => isRecent(row.last_productive_at, cutoff30d));
        const productive30d = productiveRows.length;
        const primaryProductive30d = productiveRows.filter(row => sourceQualityProfile(String(row.name || ''), String(row.url || ''), 'fixed').tier === 4).length;
        const highQualityProductive30d = productiveRows.filter(row => sourceQualityProfile(String(row.name || ''), String(row.url || ''), 'fixed').tier >= 3).length;
        const minimumProductive = Math.min(20, Math.ceil(activeSources * 0.25));
        const minimumPrimaryProductive = Math.min(15, Math.ceil(activeSources * 0.25));
        const minimumHighQualityProductive = Math.min(20, Math.ceil(activeSources * 0.40));
        const healthy = activeSources > 0
            && measured24h >= Math.ceil(activeSources * 0.9)
            && productive30d >= minimumProductive
            && primaryProductive30d >= minimumPrimaryProductive
            && highQualityProductive30d >= minimumHighQualityProductive;
        checks.push({
            name: 'source_acquisition',
            status: healthy ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - acquisitionStart,
            message: healthy ? undefined : 'The active source network has not yet demonstrated sufficient recent, qualifying production.',
            details: {
                activeSources,
                measuredSources,
                measured24h,
                acquired24h,
                qualifyingLatest,
                productive30d,
                primaryProductive30d,
                highQualityProductive30d,
                errorsLatest: acquisitionRows.filter(row => row.last_error).length,
                totalQueued: acquisitionRows.reduce((sum, row) => sum + Number(row.total_queued || 0), 0),
                healthyThresholds: {
                    minimumMeasuredShare24h: 0.9,
                    minimumProductiveSources30d: minimumProductive,
                    minimumPrimaryProductiveSources30d: minimumPrimaryProductive,
                    minimumHighQualityProductiveSources30d: minimumHighQualityProductive,
                },
            },
        });
    } catch (error) {
        checks.push({
            name: 'source_acquisition',
            status: 'unhealthy',
            responseTimeMs: Date.now() - acquisitionStart,
            message: error instanceof Error ? error.message : 'Source acquisition yield check failed',
        });
    }

    const emailConfigured = Boolean(
        c.env.EMAIL_FROM && (c.env.EMAIL?.send || c.env.RESEND_API_KEY)
    );
    checks.push({
        name: 'email_delivery',
        status: emailConfigured ? 'healthy' : 'degraded',
        responseTimeMs: 0,
        message: emailConfigured ? undefined : 'No verified transactional email provider and sender are configured',
    });

    // Check Vectorize
    const vectorStart = Date.now();
    try {
        // Try a simple query with a dummy vector
        await c.env.VECTORS.query(new Array(768).fill(0), { topK: 1 });
        checks.push({
            name: 'vectorize',
            status: 'healthy',
            responseTimeMs: Date.now() - vectorStart,
        });
    } catch (error) {
        checks.push({
            name: 'vectorize',
            status: 'degraded',
            responseTimeMs: Date.now() - vectorStart,
            message: error instanceof Error ? error.message : 'Vectorize query failed',
        });
    }

    // Check Service (Circuit Breaker status)
    const aiStart = Date.now();
    try {
        const { getCircuitBreakerStatus } = await import('../lib/circuit-breaker');
        const aiTextGenStatus = await getCircuitBreakerStatus(c.env, 'ai-text-gen');
        const aiEmbeddingsStatus = await getCircuitBreakerStatus(c.env, 'ai-embeddings');
        
        checks.push({
            name: 'editorial_generation',
            status: aiTextGenStatus.state === 'OPEN' ? 'degraded' : 'healthy',
            responseTimeMs: Date.now() - aiStart,
            details: {
                generationCircuit: aiTextGenStatus.state,
                retrievalCircuit: aiEmbeddingsStatus.state,
                generationFailures: aiTextGenStatus.failures,
            },
        });
    } catch (error) {
        checks.push({
            name: 'editorial_generation',
            status: 'degraded',
            responseTimeMs: Date.now() - aiStart,
            message: error instanceof Error ? error.message : 'Editorial generation status check failed',
        });
    }

    // Check Durable Objects
    const doStart = Date.now();
    try {
        const id = c.env.LIVE_COUNTER.idFromName('health-check');
        const stub = c.env.LIVE_COUNTER.get(id);
        const response = await stub.fetch(new Request('https://internal/get'));
        checks.push({
            name: 'durable_objects',
            status: response.ok ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - doStart,
        });
    } catch (error) {
        checks.push({
            name: 'durable_objects',
            status: 'unhealthy',
            responseTimeMs: Date.now() - doStart,
            message: error instanceof Error ? error.message : 'Durable Objects unavailable',
        });
    }

    // Calculate overall status
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) overallStatus = 'unhealthy';
    else if (degradedCount > 0) overallStatus = 'degraded';

    const totalResponseTime = Date.now() - startTime;

    // Log health check to analytics
    try {
        c.env.ANALYTICS.writeDataPoint({
            blobs: ['health_check', overallStatus],
            doubles: [totalResponseTime, checks.length, unhealthyCount, degradedCount],
            indexes: ['health_check', overallStatus],
        });
    } catch {
        // Ignore analytics errors
    }

    return c.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: c.env.API_VERSION || '2.4.0',
        environment: c.env.ENVIRONMENT || 'development',
        response_time_ms: totalResponseTime,
        checks,
    }, overallStatus === 'healthy' ? 200 : 503);
});

// ───────────────────────────────────────────────────────────────────────────────
// Readiness Probe - For Kubernetes/Docker health checks
// ───────────────────────────────────────────────────────────────────────────────
router.get('/health/ready', async (c) => {
    try {
        // Minimal check - just verify DB is accessible
        await c.env.DB.prepare('SELECT 1').first();
        return c.json({ ready: true }, 200);
    } catch {
        return c.json({ ready: false }, 503);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// Liveness Probe - For Kubernetes/Docker health checks
// ───────────────────────────────────────────────────────────────────────────────
router.get('/health/live', async (c) => {
    // Simple liveness check - if we can respond, we're alive
    return c.json({ alive: true }, 200);
});

export { router as systemRouter };
