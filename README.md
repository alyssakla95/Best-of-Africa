# BOA-Story

BOA-Story is a deployed African editorial and market-intelligence platform. It combines source-attributed reporting, country research, official economic indicators, continental dashboards, narrated briefings, multilingual reading, events, search, personalization, and member services in one reader-facing application.

The platform is not a market-data terminal and does not treat reporting volume, sentiment, or generated scores as economic performance. Market and country views distinguish:

- official or attributed evidence;
- the date and coverage of that evidence;
- supported interpretation;
- limitations, counter-signals, and questions requiring further diligence.

## Live deployment

| Surface | URL |
| --- | --- |
| Reader application | [alyssa-boa-web.pages.dev](https://alyssa-boa-web.pages.dev) |
| API Worker | [alyssa-boa-api.alyssavanklassen.workers.dev](https://alyssa-boa-api.alyssavanklassen.workers.dev) |
| Deep health | [API `/health/deep`](https://alyssa-boa-api.alyssavanklassen.workers.dev/health/deep) |
| API documentation | [Swagger UI](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/docs) |

These URLs describe the currently verified Alyssa Cloudflare deployment. The repository also supports account-neutral deployment under a different resource prefix and Cloudflare account.

### Verified state

Last checked on 25 July 2026:

- the frontend and API were reachable;
- D1, Workers AI, KV media storage, Vectorize, Durable Objects, and autonomous worker outputs were healthy;
- the database contained 304 articles;
- the current worker-output inventory reported 14 published articles, 14 audio files, and 84 quality-approved translations across six non-English languages;
- the seven-day coverage pulse contained 14 stories across 3 countries;
- the continental overview returned all 5 regions and 6 narrated briefings;
- the production bundle was served with immutable asset caching;
- the complete test suite contained 208 passing tests.

The deep-health response is currently `degraded`, rather than `healthy`, because this Cloudflare account does not yet have a verified transactional email sender. The content, intelligence, search, audio, translation, and web delivery paths remain operational.

## What is implemented

### Reader experience

- Source-attributed African reporting with article pages, related coverage, audio playback, reading tools, and saved articles.
- Country directory and country hubs with current evidence, trade and economic context, sector coverage, narrative analysis, events, and linked sources.
- Market Intelligence with official sector-performance indicators, country coverage, evidence notes, methodology, and verifiable platform reporting activity.
- Continental Overview with regional comparisons, official indicator context, narrated briefings, evidence tables, limitations, and supporting records.
- Search across articles and countries, autocomplete, filters, and a command menu.
- Events, consultation requests, travel information, a personal library, reader settings, notifications, and personalized feeds.
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

Published article translations are stored for the six non-English languages and served only after quality checks. Interface strings can also be translated on demand and cached. When a verified long-form translation is absent or fails validation, the application preserves the English source instead of presenting a partial or invented translation.

### Editorial and intelligence controls

- Ingested material is quarantined until a separate source-grounded editorial audit approves it.
- New articles must meet minimum depth requirements and preserve supplied names, dates, figures, chronology, contrary evidence, and source limitations.
- Reader-facing synthesis uses Cloudflare Workers AI `@cf/openai/gpt-oss-120b`.
- Lower-cost specialist work, such as classification, uses a separate multilingual model.
- Model output is checked for incomplete structure, insufficient depth, unsupported content, and internal process-language leakage.
- Market-performance views use official series and explicitly label proxy indicators and incompatible comparisons.
- New and recovered images are restricted to attributable source photography. Generative image production is disabled, and the scheduled remediation path replaces incomplete legacy image records when a suitable source image is available.
- Audio uses ElevenLabs when configured and Cloudflare Workers AI speech as the built-in fallback.

AI assists the production workflow, but generated text is not published merely because generation succeeded. The publication gate is evidence-based and records audit, remediation, translation, audio, and worker telemetry in D1.

### Administration and platform services

- Admin authentication and article review.
- Source management and deletion.
- Client provisioning with hashed credentials and one-time API-key display.
- Editorial inbox, audit controls, analytics, and worker health.
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
| Generation | Cloudflare Workers AI, with optional operator-configured providers |
| Async work | Cloudflare Queues for generation, translation, and optimization |
| Scheduling | One-minute Cloudflare cron with bounded internal schedules |
| Metrics | Analytics Engine and persisted `agent_metrics` telemetry |
| Live state | Durable Object `LiveCounter` |
| Frontend hosting | Cloudflare Pages |

### Autonomous lifecycle

The deployed Worker is self-sufficient. No laptop or external agent must remain online.

1. The master cron checks sources every minute.
2. Ingested records create generation work in Cloudflare Queues.
3. Queue consumers generate drafts; stranded work is recovered internally.
4. A separate editorial audit verifies source grounding and publication requirements.
5. Only approved articles are published.
6. Audio, six article translations, source-image recovery, sector classification, search indexing, and other archive backfills run as bounded, self-terminating jobs.
7. Country evidence, events, optimization, reporting, newsletters, and telemetry run on their own schedules.

Each scheduled step is isolated so one provider failure does not stop unrelated maintenance work.

### Optional ZeroClaw accelerator

`zeroclaw/` contains an optional external runtime that can claim generation tasks sooner than the Worker's internal stale-task recovery. It is not required for production operation. A deployment behaves correctly when ZeroClaw is absent or offline.

The external runtime is deployment-specific and requires an admin key plus its own provider authentication. See `AGENTS.md` and `.zeroclaw/` for the operator workflow.

## Repository layout

```text
frontend/                 React reader and admin application
src/index.ts              Worker entry point, routing, cron and queue dispatch
src/routes/               Public, member, admin and system API routes
src/lib/                  Editorial, AI, evidence, media and platform services
src/workers/              Ingestion, generation, optimization, reporting and backfills
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

Provider keys such as `NEWS_API_KEY`, `ELEVENLABS_API_KEY`, or third-party model credentials are optional. Their corresponding integrations degrade or fall back when the keys are absent.

## Validation

Run the same substantive checks used by CI:

```bash
npm run typecheck
npm test
npx tsc --noEmit -p frontend/tsconfig.app.json
npm --prefix frontend run lint
npm --prefix frontend run build
```

CI runs backend typechecking, all Vitest unit and integration tests, frontend typechecking, and the complete Vite production build on every push and pull request.

## Cloudflare deployment

### Recommended account-neutral workflow

The portable deployment script provisions uniquely named resources in the Cloudflare account currently authenticated through Wrangler. It writes generated resource IDs, URLs, and locally generated secrets only to ignored `.cloudflare/` files.

Preview the resources without changing Cloudflare:

```bash
npm run cloudflare:plan -- --prefix my-boa
```

Provision D1, KV, media storage, Vectorize, Queues, Pages, Analytics, Workers AI, and the Durable Object, then deploy:

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

Optional production secrets include:

```bash
npx wrangler secret put NEWS_API_KEY
npx wrangler secret put ELEVENLABS_API_KEY
npx wrangler secret put ELEVENLABS_VOICE_ID
npx wrangler secret put EMAIL_FROM
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put GOOGLE_AI_API_KEY
npx wrangler secret put OPENROUTER_API_KEY
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

`/health/deep` checks actual database content, cache access, rate limiting, media storage, published/audio/translation/report outputs, email delivery, Vectorize, Workers AI circuit breakers, and Durable Objects. A reachable binding alone is not reported as healthy if the expected output is absent.

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
- External sources and model providers can rate-limit or fail; the scheduler isolates failures and retries bounded queue work, but it cannot guarantee third-party availability.

## Security notes

- Admin endpoints require the admin API key or an admin-authorized token.
- Client secrets and API keys are hashed at rest; newly provisioned raw keys are returned once.
- State-changing browser requests are origin/CSRF checked.
- Session-scoped preferences, bookmarks, and notifications require a valid session identifier.
- Production error responses do not expose internal exception details.
- Deployment secrets and generated Cloudflare binding files are ignored by Git.

## License

No open-source license is granted. This repository and the BOA-Story product are proprietary; all rights are reserved.
