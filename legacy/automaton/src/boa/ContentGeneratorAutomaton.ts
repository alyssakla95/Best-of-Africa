import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { BoaClient } from "./clients/BoaClient.js";

const execAsync = promisify(exec);

interface GeneratorConfig {
    boaApiBaseUrl: string;
    boaApiKey: string;
    pollingIntervalMs?: number;
    nanobotWorkspace?: string;
    nanobotPythonPath?: string;
    openRouterApiKey?: string;
}

interface GeneratedArticle {
    title: string;
    subtitle: string;
    summary: string;
    content: string;
    tags: string[];
    readingTime: number;
}

export class ContentGeneratorAutomaton {
    private config: GeneratorConfig;
    private boa: BoaClient;
    private isRunning: boolean = false;

    constructor(config: GeneratorConfig) {
        this.config = config;
        this.boa = new BoaClient(config.boaApiBaseUrl, config.boaApiKey);
    }

    public async start() {
        console.log(`[Generator] Target Backend: ${this.config.boaApiBaseUrl}`);
        console.log(`[Generator] Automaton stating: polling for tasks...`);
        this.isRunning = true;
        this.loop();
    }

    public stop() {
        this.isRunning = false;
    }

    private async loop() {
        const interval = this.config.pollingIntervalMs || 5000;
        while (this.isRunning) {
            try {
                await this.runCycle();
            } catch (err: any) {
                console.error(`[Generator] Cycle error: ${err.message}`);
            }

            // Sleep before next poll
            await new Promise(r => setTimeout(r, interval));
        }
    }

    private async runCycle() {
        // 1. Fetch pending task
        const response = await this.boa.getPendingTask();
        
        if (!response || !response.data) {
            // No tasks available
            return;
        }

        const task = response.data;
        console.log(`[Generator] Picked up task: [${task.id}] Type: ${task.type}`);

        if (task.type === "generate_article") {
            await this.processArticleGeneration(task);
        } else {
            console.warn(`[Generator] Unknown task type: ${task.type}`);
            await this.boa.completeTask(task.id, "failed", null, `Unknown task type: ${task.type}`);
        }
    }

    private async processArticleGeneration(task: any) {
        try {
            const payload = task.payload;
            console.log(`[Generator] Generating content for: "${payload.title}"`);

            // Call nanobot to generate real article content
            const generatedArticle = await this.callNanobotForArticle(payload);

            // Post success back to Cloudflare
            await this.boa.completeTask(task.id, "completed", generatedArticle);
            console.log(`[Generator] Successfully completed task: [${task.id}]`);

        } catch (error: any) {
            console.error(`[Generator] Error processing generation task: ${error.message}`);
            await this.boa.completeTask(task.id, "failed", null, error.message);
        }
    }

    private async callNanobotForArticle(payload: any): Promise<GeneratedArticle> {
        // Determine workspace path (project root where .agent/skills is located)
        const workspacePath = this.config.nanobotWorkspace || this.findProjectRoot();
        
        // Determine Python executable path
        const pythonPath = this.config.nanobotPythonPath || this.findPythonPath();
        
        // Construct the prompt for article generation
        const prompt = this.constructArticlePrompt(payload);
        
        console.log(`[Generator] Invoking nanobot with workspace: ${workspacePath}`);
        
        // Set up environment variables for nanobot
        const env: Record<string, string> = {
            ...process.env as Record<string, string>,
            "NANOBOT_AGENTS__DEFAULTS__WORKSPACE": workspacePath,
        };
        
        // Add API key if available
        if (this.config.openRouterApiKey) {
            env["NANOBOT_PROVIDERS__OPENROUTER__API_KEY"] = this.config.openRouterApiKey;
        }

        // Build the command
        const command = `"${pythonPath}" -m nanobot agent -m "${this.escapeShellArg(prompt)}" --no-markdown`;
        
        console.log(`[Generator] Executing: ${command.replace(/"[^"]+"/, "***python***")}`);
        
        try {
            const { stdout, stderr } = await execAsync(command, {
                env,
                timeout: 120000, // 2 minute timeout for generation
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
            });

            if (stderr) {
                console.log(`[Generator] nanobot stderr: ${stderr}`);
            }

            // Parse the nanobot output
            const parsed = this.parseNanobotOutput(stdout);
            
            // Calculate reading time (approx 200 words per minute)
            const wordCount = parsed.content.split(/\s+/).length;
            const readingTime = Math.max(1, Math.ceil(wordCount / 200));

            return {
                title: parsed.title || payload.title,
                subtitle: parsed.subtitle || `Analysis of ${payload.country_name || "African"} business landscape`,
                summary: parsed.summary || `Strategic intelligence on ${payload.title}`,
                content: parsed.content || stdout, // Fallback to raw output if parsing fails
                tags: parsed.tags || ["africa", "business", "investment"],
                readingTime,
            };

        } catch (execError: any) {
            console.error(`[Generator] nanobot execution failed: ${execError.message}`);
            
            // Fallback to mock generation if nanobot fails
            console.log(`[Generator] Falling back to mock generation due to error`);
            return this.generateMockArticle(payload);
        }
    }

    private constructArticlePrompt(payload: any): string {
        const countryName = payload.country_name || "Africa";
        const sourceContent = payload.content || "";
        const sourceUrl = payload.url || "";
        
        return `Generate a Best of Africa article about: "${payload.title}" for ${countryName}. ` +
               `Use the article-generator skill to create Guardian-style business journalism. ` +
               `Base the article on this source material: ${sourceContent.substring(0, 500)}... ` +
               `Original source: ${sourceUrl}. ` +
               `Follow the editorial guidelines in the article-generator skill exactly.`;
    }

    private parseNanobotOutput(output: string): { title: string; subtitle: string; content: string; summary: string; tags: string[] } {
        const result = {
            title: "",
            subtitle: "",
            content: "",
            summary: "",
            tags: [] as string[],
        };

        // Look for structured sections in the output
        const titleMatch = output.match(/TITLE:\s*(.+?)(?:\n|$)/i);
        if (titleMatch) {
            result.title = titleMatch[1].trim();
        }

        const subtitleMatch = output.match(/SUBTITLE:\s*(.+?)(?:\n|$)/i);
        if (subtitleMatch) {
            result.subtitle = subtitleMatch[1].trim();
        }

        const summaryMatch = output.match(/SUMMARY:\s*(.+?)(?:\n|$)/i);
        if (summaryMatch) {
            result.summary = summaryMatch[1].trim();
        }

        const tagsMatch = output.match(/TAGS:\s*(.+?)(?:\n|$)/i);
        if (tagsMatch) {
            result.tags = tagsMatch[1].split(",").map(t => t.trim()).filter(t => t);
        }

        // Extract content between CONTENT: and the next section or end
        const contentMatch = output.match(/CONTENT:\s*([\s\S]*?)(?=\n(?:TITLE|SUBTITLE|SUMMARY|TAGS):|$)/i);
        if (contentMatch) {
            result.content = contentMatch[1].trim();
        }

        // If no structured content found, use the full output as content
        if (!result.content && !result.title) {
            result.content = output.trim();
        }

        return result;
    }

    private findProjectRoot(): string {
        // Start from current directory and look for .agent directory
        let currentDir = process.cwd();
        const maxDepth = 5;
        
        for (let i = 0; i < maxDepth; i++) {
            const agentDir = path.join(currentDir, ".agent");
            if (fs.existsSync(agentDir)) {
                return currentDir;
            }
            
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break;
            }
            currentDir = parentDir;
        }
        
        // Default to current working directory
        return process.cwd();
    }

    private findPythonPath(): string {
        // Check for virtual environment Python
        const venvPython = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
        if (fs.existsSync(venvPython)) {
            return venvPython;
        }
        
        const venvPythonUnix = path.join(process.cwd(), ".venv", "bin", "python");
        if (fs.existsSync(venvPythonUnix)) {
            return venvPythonUnix;
        }
        
        // Fallback to system Python
        return process.platform === "win32" ? "python" : "python3";
    }

    private escapeShellArg(arg: string): string {
        // Escape double quotes and backslashes for shell safety
        return arg.replace(/["\\]/g, "\\$&");
    }

    private generateMockArticle(payload: any): GeneratedArticle {
        // Fallback mock generation for when nanobot fails
        console.log(`[Generator] Using mock generation for: "${payload.title}"`);
        
        return {
            title: payload.title,
            subtitle: `Automaton generated subtitle for ${payload.country_name || "Africa"}`,
            summary: `This is an async generated summary from the Automaton. Original item: ${payload.url}`,
            content: `This article was processed asynchronously by the ContentGeneratorAutomaton.\n\nOriginal content summary:\n${payload.content?.substring(0, 100)}\n\nThis validates the queue decoupling.`,
            tags: ["async", "automaton", "test"],
            readingTime: 2
        };
    }
}
