# Cloudflare deployment

BOA-Story supports two deployment paths:

- The repository's existing `wrangler.toml` continues to describe the current production account.
- The portable workflow provisions an isolated copy in any other Cloudflare account without editing or exposing the current account's resource IDs.

## Portable deployment to another Cloudflare account

### Prerequisites

1. Install the repository dependencies with `npm install` and `npm --prefix frontend install`.
2. Authenticate Wrangler with `npx wrangler login`, or export a scoped `CLOUDFLARE_API_TOKEN` for automation.
3. If the login can access more than one account, pass `--account-id <account-id>` or set `CLOUDFLARE_ACCOUNT_ID`.
4. Choose a unique lowercase prefix, such as `denise-boa`. It becomes the prefix for every resource and prevents collisions with an existing installation.

Some platform features can require a paid Workers plan or separate account onboarding: Queues, Workers AI usage, Vectorize, R2, and Email Sending. Email Sending is deliberately not provisioned automatically because Cloudflare requires a verified sending domain. The application continues to use its configured provider fallback when the binding is absent.

### Preview the exact account plan

This command is local and creates no Cloudflare resources:

```powershell
npm run cloudflare:plan -- --prefix denise-boa
```

The plan lists the Worker, Pages project, D1 database, two KV namespaces, R2 bucket, Vectorize index, three Queues, Analytics Engine dataset, Workers AI binding, and Durable Object namespace that the installation will use.

### Provision without deploying code

```powershell
npm run cloudflare:setup -- --prefix denise-boa --account-id YOUR_ACCOUNT_ID
```

The setup command:

1. Confirms the active Wrangler account.
2. Generates `.cloudflare/wrangler.generated.toml` from the account-neutral template.
3. Creates D1, KV, R2, Vectorize and Queue resources with unique names.
4. Creates the Pages project unless `--no-pages` is supplied.
5. Generates strong local JWT, admin and development secrets.
6. Stores IDs, state and secrets only under the gitignored `.cloudflare/` directory.

It never deletes, replaces, imports or mutates resources belonging to another installation.

### One-command provision and deployment

Run this only after the target account owner has explicitly approved external resource creation and deployment:

```powershell
npm run cloudflare:setup -- --prefix denise-boa --account-id YOUR_ACCOUNT_ID --deploy
```

For a previously provisioned checkout:

```powershell
npm run cloudflare:deploy -- --prefix denise-boa --account-id YOUR_ACCOUNT_ID
```

Deployment order is fixed for compatibility:

1. Apply all D1 migrations.
2. Deploy the backend Worker and discover its `workers.dev` URL.
3. Redeploy the Worker with its correct public API origin.
4. Add `BACKEND_ORIGIN` to Pages Functions.
5. Build the frontend with the new API and site origins.
6. Deploy the Pages project.

Use `--site-url https://your-domain.example` and `--api-url https://api.your-domain.example` when custom domains are already configured. Otherwise, the workflow uses the generated Pages URL and discovers the Worker URL automatically.

Backend-only installation:

```powershell
npm run cloudflare:setup -- --prefix denise-boa --no-pages --deploy
```

### Optional secrets and services

The portable workflow generates only secrets needed to start the platform safely. Add optional integrations to the generated Worker configuration with Wrangler:

```powershell
npx wrangler secret put NEWS_API_KEY --config .cloudflare/wrangler.generated.toml
npx wrangler secret put RESEND_API_KEY --config .cloudflare/wrangler.generated.toml
npx wrangler secret put OPENAI_API_KEY --config .cloudflare/wrangler.generated.toml
npx wrangler secret put ANTHROPIC_API_KEY --config .cloudflare/wrangler.generated.toml
npx wrangler secret put GOOGLE_AI_API_KEY --config .cloudflare/wrangler.generated.toml
npx wrangler secret put ELEVENLABS_API_KEY --config .cloudflare/wrangler.generated.toml
```

Never commit `.cloudflare/`, `.dev.vars`, `.env.local`, or `frontend/.env.production.local`.

## Existing production account

The established deployment remains available through the checked-in `wrangler.toml`:

```powershell
npm run typecheck
npm test
npx wrangler deploy
```

Build and deploy the frontend only after the backend is compatible:

```powershell
npm --prefix frontend run build
npx wrangler pages deploy frontend/dist --project-name YOUR_EXISTING_PROJECT --branch main
```

## Local development

```powershell
Copy-Item .env.example .dev.vars
Copy-Item frontend/.env.example frontend/.env.local
npm run db:migrate
npm run dev
```

Local CORS origins belong in `.dev.vars`. Production origins belong in the selected Wrangler configuration.

## Verification

After any deployment, verify:

- `/health` and `/api/v1/health` return successfully.
- `/api/v1/system/health` reports D1, KV, R2, Vectorize and Durable Object status.
- The Pages project can fetch the API without CORS errors.
- `/sitemap.xml`, `/rss.xml`, `/podcast.xml`, and an article URL use the new account's backend.
- Queue consumers and the one-minute scheduled trigger appear on the deployed Worker.

The portable template follows Cloudflare's model that bindings connect code to account resources. The generated Wrangler file is the deployment source of truth for that installation; dashboard edits may be overwritten by a later Wrangler deployment.
