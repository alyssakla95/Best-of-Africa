# BOA-Story

BOA-Story is a deployed African reporting, research, and market-intelligence platform for readers, Enterprise decision teams, and screened specialists. It combines source-attributed articles, country research, official economic indicators, sector-performance analysis, a continental dashboard, narrated briefings, multilingual reading, search, personalization, member services, a structured Enterprise pilot, an invite-only specialist marketplace, a moderated public knowledge network, traceable Decision Rooms, and a consent-led transition programme for established external communities in one responsive application.

The product is organized around three explicit journeys:

- **Readers** start with the Africa Briefing and current reporting, then move into stories, country records, search, and research.
- **Enterprise clients** explore evidence, apply or sign in, submit bounded specialist requests, and track matching and proposals in a private workspace.
- **Specialists** may first register public interest; selected candidates receive an invitation, complete screening, enter a deliberately small founding cohort with waived listing access, and respond to administrator-confirmed opportunities.

The platform is not a live trading terminal and does not treat reporting volume, sentiment, or synthetic scores as economic performance. Market and country views distinguish:

- official or attributed evidence;
- the date and coverage of that evidence;
- supported interpretation;
- limitations, counter-signals, and questions requiring further diligence.

## Commercial position

The current product state is:

> **Production-deployed editorial and intelligence platform with Enterprise pilot and specialist-marketplace workflows**

The initial commercial proposition is deliberately narrow:

| Element | Current definition |
| --- | --- |
| Primary buyer | Corporate strategy, investment, growth and market-entry teams worldwide, working with their advisers |
| Recurring decision | Which African country and sector conditions justify deeper entry diligence, and which risks must be resolved first? |
| Pilot boundary | Four weeks, one target sector, up to three candidate countries and one named internal decision |
| Deliverables | Evidence dossier, country comparison, executive decision brief, claim/source ledger, diligence register and closeout review |
| Economic hypothesis | Reduce time spent reconciling fragmented public evidence and make unresolved risks visible before specialist diligence or capital commitment |
| Validation approach | Each pilot records the existing research baseline, delivery cycle, evidence traceability and unresolved diligence work |

The [Enterprise pilot](https://alyssa-boa-web.pages.dev/enterprise) defines the workflow and success measures. A separate [structured application](https://alyssa-boa-web.pages.dev/enterprise/apply) records the applicant, sector, one to three candidate countries, decision question, deadline, current research process, and measurable success condition. Submissions enter a protected operator inbox with qualification status and private review notes; the form prohibits confidential or sensitive information. Provisioned clients use [Enterprise access](https://alyssa-boa-web.pages.dev/enterprise/access) to enter the private specialist-request workspace. The [Trust Center](https://alyssa-boa-web.pages.dev/trust) documents current controls, data handling, service health, and procurement disclosures.

BOA-Story does not replace legal, tax, regulatory or in-country commercial diligence. The Enterprise page publishes fixed entry pricing — a US$750 focused brief, a US$1,800 comparative entry pilot, and a US$300 per month monitoring extension — together with scope, delivery, payment terms, and a credibility-stage disclosure.

### Specialist Marketplace

The repository implements an invite-only, administrator-screened specialist marketplace with a separate public interest registry. The marketplace is enabled in the verified Alyssa deployment; account-neutral and default deployment profiles keep the directory and authenticated marketplace disabled until an operator deliberately completes rollout. Anyone may [register interest](https://alyssa-boa-web.pages.dev/specialists/interest) using bounded professional coverage information, but registration creates no account or application and promises no invitation, admission, endorsement, or work.

Operators review interest against actual Enterprise demand by country, sector, service, and language. They can mark a record for review, close it, or issue a linked single-use invitation. Only an invited candidate can create hashed credentials and submit the guided four-stage application covering account details, prospective public profile, credentials and conflicts, and final confirmation. Private registry, qualification, and screening data remain separate from public profiles.

The initial **Founding Specialist Network** is deliberately capped at 50 profiles, with an operating target of roughly 20–50 credible economists, lawyers, sector operators, former regulators, bankers, consultants, academics, and other professionals relevant to observed Enterprise demand. Admin tooling aggregates active requests into country, sector, language, and service demand signals so recruitment expands where clients actually need coverage rather than toward arbitrary marketplace volume.

### Moderated Knowledge Network

Enterprise audiences and specialists have separate dominant community pages at `/enterprise/communities` and `/specialists/circles`. The network divides participation into named Enterprise-audience, regional, sector, professional, language, and decision circles. Approved contributions can also appear contextually on reader, country, Market Intelligence, and Continental Dashboard surfaces.

The interaction model supports reader and Enterprise questions, specialist explanations, field signals, evidence challenges, country and sector perspectives, consented decision learning, useful reactions, follows, and linked responses. Contribution types are restricted by authenticated account role. Field signals and evidence challenges require source links; every submission remains pending until a human approves it. Public projections omit private client identifiers and moderation records, while specialist circle membership has a separate evidence-based administrator review. Private Enterprise engagements and workspace discussions never enter the public feed automatically. Payment, popularity, reactions, and follower counts do not determine screening, verification, or circle standing.

The public [specialist directory](https://alyssa-boa-web.pages.dev/specialists) supports country, sector, language, and service filters, removable filter chips, result counts, public credential/reference links, founding-cohort badges, verification standing, and launch-safe empty states. Returning specialists use a dedicated [specialist sign-in](https://alyssa-boa-web.pages.dev/specialists/sign-in). Their private dashboard presents the actual lifecycle — application, screening, approval, listing access, publication, and matching — and provides profile editing, waiver/billing guidance, confirmed opportunities, and proposal submission.

Public standing follows a three-level evidence hierarchy:

1. **BOA Specialist** — screened for network access using submitted professional evidence.
2. **Verified Specialist** — additional documented experience, references, or professional credentials have been reviewed.
3. **Senior / Featured Specialist** — stronger documented standing and relevant delivery history have been reviewed.

Administrators must record a public evidence summary before assigning either elevated level. Founding status, a listing waiver, or payment cannot purchase a verification level.

Approved Enterprise clients sign in separately and require a live administrator marketplace-access grant before any private request form renders. They receive a request inbox, research/profile prefilling, request-status timelines, proposal comparisons, and mutation feedback. Matching remains deterministic across country, sector, language, and service category; administrators must confirm a suggestion before request details become visible to a specialist.

Approval alone does not publish a specialist profile. Public listing requires continuing screening approval plus either a current BOA listing-fee waiver or an active Stripe listing subscription. Founding specialists automatically receive waived listing access, so Stripe is not required to publish the early cohort. The verified deployment intentionally keeps Stripe unconfigured while BOA validates repeatable demand.

The MVP boundary is deliberate:

- founding specialists receive free listing access while demand is being proven;
- Stripe Checkout and Customer Portal are reserved for a later listing arrangement and do not determine verification standing;
- BOA-Story does not collect percentage commissions or client engagement fees and does not pay specialists;
- engagement contracts and delivery occur independently of BOA-Story;
- chat, milestones, reviews, disputes, engagement refunds, and transaction payouts are not implemented;
- screening is not an endorsement or substitute for client due diligence;
- identity documents, CV uploads, confidential records, and sensitive data are prohibited.

The current operating sequence is:

1. An Enterprise need or repeated demand signal appears.
2. BOA identifies the required country, sector, language, and service coverage.
3. Operators review the public interest registry and recruit additional candidates deliberately.
4. Selected candidates receive a single-use, expiring invitation.
5. Invited applications undergo evidence-based screening.
6. Approved founding specialists receive waived listing access and an evidence-supported standing.
7. BOA confirms deterministic match suggestions before specialists see request details.
8. Clients and specialists contract, pay, and deliver independently of BOA-Story.

The three standing levels are not customer ratings:

| Standing | Minimum current basis | Payment effect |
| --- | --- | --- |
| BOA Specialist | Submitted professional evidence reviewed for network access | None |
| Verified Specialist | Additional documented experience, references, or professional credentials reviewed | None |
| Senior / Featured Specialist | Stronger documented standing and relevant delivery history reviewed | None |

BOA should add transaction commissions, managed payments, reviews, or deeper engagement tooling only after observed evidence shows recurring Enterprise requests and repeatable specialist engagements. None of those future capabilities is represented as current functionality.

For a new deployment, apply migrations `0065_specialist_marketplace.sql` through `0068_founding_specialist_network.sql`. Migration `0069_verified_country_resources.sql` adds the evidence-bearing country-resource registry used by the reader product; `0070_knowledge_network.sql` adds moderated groups, memberships, contributions, reactions, and follows; `0071_decision_rooms.sql` adds private and consented-public Decision Rooms, evidence ledgers, participants, invitations, and follows; `0072_community_transition_program.sql` adds steward applications, reviewed transition records, invitation links and voluntary activations. Enable the directory/authenticated marketplace flag only after validating invitation, screening, waiver, verification, listing, matching, proposal, contribution moderation, membership review, room consent, private access, evidence-item moderation, community stewardship and transition-consent controls. Stripe testing is required only before activating paid listing arrangements. `wrangler.alyssa.toml` currently enables the marketplace; `wrangler.toml` and `wrangler.portable.toml.example` keep it disabled. Interest records are retained for no more than 24 months and are removed by bounded scheduled cleanup.

### Evidence boundary

The repository and live deployment demonstrate implemented software, operating controls, public data contracts, and a functioning pilot-intake workflow. They do not by themselves demonstrate paying customers, completed pilot outcomes, repeatable revenue, formal certification, insurance coverage, or independent product testing. Those claims should only be added when supported by verifiable external evidence.

### Reader position and validation

The Enterprise decision proposition remains the primary commercial workflow. The application homepage and navigation are editorial-first, however, so readers are not forced through a buyer funnel before reaching reporting. The reader pathway is designed for African diaspora and globally connected professionals who want to follow African business, economic, and policy developments without reconciling fragmented sources themselves.

The recurring reader habit is the **Africa Briefing**:

- a concise entry point assembled from currently published, source-attributed reporting;
- country and sector preferences for a more relevant reading sequence;
- direct paths into country records, Market Intelligence, and the Continental Overview;
- audio playback, saved articles, notifications, and the weekly email briefing where configured.

The product records first-party evidence needed to evaluate this pathway: monthly and weekly active readers, sessions active on multiple dates, briefing opens, article reads reaching at least 75% observed scroll depth, audio starts and completions, bookmarks, and newsletter subscriptions. These are operator-only measurements, not public social proof. Audience collection begins when migration `0053_reader_engagement.sql` is deployed and is not backfilled.

The reader product remains in pre-audience-validation state. No subscriber conversion, churn, willingness-to-pay, acquisition-cost, or consumer-revenue claim is made without observed external evidence.

Reader membership pricing is published at US$4, US$9, and US$19 per month through Ko-fi. Every tier is configured for the same complete reader product; the higher tiers are voluntary support rather than additional entitlements. In the currently verified deployment, read-only member content remains open for stakeholder review and email-dependent sign-in and delivery cannot operate until a verified transactional sender is configured.

## Live deployment

| Surface | URL |
| --- | --- |
| Reader application | [alyssa-boa-web.pages.dev](https://alyssa-boa-web.pages.dev) |
| API Worker | [alyssa-boa-api.alyssavanklassen.workers.dev](https://alyssa-boa-api.alyssavanklassen.workers.dev) |
| Deep health | [API `/api/v1/health/deep`](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/health/deep) |
| API documentation | [Swagger UI](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/docs) |
| Specialist directory | [Public marketplace](https://alyssa-boa-web.pages.dev/specialists) |
| Enterprise access | [Private client sign-in](https://alyssa-boa-web.pages.dev/enterprise/access) |
| Specialist access | [Private specialist sign-in](https://alyssa-boa-web.pages.dev/specialists/sign-in) |

These URLs describe the currently verified Alyssa Cloudflare deployment. The repository also supports account-neutral deployment under a different resource prefix and Cloudflare account.

### Verified state

### Production verification policy

Cloudflare deployment identifiers describe the executable release, while mutable database counts and health checks must be read from the live API. The README therefore does not treat a copied article total, coverage share or test count as permanently current.

The last live audit was performed at 00:39 UTC on 11 August 2026:

- the frontend and API were reachable, including the editorial-first reader paths, Enterprise access, specialist directory, public interest registry, specialist sign-in, trust, and pilot-application routes;
- the structured pilot application was reachable and its protected operator inbox was reading the migrated production table;
- the specialist marketplace was enabled and healthy, its D1 schema was ready, and its public API returned successfully; founding waivers make Stripe optional at this stage;
- the Founding Specialist Network currently contained zero profiles and zero active waivers, so the 20–50 profile target is an operating plan rather than a claimed cohort;
- D1, content processing, KV media storage, Vectorize, Durable Objects, sector assignment, and autonomous worker outputs were healthy;
- the database contained 856 article records at the time of inspection;
- the worker-output inventory reported 372 published articles, 372 audio files, and 2,231 quality-approved translations across six non-English languages, plus 84 market reports;
- the production bundle was served with immutable asset caching;
- the complete local quality gate passed at the time of inspection; the current CI run is the authoritative test result for a committed revision;
- ten priority reader, Enterprise, and specialist routes passed both mobile and desktop browser audits.

The verified Alyssa-account runtime is Pages deployment [`f1954a22`](https://f1954a22.alyssa-boa-web.pages.dev) together with Worker version `1ade3452-dccc-4d8a-b6c4-de5898e8a7bd`. These are direct deployments from the current working tree; the Pages project has no Git connection, and deployment metadata is not evidence that every deployed change has been committed.

At that audit, deep health was `degraded` and returned HTTP 503 because three checks had not met their production standard: `coverage_diversity`, `source_acquisition`, and `email_delivery`. The 30-day evidence window covered 43 of 54 countries; its top country and publisher each represented roughly 41% of the window, and primary/global evidence represented 16.5%, below the 50% health threshold. The current working tree retains hard admission caps for new publications and corrects acquisition health to count one canonical source per URL, matching ingestion behaviour. Those safeguards improve the forward cohort but do not rewrite historical reporting. Stripe configuration is marketplace metadata rather than a health requirement while listing access is waived.

The live status endpoints remain authoritative:

- [`/api/v1/health`](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/health) for reachability;
- [`/api/v1/health/deep`](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/health/deep) for output, diversity, acquisition, marketplace and integration health;
- [`/api/v1/market-intel/coverage-pulse`](https://alyssa-boa-api.alyssavanklassen.workers.dev/api/v1/market-intel/coverage-pulse) for the current coverage ledger.

## What is implemented

### Reader experience

- Source-attributed African reporting with article pages, related coverage, attributable photography, a Photo Desk, audio playback, verified translations, reading tools, and bookmarks.
- Country coverage for all 54 African states, with country hubs, economic and trade context, current evidence, linked sources, events, decision dossiers, and a country narrative toolkit.
- Market Intelligence, dedicated sector-performance dossiers, generated reports, and a Continental Overview built around official indicators, evidence notes, comparison boundaries, counter-signals, and narrated briefings when available.
- Search across reporting and countries with autocomplete, filters, similar-story retrieval, a command menu, and a cached research-answer path grounded in retrieved platform records.
- An editorial-first homepage and consistent desktop/mobile information architecture: Briefing, Stories, Countries, Research, Enterprise, and Specialists. The mobile dock prioritizes Briefing, Stories, Countries, Search, and the complete menu.
- An Africa Briefing and curated feed, plus Mission Control preferences for role, country, and sector. Preview mode exposes the read-only experience; persisted personalization and account actions retain their API access checks.
- A distinct analytical Decision Workspace and clearly named Saved research library, embedded decision panels on intelligence pages, reader settings, density controls, route-specific reading guides, notifications for authenticated sessions, and a global audio player.
- Events and event registration, consultation intake, curated travel information with an explicit no-booking disclaimer, newsletter subscription records, and contact forms. Email confirmations and digest delivery remain unavailable in the verified deployment until transactional email is configured.
- Published membership tiers, a one-time Ko-fi support path, a supporter-transparency feed, and a separately authorized sponsor dashboard for organization-isolated campaign delivery records.
- A global Enterprise offer, structured pilot application, password-based client access, protected qualification inbox, private specialist-request workspace, and Trust Center for data handling, operational controls, procurement review, and current limitations.
- Shared accessible journey primitives for page heroes, loading/error/empty states, access gates, lifecycle progress, form summaries, and pending submissions. Raw API status strings are converted into approachable marketplace guidance.
- Responsive navigation and layouts for desktop and mobile, including mobile alternatives for wide data tables and right-to-left layout for Arabic.

### Application surfaces and access boundaries

| Surface | Routes | Current boundary |
| --- | --- | --- |
| Editorial home and archive | `/`, `/about`, `/posts`, `/posts/:slug`, `/gallery` | Public; article truncation is disabled during stakeholder review |
| Membership and access | `/membership`, `/member-access`, `/login`, `/settings` | Pricing is public; OTP login requires configured email; account changes require a valid session |
| Briefing and workspace | `/feed`, `/library` | Read-only member views are open in preview; persisted reader state remains session scoped |
| Country research | `/countries`, `/countries/:code`, `/countries/:code/narratives` | Public in preview; some generated enrichments are returned only when available |
| Intelligence and reports | `/intelligence`, `/intelligence/reports`, `/intelligence/reports/:id`, `/sectors/:id/trends`, `/dashboards/overview` | Public read-only views; protected or cost-incurring generation remains authenticated |
| Search and analyst assistance | `/search` and the member chat widget | Retrieval is public within rate limits; analyst actions are rate limited and the widget follows member-preview state |
| Events, travel and consultation | `/events`, `/travel`, `/request-consultation` | Browsing and intake are public; registration writes are validated and session/origin protected where required |
| Reader communications | `/newsletter`, notification controls | Subscription records can be created; outbound email is unavailable without a verified sender |
| Supporter and sponsor reporting | `/supporter-feed`, `/sponsor/dashboard` | Supporter transparency follows preview membership; campaign records require partner authorization |
| Enterprise workflow | `/enterprise`, `/enterprise/apply`, `/enterprise/access`, `/trust` | Offer and application are public; password access is private; qualification records and private notes are administrator only |
| Specialist marketplace | `/specialists`, `/specialists/interest`, `/specialists/:slug`, `/specialists/join/:token`, `/specialists/sign-in`, `/specialists/dashboard`, `/specialists/requests`, `/specialists/requests/new`, `/specialists/requests/:id` | Interest registration is public and creates no account; public profiles require approval plus a waiver or active subscription; applications require an invitation; dashboards require verified specialist identity; requests require Enterprise tier plus a live administrator access grant |
| Public knowledge network | `/enterprise/communities`, `/specialists/circles`, plus contextual feeds on reader and intelligence surfaces | Reading is public; submitting, reacting and following require authentication; all contributions and responses require human moderation; specialist circle standing requires separate evidence review |
| Decision Rooms | `/decision-rooms`, `/decision-rooms/:slug`, `/enterprise/decision-rooms`, `/enterprise/decision-rooms/:id` | Approved, explicitly consented rooms are public; creating and managing rooms requires Enterprise access; private rooms are restricted to their owner and accepted specialists; every ledger contribution requires human review |
| Community transition | `/community-transition`, `/community-transition/:slug` | Applications are public but private; a transition becomes visible only after stewardship, consent, scope and receiving-circle review; membership is voluntary and no external member list or post archive is imported |
| Administration | `/admin` | Requires `ADMIN_API_KEY`; reader and client sessions do not grant administrator access |
| Legal and support | `/privacy`, `/terms`, `/contact` | Public |
| Seasonal archive | `/world-cup` | Route and data contract remain in code; global World Cup promotion is currently disabled |

### Languages

The interface supports:

- English
- French
- Portuguese
- German
- Chinese
- Modern Standard Arabic, including right-to-left layout
- Hindi

Published article translations are stored for the six non-English languages and served only after quality checks. The frontend resolves interface copy from source-controlled catalogues rather than generating it during rendering. Portuguese has the complete maintained reader-interface catalogue, while the other non-English locales currently translate reviewed navigation and keyed product copy and explicitly preserve longer English source passages. A separate throttled and cached `/api/v1/translate/interface` fallback API exists for controlled integrations but is not called by the current frontend. When a verified long-form article translation is absent or fails validation, the application preserves the English source instead of presenting a partial or invented translation.

### Discoverability and distribution

- The Worker generates the XML sitemap, latest-story RSS feed, and Daily Pulse podcast feed.
- Pages Functions expose those documents at `/sitemap.xml`, `/rss.xml`, and `/podcast.xml` on the reader origin by proxying the configured `BACKEND_ORIGIN`.
- `robots.txt` excludes administrator, settings, member-access, Enterprise access, specialist invitation/sign-in/dashboard, and private request screens and advertises the sitemap. When enabled, the sitemap includes active public specialist profiles.
- The frontend publishes branded manifest and icon metadata, canonical URLs, page titles and descriptions, and RSS discovery links.

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

- Admin authentication; article creation, review, curation, publication, rejection, audit, quarantine, restoration, and deletion.
- Source creation, monitoring and deletion; country record maintenance; editorial rule evolution; and protected operational triggers.
- Client provisioning with hashed credentials and one-time API-key display, plus Ko-fi webhook provisioning for reader memberships when its verification token is configured.
- Editorial and pilot inboxes, structured qualification and private review notes, audience reporting, source and sector-quality audits, analytics, provider controls, and worker health.
- Specialist interest review, demand-signal aggregation, founding-cohort controls, evidence-based verification standing, listing waivers, invitation, screening, approval, Enterprise access grant/suspension/revocation, deterministic match confirmation, and audit history.
- Operator-only audience reporting with explicit metric definitions, zero-safe empty states, and no substituted estimates.
- Member OTP authentication, profiles, preferences, notifications, bookmarks, campaign authorization, events, newsletters, and reporting APIs. OTP and other outbound messages fail honestly when email delivery is unavailable.
- OpenAPI/Swagger documentation under `/api/v1/docs`.
- Lightweight, readiness, liveness, and deep-health endpoints.

### API capability map

`/api/v1` is the canonical API prefix; `/api` remains a legacy alias. The principal route families are:

| Capability | Route families |
| --- | --- |
| Reporting and media | `/articles`, article images and audio, root `/sitemap.xml`, `/rss.xml`, `/podcast.xml` |
| Retrieval and research | `/search`, `/countries`, `/intel`, `/market-intel`, `/dashboards`, `/narratives`, `/world-cup` |
| Reader state | `/members`, `/auth`, `/personalization`, `/bookmarks`, `/notifications`, `/analytics` |
| Services and communications | `/services` pilot and specialist-interest intake, `/events`, `/newsletter`, `/contact`, `/translate/interface` |
| Commercial reporting | `/campaigns` and sponsor-scoped analytics |
| Specialist marketplace | `/specialists` directory, invitation redemption, dashboard, waiver/subscription listing access, Enterprise requests, confirmed matches, proposals, and the exact signed Stripe webhook |
| Moderated knowledge network | `/knowledge` groups, public approved contributions, reviewed responses, follows, useful reactions, specialist membership requests, and administrator moderation |
| Decision Rooms | `/knowledge/rooms` public discovery and detail, Enterprise room creation and private workspaces, specialist invitations, moderated evidence-ledger contributions, follows, and administrator publication controls |
| Community transition | `/knowledge/transitions` reviewed public records, consented steward applications, invitation-visit measurement, signed-in voluntary activation, receiving-circle follows and administrator controls |
| Administration | `/admin`, `/audit`, protected client/source/editorial and pilot-inbox operations |
| Autonomous processing | `/agent`, `/agent/providers`, provider OAuth/bootstrap routes, `/self-improve` |
| Operations | `/health`, `/health/live`, `/health/ready`, `/health/deep`, `/status`, `/config`, `/docs` |
| Development maintenance | `/dev` routes protected by `DEV_SECRET`; these are not public product APIs |

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
| UX and access state | Audience-centred route journeys, verified `/auth/me` hydration, role-aware route gates, shared async/form/lifecycle primitives, and explicit Portuguese interface coverage |
| API | TypeScript Cloudflare Worker using Hono and Zod |
| Relational data | Cloudflare D1 with versioned SQL migrations |
| Cache, sessions and throttling | Separate Cloudflare KV namespaces for cache/session state and rate-limit counters |
| Media | R2 when available; KV-backed media storage as the portable fallback |
| Search | D1 full-text search plus Cloudflare Vectorize semantic retrieval |
| Editorial processing | Cloudflare-native preparation, source-grounded audit, repair, translation, narration, and retrieval services |
| Async work | Cloudflare Queues for preparation, translation, and optimization |
| Scheduling | One-minute Cloudflare cron with bounded internal schedules |
| Metrics | Analytics Engine and persisted `agent_metrics` telemetry |
| Reader evidence | D1 engagement events plus Analytics Engine delivery, using hashed sessions, stored IP addresses, and one-way user-agent fingerprints |
| Live state | Durable Object `LiveCounter` |
| Transactional email | Optional Cloudflare Email Sending binding or Resend; unavailable when no verified sender/provider is configured |
| Marketplace listing access | Founding-network waivers or Stripe Checkout/Customer Portal subscriptions; neither payment path determines verification standing |
| Frontend hosting | Cloudflare Pages |

### Marketplace data model

The marketplace keeps public, private, commercial, and operational records separate:

| Table | Purpose |
| --- | --- |
| `specialist_interest_registrations` | Public expressions of interest, demand-fit review status, private qualification notes, linked invitation, and 24-month retention deadline |
| `specialist_invites` | Email-bound, single-use, expiring invitation hashes |
| `specialist_applications` | Private invited application, credentials, conflict declaration, screening state, and retention controls |
| `specialist_profiles` | Public profile projection, founding-cohort status, evidence-based standing, waiver state, screening status, and listing state |
| `specialist_subscriptions` | Optional future Stripe listing-customer and subscription state |
| `marketplace_client_access` | Live administrator grant, suspension, or revocation for Enterprise request access |
| `specialist_requests` | Bounded Enterprise decision request and required expertise |
| `specialist_matches` | Deterministic candidate score, reasons, and administrator confirmation |
| `specialist_proposals` | Indicative specialist scope, assumptions, timeline, fee, and client decision state |
| `marketplace_audit_events` | Status and operator-action history without publishing private application material |
| `country_official_resources` | Country resource links with verification evidence, review state and last-check timestamp; unverified legacy portal fields are not reader-facing |
| `knowledge_groups` | Explicit public audience, regional, sector, professional, language, and decision circles |
| `knowledge_group_memberships` | Private specialist evidence, human review record, circle role, and approval state |
| `knowledge_contributions` | Questions, perspectives and linked responses with evidence basis, sources, disclosures, privacy consent, and moderation state |
| `knowledge_reactions` / `knowledge_group_follows` | Authenticated useful reactions and circle follows without converting popularity into authority |

Interest registration never inserts a client account or specialist application. Public APIs project an allow-listed subset of profile fields; fee-waiver administration, private notes, conflicts, contact details, and billing identifiers remain non-public.

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

The current bounded cadence is:

| Cadence | Work |
| --- | --- |
| Every tick | Pending-task recovery, sector-assignment audit, editorial audit, reader-text cleanup, audio coverage, ingestion, source-image recovery, hero variants, translations, and sector backfills |
| Every two minutes | Next-country evidence refresh and stale generation-task recovery |
| Every 15 minutes | Saved World Bank-derived continental and sector dataset refresh |
| Every 30 minutes | Seasonal World Cup data refresh; the reader promotion remains disabled |
| Hourly | Expired marketplace interest, invitation, abandoned-application, orphaned-account, and associated interest-audit cleanup |
| Every four hours | Fairly rotated country reporting |
| Every six hours | Content optimization and live-event discovery on offset schedules |
| Daily | Recurring-event rollover, sector reporting, daily digest attempt, and retention cleanup |
| Weekly | Weekly digest attempt on Sunday; delivery still requires configured transactional email |

Queue consumers handle content generation, article translation, and headline/content optimization separately from the cron invocation. Worker-run telemetry is retained in `agent_metrics` for seven days; reader engagement events are retained for 90 days.

### Optional ZeroClaw accelerator

`zeroclaw/` contains an optional external runtime that can claim preparation tasks sooner than the Worker's internal stale-task recovery. It is not required for production operation. A deployment behaves correctly when ZeroClaw is absent or offline.

The external runtime is deployment-specific and requires an admin key plus its own provider authentication. See `AGENTS.md` and `.zeroclaw/` for the operator workflow.

## Repository layout

```text
frontend/                 React reader, Enterprise, specialist and admin application
frontend/functions/       Pages Functions for sitemap, RSS, podcast and article social metadata
frontend/src/components/  Shared shell, journey, accessibility and domain components
frontend/src/pages/       Reader, access, marketplace, legal and operator route surfaces
src/index.ts              Worker entry point, routing, cron and queue dispatch
src/routes/               Public, member, admin and system API routes
src/lib/                  Editorial, evidence, media and platform services
src/workers/              Ingestion, preparation, optimization, reporting and backfills
src/data/                 Bundled official-data snapshots and sector definitions
src/durable-objects/      LiveCounter implementation
migrations/               Ordered D1 schema and data migrations
tests/unit/               Unit and contract tests
tests/integration/        API and cross-layer regression tests
tests/mocks/              Cloudflare binding and service doubles
scripts/                  Account-neutral deployment tooling
wrangler.toml             Default account-specific Worker configuration
wrangler.alyssa.toml      Verified Alyssa-account Worker configuration
wrangler.portable.toml.example
                          Cloudflare template without account-specific IDs
.github/workflows/        CI and deployment workflows
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

That convenience script targets the default local database name `best-of-africa-db`. Alyssa and portable deployments use different generated or account-specific names and configurations; apply migrations with the matching `--config` and `--remote` options rather than reusing the local shortcut. The ordered migration set currently extends through `0072_community_transition_program.sql`.

For local Worker secrets and overrides, create `.dev.vars` and do not commit it. A practical development configuration is:

```dotenv
ENVIRONMENT=development
JWT_SECRET=replace-with-a-long-random-value
ADMIN_API_KEY=replace-with-a-long-random-value
DEV_SECRET=replace-with-a-long-random-value
PUBLIC_API_URL=http://localhost:8787
PUBLIC_SITE_URL=http://localhost:5173
ADDITIONAL_ORIGINS=http://localhost:5173
MARKETPLACE_ENABLED=false
```

Start the Worker and Vite application together:

```bash
npm run dev
```

Default local addresses are normally:

- frontend: `http://localhost:5173`
- Worker: `http://localhost:8787`
- API base: `http://localhost:8787/api/v1`

Optional source, narration, email, and Stripe credentials activate their corresponding integrations. Missing optional credentials use documented fallbacks or report the integration as unavailable. Local marketplace development requires migrations `0065` through `0068`; founding listing waivers require no Stripe configuration.

## Validation

Run the complete local release checks:

```bash
npm run typecheck
npm test -- --pool=threads
npm run audit:portuguese
npx tsc --noEmit -p frontend/tsconfig.app.json
npm --prefix frontend run lint
npm --prefix frontend run build
```

The CI quality gate installs both backend and frontend dependencies before running the combined Vitest suite because focused React component tests live under `frontend/src`. It then runs backend typechecking, all unit/integration/contract/component tests, the maintained Portuguese-interface audit, frontend typechecking and linting, and the complete Vite production build on every push and pull request.

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

### Reproducible release guard

`npm run deploy` and `npm run cloudflare:deploy` refuse to deploy a working tree containing modified or untracked files. This prevents a direct Cloudflare release from containing code that cannot be recovered from GitHub. Run the complete quality gate, commit only the intended source and migration files, and confirm `npm run release:clean` before applying remote migrations or deploying the Worker and Pages build. A deliberate emergency override is available only by invoking `node scripts/verify-clean-release.mjs --allow-dirty`; routine releases must not use it.

Three Worker configuration paths are intentionally distinct:

- `wrangler.alyssa.toml` describes the verified Alyssa deployment, including KV-backed media, no active email binding, and the enabled marketplace rollout flag.
- `wrangler.toml` is another account-specific deployment profile with its own resource IDs, origins, R2 bucket, and optional Cloudflare Email binding.
- `wrangler.portable.toml.example` and `scripts/cloudflare-portable.mjs` are the account-neutral path. Generated IDs, secrets, API origins, and Pages settings remain outside version control.

The GitHub `deploy.yml` workflow is a separate default-profile deployment path: it uses `wrangler.toml` and its configured Worker/Pages projects, not the Alyssa or portable profiles. Its pre-deploy check is narrower than the complete `ci.yml` gate. Releasing the verified Alyssa target therefore requires the explicit Alyssa Worker config and a Pages deploy run from `frontend/` so Wrangler discovers the project-root `functions/` directory.

### Required secrets

Portable setup creates strong local deployment values for:

- `JWT_SECRET`
- `ADMIN_API_KEY`
- `DEV_SECRET`

They are stored in ignored `.cloudflare/secrets.env` and passed to Wrangler during deployment. Do not commit or print this file.

Optional production secrets and bindings currently used by deployable integrations include:

```bash
npx wrangler secret put NEWS_API_KEY --config wrangler.alyssa.toml
npx wrangler secret put KOFI_TOKEN --config wrangler.alyssa.toml
npx wrangler secret put ELEVENLABS_API_KEY --config wrangler.alyssa.toml
npx wrangler secret put ELEVENLABS_VOICE_ID --config wrangler.alyssa.toml
npx wrangler secret put EMAIL_FROM --config wrangler.alyssa.toml
npx wrangler secret put RESEND_API_KEY --config wrangler.alyssa.toml
npx wrangler secret put STRIPE_SECRET_KEY --config wrangler.alyssa.toml
npx wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler.alyssa.toml
npx wrangler secret put STRIPE_SPECIALIST_PRICE_ID --config wrangler.alyssa.toml
npx wrangler secret put OPENAI_API_KEY --config wrangler.alyssa.toml
npx wrangler secret put ANTHROPIC_API_KEY --config wrangler.alyssa.toml
npx wrangler secret put GOOGLE_AI_API_KEY --config wrangler.alyssa.toml
npx wrangler secret put OPENROUTER_API_KEY --config wrangler.alyssa.toml
npx wrangler secret put MOONSHOT_CLIENT_ID --config wrangler.alyssa.toml
npx wrangler secret put MOONSHOT_CLIENT_SECRET --config wrangler.alyssa.toml
```

The explicit config is essential: omitting it targets the Worker named by the default `wrangler.toml`. Portable deployments instead use the ignored generated config and secrets file created by the setup script.

`KOFI_TOKEN` verifies membership webhooks. External model credentials are optional operational/provider integrations; the information model used by the application remains the configured Workers AI path unless an explicitly supported operator workflow selects otherwise. Gemini and Moonshot also expose protected OAuth bootstrap routes, and provider records can be managed through the admin-gated agent-provider API.

The three Stripe values configure a later specialist listing subscription only. The server-controlled Price ID is never accepted from the browser. The webhook endpoint is `/api/v1/specialists/stripe/webhook`; it must receive the untouched body and a valid `Stripe-Signature`. New/default deployments should keep paid listing disabled until test-mode checkout, portal, replay, failure, cancellation, and publication gating have been verified. The Alyssa deployment uses founding-network waivers and therefore does not require Stripe for current listing publication.

Transactional email requires `EMAIL_FROM` on a verified sender domain plus either the Cloudflare `EMAIL` binding or `RESEND_API_KEY`. The runtime tries Cloudflare Email Sending first, then Resend, and finally a legacy MailChannels request that normally cannot deliver without a paid setup. Deep health reports email as configured only for the first two supported paths. Setting an API key without a verified sender is intentionally treated as unavailable.

## Health and operations

Primary operational endpoints:

```text
GET /health                    minimal root reachability probe
GET /api/v1/health             versioned status, timestamp and environment
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

Specialist marketplace contracts:

```text
POST  /api/v1/services/specialist-interest
GET   /api/v1/specialists
GET   /api/v1/specialists/:slug
POST  /api/v1/specialists/join
GET   /api/v1/specialists/dashboard
PUT   /api/v1/specialists/dashboard/profile
POST  /api/v1/specialists/billing/checkout
POST  /api/v1/specialists/billing/portal
GET   /api/v1/specialists/requests
POST  /api/v1/specialists/requests
GET   /api/v1/specialists/requests/:id
POST  /api/v1/specialists/matches/:id/proposals
PATCH /api/v1/specialists/proposals/:id
POST  /api/v1/specialists/stripe/webhook
```

Moderated knowledge-network contracts:

```text
GET   /api/v1/knowledge/groups
GET   /api/v1/knowledge/contributions
POST  /api/v1/knowledge/contributions
POST  /api/v1/knowledge/contributions/:id/useful
POST  /api/v1/knowledge/groups/:slug/follow
POST  /api/v1/knowledge/groups/:slug/membership
GET   /api/v1/knowledge/admin/contributions
PATCH /api/v1/knowledge/admin/contributions/:id
GET   /api/v1/knowledge/admin/memberships
PATCH /api/v1/knowledge/admin/memberships/:groupId/:clientId
```

Principal administrator contracts:

```text
GET    /api/v1/admin/specialists
PATCH  /api/v1/admin/specialists/interest/:id
POST   /api/v1/admin/specialists/invites
DELETE /api/v1/admin/specialists/invites/:id
PATCH  /api/v1/admin/specialists/applications/:id
PATCH  /api/v1/admin/specialists/profiles/:id/standing
PUT    /api/v1/admin/specialists/enterprise-access/:clientId
POST   /api/v1/admin/specialists/requests/:id/match
PATCH  /api/v1/admin/specialists/matches/:id
```

The public interest endpoint is origin checked, rate limited, schema validated, and enumeration-safe: repeated, invited, and already-applying email addresses receive the same generic response without exposing account state. Public directory responses contain only projected public profile fields. Dashboard and proposal actions check the current specialist application, waiver, and subscription state in D1. Enterprise request operations require both an Enterprise account and an enabled `marketplace_client_access` row; frontend route guards improve guidance but do not replace these server-side checks.

Reader measurement contracts:

```text
POST /api/v1/analytics/events
POST /api/v1/analytics/events/batch
GET  /api/v1/analytics/audience
```

Reader analytics submission requires an `X-Session-ID` header and is origin checked, rate limited, and schema validated; it does not infer that identifier from a member JWT. The curated personalization feed and other persisted reader-state contracts likewise require their documented session header. Audience reporting requires `ADMIN_API_KEY`. Each event stores the connecting IP address and a one-way SHA-256 fingerprint of the normalized user-agent; the raw user-agent string is not stored in D1. Events and their identifiers are deleted after 90 days.

`/health/deep` checks actual database content, cache access, rate limiting, media storage, published/audio/translation/report outputs, sector-assignment audit coverage, country and publisher diversity, source-acquisition yield, email delivery, semantic retrieval, content-processing circuit breakers, and Durable Objects. A reachable binding alone is not reported as healthy if the expected output is absent. Both `/health/*` and `/api/v1/health/*` are supported.

Worker logs can be streamed with:

```bash
npm run tail
```

## Known operational limitations

- Transactional email is not active in the currently verified Alyssa deployment because no verified sender has been configured.
- The specialist marketplace is enabled in the Alyssa deployment with founding-network fee waivers. Stripe checkout and billing portal remain unavailable until Stripe secrets and a Price ID are configured, but they are not required for waived founding listings.
- That Cloudflare account uses KV media storage because R2 is unavailable. The abstraction supports migration to R2 later.
- Member preview and server-side paywall bypass are intentionally enabled for stakeholder review.
- Subscription prices and commercial entitlements are product configuration, not evidence about platform health.
- Live coverage counts change as the autonomous pipeline publishes, translates, and refreshes records.
- Historical country portal columns are retained for migration compatibility but are not exposed to readers. Country pages always provide primary World Bank, IMF and UN Comtrade evidence links; additional national portals appear only through the verified-resource registry.
- The 30-day diversity window contains historical concentration and improves only as older records expire and newly admitted records satisfy the current country, publisher and source-tier caps.
- Consumer retention, acquisition, conversion, churn, and revenue are not treated as proven until the new first-party measurement record contains sufficient observed activity.
- External sources and processing services can rate-limit or fail; the scheduler isolates failures and retries bounded queue work, but it cannot guarantee third-party availability.
- Public AI-assisted endpoints enforce per-IP rate limits, and the interface translation endpoint is throttled against bulk automated use.

## Security notes

- Admin endpoints require `ADMIN_API_KEY`, supplied through `X-Admin-Key` or as the bearer value. Reader and client JWTs never authorize the admin surface.
- Client secrets and API keys are hashed at rest; newly provisioned raw keys are returned once.
- State-changing browser requests are origin/CSRF checked.
- Session-scoped preferences, bookmarks, and notifications require a valid session identifier.
- Reader engagement events store IP addresses, hashed session identifiers, and one-way user-agent fingerprints for up to 90 days as disclosed in the Privacy Policy.
- Production error responses do not expose internal exception details.
- Deployment secrets and account-specific Cloudflare binding files are ignored by Git.

## License

No open-source license is granted. This repository and the BOA-Story product are proprietary; all rights are reserved.
