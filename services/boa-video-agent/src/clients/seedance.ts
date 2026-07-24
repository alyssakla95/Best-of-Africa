
import axios from 'axios';

export interface VideoStatus {
    id: string;
    status: 'processing' | 'succeeded' | 'failed';
    output_url?: string;
    error?: string;
}

export class SeedanceClient {
    private apiKey: string;
    private baseUrl: string;

    constructor(apiKey: string, baseUrl: string = 'https://api.seedance.app') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;

        if (!this.apiKey) {
            // Throwing error to prevent startup without keys
            throw new Error("SeedanceClient requires an API KEY. Mock mode is disabled.");
        }
    }

    async generateVideo(prompt: string, duration: number = 10, style: string = 'cinematic', resolution: string = '1080p'): Promise<string> {
        try {
            const res = await axios.post(`${this.baseUrl}/generate/text-to-video`, {
                prompt,
                duration,
                style,
                resolution
            }, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            if (res.data && res.data.success && res.data.data) {
                return res.data.data.video_id;
            }
            throw new Error(res.data?.error || "Unknown Seedance API error");
        } catch (error) {
            console.error("[SeedanceClient] Generation failed:", error);
            throw error;
        }
    }

    async getVideoStatus(videoId: string): Promise<VideoStatus> {
        try {
            const res = await axios.get(`${this.baseUrl}/generate/status/${videoId}`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });

            // Map Seedance status to our internal standardized status
            const rawStatus = res.data?.data?.status; // e.g. 'processing', 'completed', 'failed'

            let status: VideoStatus['status'] = 'processing';
            if (rawStatus === 'completed' || rawStatus === 'succeeded') status = 'succeeded';
            if (rawStatus === 'failed' || rawStatus === 'error') status = 'failed';

            return {
                id: videoId,
                status,
                output_url: res.data?.data?.video_url,
                error: res.data?.data?.error_message
            };
        } catch (error) {
            console.error(`[SeedanceClient] Status check failed for ${videoId}:`, error);
            // Treat 404 as failed
            return { id: videoId, status: 'failed', error: 'Status check failed' };
        }
    }
}
