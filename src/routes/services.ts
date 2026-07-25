// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES ROUTER
// Corporate services: Booking, Concierge, Events, Summits
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, CountryReport, AudienceInsights } from '../types';
import { requireApiKey, rateLimit } from '../lib/auth';
import { getCached, getCachedValue, CACHE_KEYS, CACHE_TTL } from '../lib';
import { validate, BookingRequestSchema, PaginationSchema, EventRegistrationSchema, IdOrSlugParamSchema, UuidParamSchema, CountryCodeParamSchema, AiChatSchema, AiReframeSchema, AiReformatSchema } from '../lib';
import { callConfiguredAI } from '../lib/ai';
import { z } from 'zod';
import { sendRegistrationConfirmation } from '../lib/email';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// POST /services/booking - Submit booking/concierge request
// ───────────────────────────────────────────────────────────────────────────────
router.post('/booking', validate('json', BookingRequestSchema), async (c) => {
    // Per-IP throttle — each booking triggers an AI preliminary brief, so an
    // unthrottled loop burns Workers AI budget on top of filling D1.
    const { throttle } = await import('../lib/ratelimit');
    const limited = await throttle(c, 'booking');
    if (limited) return limited;

    const {
        service_type,
        destination_country,
        dates,
        requirements,
        budget_range,
        urgency,
        guest_email,
        guest_name,
        guest_organization
    } = (c.req as any).valid('json');

    // Validation
    if (!service_type) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'service_type is required'
        }, 400);
    }

    if (!guest_email && !c.get('clientId')) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'guest_email is required for unauthenticated requests'
        }, 400);
    }

    // Generate Preliminary Intelligence Brief (Instant Value)
    let preliminaryNote = null;
    try {
        // Quick RAG-lite
        const keywords = `${service_type} ${destination_country || ''} ${budget_range}`.trim();
        const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [keywords] });
        const vector = (embedding as Record<string, any>).data[0];

        const relevant = await c.env.VECTORS.query(vector, { topK: 6, returnMetadata: true });
        const context = relevant.matches.map((match, index) => {
            const metadata = match.metadata as Record<string, any>;
            return `[${index + 1}] ${metadata.title || 'Untitled record'}\nPublished: ${metadata.published_at || 'date unavailable'}\nSource URL: ${metadata.source_url || metadata.url || 'unavailable'}\nEvidence: ${(metadata.text || metadata.summary || '').slice(0, 650)}`;
        }).join('\n---\n');

        if (context) {
            const prompt = `System: You are BOA-Story's concierge research desk. Use only the numbered records and the request details. Cite records inline, separate documented facts from suggested questions, and never promise availability, pricing, safety, access or outcomes that are not supplied.\nUser request: Service ${service_type}; destination ${destination_country || 'not specified'}; dates ${JSON.stringify(dates || null)}; budget ${budget_range || 'not specified'}; urgency ${urgency || 'normal'}; requirements ${requirements || 'not specified'}.\n\nRelevant records:\n${context}`;
            const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 5000, temperature: 0.2, response_profile: 'decision-brief' });
            // Coalesce to null — D1 .bind() throws on undefined, which would
            // fail the whole booking over an optional nicety.
            preliminaryNote = aiResponse?.trim() || null;
        }
    } catch (e) {
        console.error('AI Concierge Brief Failed', e);
    }

    const id = crypto.randomUUID();
    const userId = c.get('clientId') || null;

    await c.env.DB.prepare(`
        INSERT INTO booking_requests (
            id, user_id, guest_email, guest_name, guest_organization,
            service_type, destination_country, dates_json, requirements,
            budget_range, urgency, status, created_at, ai_concierge_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', datetime('now'), ?)
    `).bind(
        id,
        userId,
        guest_email || null,
        guest_name || null,
        guest_organization || null,
        service_type,
        destination_country || null,
        dates ? JSON.stringify(dates) : null,
        requirements || null,
        budget_range || 'Standard',
        urgency || 'Normal',
        preliminaryNote // Save the Brief
    ).run();

    return c.json({
        success: true,
        id,
        message: 'Your request has been received. Our concierge team will contact you within 24 hours.',
        preliminary_brief: preliminaryNote // Instant intelligence
    }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/booking/:id - Get booking request status
// ────────────────────────────────────────────────────────────────────────────────
router.get('/booking/:id', validate('param', UuidParamSchema), async (c) => {
    const { id } = (c.req as any).valid('param');

    const booking = await c.env.DB.prepare(`
        SELECT br.*, c.name as country_name
        FROM booking_requests br
        LEFT JOIN countries c ON br.destination_country = c.code
        WHERE br.id = ?
    `).bind(id).first();

    if (!booking) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Booking request not found'
        }, 404);
    }

    const data = booking as Record<string, unknown>;

    return c.json({
        success: true,
        data: {
            ...data,
            dates: data.dates_json ? JSON.parse(data.dates_json as string) : null,
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/events - List upcoming events
// ───────────────────────────────────────────────────────────────────────────────
router.get('/events', validate('query', PaginationSchema.extend({
    type: z.string().optional(),
    country: z.string().optional(),
    status: z.string().optional(),
})), async (c) => {
    const { type, country, status, limit } = (c.req as any).valid('query');

    let query = `
        SELECT e.*, c.name as country_name, c.flag_emoji,
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status != 'Cancelled') as registered_count
        FROM events e
        LEFT JOIN countries c ON e.country_code = c.code
        WHERE 1=1
    `;
    const params: string[] = [];

    if (type) {
        query += ' AND e.category = ?';
        params.push(type);
    }

    if (country) {
        query += ' AND e.country_code = ?';
        params.push(country.toUpperCase());
    }

    if (status) {
        query += ' AND LOWER(e.status) = LOWER(?)';
        params.push(status);
    }

    // Only surface UPCOMING (or currently-running) events — never lead with
    // summits that already happened, which made the calendar look stale/static.
    query += " AND date(COALESCE(e.date_end, e.date_start)) >= date('now')";

    query += ' ORDER BY e.date_start ASC';

    if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
    } else {
        query += ' LIMIT 20';
    }

    const events = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
        success: true,
        data: (events.results || []).map((event: Record<string, unknown>) => ({
            ...event,
            date: event.date_start, // Alias for frontend compatibility
            event_type: event.category, // Alias for frontend compatibility
        }))
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/events/:id - Get single event details
// ───────────────────────────────────────────────────────────────────────────────
router.get('/events/:id', validate('param', IdOrSlugParamSchema), async (c) => {
    const { id } = (c.req as any).valid('param');

    // Support lookup by ID or slug
    const event = await c.env.DB.prepare(`
        SELECT e.*, c.name as country_name, c.flag_emoji,
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status != 'Cancelled') as registered_count
        FROM events e
        LEFT JOIN countries c ON e.country_code = c.code
        WHERE e.id = ? OR e.slug = ?
    `).bind(id, id).first();

    if (!event) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Event not found'
        }, 404);
    }

    const data = event as Record<string, unknown>;
    const eventContextKey = `event:${id}:context:v2`;
    const eventContext = await getCachedValue<string>(c.env, eventContextKey);
    const immediateEventContext = `${String(data.title)} is scheduled from ${String(data.date_start || 'the recorded start date')} to ${String(data.date_end || data.date_start || 'the recorded end date')}${data.country_name ? ` in ${String(data.country_name)}` : ''}. ${String(data.description || 'The event record contains the current organiser-supplied details and registration information.')}`;
    if (!eventContext) {
        c.executionCtx.waitUntil(
            getCached(c.env, eventContextKey, async () => {
                const topic = `${data.title} ${data.country_name || ''} business`;
                try {
                    const embedding = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', { text: [topic] });
                    const vector = (embedding as Record<string, any>).data[0];
                    const relevant = await c.env.VECTORS.query(vector, { topK: 6, returnMetadata: true });
                    const context = relevant.matches.map((match, index) => {
                        const metadata = match.metadata as Record<string, any>;
                        return `[${index + 1}] ${metadata.title || 'Untitled record'}\nPublished: ${metadata.published_at || 'date unavailable'}\nSource URL: ${metadata.source_url || metadata.url || 'unavailable'}\nEvidence: ${(metadata.text || metadata.summary || '').slice(0, 650)}`;
                    }).join('\n---\n');
                    if (!context) return immediateEventContext;
                    const prompt = `System: You are BOA-Story's event evidence desk. Use only the event record and numbered reporting records. Explain relevance, affected sectors and institutions, practical questions, contradictions and evidence gaps. Cite records inline and do not invent speakers, agenda items or outcomes.\nUser: Event: ${data.title}. Description: ${data.description || 'unavailable'}. Country: ${data.country_name || 'not specified'}. Dates: ${data.date_start || 'unavailable'} to ${data.date_end || 'unavailable'}.\n\nRelevant records:\n${context}`;
                    const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 5000, temperature: 0.2, response_profile: 'decision-brief' });
                    return aiResponse?.trim() || immediateEventContext;
                } catch { return immediateEventContext; }
            }, { ttl: CACHE_TTL.ARCHIVE }).then(() => undefined)
        );
    }

    return c.json({
        success: true,
        data: {
            ...data,
            date: data.date_start, // Alias for frontend
            event_type: data.category, // Alias for frontend
            ai_context_brief: eventContext || immediateEventContext
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /services/events/:id/register - Register for an event
// ───────────────────────────────────────────────────────────────────────────────
router.post('/events/:id/register', validate('param', IdOrSlugParamSchema), validate('json', EventRegistrationSchema), async (c) => {
    // Per-IP throttle — unauthenticated writes + (once email is live) a
    // confirmation send per request.
    const { throttle } = await import('../lib/ratelimit');
    const limited = await throttle(c, 'event-register');
    if (limited) return limited;

    const { id: eventId } = (c.req as any).valid('param');
    const {
        user_email,
        user_name,
        user_organization,
        user_title,
        ticket_type,
        dietary_requirements,
        special_requests
    } = (c.req as any).valid('json');

    // Validation
    if (!user_email) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'user_email is required'
        }, 400);
    }

    // Get event and check capacity
    const event = await c.env.DB.prepare(`
        SELECT e.*,
               (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id AND er.status NOT IN ('Cancelled')) as registered_count
        FROM events e
        WHERE e.id = ? OR e.slug = ?
    `).bind(eventId, eventId).first();

    if (!event) {
        return c.json({
            success: false,
            error: 'not_found',
            message: 'Event not found'
        }, 404);
    }

    const eventData = event as Record<string, unknown>;

    // Check if event is open for registration
    if (eventData.status === 'Completed' || eventData.status === 'Cancelled') {
        return c.json({
            success: false,
            error: 'registration_closed',
            message: 'This event is no longer accepting registrations'
        }, 400);
    }

    // Check capacity
    const registeredCount = eventData.registered_count as number || 0;
    const capacity = eventData.capacity as number | null;

    if (capacity && registeredCount >= capacity) {
        return c.json({
            success: false,
            error: 'sold_out',
            message: 'This event has reached capacity'
        }, 400);
    }

    // Check if already registered
    const existing = await c.env.DB.prepare(`
        SELECT id FROM event_registrations
        WHERE event_id = ? AND user_email = ? AND status != 'Cancelled'
    `).bind(eventData.id, user_email).first();

    if (existing) {
        return c.json({
            success: false,
            error: 'already_registered',
            message: 'You are already registered for this event'
        }, 400);
    }

    // Generate confirmation code
    const confirmationBytes = crypto.getRandomValues(new Uint8Array(4));
    const confirmationSuffix = Array.from(confirmationBytes)
        .map(byte => byte.toString(36).padStart(2, '0'))
        .join('')
        .slice(0, 8)
        .toUpperCase();
    const confirmationCode = `BOA-${Date.now().toString(36).toUpperCase()}-${confirmationSuffix}`;
    const registrationId = crypto.randomUUID();
    const userId = c.get('clientId') || null;

    await c.env.DB.prepare(`
        INSERT INTO event_registrations (
            id, event_id, user_id, user_email, user_name, user_organization,
            user_title, ticket_type, dietary_requirements, special_requests,
            status, confirmation_code, registered_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, datetime('now'))
    `).bind(
        registrationId,
        eventData.id,
        userId,
        user_email,
        user_name || null,
        user_organization || null,
        user_title || null,
        ticket_type || 'Standard',
        dietary_requirements || null,
        special_requests || null,
        confirmationCode
    ).run();

    sendRegistrationConfirmation(c.env, {
        registrationId,
        confirmationCode,
        user_email,
        user_name: user_name || undefined,
        event: eventData as { title: string; date?: string; date_start?: string; location?: string },
    }).catch((err) => console.error('[email] registration confirmation failed:', err));

    return c.json({
        success: true,
        data: {
            registration_id: registrationId,
            confirmation_code: confirmationCode,
            event_title: eventData.title,
            event_date: eventData.date,
            status: 'Pending',
            message: `Registration successful. Your confirmation code is ${confirmationCode}. Please keep it for your records.`
        }
    }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/events/:id/registrations - Get event registrations (admin)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/events/:id/registrations', validate('param', IdOrSlugParamSchema), async (c) => {
    const { id: eventId } = (c.req as any).valid('param');

    // Require an authenticated admin client
    const clientId = c.get('clientId');
    if (!clientId) return c.json({ error: 'unauthorized' }, 401);
    const caller = await c.env.DB.prepare('SELECT type FROM clients WHERE id = ?').bind(clientId).first<{ type: string }>();
    if (!caller || caller.type !== 'admin') return c.json({ error: 'unauthorized' }, 401);

    const registrations = await c.env.DB.prepare(`
        SELECT er.*, e.title as event_title
        FROM event_registrations er
        JOIN events e ON er.event_id = e.id
        WHERE e.id = ? OR e.slug = ?
        ORDER BY er.registered_at DESC
    `).bind(eventId, eventId).all();

    return c.json({
        success: true,
        data: registrations.results || [],
        total: registrations.results?.length || 0
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /services/booking - List user's booking requests
// ───────────────────────────────────────────────────────────────────────────────
router.get('/booking', validate('query', z.object({ email: z.string().email().optional() })), async (c) => {
    const { email } = (c.req as any).valid('query');
    const userId = c.get('clientId');

    if (!email && !userId) {
        return c.json({
            success: false,
            error: 'validation_error',
            message: 'email query parameter or authentication required'
        }, 400);
    }

    let query = `
        SELECT br.*, c.name as country_name
        FROM booking_requests br
        LEFT JOIN countries c ON br.destination_country = c.code
        WHERE 1=1
    `;
    const params: (string | null)[] = [];

    if (userId) {
        query += ' AND br.user_id = ?';
        params.push(userId);
    } else if (email) {
        query += ' AND br.guest_email = ?';
        params.push(email);
    }

    query += ' ORDER BY br.created_at DESC LIMIT 50';

    const bookings = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
        success: true,
        data: (bookings.results || []).map((b: Record<string, unknown>) => ({
            ...b,
            dates: b.dates_json ? JSON.parse(b.dates_json as string) : null,
        }))
    });
});

export { router as servicesRouter };
