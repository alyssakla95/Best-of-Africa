import { Hono } from 'hono';
import { z } from 'zod';
import Stripe from 'stripe';
import type { Env, Variables } from '../types';
import { createJWT, requireClientAuth, requireMarketplaceEnterprise, requireSpecialist } from '../lib/auth';
import { hashPassword } from '../lib/password';
import { throttle } from '../lib/ratelimit';
import {
    appendMarketplaceAudit,
    parseStringArray,
    publicProfile,
    sha256,
    synchronizeProfileListing,
} from '../lib/marketplace';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();
const text = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum);
const stringList = z.array(text(1, 100)).min(1).max(20);
const optionalUrlList = z.array(z.string().url().max(500)).max(10).default([]);

const ApplicationSchema = z.object({
    token: text(20, 200),
    password: z.string().min(12).max(128),
    contact_name: text(2, 120),
    entity_type: z.enum(['individual', 'organization']),
    organization: z.string().trim().max(160).optional(),
    role_title: z.string().trim().max(120).optional(),
    headline: text(10, 180),
    biography: text(80, 4000),
    countries: stringList,
    sectors: stringList,
    service_categories: stringList,
    languages: stringList,
    credential_summary: text(20, 2000),
    credential_links: optionalUrlList,
    indicative_pricing: z.string().trim().max(500).optional(),
    availability: z.string().trim().max(500).optional(),
    conflicts_declaration: text(2, 2000),
    no_sensitive_data_confirmed: z.literal(true),
});

const ProfileSchema = z.object({
    display_name: text(2, 120),
    organization: z.string().trim().max(160).nullable().optional(),
    headline: text(10, 180),
    biography: text(80, 4000),
    countries: stringList,
    sectors: stringList,
    service_categories: stringList,
    languages: stringList,
    credential_summary: text(20, 2000),
    credential_links: optionalUrlList,
    indicative_pricing: z.string().trim().max(500).nullable().optional(),
    availability: z.string().trim().max(500).nullable().optional(),
});

const RequestSchema = z.object({
    title: text(5, 180),
    decision_question: text(10, 2000),
    countries: stringList,
    sector: text(2, 120),
    required_expertise: stringList,
    preferred_languages: stringList,
    decision_deadline: z.string().date().optional(),
    context_summary: z.string().trim().max(4000).optional(),
    no_sensitive_data_confirmed: z.literal(true),
});

const ProposalSchema = z.object({
    scope_summary: text(20, 3000),
    assumptions: z.string().trim().max(2000).optional(),
    timeline: text(2, 500),
    indicative_fee: text(2, 500),
});

function jsonArray(value: string[]): string {
    return JSON.stringify([...new Set(value.map(item => item.trim()).filter(Boolean))]);
}

function slugify(value: string): string {
    const base = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    return `${base || 'specialist'}-${crypto.randomUUID().slice(0, 8)}`;
}

function stripeClient(env: Env): Stripe | null {
    if (!env.STRIPE_SECRET_KEY) return null;
    return new Stripe(env.STRIPE_SECRET_KEY, {
        httpClient: Stripe.createFetchHttpClient(),
    });
}

// Exact signed webhook route. The global CSRF guard exempts only this path.
router.post('/stripe/webhook', async (c) => {
    const stripe = stripeClient(c.env);
    const signature = c.req.header('Stripe-Signature');
    if (!stripe || !c.env.STRIPE_WEBHOOK_SECRET || !signature) {
        return c.json({ error: 'stripe_not_configured' }, 503);
    }

    const rawBody = await c.req.text();
    let event: Stripe.Event;
    try {
        event = await stripe.webhooks.constructEventAsync(
            rawBody,
            signature,
            c.env.STRIPE_WEBHOOK_SECRET,
        );
    } catch {
        return c.json({ error: 'invalid_signature' }, 400);
    }

    const inserted = await c.env.DB.prepare(`
        INSERT OR IGNORE INTO stripe_webhook_events (event_id, event_type)
        VALUES (?, ?)
    `).bind(event.id, event.type).run();
    if (!inserted.meta.changes) {
        const existing = await c.env.DB.prepare(`
            SELECT status FROM stripe_webhook_events WHERE event_id = ?
        `).bind(event.id).first<{ status: string }>();
        if (existing?.status !== 'failed') {
            return c.json({ received: true, duplicate: true });
        }
        await c.env.DB.prepare(`
            UPDATE stripe_webhook_events
            SET status = 'processing', error = NULL, attempts = attempts + 1,
                updated_at = datetime('now')
            WHERE event_id = ? AND status = 'failed'
        `).bind(event.id).run();
    }

    try {
        const object = event.data.object as Stripe.Subscription | Stripe.Checkout.Session | Stripe.Invoice;
        let clientId: string | null = null;
        let customerId: string | null = null;
        let subscriptionId: string | null = null;
        let status: string | null = null;
        let currentPeriodEnd: string | null = null;
        let cancelAtPeriodEnd = 0;

        if (event.type === 'checkout.session.completed') {
            const session = object as Stripe.Checkout.Session;
            clientId = session.client_reference_id || session.metadata?.client_id || null;
            customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
            subscriptionId = typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id || null;
            status = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
                ? 'active'
                : 'incomplete';
        } else if (event.type.startsWith('customer.subscription.')) {
            const subscription = object as Stripe.Subscription;
            clientId = subscription.metadata.client_id || null;
            customerId = typeof subscription.customer === 'string'
                ? subscription.customer
                : subscription.customer.id;
            subscriptionId = subscription.id;
            status = subscription.status === 'trialing'
                ? 'active'
                : subscription.status === 'paused'
                    ? 'past_due'
                    : subscription.status;
            const periodEnd = subscription.items.data[0]?.current_period_end;
            currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;
            cancelAtPeriodEnd = subscription.cancel_at_period_end ? 1 : 0;
        } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
            const invoice = object as Stripe.Invoice;
            customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id || null;
            status = event.type === 'invoice.paid' ? 'active' : 'past_due';
            const existing = customerId
                ? await c.env.DB.prepare(`
                    SELECT client_id FROM specialist_subscriptions WHERE stripe_customer_id = ?
                `).bind(customerId).first<{ client_id: string }>()
                : null;
            clientId = existing?.client_id || null;
        }

        if (clientId && status) {
            await c.env.DB.prepare(`
                INSERT INTO specialist_subscriptions (
                    client_id, stripe_customer_id, stripe_subscription_id, status,
                    current_period_end, cancel_at_period_end, last_event_created, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                ON CONFLICT(client_id) DO UPDATE SET
                    stripe_customer_id = COALESCE(excluded.stripe_customer_id, stripe_customer_id),
                    stripe_subscription_id = COALESCE(excluded.stripe_subscription_id, stripe_subscription_id),
                    status = excluded.status,
                    current_period_end = COALESCE(excluded.current_period_end, current_period_end),
                    cancel_at_period_end = excluded.cancel_at_period_end,
                    last_event_created = excluded.last_event_created,
                    updated_at = datetime('now')
                WHERE excluded.last_event_created >= COALESCE(specialist_subscriptions.last_event_created, 0)
            `).bind(
                clientId,
                customerId,
                subscriptionId,
                status,
                currentPeriodEnd,
                cancelAtPeriodEnd,
                event.created,
            ).run();
            await synchronizeProfileListing(c.env, clientId);
            await appendMarketplaceAudit(c.env, {
                actorType: 'stripe',
                actorId: event.id,
                entityType: 'subscription',
                entityId: clientId,
                eventType: event.type,
                toStatus: status,
            });
        }
        await c.env.DB.prepare(`
            UPDATE stripe_webhook_events
            SET status = 'processed', processed_at = datetime('now'), updated_at = datetime('now')
            WHERE event_id = ?
        `).bind(event.id).run();
        return c.json({ received: true });
    } catch (error) {
        await c.env.DB.prepare(`
            UPDATE stripe_webhook_events
            SET status = 'failed', error = ?, updated_at = datetime('now')
            WHERE event_id = ?
        `).bind(error instanceof Error ? error.message.slice(0, 500) : 'processing failed', event.id).run();
        return c.json({ error: 'webhook_processing_failed' }, 500);
    }
});

router.use('*', async (c, next) => {
    if (c.env.MARKETPLACE_ENABLED !== 'true') {
        return c.json({ error: 'not_found' }, 404);
    }
    await next();
});

router.post('/join', async (c) => {
    const limited = await throttle(c, 'specialist-join');
    if (limited) return limited;
    const parsed = ApplicationSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    const tokenHash = await sha256(body.token);
    const invite = await c.env.DB.prepare(`
        SELECT id, email, status, expires_at FROM specialist_invites WHERE token_hash = ?
    `).bind(tokenHash).first<{ id: string; email: string; status: string; expires_at: string }>();
    if (!invite || invite.status !== 'issued' || new Date(invite.expires_at) <= new Date()) {
        return c.json({ error: 'invalid_invitation', message: 'Invitation is invalid, expired, or already used' }, 400);
    }

    const existing = await c.env.DB.prepare('SELECT id FROM clients WHERE lower(email) = lower(?)')
        .bind(invite.email).first<{ id: string }>();
    if (existing) return c.json({ error: 'account_exists' }, 409);

    const clientId = crypto.randomUUID();
    const applicationId = crypto.randomUUID();
    const passwordHash = await hashPassword(body.password);
    await c.env.DB.batch([
        c.env.DB.prepare(`
            INSERT INTO clients (
                id, name, email, organization, type, api_key_hash, tier,
                rate_limit_per_hour, is_active, created_at
            ) VALUES (?, ?, ?, ?, 'specialist', ?, 'specialist', 200, 1, datetime('now'))
        `).bind(clientId, body.contact_name, invite.email.toLowerCase(), body.organization || null, passwordHash),
        c.env.DB.prepare(`
            INSERT INTO specialist_applications (
                id, invite_id, client_id, contact_name, work_email, entity_type,
                organization, role_title, headline, biography, countries, sectors,
                service_categories, languages, credential_summary, credential_links,
                indicative_pricing, availability, conflicts_declaration,
                no_sensitive_data_confirmed, status, retention_until
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1,
                'submitted', datetime('now', '+24 months'))
        `).bind(
            applicationId, invite.id, clientId, body.contact_name, invite.email.toLowerCase(),
            body.entity_type, body.organization || null, body.role_title || null, body.headline,
            body.biography, jsonArray(body.countries), jsonArray(body.sectors),
            jsonArray(body.service_categories), jsonArray(body.languages), body.credential_summary,
            jsonArray(body.credential_links), body.indicative_pricing || null, body.availability || null,
            body.conflicts_declaration,
        ),
        c.env.DB.prepare(`
            UPDATE specialist_invites
            SET status = 'redeemed', redeemed_at = datetime('now'), application_id = ?,
                updated_at = datetime('now')
            WHERE id = ? AND status = 'issued'
        `).bind(applicationId, invite.id),
    ]);
    await appendMarketplaceAudit(c.env, {
        actorType: 'specialist',
        actorId: clientId,
        entityType: 'application',
        entityId: applicationId,
        eventType: 'submitted',
        toStatus: 'submitted',
    });
    return c.json({
        success: true,
        application_id: applicationId,
        token: await createJWT(clientId, c.env.JWT_SECRET),
    }, 201);
});

router.get('/dashboard', requireClientAuth, async (c) => {
    const clientId = c.get('clientId');
    const application = await c.env.DB.prepare(`
        SELECT id, contact_name, work_email, organization, role_title, headline, biography,
               countries, sectors, service_categories, languages, credential_summary,
               credential_links, indicative_pricing, availability, status, screened_at, updated_at
        FROM specialist_applications WHERE client_id = ?
    `).bind(clientId).first<Record<string, unknown>>();
    if (!application) return c.json({ error: 'not_a_specialist' }, 403);
    const [profile, subscription, matches] = await Promise.all([
        c.env.DB.prepare('SELECT * FROM specialist_profiles WHERE client_id = ?').bind(clientId)
            .first<Record<string, unknown>>(),
        c.env.DB.prepare(`
            SELECT status, current_period_end, cancel_at_period_end, updated_at
            FROM specialist_subscriptions WHERE client_id = ?
        `).bind(clientId).first(),
        c.env.DB.prepare(`
            SELECT m.*, r.title, r.decision_question, r.countries, r.sector,
                   r.required_expertise, r.preferred_languages, r.decision_deadline, r.context_summary
            FROM specialist_matches m JOIN specialist_requests r ON r.id = m.request_id
            WHERE m.specialist_client_id = ? AND m.status != 'suggested'
            ORDER BY m.created_at DESC
        `).bind(clientId).all(),
    ]);
    return c.json({
        application: {
            ...application,
            countries: parseStringArray(application.countries),
            sectors: parseStringArray(application.sectors),
            service_categories: parseStringArray(application.service_categories),
            languages: parseStringArray(application.languages),
            credential_links: parseStringArray(application.credential_links),
        },
        profile: profile ? publicProfile(profile) : null,
        listing_access: profile ? {
            fee_waived: Boolean(profile.listing_fee_waived)
                && (!profile.listing_fee_waived_until
                    || new Date(String(profile.listing_fee_waived_until)).getTime() > Date.now()),
            fee_waived_until: profile.listing_fee_waived_until || null,
        } : null,
        subscription,
        matches: matches.results || [],
    });
});

router.put('/dashboard/profile', requireSpecialist, async (c) => {
    const parsed = ProfileSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    await c.env.DB.prepare(`
        UPDATE specialist_profiles SET display_name = ?, organization = ?, headline = ?,
            biography = ?, countries = ?, sectors = ?, service_categories = ?, languages = ?,
            credential_summary = ?, credential_links = ?, indicative_pricing = ?,
            availability = ?, updated_at = datetime('now')
        WHERE client_id = ?
    `).bind(
        body.display_name, body.organization || null, body.headline, body.biography,
        jsonArray(body.countries), jsonArray(body.sectors), jsonArray(body.service_categories),
        jsonArray(body.languages), body.credential_summary, jsonArray(body.credential_links),
        body.indicative_pricing || null, body.availability || null, c.get('clientId'),
    ).run();
    return c.json({ success: true });
});

router.post('/billing/checkout', requireSpecialist, async (c) => {
    const clientId = c.get('clientId');
    const standing = await c.env.DB.prepare(`
        SELECT listing_fee_waived, listing_fee_waived_until
        FROM specialist_profiles WHERE client_id = ?
    `).bind(clientId).first<{ listing_fee_waived: number; listing_fee_waived_until: string | null }>();
    if (standing?.listing_fee_waived
        && (!standing.listing_fee_waived_until
            || new Date(standing.listing_fee_waived_until).getTime() > Date.now())) {
        return c.json({ error: 'listing_fee_waived' }, 409);
    }
    const stripe = stripeClient(c.env);
    if (!stripe || !c.env.STRIPE_SPECIALIST_PRICE_ID || !c.env.PUBLIC_SITE_URL) {
        return c.json({ error: 'stripe_not_configured' }, 503);
    }
    const [client, existing] = await Promise.all([
        c.env.DB.prepare('SELECT email FROM clients WHERE id = ?').bind(clientId)
            .first<{ email: string }>(),
        c.env.DB.prepare('SELECT stripe_customer_id FROM specialist_subscriptions WHERE client_id = ?')
            .bind(clientId).first<{ stripe_customer_id: string | null }>(),
    ]);
    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: c.env.STRIPE_SPECIALIST_PRICE_ID, quantity: 1 }],
        client_reference_id: clientId,
        metadata: { client_id: clientId },
        subscription_data: { metadata: { client_id: clientId } },
        customer: existing?.stripe_customer_id || undefined,
        customer_email: existing?.stripe_customer_id ? undefined : client?.email,
        success_url: `${c.env.PUBLIC_SITE_URL.replace(/\/$/, '')}/specialists/dashboard?billing=success`,
        cancel_url: `${c.env.PUBLIC_SITE_URL.replace(/\/$/, '')}/specialists/dashboard?billing=cancelled`,
    }, { idempotencyKey: `specialist-checkout-${clientId}-${Math.floor(Date.now() / 600_000)}` });
    await c.env.DB.prepare(`
        INSERT INTO specialist_subscriptions (client_id, stripe_checkout_session_id, status)
        VALUES (?, ?, 'checkout_open')
        ON CONFLICT(client_id) DO UPDATE SET stripe_checkout_session_id = excluded.stripe_checkout_session_id,
            status = CASE WHEN status = 'active' THEN status ELSE 'checkout_open' END,
            updated_at = datetime('now')
    `).bind(clientId, session.id).run();
    return c.json({ url: session.url });
});

router.post('/billing/portal', requireSpecialist, async (c) => {
    const stripe = stripeClient(c.env);
    if (!stripe || !c.env.PUBLIC_SITE_URL) return c.json({ error: 'stripe_not_configured' }, 503);
    const subscription = await c.env.DB.prepare(`
        SELECT stripe_customer_id FROM specialist_subscriptions WHERE client_id = ?
    `).bind(c.get('clientId')).first<{ stripe_customer_id: string | null }>();
    if (!subscription?.stripe_customer_id) return c.json({ error: 'billing_account_not_found' }, 404);
    const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${c.env.PUBLIC_SITE_URL.replace(/\/$/, '')}/specialists/dashboard`,
    });
    return c.json({ url: session.url });
});

router.post('/requests', requireMarketplaceEnterprise, async (c) => {
    const parsed = RequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const body = parsed.data;
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO specialist_requests (
            id, requester_client_id, title, decision_question, countries, sector,
            required_expertise, preferred_languages, decision_deadline, context_summary,
            no_sensitive_data_confirmed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
        id, c.get('clientId'), body.title, body.decision_question, jsonArray(body.countries),
        body.sector, jsonArray(body.required_expertise), jsonArray(body.preferred_languages),
        body.decision_deadline || null, body.context_summary || null,
    ).run();
    await appendMarketplaceAudit(c.env, {
        actorType: 'enterprise',
        actorId: c.get('clientId'),
        entityType: 'request',
        entityId: id,
        eventType: 'submitted',
        toStatus: 'submitted',
    });
    return c.json({ id, status: 'submitted' }, 201);
});

router.get('/requests', requireMarketplaceEnterprise, async (c) => {
    const result = await c.env.DB.prepare(`
        SELECT id, title, sector, countries, decision_deadline, status, created_at, updated_at
        FROM specialist_requests WHERE requester_client_id = ? ORDER BY created_at DESC
    `).bind(c.get('clientId')).all();
    return c.json({ data: result.results || [] });
});

router.get('/requests/:id', requireMarketplaceEnterprise, async (c) => {
    const request = await c.env.DB.prepare(`
        SELECT * FROM specialist_requests WHERE id = ? AND requester_client_id = ?
    `).bind(c.req.param('id'), c.get('clientId')).first<Record<string, unknown>>();
    if (!request) return c.json({ error: 'not_found' }, 404);
    const proposals = await c.env.DB.prepare(`
        SELECT p.id, p.scope_summary, p.assumptions, p.timeline, p.indicative_fee,
               p.status, p.created_at, sp.display_name, sp.organization, sp.slug
        FROM specialist_proposals p
        JOIN specialist_profiles sp ON sp.client_id = p.specialist_client_id
        WHERE p.request_id = ? AND p.status != 'withdrawn'
        ORDER BY p.created_at DESC
    `).bind(c.req.param('id')).all();
    return c.json({
        request: {
            ...request,
            countries: parseStringArray(request.countries),
            required_expertise: parseStringArray(request.required_expertise),
            preferred_languages: parseStringArray(request.preferred_languages),
        },
        proposals: proposals.results || [],
    });
});

router.post('/matches/:matchId/proposals', requireSpecialist, async (c) => {
    const parsed = ProposalSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error', issues: parsed.error.issues }, 400);
    const match = await c.env.DB.prepare(`
        SELECT m.id, m.request_id, m.status FROM specialist_matches m
        JOIN specialist_subscriptions s ON s.client_id = m.specialist_client_id
        WHERE m.id = ? AND m.specialist_client_id = ? AND m.status = 'invited'
          AND s.status = 'active'
    `).bind(c.req.param('matchId'), c.get('clientId'))
        .first<{ id: string; request_id: string; status: string }>();
    if (!match) return c.json({ error: 'match_not_found' }, 404);
    const id = crypto.randomUUID();
    await c.env.DB.batch([
        c.env.DB.prepare(`
            INSERT INTO specialist_proposals (
                id, match_id, request_id, specialist_client_id, scope_summary,
                assumptions, timeline, indicative_fee
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id, match.id, match.request_id, c.get('clientId'), parsed.data.scope_summary,
            parsed.data.assumptions || null, parsed.data.timeline, parsed.data.indicative_fee,
        ),
        c.env.DB.prepare(`
            UPDATE specialist_matches SET status = 'proposal_submitted', updated_at = datetime('now')
            WHERE id = ?
        `).bind(match.id),
        c.env.DB.prepare(`
            UPDATE specialist_requests SET status = 'proposals_ready', updated_at = datetime('now')
            WHERE id = ?
        `).bind(match.request_id),
    ]);
    return c.json({ id, status: 'submitted' }, 201);
});

router.patch('/proposals/:id', requireClientAuth, async (c) => {
    const parsed = z.object({ status: z.enum(['accepted', 'declined', 'withdrawn']) })
        .safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'validation_error' }, 400);
    const proposal = await c.env.DB.prepare(`
        SELECT p.id, p.specialist_client_id, p.request_id, p.status, r.requester_client_id
        FROM specialist_proposals p JOIN specialist_requests r ON r.id = p.request_id
        WHERE p.id = ?
    `).bind(c.req.param('id')).first<{
        id: string; specialist_client_id: string; request_id: string; status: string; requester_client_id: string;
    }>();
    if (!proposal) return c.json({ error: 'not_found' }, 404);
    const clientId = c.get('clientId');
    const allowed = parsed.data.status === 'withdrawn'
        ? proposal.specialist_client_id === clientId
        : proposal.requester_client_id === clientId;
    if (!allowed) return c.json({ error: 'forbidden' }, 403);
    if (proposal.status !== 'submitted') {
        return c.json({ error: 'invalid_transition', from: proposal.status, to: parsed.data.status }, 409);
    }
    const updates = [
        c.env.DB.prepare(`
            UPDATE specialist_proposals SET status = ?, updated_at = datetime('now')
            WHERE id = ? AND status = 'submitted'
        `).bind(parsed.data.status, proposal.id),
    ];
    if (parsed.data.status === 'accepted') {
        updates.push(
            c.env.DB.prepare(`
                UPDATE specialist_proposals SET status = 'declined', updated_at = datetime('now')
                WHERE request_id = ? AND id != ? AND status = 'submitted'
            `).bind(proposal.request_id, proposal.id),
            c.env.DB.prepare(`
                UPDATE specialist_requests SET status = 'closed', updated_at = datetime('now')
                WHERE id = ?
            `).bind(proposal.request_id),
        );
    }
    await c.env.DB.batch(updates);
    await appendMarketplaceAudit(c.env, {
        actorType: parsed.data.status === 'withdrawn' ? 'specialist' : 'enterprise',
        actorId: clientId,
        entityType: 'proposal',
        entityId: proposal.id,
        eventType: parsed.data.status,
        fromStatus: proposal.status,
        toStatus: parsed.data.status,
    });
    return c.json({ success: true });
});

router.get('/', async (c) => {
    const country = c.req.query('country')?.toLowerCase();
    const sector = c.req.query('sector')?.toLowerCase();
    const language = c.req.query('language')?.toLowerCase();
    const service = c.req.query('service')?.toLowerCase();
    const result = await c.env.DB.prepare(`
        SELECT id, slug, display_name, organization, headline, biography, countries,
               sectors, service_categories, languages, credential_summary,
               credential_links, indicative_pricing, availability, verification_level,
               verification_summary, founding_cohort, listed_at
        FROM specialist_profiles
        WHERE is_listed = 1 AND screening_status = 'approved'
        ORDER BY listed_at DESC
        LIMIT 100
    `).all<Record<string, unknown>>();
    const data = (result.results || []).map(publicProfile).filter(profile => {
        const includes = (key: string, value?: string) => !value
            || (profile[key] as string[]).some(item => item.toLowerCase() === value);
        return includes('countries', country) && includes('sectors', sector)
            && includes('languages', language) && includes('service_categories', service);
    });
    return c.json({ data });
});

router.get('/:slug', async (c) => {
    const row = await c.env.DB.prepare(`
        SELECT id, slug, display_name, organization, headline, biography, countries,
               sectors, service_categories, languages, credential_summary,
               credential_links, indicative_pricing, availability, verification_level,
               verification_summary, founding_cohort, listed_at
        FROM specialist_profiles
        WHERE slug = ? AND is_listed = 1 AND screening_status = 'approved'
    `).bind(c.req.param('slug')).first<Record<string, unknown>>();
    if (!row) return c.json({ error: 'not_found' }, 404);
    return c.json({ data: publicProfile(row) });
});

export { router as specialistsRouter };
