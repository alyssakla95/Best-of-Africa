# Agent Infrastructure

## Autonomous Lifecycle: Cloudflare-Native (default)

The platform is self-sufficient. Every autonomous role runs as Cloudflare
scheduled workers and queue consumers inside the deployed Worker — no external
agent is required for any environment:

- **Ingestion** — every minute (`workers/ingestion.ts`)
- **Generation** — content queue consumer + stale-task recovery
  (`workers/generator.ts`); tasks stranded more than 15 minutes are claimed
  internally, so the pipeline never depends on an external claimant
- **Editorial audit & publication** — every tick (`lib/moderation.ts`
  `auditPendingArticles`); audio narration and all six translation jobs run
  only after the source-grounded audit approves the final text
- **Enrichment backfills** — audio, translations, sectors, hero variants,
  source images (all self-terminating cron steps in `src/index.ts`)
- **Optimization, reporting, digests, events** — bounded cron schedules in
  `src/index.ts` (`scheduled()`)

Run telemetry for these workers persists to `agent_metrics`; deep health at
`/health/deep` reports real worker outputs (published/audio/translation/report
counts), not merely binding reachability.

## Optional External Runtime: ZeroClaw (deployment-specific)

**ZeroClaw** (`zeroclaw/` — cloned from [zeroclaw-labs/zeroclaw](https://github.com/zeroclaw-labs/zeroclaw))
is an OPTIONAL external accelerator for operators who want a local agent
claiming generation tasks faster than the 15-minute internal fallback. It is
not part of the platform's required infrastructure:

- A deployment works identically with or without it; the internal recovery
  path processes the same `agent_tasks` queue when ZeroClaw is offline.
- Enabling it is deployment-specific: set `ADMIN_API_KEY` on the Worker and
  point the local runtime at the `/agents/*` webhook endpoints, which are
  admin-key gated.
- **Auth**: Gemini OAuth (your Google subscription, no API key needed)
- **Config**: `.zeroclaw/config.json`
- **Launch**: `.zeroclaw/run.bat` (Windows)
- **Skills**: `.zeroclaw/skills/`

To start the agent: run `.zeroclaw/run.bat` after completing `zeroclaw auth login --provider gemini` once.

---

## Coding Assistant Skills (Antigravity)

The following skills are available to the **Antigravity coding assistant** within this workspace.
These are editorial guidelines — NOT the ZeroClaw runtime skill definitions.
The ZeroClaw runtime skill definitions live in `.zeroclaw/skills/`.

<available_skills>

- name: article-generator
    description: Generates high-quality, Guardian-style African business and tourism articles from raw news ingestion.
    path: .agent/skills/article-generator
- name: proactive-editorial
    description: Scans the BoA content database for articles that need auditing or refreshing.
    path: .agent/skills/proactive-editorial
- name: self-improving-editorial
    description: Logic for self-critique, feedback ingestion, and instruction evolution.
    path: .agent/skills/self-improving-editorial

</available_skills>
