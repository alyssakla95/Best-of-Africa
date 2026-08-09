# BOA-Story

BOA-Story is a deployed African reporting and market-intelligence platform for readers and organizations worldwide. It combines source-attributed articles, country research, official economic indicators, sector-performance analysis, a continental dashboard, narrated briefings, multilingual reading, events, search, personalization, member services, and a structured enterprise-pilot workflow in one responsive application.

The platform is not a live trading terminal and does not treat reporting volume, sentiment, or synthetic scores as economic performance. Market and country views distinguish:

- official or attributed evidence;
- the date and coverage of that evidence;
- supported interpretation;
- limitations, counter-signals, and questions requiring further diligence.

## Commercial position

The current product state is:

> **Production-deployed intelligence platform with a measurable design-partner pilot workflow**

The initial commercial proposition is deliberately narrow:

| Element | Current definition |
| --- | --- |
| Primary buyer | Corporate strategy, investment, growth and market-entry teams worldwide, working with their advisers |
| Recurring decision | Which African country and sector conditions justify deeper entry diligence, and which risks must be resolved first? |
| Pilot boundary | Four weeks, one target sector, up to three candidate countries and one named internal decision |
| Deliverables | Evidence dossier, country comparison, executive decision brief, claim/source ledger, diligence register and closeout review |
| Economic hypothesis | Reduce time spent reconciling fragmented public evidence and make unresolved risks visible before specialist diligence or capital commitment |
| Validation approach | Each pilot records the existing research baseline, delivery cycle, evidence traceability and unresolved diligence work |

The [Enterprise pilot](https://alyssa-boa-web.pages.dev/enterprise) defines the workflow and success measures. A separate [structured application](https://alyssa-boa-web.pages.dev/enterprise/apply) records the applicant, sector, one to three candidate countries, decision question, deadline, current research process, and measurable success condition. Submissions enter a protected operator inbox with qualification status and private review notes; the form prohibits confidential or sensitive information. The [Trust Center](https://alyssa-boa-web.pages.dev/trust) documents current controls, data handling, service health, and procurement disclosures.

BOA-Story does not replace legal, tax, regulatory or in-country commercial diligence. The Enterprise page publishes fixed entry pricing — a US$750 focused brief, a US$1,800 comparative entry pilot, and a US$300 per month monitoring extension — together with scope, delivery, payment terms, and a credibility-stage disclosure.

### Evidence boundary

The repository and live deployment demonstrate implemented software, operating controls, public data contracts, and a functioning pilot-intake workflow. They do not by themselves demonstrate paying customers, completed pilot outcomes, repeatable revenue, formal certification, insurance coverage, or independent product testing. Those claims should only be added when supported by verifiable external evidence.

### Reader position and validation

The enterprise decision proposition remains the primary commercial workflow. Alongside it, the initial reader pathway is designed for African diaspora and globally connected professionals who want to follow African business, economic, and policy developments without reconciling fragmented sources themselves.

The recurring reader habit is the **Africa Briefing**:

- a concise entry point assembled from currently published, source-attributed reporting;
- country and sector preferences for a more relevant reading sequence;
- direct paths into country records, Market Intelligence, and the Continental Overview;
- audio playback, saved articles, notifications, and the weekly email briefing where configured.

The product records first-party evidence needed to evaluate this pathway: monthly and weekly active readers, sessions active on multiple dates, briefing opens, article reads reaching at least 75% observed scroll depth, audio starts and completions, bookmarks, and newsletter subscriptions. These are operator-only measurements, not public social proof. Audience collection begins when migration `0053_reader_engagement.sql` is deployed and is not backfilled.

The reader product remains in pre-audience-validation state. No subscriber conversion, churn, willingness-to-pay, acquisition-cost, or consumer-revenue claim is made without observed external evidence.

Reader membership is live at US$4, US$9, and US$19 per month with Ko-fi monthly billing. Every tier includes complete reader access; the higher tiers are voluntary support rather than additional entitlements.

## Live deployment

| Surface | URL |
| --- | --- |
| Reader application | [alyssa-boa-web.pages.dev](https://alyssa-boa-web.pages.dev) |
| API Worker | [alyssa-boa-api.alyssavanklassen.workers.dev](https://alyssa-boa-api.alyssavanklassen.workers.dev) |
| Deep health | [API `/api/v1/health/deep`](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/health/deep) |
| API documentation | [Swagger UI](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/docs) |

These URLs describe the currently verified Alyssa Cloudflare deployment. The repository also supports account-neutral deployment under a different resource prefix and Cloudflare account.

### Verified state

Last checked on 9 August 2026:

- the frontend and API were reachable, along with the reader, enterprise, membership, countries, trust, and pilot-application routes;
- the structured pilot application was reachable and its protected operator inbox was reading the migrated production table;
- D1, content processing, KV media storage, Vectorize, Durable Objects, and autonomous worker outputs were healthy;
- the database contained 831 article records;
- the current worker-output inventory reported 361 published articles, 360 audio files, and 2,146 quality-approved translations across six non-English languages, plus 82 market reports;
- the production bundle was served with immutable asset caching;
- the complete test suite contained 311 passing tests.

The verified Alyssa-account release was repository commit `16f1e64` and Worker version `2374595b-8c51-4f91-a18d-f8b32a70ca92`.

The deep-health response is currently `degraded`, rather than `healthy`, because of two checks: `coverage_diversity` reports that the rolling evidence window has not yet met the all-country, publisher, and global-source quality standard, and `email_delivery` reports that no verified transactional email provider and sender are configured. The endpoint returns HTTP 503 while any check is degraded by design. The content, intelligence, search, audio, translation, and web delivery paths remain operational.

## What is implemented

### Reader experience

- Source-attributed African reporting with article pages, related coverage, audio playback, reading tools, and saved articles.
- Country directory and country hubs with current evidence, trade and economic context, sector coverage, narrative analysis, events, and linked sources.
- Market Intelligence with official sector-performance indicators, country coverage, evidence notes, methodology, and verifiable platform reporting activity.
- Continental Overview with regional comparisons, official indicator context, narrated briefings, evidence tables, limitations, and supporting records.
- Search across articles and countries, autocomplete, filters, and a command menu.
- Events, consultation requests, travel information, a personal library, reader settings, notifications, and personalized feeds.
- A distinct Africa Briefing pathway for diaspora and globally connected readers without reducing the Enterprise, Market Intelligence, or Continental Overview position.
- A global Enterprise pilot page, structured application and protected qualification workflow, plus a Trust Center for data handling, operational controls, and procurement review.
- Responsive navigation and layouts for desktop and mobile, including mobile alternatives for wide data tables.

### Languages

The interface supports:

- English
- French
- Portuguese
- German
- Chinese
- Modern Standard Arabic, including right-to-left layout
- Hindi

Published article translations are stored for the six non-English languages and served only after quality checks. Interface copy resolves only from source-controlled language catalogues; it is never generated on demand. Portuguese has the complete maintained reader-interface catalogue, while the other non-English locales currently translate reviewed navigation and keyed product copy and explicitly preserve longer English source passages. When a verified long-form article translation is absent or fails validation, the application preserves the English source instead of presenting a partial or invented translation.

### Editorial and intelligence controls

- Ingested material is quarantined until a separate source-grounded editorial audit approves it.
- New articles treat each supplied source record as a closed factual universe and must preserve supported names, dates, figures, chronology, contrary evidence, and source limitations.
- Articles must contain 600-2,000 evidence-supported words and a professional brief of at least 200 words; unsupported padding does not satisfy the depth gate.
- Publication requires an independent, source-grounded audit score of at least 80% with no unresolved findings.
- Failed drafts remain quarantined and can be repaired and independently re-audited without bypassing publication controls.
- Reader and administrator screens use neutral editorial and product terminology rather than exposing provider, model, prompt, or drafting-process language.
- Market-performance views use official series and explicitly label proxy indicators and incompatible comparisons.
- New and recovered images are restricted to attributable source photography. Generative image production is disabled, and the scheduled remediation path replaces incomplete legacy image records when a suitable source image is available.
- Audio uses a configured narration service with a Cloudflare-native fallback.

Prepared text is never published merely because preparation succeeded. Audit, remediation, translation, narration, and worker telemetry are recorded in D1.

### Administration and platform services

- Admin authentication and article review.
- Source management and deletion.
- Client provisioning with hashed credentials and one-time API-key display.
- Editorial inbox, structured pilot qualification and private review notes, audit controls, analytics, and worker health.
- Operator-only audience reporting with explicit metric definitions, zero-safe empty states, and no substituted estimates.
- Member authentication, preferences, notifications, bookmarks, campaign authorization, events, newsletters, and reporting APIs.
- OpenAPI/Swagger documentation under `/api/v1/docs`.
- Lightweight, readiness, liveness, and deep-health endpoints.

## Current review configuration

The application is temporarily in stakeholder member-preview mode:

- read-only member views are visible without a subscription;
- article paywall truncation is disabled;
- account administration and cost-incurring protected actions remain authenticated.

This is deliberate review configuration, not the final subscription policy. Restore normal member gating by setting both review constants to `false`:

- `MEMBER_PREVIEW_MODE` in `frontend/src/config/flags.ts`
- `PAYWALL_DISABLED_FOR_REVIEW` in `src/routes/articles.ts`

## Architecture

| Layer | Current implementation |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Radix UI, Framer Motion, Recharts |
| API | TypeScript Cloudflare Worker using Hono and Zod |
| Relational data | Cloudflare D1 with versioned SQL migrations |
| Cache and sessions | Cloudflare KV |
| Media | R2 when available; KV-backed media storage as the portable fallback |
| Search | D1 full-text search plus Cloudflare Vectorize semantic retrieval |
| Editorial processing | Cloudflare-native preparation, source-grounded audit, repair, translation, narration, and retrieval services |
| Async work | Cloudflare Queues for preparation, translation, and optimization |
| Scheduling | One-minute Cloudflare cron with bounded internal schedules |
| Metrics | Analytics Engine and persisted `agent_metrics` telemetry |
| Reader evidence | D1 engagement events plus Analytics Engine delivery, using hashed sessions, stored IP addresses, and one-way user-agent fingerprints |
| Live state | Durable Object `LiveCounter` |
| Frontend hosting | Cloudflare Pages |

### Autonomous lifecycle

The deployed Worker is self-sufficient. No laptop or external agent must remain online.

1. The master cron checks eligible sources every minute.
2. New source records create preparation work in Cloudflare Queues.
3. Queue consumers prepare drafts; stranded work is recovered internally.
4. A separate editorial audit verifies source grounding and publication requirements.
5. Only approved articles are published.
6. Audio, six article translations, source-image recovery, sector classification, search indexing, and other archive backfills run as bounded, self-terminating jobs.
7. Country evidence, events, optimization, reporting, newsletters, and telemetry run on their own schedules.

Each scheduled step is isolated so one provider failure does not stop unrelated maintenance work.

The one-minute schedule is a processing cadence, not a promise to publish one article per minute. Publication occurs only when a new source is eligible and the resulting article passes every evidence and quality gate.

### Optional ZeroClaw accelerator

`zeroclaw/` contains an optional external runtime that can claim preparation tasks sooner than the Worker's internal stale-task recovery. It is not required for production operation. A deployment behaves correctly when ZeroClaw is absent or offline.

The external runtime is deployment-specific and requires an admin key plus its own provider authentication. See `AGENTS.md` and `.zeroclaw/` for the operator workflow.

## Repository layout

```text
frontend/                 React reader and admin application
src/index.ts              Worker entry point, routing, cron and queue dispatch
src/routes/               Public, member, admin and system API routes
src/lib/                  Editorial, evidence, media and platform services
src/workers/              Ingestion, preparation, optimization, reporting and backfills
migrations/               Ordered D1 schema and data migrations
tests/unit/               Unit and contract tests
tests/integration/        API and cross-layer regression tests
scripts/                  Account-neutral deployment tooling
wrangler.portable.toml.example
                          Cloudflare template without account-specific IDs
zeroclaw/                 Optional external task-claiming runtime
```

## Local development

### Requirements

- Node.js 20 or newer
- npm
- A Cloudflare account and Wrangler login for Worker integrations

Install backend and frontend dependencies:

```bash
npm ci
npm --prefix frontend ci
```

Apply migrations to the local D1 database:

```bash
npm run db:migrate
```

For local Worker secrets and overrides, create `.dev.vars` and do not commit it. A practical development configuration is:

```dotenv
ENVIRONMENT=development
JWT_SECRET=replace-with-a-long-random-value
ADMIN_API_KEY=replace-with-a-long-random-value
DEV_SECRET=replace-with-a-long-random-value
PUBLIC_API_URL=http://localhost:8787
PUBLIC_SITE_URL=http://localhost:5173
ADDITIONAL_ORIGINS=http://localhost:5173
```

Start the Worker and Vite application together:

```bash
npm run dev
```

Default local addresses are normally:

- frontend: `http://localhost:5173`
- Worker: `http://localhost:8787`
- API base: `http://localhost:8787/api/v1`

Optional source, narration, and email credentials activate their corresponding integrations. Missing optional credentials use documented fallbacks or report the integration as unavailable.

## Validation

Run the complete local release checks:

```bash
npm run typecheck
npm test
npx tsc --noEmit -p frontend/tsconfig.app.json
npm --prefix frontend run lint
npm --prefix frontend run build
```

The CI quality gate runs backend typechecking, all Vitest unit and integration tests, frontend typechecking, and the complete Vite production build on every push and pull request. Frontend linting is an additional local release check.

## Cloudflare deployment

### Recommended account-neutral workflow

The portable deployment script provisions uniquely named resources in the Cloudflare account currently authenticated through Wrangler. It writes generated resource IDs, URLs, and locally generated secrets only to ignored `.cloudflare/` files.

Preview the resources without changing Cloudflare:

```bash
npm run cloudflare:plan -- --prefix my-boa
```

Provision D1, KV, media storage, Vectorize, Queues, Pages, Analytics, content processing, and the Durable Object, then deploy:

```bash
npm run cloudflare:setup -- --prefix my-boa --deploy
```

Deploy subsequent versions using the saved local configuration:

```bash
npm run cloudflare:deploy -- --prefix my-boa
```

The deployment order is:

1. apply remote D1 migrations;
2. deploy the backend Worker;
3. write the frontend API origin;
4. build the frontend;
5. deploy Cloudflare Pages.

Useful options include `--account-id`, `--site-url`, `--api-url`, `--pages-project`, `--worker-name`, `--no-pages`, and `--require-r2`.

The script never deletes or replaces remote resources. If R2 is unavailable, setup provisions a KV media namespace unless `--require-r2` was requested.

### Required secrets

Portable setup creates strong local deployment values for:

- `JWT_SECRET`
- `ADMIN_API_KEY`
- `DEV_SECRET`

They are stored in ignored `.cloudflare/secrets.env` and passed to Wrangler during deployment. Do not commit or print this file.

Optional production secrets currently used by deployable integrations include:

```bash
npx wrangler secret put NEWS_API_KEY
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put ELEVENLABS_VOICE_ID
npx wrangler secret put EMAIL_FROM
npx wrangler secret put RESEND_API_KEY
```

Transactional email requires both a verified sender/domain and a supported delivery binding or provider. Setting an API key without a verified `EMAIL_FROM` address is intentionally treated as unavailable.

## Health and operations

Primary operational endpoints:

```text
GET /health
GET /health/live
GET /health/ready
GET /health/deep
GET /api/v1/agent/status
GET /api/v1/docs
```

Primary reader-facing intelligence contracts:

```text
GET  /api/v1/market-intel/coverage-pulse
GET  /api/v1/dashboards/continental/overview
GET  /api/v1/personalization/feed/curated
POST /api/v1/intel/analyst
```

Pilot workflow contracts:

```text
POST  /api/v1/services/pilot-requests
GET   /api/v1/admin/inbox
PATCH /api/v1/admin/pilot-requests/:id
```

The application endpoint is public, origin checked, rate limited, and schema validated. Inbox and qualification-status operations require administrator authentication. The application accepts no confidential or sensitive information and does not promise pilot acceptance or an outcome.

Reader measurement contracts:

```text
POST /api/v1/analytics/events
POST /api/v1/analytics/events/batch
GET  /api/v1/analytics/audience
```

Event submission requires a valid reader session and is origin checked, rate limited, and schema validated. Audience reporting requires administrator authentication. Each event stores the connecting IP address and a one-way SHA-256 fingerprint of the normalized user-agent; the raw user-agent string is not stored in D1. Events and their identifiers are deleted after 90 days.

`/health/deep` checks actual database content, cache access, rate limiting, media storage, published/audio/translation/report outputs, email delivery, semantic retrieval, content-processing circuit breakers, and Durable Objects. A reachable binding alone is not reported as healthy if the expected output is absent.

Worker logs can be streamed with:

```bash
npm run tail
```

## Known operational limitations

- Transactional email is not active in the currently verified Alyssa deployment because no verified sender has been configured.
- That Cloudflare account uses KV media storage because R2 is unavailable. The abstraction supports migration to R2 later.
- Member preview and server-side paywall bypass are intentionally enabled for stakeholder review.
- Subscription prices and commercial entitlements are product configuration, not evidence about platform health.
- Live coverage counts change as the autonomous pipeline publishes, translates, and refreshes records.
- Consumer retention, acquisition, conversion, churn, and revenue are not treated as proven until the new first-party measurement record contains sufficient observed activity.
- External sources and processing services can rate-limit or fail; the scheduler isolates failures and retries bounded queue work, but it cannot guarantee third-party availability.
- Public AI-assisted endpoints enforce per-IP rate limits, and the interface translation endpoint is throttled against bulk automated use.

## Security notes

- Admin endpoints require the admin API key or an admin-authorized token.
- Client secrets and API keys are hashed at rest; newly provisioned raw keys are returned once.
- State-changing browser requests are origin/CSRF checked.
- Session-scoped preferences, bookmarks, and notifications require a valid session identifier.
- Reader engagement events store IP addresses, hashed session identifiers, and one-way user-agent fingerprints for up to 90 days as disclosed in the Privacy Policy.
- Production error responses do not expose internal exception details.
- Deployment secrets and account-specific Cloudflare binding files are ignored by Git.

## License

No open-source license is granted. This repository and the BOA-Story product are proprietary; all rights are reserved.
