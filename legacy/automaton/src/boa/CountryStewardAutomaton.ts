
import path from "path";
import fs from "fs";
import { type CountryStewardConfig } from "./config/country.steward.schema.js";
import { BoaClient, type BoaMetrics } from "./clients/BoaClient.js";
import { createConwayClient } from "../conway/client.js";
import { getUsdcBalance } from "../conway/x402.js";
import { getSurvivalTier } from "../conway/credits.js";
import { createDatabase, type AutomatonDatabase } from "../state/database.js";
import { type ConwayClient, type SurvivalTier } from "../types.js";
import { getWallet } from "../identity/wallet.js"; // Standard wallet loader - we might need to customize this

// Helper to load a specific wallet for a country
// Since getWallet() is hardcoded to ~/.automaton/wallet.json, we'll manually implement
// a similar loader that takes a custom path.
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem";

function loadCountryWallet(walletPath: string): PrivateKeyAccount {
    if (!fs.existsSync(walletPath)) {
        // Generate new wallet
        console.log(`[Wallet] No wallet found at ${walletPath}. Generating new one...`);
        const dir = path.dirname(walletPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const privateKey = generatePrivateKey();
        const data = {
            privateKey,
            createdAt: new Date().toISOString()
        };
        fs.writeFileSync(walletPath, JSON.stringify(data, null, 2), { mode: 0o600 });
        return privateKeyToAccount(privateKey);
    }
    const data = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
    return privateKeyToAccount(data.privateKey);
}

export class CountryStewardAutomaton {
    private config: CountryStewardConfig;
    private boa: BoaClient;
    private conway: ConwayClient;
    private db: AutomatonDatabase;
    private account: PrivateKeyAccount;
    private isRunning: boolean = false;

    constructor(config: CountryStewardConfig, privateKey?: string) {
        this.config = config;
        this.boa = new BoaClient(config.boaApiBaseUrl, config.boaApiKey);

        // Wallet setup
        // If privateKey provided, use it. Else check walletDataDir.
        // If neither, fail (mock mode might generate one).
        if (privateKey) {
            this.account = privateKeyToAccount(privateKey as `0x${string}`);
        } else {
            const walletFile = path.join(config.walletDataDir, "wallet.json");
            this.account = loadCountryWallet(walletFile);
        }

        // DB setup
        const dbPath = path.join(config.walletDataDir, "state.db");
        // Ensure dir exists
        fs.mkdirSync(config.walletDataDir, { recursive: true });
        this.db = createDatabase(dbPath);

        // Conway Client setup
        // Uses default API URL unless overridden
        this.conway = createConwayClient({
            apiUrl: "https://api.conway.tech",
            apiKey: this.config.boaApiKey || process.env.CONWAY_API_KEY || "",
            sandboxId: "steward-" + config.countryCode.toLowerCase()
        });
    }

    public async start() {
        console.log(`[${this.config.countryCode}] Steward starting for ${this.config.displayName}...`);
        this.isRunning = true;
        this.loop();
    }

    public stop() {
        this.isRunning = false;
    }

    private async loop() {
        while (this.isRunning) {
            try {
                await this.runCycle();
            } catch (err: any) {
                console.error(`[${this.config.countryCode}] Cycle error: ${err.message}`);
            }

            // Sleep 1 hour
            await new Promise(r => setTimeout(r, 3600000));
        }
    }

    private async runCycle() {
        const timestamp = new Date().toISOString();
        console.log(`[${this.config.countryCode}] Cycle starting at ${timestamp}`);

        // 1. Check Financials
        const credits = await this.conway.getCreditsBalance().catch(() => 0);
        const usdc = await getUsdcBalance(this.account.address).catch(() => 0);
        const tier = getSurvivalTier(credits);

        console.log(`[${this.config.countryCode}] Budget: $${(credits / 100).toFixed(2)} Credits, $${usdc.toFixed(2)} USDC. Tier: ${tier}`);

        if (tier === "critical" || tier === "dead") {
            console.warn(`[${this.config.countryCode}] Budget CRITICAL. Skipping actions.`);
            await this.emitStatus("critical", "Budget CRITICAL");
            return;
        }

        if (usdc < (this.config.minBalanceThresholdUsd || 0.5)) {
            console.warn(`[${this.config.countryCode}] USDC Low. Skipping actions.`);
            await this.emitStatus("low_budget", "USDC Low");
            return;
        }

        // 2. Fetch Metrics
        const metrics = await this.boa.getCountryMetrics(this.config.countryCode);
        console.log(`[${this.config.countryCode}] Metrics: Views=${metrics.pageViews}, Bounce=${metrics.bounceRate}%`);

        // 3. Decide
        if (metrics.campaignActive || this.config.campaignActive) {
            console.log(`[${this.config.countryCode}] Campaign Active! Aggressive monitoring.`);
            // TODO: Aggressive logic
        }

        // Simple Rule: Drop in engagement > threshold
        // We need previous metrics to compare.
        const prevViewsStr = this.db.getKV("last_page_views");
        const prevViews = prevViewsStr ? parseInt(prevViewsStr) : metrics.pageViews;

        const dropPercent = ((prevViews - metrics.pageViews) / prevViews) * 100;

        let actionTaken = false;

        if (dropPercent > this.config.auditThresholds.engagementDropPercent) {
            console.log(`[${this.config.countryCode}] Engagement dropped ${dropPercent.toFixed(1)}%. Triggering Audit.`);

            // Check last audit time
            const lastAuditApi = metrics.lastAuditDate ? new Date(metrics.lastAuditDate).getTime() : 0;
            const minInterval = this.config.auditThresholds.minTimeBetweenAuditsHours * 3600 * 1000;

            if (Date.now() - lastAuditApi > minInterval) {
                await this.boa.requestBatchAudit({
                    countryCode: this.config.countryCode,
                    scope: "priority",
                    reason: `Engagement drop detected: ${dropPercent.toFixed(1)}%`
                });
                actionTaken = true;
            } else {
                console.log(`[${this.config.countryCode}] Audit skipped (too soon).`);
            }
        } else {
            console.log(`[${this.config.countryCode}] Metrics Stable.`);
        }

        // Save state
        this.db.setKV("last_page_views", metrics.pageViews.toString());
        this.db.setKV("last_cycle", timestamp);

        await this.emitStatus(tier, actionTaken ? "Action taken: Audit triggered." : "Metrics Stable.");
    }

    private async emitStatus(tier: string, message: string = "") {
        try {
            const credits = await this.conway.getCreditsBalance().catch(() => 0);
            const usdc = await getUsdcBalance(this.account.address).catch(() => 0);

            await this.boa.postStewardStatus(this.config.countryCode, {
                status: tier === "critical" || tier === "dead" ? "critical" : "active",
                tier: tier,
                credits: credits / 100, // Convert to float dollars
                usdc: usdc,
                message: message || "Routine check"
            });
        } catch (error) {
            console.error(`Failed to post steward status: ${error}`);
        }
    }
}

