// ═══════════════════════════════════════════════════════════════════════════════
// PERSONALIZATION ROUTER
// User preference tracking and personalized content delivery
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables, UserPreference } from '../types';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { callConfiguredAI, MODELS } from '../lib/ai';


const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// POST /personalization/preferences - Save user preferences
// ───────────────────────────────────────────────────────────────────────────────
router.post('/preferences', async (c) => {
    const body = await c.req.json();
    const sessionId = c.req.header('X-Session-ID') || crypto.randomUUID();

    // Check if preference exists
    const existing = await c.env.DB.prepare(
        'SELECT id FROM user_preferences WHERE session_id = ?'
    ).bind(sessionId).first();

    if (existing) {
        // Update existing
        const updates: string[] = [];
        const values: unknown[] = [];

        if (body.countries_of_interest) {
            updates.push('countries_of_interest = ?');
            values.push(JSON.stringify(body.countries_of_interest));
        }
        if (body.sectors_of_interest) {
            updates.push('sectors_of_interest = ?');
            values.push(JSON.stringify(body.sectors_of_interest));
        }
        if (body.regions_of_interest) {
            updates.push('regions_of_interest = ?');
            values.push(JSON.stringify(body.regions_of_interest));
        }
        if (body.language_preference) {
            updates.push('language_preference = ?');
            values.push(body.language_preference);
        }
        if (body.format_preference) {
            updates.push('format_preference = ?');
            values.push(body.format_preference);
        }
        if (body.reading_level) {
            updates.push('reading_level = ?');
            values.push(body.reading_level);
        }

        updates.push("last_seen_at = datetime('now')");
        updates.push("updated_at = datetime('now')");

        await c.env.DB.prepare(
            `UPDATE user_preferences SET ${updates.join(', ')} WHERE session_id = ?`
        ).bind(...values, sessionId).run();

        return c.json({ session_id: sessionId, updated: true });
    } else {
        // Create new
        const id = crypto.randomUUID();
        await c.env.DB.prepare(`
            INSERT INTO user_preferences (
                id, session_id, countries_of_interest, sectors_of_interest,
                regions_of_interest, language_preference, format_preference, reading_level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            sessionId,
            JSON.stringify(body.countries_of_interest || []),
            JSON.stringify(body.sectors_of_interest || []),
            JSON.stringify(body.regions_of_interest || []),
            body.language_preference || 'en',
            body.format_preference || 'full',
            body.reading_level || 'professional'
        ).run();

        return c.json({ session_id: sessionId, created: true }, 201);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /personalization/preferences - Get user preferences
// ───────────────────────────────────────────────────────────────────────────────
router.get('/preferences', async (c) => {
    const sessionId = c.req.header('X-Session-ID');

    if (!sessionId) {
        return c.json({
            preferences: {
                countries_of_interest: [], sectors_of_interest: [], regions_of_interest: [],
                language_preference: 'en', format_preference: 'full', reading_level: 'professional', articles_read: []
            },
            preference_basis: 'default all-coverage feed because no reader session was supplied'
        });
    }

    const prefs = await c.env.DB.prepare(
        'SELECT * FROM user_preferences WHERE session_id = ?'
    ).bind(sessionId).first();

    if (!prefs) {
        return c.json({
            preferences: {
                countries_of_interest: [], sectors_of_interest: [], regions_of_interest: [],
                language_preference: 'en', format_preference: 'full', reading_level: 'professional', articles_read: []
            },
            preference_basis: 'default all-coverage feed because this session has no saved selections'
        });
    }

    const prefsData = prefs as Record<string, any>;
    return c.json({
        preferences: {
            ...prefsData,
            countries_of_interest: prefsData.countries_of_interest ? JSON.parse(prefsData.countries_of_interest) : [],
            sectors_of_interest: prefsData.sectors_of_interest ? JSON.parse(prefsData.sectors_of_interest) : [],
            regions_of_interest: prefsData.regions_of_interest ? JSON.parse(prefsData.regions_of_interest) : [],
            articles_read: prefsData.articles_read ? JSON.parse(prefsData.articles_read) : [],
            search_history: prefsData.search_history ? JSON.parse(prefsData.search_history) : [],
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /personalization/track - Track user behavior
// ───────────────────────────────────────────────────────────────────────────────
router.post('/track', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    if (!sessionId) {
        return c.json({ error: 'Session ID required' }, 400);
    }

    const body = await c.req.json();
    const { event_type, article_id, search_query, duration_seconds, scroll_depth } = body;

    // Update preferences based on event
    if (event_type === 'article_read' && article_id) {
        // Add to articles read
        await c.env.DB.prepare(`
            UPDATE user_preferences 
            SET articles_read = json_insert(
                COALESCE(articles_read, '[]'), 
                '$[#]', 
                ?
            ),
            last_seen_at = datetime('now')
            WHERE session_id = ?
        `).bind(article_id, sessionId).run();

        // Get article's country and sector to update interests
        const article = await c.env.DB.prepare(
            'SELECT country_code, sector_id FROM articles WHERE id = ?'
        ).bind(article_id).first();

        if (article) {
            const a = article as Record<string, any>;
            if (a.country_code) {
                await c.env.DB.prepare(`
                    UPDATE user_preferences 
                    SET countries_of_interest = json_insert(
                        COALESCE(countries_of_interest, '[]'), 
                        '$[#]', 
                        ?
                    )
                    WHERE session_id = ? 
                    AND NOT json_each.value = ?
                `).bind(a.country_code, sessionId, a.country_code).run();
            }
        }
    }

    if (event_type === 'search' && search_query) {
        await c.env.DB.prepare(`
            UPDATE user_preferences 
            SET search_history = json_insert(
                COALESCE(search_history, '[]'), 
                '$[#]', 
                ?
            ),
            last_seen_at = datetime('now')
            WHERE session_id = ?
        `).bind(search_query, sessionId).run();
    }

    return c.json({ tracked: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /personalization/recommended - Get personalized article recommendations
// ───────────────────────────────────────────────────────────────────────────────
router.get('/recommended', async (c) => {
    const sessionId = c.req.header('X-Session-ID');
    const limit = parseInt(c.req.query('limit') || '10');

    if (!sessionId) {
        // Return popular articles for anonymous users
        const popular = await c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.summary, a.country_code, a.sector_id,
                   c.name as country_name, c.flag_emoji, s.name as sector_name,
                   a.hero_image_url, a.published_at
            FROM articles a
            LEFT JOIN countries c ON a.country_code = c.code
            LEFT JOIN sectors s ON a.sector_id = s.id
            WHERE a.status = 'published'
            ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
            LIMIT ?
        `).bind(limit).all();

        return c.json({
            data: (popular.results || []).map((art: any) => ({
                ...art,
                reasoning: "Trending on the platform right now."
            }))
        });
    }

    // Get user preferences
    const prefs = await c.env.DB.prepare(
        'SELECT * FROM user_preferences WHERE session_id = ?'
    ).bind(sessionId).first<UserPreference>();

    if (!prefs) {
        // No preferences yet, return popular
        const popular = await c.env.DB.prepare(`
            SELECT a.id, a.slug, a.title, a.summary, a.country_code, a.sector_id,
                   c.name as country_name, c.flag_emoji, s.name as sector_name,
                   a.hero_image_url, a.published_at
            FROM articles a
            LEFT JOIN countries c ON a.country_code = c.code
            LEFT JOIN sectors s ON a.sector_id = s.id
            WHERE a.status = 'published'
            ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
            LIMIT ?
        `).bind(limit).all();

        return c.json({
            data: (popular.results || []).map((art: any) => ({
                ...art,
                reasoning: "Trending on the platform right now."
            }))
        });
    }

    const prefsData = prefs as Record<string, any>;
    const countries = prefsData.countries_of_interest ? JSON.parse(prefsData.countries_of_interest) : [];
    const sectors = prefsData.sectors_of_interest ? JSON.parse(prefsData.sectors_of_interest) : [];
    const articlesRead = prefsData.articles_read ? JSON.parse(prefsData.articles_read) : [];

    // Build personalized query
    let query = `
        SELECT a.id, a.slug, a.title, a.summary, a.country_code, a.sector_id,
               c.name as country_name, c.flag_emoji, s.name as sector_name,
               a.hero_image_url, a.published_at, a.engagement_score
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.status = 'published'
    `;

    // Exclude already read articles
    if (articlesRead.length > 0) {
        const placeholders = articlesRead.map(() => '?').join(',');
        query += ` AND a.id NOT IN (${placeholders})`;
    }

    query += ' ORDER BY ';

    // Prioritize user's interests
    if (countries.length > 0 || sectors.length > 0) {
        query += 'CASE ';
        if (countries.length > 0) {
            query += `WHEN a.country_code IN (${countries.map(() => '?').join(',')}) THEN 0 `;
        }
        if (sectors.length > 0) {
            query += `WHEN a.sector_id IN (${sectors.map(() => '?').join(',')}) THEN 1 `;
        }
        query += 'ELSE 2 END, ';
    }

    query += '(a.engagement_score * 1.0 / ((julianday(\'now\') - julianday(a.published_at)) + 1)) DESC LIMIT ?';

    const params = [...articlesRead, ...countries, ...sectors, limit];
    const recommended = await c.env.DB.prepare(query).bind(...params).all();

    // Generate Reasoning for each item
    const enrichedResults = (recommended.results || []).map((art: any) => {
        let reason = "Recommended for you.";
        if (art.country_code && countries.includes(art.country_code)) {
            reason = `Because you follow ${art.country_name}`;
        } else if (art.sector_id && sectors.includes(art.sector_id)) {
            reason = `Because you follow ${art.sector_name}`;
        } else {
            reason = "Trending in your region";
        }
        return { ...art, reasoning: reason };
    });

    return c.json({
        data: enrichedResults,
        personalized: true,
        ai_feed_summary: `We've curated these stories focusing on ${countries.join(', ')} and ${sectors.join(', ')} based on your reading history.`,
        based_on: {
            countries: countries.slice(0, 3),
            sectors: sectors.slice(0, 3),
        }
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /personalization/feed/-curated - -curated briefing (The "Why it matters")
// ───────────────────────────────────────────────────────────────────────────────
router.get('/feed/ai-curated', async (c) => {
    const sessionId = c.req.header('X-Session-ID');

    // Auth Check
    if (!sessionId) {
        return c.json({ error: 'unauthorized', message: 'Session ID required for AI curation' }, 401);
    }

    // Get Preferences
    const prefs = await c.env.DB.prepare('SELECT * FROM user_preferences WHERE session_id = ?').bind(sessionId).first();
    if (!prefs) {
        return c.json({ error: 'no_prefs', message: 'Set preferences to enable AI curation' }, 400);
    }
    const prefsData = prefs as Record<string, any>;
    const countries = prefsData.countries_of_interest ? JSON.parse(prefsData.countries_of_interest) : [];
    const sectors = prefsData.sectors_of_interest ? JSON.parse(prefsData.sectors_of_interest) : [];

    // Smart Caching: Keyed by session + latest article ID (to invalidate on new content) 
    // For now, simpler time-based cache is sufficient
    return c.json(await getCached(
        c.env,
        `feed:ai-curated:depth-v6:${sessionId}`,
        async () => {
            // 1. Fetch Top 15 Candidates (SQL)
            const candidates = await c.env.DB.prepare(`
                SELECT a.id, a.slug, a.title, a.summary, c.name as country, s.name as sector
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.status = 'published'
                AND (
                    a.country_code IN (${countries.length ? countries.map(() => '?').join(',') : "''"})
                    OR a.sector_id IN (${sectors.length ? sectors.map(() => '?').join(',') : "''"})
                )
                ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
                LIMIT 15
             `).bind(...countries, ...sectors).all();

            if (!candidates.results || candidates.results.length < 3) {
                // Fallback if not enough matches
                return { curated: [], message: "Not enough matching content for AI curation yet." };
            }

            // 2. Curation Logic
            const context = (candidates.results as any[]).map((a, i) =>
                `[${i + 1}] ID:${a.id} | Title: ${a.title} | Country: ${a.country || 'unavailable'} | Sector: ${a.sector || 'unavailable'}\nEvidence: ${(a.summary || 'Summary unavailable.').slice(0, 900)}`
            ).join('\n');

            const prompt = `
                User Profile: Interested in ${countries.join(', ')} and ${sectors.join(', ')}.
                Task: Select the top 5 most relevant articles from the list below.
                For each, write a 140-220 word "relevance_note" explaining the documented facts, connection to the stated interests, named actors or places, practical significance, evidence limitations, and one question the reader should verify. Do not infer relevance from engagement or popularity.
                
                Articles:
                ${context}

                Output JSON Array format:
                [ { "id": "article_id", "relevance_note": "..." } ]
             `;

            try {
                const aiPrompt = `System: You are an independent student writer for BOA-Story. Keep your tone authentic, grounded, and human. Avoid corporate, intelligence, or institutional jargon.\nUser: ${prompt}`;
                const rawText = await callConfiguredAI(c.env, { prompt: aiPrompt, max_tokens: 3200, temperature: 0.2, response_profile: 'structured-analysis', structured_output: true });
                const jsonMatch = (rawText || '[]').match(/\[.*\]/s);
                const selections = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

                // 3. Hydrate Results
                const finalFeed = [];
                for (const sel of selections) {
                    const original = (candidates.results as any[]).find(c => c.id === sel.id);
                    if (original) {
                        finalFeed.push({
                            ...original,
                            ai_curation: {
                                relevance_note: sel.relevance_note,
                                match_basis: 'selected by direct country or sector preference match and source-bounded editorial review'
                            }
                        });
                    }
                }

                return {
                    data: finalFeed,
                    meta: {
                        curated_count: finalFeed.length,
                        model: MODELS.TEXT_GENERATION
                    }
                };

            } catch (e) {
                console.error('AI Curation Failed', e);
                // Fallback to top 5 raw
                return {
                    data: candidates.results.slice(0, 5).map(c => ({ ...c, ai_curation: { relevance_note: 'This report directly matches at least one selected country or sector. Read its dated source record and article evidence before drawing a broader conclusion.', match_basis: 'deterministic country or sector preference match' } })),
                    meta: { mode: 'fallback' }
                };
            }
        },
        { ttl: 1800 } // Cache for 30 mins
    ));
});

export { router as personalizationRouter };
