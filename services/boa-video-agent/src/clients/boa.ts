
import axios from 'axios';

export interface ArticleMetadata {
    id: string;
    title: string;
    description?: string; // summary
    country?: string;
    topic?: string; // sector
    variants?: {
        tourist?: string;
        investor?: string;
        policy?: string;
    };
}

export class BoaContentClient {
    private baseUrl: string;
    private apiKey: string;

    constructor(baseUrl: string = 'http://localhost:8787/api', apiKey: string = '') {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;

        if (!this.apiKey) {
            console.warn('[BoaContentClient] Warning: No API Key provided. Live requests may fail.');
        }
    }

    async getArticleMetadata(articleId: string): Promise<ArticleMetadata | null> {
        try {
            // Fetch from public/internal API
            const url = `${this.baseUrl}/articles/${articleId}`;

            const res = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            const data = res.data;
            if (!data) return null;

            // Map response to Metadata
            return {
                id: data.id,
                title: data.title,
                description: data.summary,
                country: data.country_name || data.country_code,
                topic: data.sector_name,
                variants: {
                    // Fallback to summary if variant not present in main DB yet
                    tourist: data.summary
                }
            };
        } catch (error) {
            console.error(`[BoaContentClient] Error fetching article ${articleId}:`, error);
            throw new Error(`Failed to fetch article ${articleId}: ${(error as any).message}`);
        }
    }
}
