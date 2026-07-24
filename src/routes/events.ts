// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS ROUTER
// Summits, Forums, and Conferences with Value Props
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI } from '../lib/ai';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /events - List upcoming events
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { status, limit } = c.req.query();
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || '20', 10) || 20));

    // Build WHERE clause
    let whereClause = "LOWER(status) != 'cancelled' AND date(COALESCE(date_end, date_start)) >= date('now')";
    if (status === 'upcoming') {
        whereClause = "LOWER(status) IN ('upcoming', 'active', 'registration_open', 'open') AND date(COALESCE(date_end, date_start)) >= date('now')";
    }

    try {
        const events = await c.env.DB.prepare(`
            SELECT id, title, slug, date_start, date_end, location, country_code,
                   category, status, is_featured, is_vip, description, registration_url
            FROM events
            WHERE ${whereClause}
            ORDER BY date_start ASC
            LIMIT ?
        `).bind(limitNum).all();

        return c.json({
            success: true,
            data: (events.results || []).map((event: Record<string, unknown>) => ({
                ...event,
                date: event.date_start,
                event_type: event.category,
                is_exclusive: Boolean(event.is_vip),
            })),
        });
    } catch (err) {
        // Table may not exist yet or query failed — return empty rather than 500
        console.error('[events] list failed:', err);
        return c.json({ success: false, error: 'events_unavailable', message: 'Verified event records could not be loaded.' }, 503);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /events/:id - Event Details + Value Prop
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (c) => {
    const id = c.req.param('id');

    const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();

    if (!event) {
        return c.json({ error: 'not_found', message: 'Event not found' }, 404);
    }

    const eventData = event as Record<string, any>;

    // Lazy-generate an evidence-aware context brief if the curated record does not
    // already contain one. The production schema stores this as ai_context_brief.
    if (!eventData.ai_context_brief) {
        try {
            const prompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: Event: ${eventData.title}\nDescription: ${eventData.description}\nType: ${eventData.category}`;
            const generated = await callConfiguredAI(c.env, { prompt: `${prompt}\n\nProduce a complete event dossier: documented purpose and agenda, organiser, intended participants, relevant sectors, decision value, dates and logistics, preparation guidance, dependencies, uncertainties, source limitations, and a verification checklist. Distinguish confirmed details from organiser claims and do not invent speakers or outcomes.`, max_tokens: 5000, temperature: 0.2, response_profile: 'decision-brief' }).then(res => res?.trim());

            if (generated) {
                eventData.ai_context_brief = generated;
                // Save back to DB for next time
                await c.env.DB.prepare('UPDATE events SET ai_context_brief = ? WHERE id = ?')
                    .bind(generated, id).run();
            }
        } catch (e) { /* Ignore failure, return without prop */ }
    }

    return c.json({
        event: {
            ...eventData,
            date: eventData.date_start,
            event_type: eventData.category,
            is_exclusive: Boolean(eventData.is_vip),
            value_proposition: eventData.ai_context_brief,
        }
    });
});

export { router as eventsRouter };
