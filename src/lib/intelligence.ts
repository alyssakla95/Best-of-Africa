// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE INTELLIGENCE SERVICE
// Trend detection, sentiment analysis, and coverage optimization
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached, CACHE_TTL } from './cache';
import { callConfiguredAI } from './ai';

// ───────────────────────────────────────────────────────────────────────────────
// Trend Detection - Track Article Velocity
// ───────────────────────────────────────────────────────────────────────────────
export interface TrendSignal {
    entity: string;
    entity_type: 'country' | 'sector' | 'topic';
    article_count_24h: number;
    article_count_7d: number;
    velocity: number; // Articles per day trending
    change_percent: number; // vs previous period
    is_trending: boolean;
    sample_titles: string[];
}

export async function detectTrends(env: Env): Promise<TrendSignal[]> {
    const trends: TrendSignal[] = [];

    // Country trends
    const countryTrends = await env.DB.prepare(`
        SELECT 
            c.code as entity,
            c.name as entity_name,
            COUNT(CASE WHEN a.published_at > datetime('now', '-1 day') THEN 1 END) as count_24h,
            COUNT(CASE WHEN a.published_at > datetime('now', '-7 days') THEN 1 END) as count_7d,
            COUNT(CASE WHEN a.published_at BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days') THEN 1 END) as count_prev_7d
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code AND a.status = 'published'
        GROUP BY c.code
        HAVING count_7d > 0
    `).all();

    for (const row of countryTrends.results || []) {
        const r = row as Record<string, any>;
        const velocity = r.count_7d / 7;
        const prevVelocity = r.count_prev_7d / 7;
        const changePercent = prevVelocity > 0 ? ((velocity - prevVelocity) / prevVelocity) * 100 : 100;

        // Get sample titles
        const samples = await env.DB.prepare(`
            SELECT title FROM articles 
            WHERE country_code = ? AND status = 'published'
            ORDER BY published_at DESC LIMIT 3
        `).bind(r.entity).all();

        trends.push({
            entity: r.entity_name || r.entity,
            entity_type: 'country',
            article_count_24h: r.count_24h,
            article_count_7d: r.count_7d,
            velocity,
            change_percent: changePercent,
            is_trending: changePercent > 50 || r.count_24h >= 3,
            sample_titles: (samples.results || []).map((s: any) => s.title),
        });
    }

    // Sector trends
    const sectorTrends = await env.DB.prepare(`
        SELECT 
            s.id as entity,
            s.name as entity_name,
            COUNT(CASE WHEN a.published_at > datetime('now', '-1 day') THEN 1 END) as count_24h,
            COUNT(CASE WHEN a.published_at > datetime('now', '-7 days') THEN 1 END) as count_7d,
            COUNT(CASE WHEN a.published_at BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days') THEN 1 END) as count_prev_7d
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.status = 'published'
        GROUP BY s.id
    `).all();

    for (const row of sectorTrends.results || []) {
        const r = row as Record<string, any>;
        const velocity = r.count_7d / 7;
        const prevVelocity = r.count_prev_7d / 7;
        const changePercent = prevVelocity > 0 ? ((velocity - prevVelocity) / prevVelocity) * 100 : 100;

        trends.push({
            entity: r.entity_name || r.entity,
            entity_type: 'sector',
            article_count_24h: r.count_24h,
            article_count_7d: r.count_7d,
            velocity,
            change_percent: changePercent,
            is_trending: changePercent > 50 || r.count_24h >= 2,
            sample_titles: [],
        });
    }

    return trends.sort((a, b) => b.change_percent - a.change_percent);
}

// ───────────────────────────────────────────────────────────────────────────────
// Sentiment Analysis
// ───────────────────────────────────────────────────────────────────────────────
export type SentimentScore = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
    score: SentimentScore;
    confidence: number;
    positive_signals: string[];
    negative_signals: string[];
}

export async function analyzeSentiment(
    env: Env,
    title: string,
    content: string
): Promise<SentimentResult> {
    try {
        const prompt = `System: You are a financial news sentiment analyst. Analyze the sentiment of articles about African markets.
                    
Respond in JSON format:
{
    "score": "positive" | "neutral" | "negative",
    "confidence": 0.0-1.0,
    "positive_signals": ["signal1", "signal2"],
    "negative_signals": ["signal1", "signal2"]
}

Focus on investment/business implications. Positive = growth, investment, opportunity. Negative = risk, decline, instability.

User: Title: ${title}\n\nContent: ${content.slice(0, 1500)}`;
        
        const aiResponseRaw = await callConfiguredAI(env, { prompt, max_tokens: 200 });

        const text = aiResponseRaw || '';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                score: parsed.score || 'neutral',
                confidence: parsed.confidence || 0.5,
                positive_signals: parsed.positive_signals || [],
                negative_signals: parsed.negative_signals || [],
            };
        }

        return { score: 'neutral', confidence: 0.5, positive_signals: [], negative_signals: [] };
    } catch (error) {
        console.error('Sentiment analysis failed:', error);
        return { score: 'neutral', confidence: 0.5, positive_signals: [], negative_signals: [] };
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Coverage Heatmap - Identify Content Gaps
// ───────────────────────────────────────────────────────────────────────────────
export interface CoverageCell {
    country_code: string;
    country_name: string;
    sector_id: string;
    sector_name: string;
    article_count: number;
    avg_engagement: number;
    last_article_days: number | null;
    coverage_score: number; // 0-100
    needs_content: boolean;
}

export async function getCoverageHeatmap(env: Env): Promise<CoverageCell[]> {
    const coverage: CoverageCell[] = [];

    // Get all country-sector combinations
    const data = await env.DB.prepare(`
        SELECT 
            c.code as country_code,
            c.name as country_name,
            s.id as sector_id,
            s.name as sector_name,
            COUNT(a.id) as article_count,
            AVG(a.engagement_score) as avg_engagement,
            julianday('now') - julianday(MAX(a.published_at)) as days_since_last
        FROM countries c
        CROSS JOIN sectors s
        LEFT JOIN articles a ON a.country_code = c.code 
            AND a.sector_id = s.id 
            AND a.status = 'published'
        GROUP BY c.code, s.id
    `).all();

    for (const row of data.results || []) {
        const r = row as Record<string, any>;

        // Coverage score based on: article count, recency, engagement
        const countScore = Math.min(100, r.article_count * 10);
        const recencyScore = r.days_since_last === null ? 0 : Math.max(0, 100 - r.days_since_last * 3);
        const engagementScore = r.avg_engagement || 0;

        const coverageScore = (countScore * 0.4) + (recencyScore * 0.4) + (engagementScore * 0.2);

        coverage.push({
            country_code: r.country_code,
            country_name: r.country_name,
            sector_id: r.sector_id,
            sector_name: r.sector_name,
            article_count: r.article_count,
            avg_engagement: r.avg_engagement || 0,
            last_article_days: r.days_since_last,
            coverage_score: Math.round(coverageScore),
            needs_content: coverageScore < 30,
        });
    }

    return coverage.sort((a, b) => a.coverage_score - b.coverage_score);
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Trending Topics (CACHED)
// ───────────────────────────────────────────────────────────────────────────────
export async function getTrendingTopics(env: Env): Promise<TrendSignal[]> {
    return getCached(
        env,
        'trends:all',
        async () => {
            const trends = await detectTrends(env);
            return trends.filter(t => t.is_trending);
        },
        { ttl: CACHE_TTL.DASHBOARD } // 10 min cache
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Store Sentiment in Database
// ───────────────────────────────────────────────────────────────────────────────
export async function storeSentiment(
    env: Env,
    articleId: string,
    sentiment: SentimentResult
): Promise<void> {
    await env.DB.prepare(`
        UPDATE articles 
        SET sentiment_score = ?,
            sentiment_confidence = ?,
            sentiment_signals = ?
        WHERE id = ?
    `).bind(
        sentiment.score,
        sentiment.confidence,
        JSON.stringify({
            positive: sentiment.positive_signals,
            negative: sentiment.negative_signals,
        }),
        articleId
    ).run();
}
