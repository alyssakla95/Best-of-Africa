# !! ACTION REQUIRED — ACTIVATE KIMI MOONSHOT AI FOR AGENTS

> Complete these steps after deploying. Until done, agents fall back to Cloudflare Workers AI.
> Estimated time: ~5 minutes.

---

## STEP 1 — Register Moonshot as the default AI provider

Run this once after `wrangler deploy`:

```bash
curl -X POST https://api.bestofafrica.com/api/v1/agent/providers \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider":"moonshot","model":"moonshot-v1-32k","is_default":true}'
```

---

## STEP 2 — Extract your token from the Kimi browser session

1. Open **kimi.moonshot.cn** in Chrome — log in with your subscription account
2. Open DevTools (`F12`) → **Network** tab → type `completion` in the filter bar
3. Send any message in the chat
4. Click the streaming request that appears → **Headers** tab
5. Copy the full value of the **`Authorization`** header (starts with `Bearer eyJ...`)
   — this is your **access token**

**For the refresh token (makes it permanent — do this too):**
- DevTools → **Application** tab → **Local Storage** → `kimi.moonshot.cn`
- Find the key `refresh_token` — copy its value
- If not there: Network tab → look for a POST to `/api/auth/token/refresh` → copy `refresh_token` from the response body

---

## STEP 3 — Probe the token to confirm it works

Replace `YOUR_ADMIN_API_KEY` and `eyJ...` with your actual values:

```bash
curl -X POST https://api.bestofafrica.com/api/v1/agent/moonshot/oauth/probe \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token":"eyJ..."}'
```

Expected response: `"valid": true` with a list of Moonshot models.  
If you get `"valid": false` — the token is wrong or expired. Re-extract from step 2.

---

## STEP 4 — Bootstrap the token into the platform

```bash
curl -X POST https://api.bestofafrica.com/api/v1/agent/moonshot/oauth/bootstrap \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token":  "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in":    3600
  }'
```

> Including `refresh_token` is critical — it makes the platform auto-renew before
> expiry so agents run on your subscription permanently with no manual intervention.

---

## STEP 5 — Verify it's live

```bash
curl https://api.bestofafrica.com/api/v1/agent/moonshot/oauth/status \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

You should see:
```json
{
  "authorized": true,
  "access_token_valid": true,
  "has_refresh_token": true
}
```

---

## Once complete

All AI agents (article generation, headline optimization, narrative gap filling,
market intelligence, sector summaries, self-improvement) will run on your
Moonshot AI Kimi subscription automatically. Tokens auto-refresh — nothing
further needed unless you explicitly revoke them.

To revoke:
```bash
curl -X DELETE https://api.bestofafrica.com/api/v1/agent/moonshot/oauth/tokens \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

---

*Generated 2026-04-27 | Best of Africa Platform*
