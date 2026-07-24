// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS DISCOVERY WORKER
// Auto-populates the events calendar from the live news the platform already
// ingests, so it stays current continent-wide without manual seeding. Runs on a
// cron, is circuit-breaker gated (skips when text-gen is over quota), and guards
// hard against junk: future-dated only, must map to a real African country.
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { callConfiguredAI, matchCountryByName, matchSectorByKeywords } from '../lib/ai';

const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export async function discoverEvents(env: Env): Promise<number> {
    // Don't spend budget when text generation is over quota.
    try {
        const cb = await env.CACHE.get('cb:ai-text-gen', 'json') as { state?: string } | null;
        if (cb?.state === 'OPEN') return 0;
    } catch { /* ignore */ }

    // Candidate articles: recent, event-sounding headlines.
    const res = await env.DB.prepare(`
        SELECT title, summary FROM articles
        WHERE status = 'published' AND published_at > datetime('now', '-21 days')
          AND (title LIKE '%Summit%' OR title LIKE '%Conference%' OR title LIKE '%Forum%'
               OR title LIKE '%Expo%' OR title LIKE '%Festival%' OR title LIKE '%Fair%'
               OR title LIKE '%Congress%' OR title LIKE '%Symposium%')
        ORDER BY published_at DESC LIMIT 15
    `).all();
    const items = (res.results || []) as Array<Record<string, any>>;
    if (items.length === 0) return 0;

    const snippets = items
        .map((a, i) => `${i + 1}. ${a.title}\n${String(a.summary || '').slice(0, 200)}`)
        .join('\n\n');

    const prompt = `From these African news snippets, extract only real, specific, UPCOMING events (summit, conference, forum, expo, trade fair, festival). For each, give the official event name, the date if clearly stated (YYYY-MM-DD), the host city and the country. Ignore anything without a clear event name and a future date.
Reply with ONLY a JSON array, e.g. [{"title":"...","date":"YYYY-MM-DD","city":"...","country":"Kenya"}]. If none, reply [].

Snippets:
${snippets}`;

    let text = '';
    try {
        text = await callConfiguredAI(env, { prompt, max_tokens: 700, temperature: 0.1 });
    } catch { return 0; }

    let parsed: any[] = [];
    try { const m = text.match(/\[[\s\S]*\]/); if (m) parsed = JSON.parse(m[0]); } catch { return 0; }
    if (!Array.isArray(parsed)) return 0;

    const today = new Date().toISOString().slice(0, 10);
    let added = 0;

    for (const e of parsed) {
        const title = String(e?.title || '').trim();
        const date = String(e?.date || '').trim();
        if (!title || title.length < 6) continue;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) continue; // upcoming only

        // Must resolve to a real African country (guards against noise).
        const cc = matchCountryByName(`${title} ${e?.country || ''} ${e?.city || ''}`, `${e?.country || ''} ${e?.city || ''}`);
        if (!cc) continue;

        const sector = matchSectorByKeywords(title, String(e?.city || ''));
        const category = sector ? cap(sector) : 'Business';
        const location = [e?.city, e?.country].filter(Boolean).join(', ') || null;
        const slug = slugify(title);
        if (!slug) continue;

        try {
            const r = await env.DB.prepare(`
                INSERT OR IGNORE INTO events (id, title, date_start, date_end, location, country_code, category, status, is_featured, is_vip, description, slug, created_at)
                VALUES (?, ?, ?, NULL, ?, ?, ?, 'upcoming', 0, 0, ?, ?, datetime('now'))
            `).bind(
                'ev-auto-' + slug, title, date, location, cc, category,
                'Surfaced automatically from BOA-Story news coverage.', slug,
            ).run();
            if ((r as Record<string, any>).meta?.changes) added++;
        } catch { /* dup slug / ignore */ }
    }

    if (added) console.log(`[events-discovery] added ${added} events from news`);
    return added;
}
