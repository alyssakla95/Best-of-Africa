
export interface CountryStewardConfig {
    countryCode: string; // ISO 2-letter (e.g. RW)
    displayName: string;
    boaApiBaseUrl: string; // e.g. http://localhost:8787
    boaApiKey?: string;

    // Budget & Financials
    walletDataDir: string; // e.g. ~/.automaton/boa/RW
    maxMonthlySpendUsd: number;
    minBalanceThresholdUsd: number; // default 0.50

    // Operational thresholds
    auditThresholds: {
        engagementDropPercent: number; // default 20
        minTimeBetweenAuditsHours: number; // default 24
    };

    // Scope
    priorityPages: string[];
    campaignActive: boolean;

    // Batch Jobs (Conway Compute)
    batchJobConfig?: {
        enabled: boolean;
        sandboxConfig?: {
            vcpu: number;
            memoryMb: number;
        }
    };
}

export const DEFAULT_STEWARD_CONFIG: Partial<CountryStewardConfig> = {
    minBalanceThresholdUsd: 0.5,
    auditThresholds: {
        engagementDropPercent: 20,
        minTimeBetweenAuditsHours: 24,
    },
    priorityPages: [],
    campaignActive: false,
};
