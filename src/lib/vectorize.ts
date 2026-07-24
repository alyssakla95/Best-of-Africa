// ═══════════════════════════════════════════════════════════════════════════════
// VECTORIZE LIBRARY
// Semantic search and content similarity
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { generateEmbedding } from './ai';

// ───────────────────────────────────────────────────────────────────────────────
// Index Article in Vectorize
// ───────────────────────────────────────────────────────────────────────────────
export async function indexArticle(
    env: Env,
    articleId: string,
    title: string,
    content: string,
    metadata: {
        country_code?: string;
        region?: string;
        sector_id?: string;
        published_at?: string;
        ai_investor_brief?: string;
        ai_push_message?: string;
        ai_social_post?: string;
    } = {}
): Promise<number> { // Return number of chunks
    // 1. Maintain the "Main" document vector (for related articles/high-level search)
    // Include Refinements in the Search Index so they are discoverable
    const aiContext = `
    Investor Brief: ${metadata.ai_investor_brief || ''}
    Key Message: ${metadata.ai_push_message || ''}
    Impact: ${metadata.ai_social_post || ''}
    `.trim();

    const mainTextToEmbed = `${title}\n\n${aiContext}\n\n${content.slice(0, 4000)}`;
    const mainVector = await generateEmbedding(env, mainTextToEmbed);

    const baseMetadata = {
        title,
        country_code: metadata.country_code || '',
        region: metadata.region || '',
        sector_id: metadata.sector_id || '',
        published_at: metadata.published_at || '',
        type: 'document'
    };

    const vectors = [{
        id: articleId,
        values: mainVector,
        metadata: {
            ...baseMetadata,
            text: mainTextToEmbed.slice(0, 2200) // Rich source preview for evidence-grounded RAG
        },
    }];

    // 2. Generate Content Chunks (Sliding Window)
    // Window: 1000 chars, Overlap: 200 chars
    const CHUNK_SIZE = 1000;
    const OVERLAP = 200;

    let chunkCount = 0;
    /* 
       We only chunk the actual content, not the title, 
       but we prepend title to the first chunk or all chunks? 
       Let's prepend title to all chunks for context.
    */

    let start = 0;
    const fullText = `${title}\n\n${content}`;

    // Safety check: if content is short, the main vector is enough, but we might want at least one chunk?
    // Actually, if content < CHUNK_SIZE, the main vector acts as the chunk.
    // But to keep logic consistent for RAG which looks for `type: chunk` or `type: document`...
    // Let's create chunks regardless.

    while (start < fullText.length) {
        const end = Math.min(start + CHUNK_SIZE, fullText.length);
        const chunkText = fullText.slice(start, end);

        // Skip if chunk is too small (tail end)
        if (chunkText.length < 50 && chunkCount > 0) break;

        const chunkVector = await generateEmbedding(env, chunkText);

        vectors.push({
            id: `${articleId}#${chunkCount}`,
            values: chunkVector,
            metadata: {
                ...baseMetadata,
                type: 'chunk',
                chunk_index: chunkCount.toString(),
                text: chunkText // Store text for RAG (retrieval)
            } as any
        });

        chunkCount++;
        start += (CHUNK_SIZE - OVERLAP);
    }

    // Upsert all vectors (batch if necessary, but 10-20 vectors is fine in one go)
    // Vectorize supports up to 1000 vectors perupsert
    await env.VECTORS.upsert(vectors);

    return chunkCount;
}

// ───────────────────────────────────────────────────────────────────────────────
// Search Similar Content
// ───────────────────────────────────────────────────────────────────────────────
export async function searchSimilar(
    env: Env,
    query: string,
    options: {
        topK?: number;
        filter?: {
            country_code?: string;
            region?: string;
            sector_id?: string;
        };
    } = {}
): Promise<Array<{ id: string; score: number; metadata: Record<string, string> }>> {
    const { topK = 10, filter } = options;

    // Generate query embedding
    const queryVector = await generateEmbedding(env, query);

    // Build filter if provided
    const vectorizeFilter: Record<string, string> = {};
    if (filter?.country_code) vectorizeFilter.country_code = filter.country_code;
    if (filter?.region) vectorizeFilter.region = filter.region;
    if (filter?.sector_id) vectorizeFilter.sector_id = filter.sector_id;

    // Query Vectorize
    const results = await env.VECTORS.query(queryVector, {
        topK,
        returnMetadata: 'all',
        filter: Object.keys(vectorizeFilter).length > 0 ? vectorizeFilter : undefined,
    });

    return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: (match.metadata as Record<string, string>) || {},
    }));
}

// ───────────────────────────────────────────────────────────────────────────────
// Find Narrative Gaps Using Embeddings
// ───────────────────────────────────────────────────────────────────────────────
export async function findNarrativeGaps(
    env: Env,
    countryCode: string,
    sectors: string[]
): Promise<Array<{ sector: string; coverage_score: number }>> {
    const gaps: Array<{ sector: string; coverage_score: number }> = [];

    for (const sector of sectors) {
        // Generate a query for what ideal coverage would look like
        const idealQuery = `investment opportunities ${sector} developments business growth`;

        // Search for existing content matching this
        const results = await searchSimilar(env, idealQuery, {
            topK: 5,
            filter: { country_code: countryCode, sector_id: sector },
        });

        // Calculate coverage score based on result quality
        const avgScore = results.length > 0
            ? results.reduce((sum, r) => sum + r.score, 0) / results.length
            : 0;

        const coverageScore = Math.round(avgScore * 100);

        if (coverageScore < 70) {
            gaps.push({ sector, coverage_score: coverageScore });
        }
    }

    return gaps.sort((a, b) => a.coverage_score - b.coverage_score);
}

// ───────────────────────────────────────────────────────────────────────────────
// Remove Article from Index
// ───────────────────────────────────────────────────────────────────────────────
export async function removeFromIndex(env: Env, articleId: string, chunkCount: number = 0): Promise<void> {
    const idsToDelete = [articleId]; // Always delete the main document vector

    for (let i = 0; i < chunkCount; i++) {
        idsToDelete.push(`${articleId}#${i}`);
    }

    // Batch delete (limit is usually high enough)
    await env.VECTORS.deleteByIds(idsToDelete);
}

// ───────────────────────────────────────────────────────────────────────────────
// Batch Index Articles
// ───────────────────────────────────────────────────────────────────────────────
export async function batchIndexArticles(
    env: Env,
    articles: Array<{
        id: string;
        title: string;
        content: string;
        country_code?: string;
        region?: string;
        sector_id?: string;
        published_at?: string;
    }>
): Promise<number> {
    const vectors = [];

    for (const article of articles) {
        try {
            const textToEmbed = `${article.title}\n\n${article.content.slice(0, 4000)}`;
            const vector = await generateEmbedding(env, textToEmbed);

            vectors.push({
                id: article.id,
                values: vector,
                metadata: {
                    title: article.title,
                    country_code: article.country_code || '',
                    region: article.region || '',
                    sector_id: article.sector_id || '',
                    published_at: article.published_at || '',
                },
            });
        } catch (error) {
            console.error(`Failed to generate embedding for article ${article.id}:`, error);
        }
    }

    if (vectors.length > 0) {
        await env.VECTORS.upsert(vectors);
    }

    return vectors.length;
}
