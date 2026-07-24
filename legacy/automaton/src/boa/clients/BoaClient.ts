
/**
 * BoA Backend Client
 * 
 * Strictly explicitly whitelisted endpoints.
 */

export interface BoaMetrics {
    countryCode: string;
    pageViews: number;
    bounceRate: number;
    avgTimeOnPage: number;
    lastAuditDate?: string;
    campaignActive: boolean;
}

export interface AuditRequest {
    articleId: string;
    reason: string;
}

export interface BatchAuditRequest {
    countryCode: string;
    scope: "all" | "priority" | "campaign";
    reason: string;
}

export class BoaClient {
    private baseUrl: string;
    private apiKey?: string;

    constructor(baseUrl: string, apiKey?: string) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.apiKey = apiKey;
    }

    private async request<T>(method: string, path: string, body?: any): Promise<T> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (this.apiKey) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
        }

        const resp = await fetch(`${this.baseUrl}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!resp.ok) {
            throw new Error(`BoA API Request Failed: ${method} ${path} -> ${resp.status} ${await resp.text()}`);
        }

        return resp.json() as Promise<T>;
    }

    public async getCountryMetrics(countryCode: string): Promise<BoaMetrics> {
        return this.request<BoaMetrics>("GET", `/boa/metrics/country/${countryCode}`);
    }

    public async requestAudit(req: AuditRequest): Promise<{ ticketId: string }> {
        return this.request<{ ticketId: string }>("POST", "/boa/audit", req);
    }

    public async requestBatchAudit(req: BatchAuditRequest): Promise<{ jobId: string }> {
        return this.request<{ jobId: string }>("POST", "/boa/batch-audit", req);
    }

    public async postStewardStatus(countryCode: string, status: any): Promise<void> {
        // Fire and forget or simple sync
        try {
            await this.request("POST", `/boa/steward-status/${countryCode}`, status);
        } catch (e) {
            console.warn(`Failed to post steward status: ${e}`);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────────
    // Agent Task Queue Methods
    // ───────────────────────────────────────────────────────────────────────────────
    
    public async getPendingTask(): Promise<{ data: any, message: string } | null> {
        try {
            return await this.request<{ data: any, message: string }>("GET", "/api/v1/agent/tasks/pending");
        } catch (e) {
            console.warn(`Failed to get pending task: ${e}`);
            return null;
        }
    }

    public async completeTask(taskId: string, status: "completed" | "failed", result?: any, errorMessage?: string): Promise<void> {
        try {
            await this.request("POST", "/api/v1/agent/tasks/complete", {
                taskId,
                status,
                result,
                errorMessage
            });
        } catch (e) {
            console.warn(`Failed to complete task ${taskId}: ${e}`);
        }
    }
}
