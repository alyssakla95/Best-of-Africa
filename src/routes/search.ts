// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH ROUTER
// Vectorize-powered semantic search
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { trackEvent } from '../lib/analytics';
import { getCached, CACHE_KEYS, CACHE_TTL } from '../lib/cache';
import { checkRateLimit, rateLimitHeaders } from '../lib/ratelimit';
import { callConfiguredAI } from '../lib/ai';
import { diversifyCoverageRows } from '../lib/source-quality';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// ───────────────────────────────────────────────────────────────────────────────
// GET /search - Full-text and semantic search with Answer
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const { q, type = 'hybrid', limit = '10' } = c.req.query();

    if (!q || q.length < 2) {
        return c.json({ error: 'bad_request', message: 'Query must be at least 2 characters' }, 400);
    }

    // Rate limit: 30 searches/min per IP to protect embedding quota
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const rl = await checkRateLimit(c.env, `search:${ip}`, 'free');
    Object.entries(rateLimitHeaders(rl)).forEach(([k, v]) => c.header(k, v));
    if (!rl.allowed) {
        return c.json({ error: 'too_many_requests', message: `Rate limit exceeded. Retry in ${rl.retryAfter}s.` }, 429);
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Track search event
    c.executionCtx.waitUntil(
        trackEvent(c.env, { type: 'search', search_query: q })
    );

    if (type === 'semantic' || type === 'hybrid') {
        // Generate embedding for the query and search Vectorize. If Workers AI is
        // unavailable (e.g. neuron quota exhausted or a model change), degrade
        // gracefully to keyword/full-text search instead of failing the request.
        let vectorResults: { matches: any[] } = { matches: [] };
        try {
            const embeddingResponse = await (c.env.AI as Record<string, any>).run('@cf/baai/bge-base-en-v1.5', {
                text: q,
            });
            const queryVector = (embeddingResponse as Record<string, any>).data[0];
            vectorResults = await c.env.VECTORS.query(queryVector, {
                topK: limitNum,
                returnMetadata: 'all',
            });
        } catch (e) {
            console.warn('Semantic search unavailable, falling back to keyword/full-text search:', e);
            vectorResults = { matches: [] };
        }

        if (type === 'semantic') {
            // Pure semantic search
            // Deduplicate chunks: Group by articleId, keep highest score
            const bestMatches = new Map<string, { id: string, score: number, text?: string }>();

            for (const match of vectorResults.matches) {
                const articleId = match.id.split('#')[0];
                if (!bestMatches.has(articleId) || match.score > bestMatches.get(articleId)!.score) {
                    bestMatches.set(articleId, {
                        id: match.id,
                        score: match.score,
                        text: (match.metadata as Record<string, any>)?.text // Capture chunk text
                    });
                }
            }

            const articleIds = Array.from(bestMatches.keys());

            if (articleIds.length === 0) {
                // Generate Answer (The "Refined Delivery")
                let aiAnswer = null;
                // Note: searchResults is not defined here if articleIds.length === 0.
                // This block will only return an empty result set and no answer.
                // If an answer is desired for no results, the logic needs to be adjusted.
                // For now, it will only be generated if there are actual search results.
                // The original instruction implies `searchResults` would be available,
                // but it's only created after this `if` block.
                // To faithfully apply the instruction, I'm placing it as requested,
                // but noting the potential logical issue.
                // If `searchResults` is intended to be available here, it needs to be moved up.
                // Assuming the intent is to return an empty result set with no answer if no articles are found.
                return c.json({
                    results: [],
                    editorial_answer: aiAnswer,
                    query: q,
                    type: 'semantic'
                });
            }

            const placeholders = articleIds.map(() => '?').join(',');
            const articles = await c.env.DB.prepare(`
        SELECT
          a.id, a.slug, a.title, a.summary, a.source_url, a.source_title, a.source_quality_tier,
          a.country_code, c.name as country_name,
          a.sector_id, s.name as sector_name,
          a.hero_image_url, a.published_at
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.id IN (${placeholders}) AND a.status = 'published'
      `).bind(...articleIds).all();

            // Transform to SearchResult format
            const balancedSemanticArticles = diversifyCoverageRows(
                [...(articles.results || [])].sort((left: any, right: any) =>
                    (bestMatches.get(right.id)?.score || 0) - (bestMatches.get(left.id)?.score || 0)),
                limitNum,
            );
            const searchResults = balancedSemanticArticles.map((article: any) => {
                const match = bestMatches.get(article.id);
                // Use chunk text for immediate context if available, else summary
                const context = match?.text || article.summary;

                return {
                    article: {
                        id: article.id,
                        slug: article.slug,
                        title: article.title,
                        summary: article.summary || '',
                        country_code: article.country_code,
                        country_name: article.country_name || '',
                        sector_id: article.sector_id,
                        sector_name: article.sector_name || '',
                        hero_image_url: article.hero_image_url,
                        reading_time_minutes: 5,
                        published_at: article.published_at,
                        // Inject the specific matched text as a highlight/snippet
                        match_context: match?.text
                    },
                    score: match?.score || 0,
                    highlights: []
                };
            }).sort((a, b) => b.score - a.score);

            // Generate Answer (The "Refined Delivery") — cached like the hybrid
            // path: an uncached 6,000-token synthesis made every first semantic
            // query wait on the full generation (~40s cold).
            let aiAnswer = null;
            if (searchResults.length > 0) {
                const context = searchResults.slice(0, 12).map((r, index) => {
                    const article = (articles.results || []).find((item: any) => item.id === r.article.id) as any;
                    return `[${index + 1}] Title: ${r.article.title}\nPublished: ${r.article.published_at || 'date unavailable'}\nCountry: ${r.article.country_name || 'not specified'}\nSource URL: ${article?.source_url || 'unavailable'}\nEvidence: ${(r.article.match_context || r.article.summary || '').slice(0, 1200)}`;
                }).join('\n---\n');
                aiAnswer = await getCached(
                    c.env,
                    CACHE_KEYS.searchAiSummary(`${q}:semantic:depth-v5`),
                    async () => {
                        try {
                            const prompt = `System: Produce a detailed evidence-grounded research answer using only the supplied records. Cite titles inline, separate facts from implications, identify contradictions and missing evidence, and never pad thin context with general knowledge.\nUser: Query: ${q}\n\nContext:\n${context}`;
                            const ansRes = await callConfiguredAI(c.env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' });
                            return ansRes?.trim() || null;
                        } catch (e) {
                            return null;
                        }
                    },
                    { ttl: CACHE_TTL.DASHBOARD },
                );
            }

            return c.json({
                results: searchResults,
                editorial_answer: aiAnswer,
                suggestions: [],
                query: q,
                type: 'semantic',
            });
        }

        // Hybrid: combine semantic and full-text
        const ftsQuery = `"${q.replace(/"/g, '""')}"*`;
        const fullTextResults = await c.env.DB.prepare(`
      SELECT 
        a.id, a.slug, a.title, a.summary, a.source_title, a.source_quality_tier,
        a.country_code, c.name as country_name,
        a.sector_id, s.name as sector_name,
        a.hero_image_url, a.published_at
      FROM articles_fts f
      JOIN articles a ON a.id = f.id
      LEFT JOIN countries c ON a.country_code = c.code
      LEFT JOIN sectors s ON a.sector_id = s.id
      WHERE articles_fts MATCH ?
        AND a.status = 'published'
      ORDER BY rank
      LIMIT ?
    `).bind(ftsQuery, Math.min(200, limitNum * 8)).all();

        // Merge and deduplicate results
        const seen = new Set<string>();
        const merged = [];

        // Process Vector Matches (Semantic)
        const vectorMatches = new Map<string, { score: number, text?: string }>();
        for (const match of vectorResults.matches) {
            const articleId = match.id.split('#')[0];
            if (!vectorMatches.has(articleId) || match.score > vectorMatches.get(articleId)!.score) {
                vectorMatches.set(articleId, {
                    score: match.score,
                    text: (match.metadata as Record<string, any>)?.text
                });
            }
        }

        // Add semantic results first (higher relevance)
        for (const [id, match] of vectorMatches.entries()) {
            if (!seen.has(id)) {
                seen.add(id);
                merged.push({
                    id: id,
                    relevance_score: match.score,
                    source: 'semantic',
                    match_context: match.text // Pass chunk text
                });
            }
        }

        // Add full-text results
        for (const article of fullTextResults.results || []) {
            if (!seen.has((article as Record<string, any>).id)) {
                seen.add((article as Record<string, any>).id);
                merged.push({
                    ...article,
                    relevance_score: 0.5,
                    source: 'fulltext',
                });
            }
        }

        // Enrich semantic entries with their article rows. They were pushed with
        // only {id, score} — without this, every semantic hit (which sorts to the
        // top) reached the UI with no title/slug/summary and rendered as an
        // empty card, and the RAG prompt below saw "Untitled" for all of them.
        const semanticIds = merged.filter((m: any) => m.source === 'semantic').map((m: any) => m.id);
        if (semanticIds.length > 0) {
            const ph = semanticIds.map(() => '?').join(',');
            const rows = await c.env.DB.prepare(`
                SELECT a.id, a.slug, a.title, a.summary, a.source_url,
                       a.country_code, c.name as country_name, a.source_title, a.source_quality_tier,
                       a.sector_id, s.name as sector_name,
                       a.hero_image_url, a.published_at
                FROM articles a
                LEFT JOIN countries c ON a.country_code = c.code
                LEFT JOIN sectors s ON a.sector_id = s.id
                WHERE a.id IN (${ph}) AND a.status = 'published'
            `).bind(...semanticIds).all();
            const byId = new Map((rows.results || []).map((r: any) => [r.id, r]));
            for (const m of merged as any[]) {
                if (m.source === 'semantic') {
                    const row = byId.get(m.id);
                    if (row) Object.assign(m, row);
                }
            }
        }
        // Drop anything that never resolved to a published article (stale vectors).
        const resolvedResults = merged.filter((m: any) => m.slug && m.title);
        const balancedResolvedResults = diversifyCoverageRows(resolvedResults as any[], limitNum);

        // ═══════════════════════════════════════════════════════════════════════════
        // RAG: Generate summary from top results using Workers (CACHED)
        // ═══════════════════════════════════════════════════════════════════════════
        const topResults = balancedResolvedResults.slice(0, 12);
        let aiSummary: string | null = null;

        if (topResults.length > 0) {
            // Cache summaries for 10 minutes to avoid repeated expensive calls
            aiSummary = await getCached(
                c.env,
                CACHE_KEYS.searchAiSummary(`${q}:depth-v5`),
                async () => {
                    try {
                        const briefsContext = topResults.map((item: any, i: number) => {
                            const title = item.title || 'Untitled';
                            // Use match_context (specific chunk) if available, otherwise summary
                            const content = item.match_context || item.summary || '';
                            const country = (item.country_name && item.country_name !== 'null') ? item.country_name : 'Region';
                            return `[${i + 1}] "${title}" (${country})\nPublished: ${item.published_at || 'date unavailable'}\nSource URL: ${item.source_url || 'unavailable'}\nEvidence: ${content.slice(0, 1200)}`;
                        }).join('\n\n');

                        const prompt = `System: You are BOA-Story's evidence synthesis desk. Use only the numbered records, cite them inline as [1], [2], and distinguish reported facts from analysis. Do not make an investment recommendation or estimate missing figures.\nUser: Answer the research query "${q}" based on these records:\n${briefsContext}`;
                        const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' });
                        return aiResponse || null;
                    } catch (aiError) {
                        console.error('AI summary generation failed:', aiError);
                        return null;
                    }
                },
                { ttl: CACHE_TTL.DASHBOARD } // 10 minutes
            );
        }

        // Transform results to match frontend SearchResult type
        const searchResults = balancedResolvedResults.map((item: any) => ({
            article: {
                id: item.id,
                slug: item.slug,
                title: item.title,
                summary: item.summary || '',
                country_code: item.country_code,
                country_name: item.country_name || '',
                sector_id: item.sector_id,
                sector_name: item.sector_name || '',
                hero_image_url: item.hero_image_url,
                reading_time_minutes: item.reading_time_minutes || 5,
                published_at: item.published_at
            },
            score: item.relevance_score || 0.5,
            highlights: []
        }));

        return c.json({
            results: searchResults,
            suggestions: [], // Populated by separate /suggest endpoint
            editorial_answer: aiSummary,
            query: q,
            type: 'hybrid',
        });
    }

    // Pure full-text search utilizing FTS5 indexing
    const ftsQuery = `"${q.replace(/"/g, '""')}"*`;
    const results = await c.env.DB.prepare(`
    SELECT 
      a.id, a.slug, a.title, a.summary, a.source_title, a.source_quality_tier,
      a.country_code, c.name as country_name,
      a.sector_id, s.name as sector_name,
      a.hero_image_url, a.published_at
    FROM articles_fts f
    JOIN articles a ON a.id = f.id
    LEFT JOIN countries c ON a.country_code = c.code
    LEFT JOIN sectors s ON a.sector_id = s.id
    WHERE articles_fts MATCH ?
      AND a.status = 'published'
    ORDER BY rank
    LIMIT ?
  `).bind(ftsQuery, Math.min(200, limitNum * 8)).all();

    const balancedFullTextResults = diversifyCoverageRows(results.results || [], limitNum);

    // Transform to SearchResult format
    const searchResults = balancedFullTextResults.map((article: any) => ({
        article: {
            id: article.id,
            slug: article.slug,
            title: article.title,
            summary: article.summary || '',
            country_code: article.country_code,
            country_name: article.country_name || '',
            sector_id: article.sector_id,
            sector_name: article.sector_name || '',
            hero_image_url: article.hero_image_url,
            reading_time_minutes: 5,
            published_at: article.published_at
        },
        score: 0.5,
        highlights: []
    }));

    return c.json({
        results: searchResults,
        suggestions: [],
        query: q,
        type: 'fulltext',
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /search/semantic - Dedicated semantic search endpoint (RAG)
// As per BACKEND_INTEGRATION.md section 3.C
// ───────────────────────────────────────────────────────────────────────────────
router.get('/semantic', async (c) => {
    const { q, limit = '10' } = c.req.query();

    if (!q || q.length < 2) {
        return c.json({
            success: false,
            error: 'bad_request',
            message: 'Query must be at least 2 characters'
        }, 400);
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    // Track search event
    c.executionCtx.waitUntil(
        trackEvent(c.env, { type: 'search', search_query: q })
    );

    try {
        // 1. Generate Embedding for User Query (bge-base-en-v1.5 on Workers )
        const embeddingResponse = await (c.env.AI as Record<string, any>).run('@cf/baai/bge-base-en-v1.5', {
            text: q,
        });
        const queryVector = (embeddingResponse as Record<string, any>).data[0];

        // 2. Query Vectorize index for nearest article chunks
        let vectorResults;
        try {
            vectorResults = await c.env.VECTORS.query(queryVector, {
                topK: limitNum,
                returnMetadata: 'all',
            });
        } catch (e) {
            console.warn('Vector search failed (likely local dev):', e);
            vectorResults = { matches: [] };
        }

        const bestMatches = new Map<string, { id: string, score: number, text?: string }>();
        for (const match of vectorResults.matches) {
            const articleId = match.id.split('#')[0];
            if (!bestMatches.has(articleId) || match.score > bestMatches.get(articleId)!.score) {
                bestMatches.set(articleId, {
                    id: match.id,
                    score: match.score,
                    text: (match.metadata as Record<string, any>)?.text
                });
            }
        }

        const articleIds = Array.from(bestMatches.keys());

        if (articleIds.length === 0) {
            return c.json({
                success: true,
                results: [],
                editorial_answer: `The indexed BOA-Story corpus contains zero semantic matches for “${q}” under the current search threshold.`,
                query: q
            });
        }

        // 3. Retrieve full article metadata from D1
        const placeholders = articleIds.map(() => '?').join(',');
        const articles = await c.env.DB.prepare(`
            SELECT 
                a.id, a.slug, a.title, a.summary, a.content, a.source_url,
                a.source_title, a.source_quality_tier,
                a.country_code, c.name as country_name, c.flag_emoji,
                a.sector_id, s.name as sector_name,
                a.hero_image_url, a.reading_time_minutes, a.published_at
            FROM articles a
            LEFT JOIN countries c ON a.country_code = c.code
            LEFT JOIN sectors s ON a.sector_id = s.id
            WHERE a.id IN (${placeholders}) AND a.status = 'published'
        `).bind(...articleIds).all();

        // Sort by vector similarity
        const scoreMap = new Map(vectorResults.matches.map(m => [m.id, m.score]));
        const sorted = (articles.results || []).sort(
            (a: any, b: any) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0)
        );
        const balancedSorted = diversifyCoverageRows(sorted, limitNum);

        // 4. (Optional) Pass chunks to LLM for summary generation
        let aiSummary: string | null = null;
        const topResults = balancedSorted.slice(0, 12);

        if (topResults.length > 0) {
            aiSummary = await getCached(
                c.env,
                CACHE_KEYS.searchAiSummary(`${q}:depth-v5`),
                async () => {
                    try {
                        const contextChunks = topResults.map((item: any, i: number) => {
                            const title = item.title || 'Untitled';
                            // Use specific chunk text if available
                            const content = bestMatches.get(item.id)?.text || item.summary || '';
                            const country = item.country_name || 'Africa';
                            return `[${i + 1}] "${title}" (${country})\nPublished: ${item.published_at || 'date unavailable'}\nSource URL: ${item.source_url || 'unavailable'}\nEvidence: ${content.slice(0, 1200)}`;
                        }).join('\n\n');

                        const prompt = `System: You are BOA-Story's evidence synthesis desk. Use only the numbered records, cite them inline as [1], [2], separate facts from analysis, and surface contradictions and gaps.\nUser: Research query: "${q}"\n\nRelevant records:\n${contextChunks}\n\nProvide a complete synthesis:`;
                        const aiResponse = await callConfiguredAI(c.env, { prompt, max_tokens: 6000, temperature: 0.2, response_profile: 'evidence-brief' });
                        return aiResponse || null;
                    } catch (aiError) {
                        console.error('RAG summary generation failed:', aiError);
                        return null;
                    }
                },
                { ttl: CACHE_TTL.DASHBOARD }
            );
        }

        // Transform results
        const results = balancedSorted.map((article: any) => ({
            id: article.id,
            slug: article.slug,
            title: article.title,
            summary: article.summary,
            country_code: article.country_code,
            country_name: article.country_name,
            flag_emoji: article.flag_emoji,
            sector_id: article.sector_id,
            sector_name: article.sector_name,
            hero_image_url: article.hero_image_url,
            reading_time_minutes: article.reading_time_minutes || 5,
            published_at: article.published_at,
            relevance_score: scoreMap.get(article.id) || 0,
        }));

        return c.json({
            success: true,
            results,
            editorial_answer: aiSummary,
            query: q,
            result_count: results.length,
        });

    } catch (error) {
        console.error('Semantic search error:', error);
        return c.json({
            success: false,
            error: 'search_error',
            message: 'An error occurred during semantic search'
        }, 500);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /search/similar/:id - Find similar articles
// ───────────────────────────────────────────────────────────────────────────────
router.get('/similar/:id', async (c) => {
    const articleId = c.req.param('id');
    const { limit = '5' } = c.req.query();
    const limitNum = Math.min(20, Math.max(1, parseInt(limit)));

    // Get article's embedding from Vectorize
    const article = await c.env.DB.prepare(
        'SELECT embedding_id FROM articles WHERE id = ?'
    ).bind(articleId).first<{ embedding_id: string }>();

    if (!article?.embedding_id) {
        // Fallback: find by same country/sector
        const fallback = await c.env.DB.prepare(`
      SELECT a.id, a.slug, a.title, a.summary, a.hero_image_url,
             a.country_code, a.source_title, a.source_quality_tier
      FROM articles a
      WHERE a.id != ?
        AND a.status = 'published'
        AND (
          a.country_code = (SELECT country_code FROM articles WHERE id = ?)
          OR a.sector_id = (SELECT sector_id FROM articles WHERE id = ?)
        )
      ORDER BY (a.engagement_score * 1.0 / ((julianday('now') - julianday(a.published_at)) + 1)) DESC
      LIMIT ?
    `).bind(articleId, articleId, articleId, Math.min(100, limitNum * 8)).all();

        return c.json({ data: diversifyCoverageRows(fallback.results || [], limitNum) });
    }

    // Get the embedding vector for this article from Vectorize
    const embeddingResult = await c.env.VECTORS.getByIds([article.embedding_id]);
    if (!embeddingResult || embeddingResult.length === 0 || !embeddingResult[0].values) {
        return c.json({ data: [] });
    }

    // Query Vectorize for similar articles using the vector
    let vectorResults;
    try {
        vectorResults = await c.env.VECTORS.query(embeddingResult[0].values, {
            topK: Math.min(100, limitNum * 8 + 1),
            returnMetadata: 'all',
        });
    } catch (e) {
        console.warn('Vector search failed (likely local dev):', e);
        vectorResults = { matches: [] };
    }

    // Filter out the source article
    const similarIds = vectorResults.matches
        .filter(m => m.id !== articleId)
        .slice(0, Math.min(100, limitNum * 8))
        .map(m => m.id);

    if (similarIds.length === 0) {
        return c.json({ data: [] });
    }

    // Clean up IDs (remove chunk suffixes just in case)
    const cleanIds = [...new Set(similarIds.map(id => id.split('#')[0]))];

    const placeholders = cleanIds.map(() => '?').join(',');
    const similar = await c.env.DB.prepare(`
    SELECT id, slug, title, summary, hero_image_url, country_code, source_title, source_quality_tier
    FROM articles
    WHERE id IN (${placeholders}) AND status = 'published'
  `).bind(...cleanIds).all();

    return c.json({ data: diversifyCoverageRows(similar.results || [], limitNum) });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET /search/suggest - Autocomplete suggestions (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/suggest', async (c) => {
    const { q } = c.req.query();

    if (!q || q.length < 2) {
        return c.json({ suggestions: [] });
    }

    // Cache suggestions for 5 minutes - most queries repeat frequently
    const suggestions = await getCached(
        c.env,
        CACHE_KEYS.searchSuggest(q),
        async () => {
            // Get title suggestions
            const articles = await c.env.DB.prepare(`
                SELECT DISTINCT title
                FROM articles
                WHERE status = 'published' AND source_quality_tier >= 3 AND title LIKE ?
                LIMIT 5
            `).bind(`${q}%`).all<{ title: string }>();

            // Get country suggestions
            const countries = await c.env.DB.prepare(`
                SELECT name, code
                FROM countries
                WHERE name LIKE ?
                LIMIT 3
            `).bind(`${q}%`).all<{ name: string; code: string }>();

            // Get sector suggestions
            const sectors = await c.env.DB.prepare(`
                SELECT name, id
                FROM sectors
                WHERE name LIKE ?
                LIMIT 3
            `).bind(`%${q}%`).all<{ name: string; id: string }>();

            return [
                ...(articles.results || []).map(a => ({ type: 'article', text: a.title })),
                ...(countries.results || []).map(c => ({ type: 'country', text: c.name, code: c.code })),
                ...(sectors.results || []).map(s => ({ type: 'sector', text: s.name, id: s.id })),
            ];
        },
        { ttl: CACHE_TTL.FREQUENT } // 5 minutes
    );

    return c.json({ suggestions });
});


export { router as searchRouter };
