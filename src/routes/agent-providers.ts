// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDERS ROUTER
// Manage optional provider credentials for explicit specialist integrations.
// Supports: OpenAI, Anthropic, Google Gemini, OpenRouter, Moonshot (Kimi), Cloudflare Workers 
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { MODELS } from '../lib/ai';
import { getProviderToken, storeProviderToken, clearProviderToken } from '../lib/provider-tokens';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

const VALID_PROVIDERS = ['openai', 'anthropic', 'gemini', 'openrouter', 'moonshot', 'workers_ai'] as const;
type ProviderName = typeof VALID_PROVIDERS[number];

const PROVIDER_DEFAULTS: Record<ProviderName, { model: string; label: string; base_url?: string }> = {
    openai:     { model: 'gpt-4o',                         label: 'OpenAI',              base_url: 'https://api.openai.com/v1' },
    anthropic:  { model: 'claude-sonnet-4-6',               label: 'Anthropic',           base_url: 'https://api.anthropic.com' },
    gemini:     { model: 'gemini-2.5-pro',                  label: 'Google Gemini',       base_url: 'https://generativelanguage.googleapis.com/v1beta' },
    openrouter: { model: 'anthropic/claude-sonnet-4-6',     label: 'OpenRouter',          base_url: 'https://openrouter./api/v1' },
    moonshot:   { model: 'moonshot-v1-32k',                 label: 'Moonshot AI (Kimi)',  base_url: 'https://api.moonshot.cn/v1' },
    workers_ai: { model: MODELS.TEXT_GENERATION,             label: 'Cloudflare Workers AI' },
};

// Admin-only auth
router.use('/*', async (c, next) => {
    const auth = c.req.header('Authorization');
    if (!auth || auth !== `Bearer ${c.env.ADMIN_API_KEY}`) {
        return c.json({ error: 'unauthorized' }, 401);
    }
    await next();
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //providers — list all configured providers (API key redacted)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (c) => {
    const rows = await c.env.DB.prepare(`
        SELECT id, provider, label, model, base_url, is_active, is_default,
               last_tested_at, last_test_status, last_test_error, created_at, updated_at
        FROM ai_providers
        ORDER BY is_default DESC, created_at ASC
    `).all<Record<string, unknown>>();

    return c.json({ data: rows.results });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //providers — add or update a provider
// ───────────────────────────────────────────────────────────────────────────────
router.post('/', async (c) => {
    const body = await c.req.json<{
        provider: string;
        api_key?: string;
        model?: string;
        label?: string;
        base_url?: string;
        is_default?: boolean;
    }>();

    if (!body.provider || !VALID_PROVIDERS.includes(body.provider as ProviderName)) {
        return c.json({ error: 'invalid_provider', message: `Provider must be one of: ${VALID_PROVIDERS.join(', ')}` }, 400);
    }

    // External providers need an api_key unless they have a bootstrap token or OAuth.
    if (body.provider !== 'workers_ai' && body.provider !== 'moonshot' && !body.api_key) {
        const hasBootstrap = await getProviderToken(c.env, body.provider);
        if (!hasBootstrap) {
            return c.json({ error: 'api_key_required', message: 'api_key is required (or bootstrap a key first via POST /agent/providers/bootstrap/:provider)' }, 400);
        }
    }

    const prov = body.provider as ProviderName;
    const defaults = PROVIDER_DEFAULTS[prov];
    const id = crypto.randomUUID();

    // If setting as default, unset all others first
    if (body.is_default) {
        await c.env.DB.prepare('UPDATE ai_providers SET is_default = 0').run();
    }

    await c.env.DB.prepare(`
        INSERT INTO ai_providers (id, provider, label, api_key, model, base_url, is_active, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `).bind(
        id,
        prov,
        body.label || defaults.label,
        body.api_key || null,
        body.model || defaults.model,
        body.base_url || defaults.base_url || null,
        body.is_default ? 1 : 0
    ).run();

    // Sync to ZeroClaw config KV so the picks it up immediately
    await syncProvidersToKV(c.env);

    return c.json({ success: true, id, provider: prov }, 201);
});

// ───────────────────────────────────────────────────────────────────────────────
// PATCH //providers/:id — update a specific provider
// ───────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json<{
        api_key?: string;
        model?: string;
        label?: string;
        base_url?: string;
        is_active?: boolean;
        is_default?: boolean;
    }>();

    const existing = await c.env.DB.prepare('SELECT id FROM ai_providers WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ error: 'not_found' }, 404);

    const updates: string[] = [];
    const vals: unknown[] = [];

    if (body.api_key !== undefined)  { updates.push('api_key = ?');   vals.push(body.api_key); }
    if (body.model !== undefined)    { updates.push('model = ?');      vals.push(body.model); }
    if (body.label !== undefined)    { updates.push('label = ?');      vals.push(body.label); }
    if (body.base_url !== undefined) { updates.push('base_url = ?');   vals.push(body.base_url); }
    if (body.is_active !== undefined){ updates.push('is_active = ?');  vals.push(body.is_active ? 1 : 0); }
    if (body.is_default) {
        await c.env.DB.prepare('UPDATE ai_providers SET is_default = 0').run();
        updates.push('is_default = 1');
    }

    if (!updates.length) return c.json({ success: true, message: 'Nothing to update' });

    updates.push('updated_at = datetime(\'now\')');
    vals.push(id);

    await c.env.DB.prepare(`UPDATE ai_providers SET ${updates.join(', ')} WHERE id = ?`).bind(...vals).run();
    await syncProvidersToKV(c.env);

    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// DELETE //providers/:id — remove a provider
// ───────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM ai_providers WHERE id = ?').bind(id).run();
    await syncProvidersToKV(c.env);
    return c.json({ success: true });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //providers/:id/test — verify an API key works
// ───────────────────────────────────────────────────────────────────────────────
router.post('/:id/test', async (c) => {
    const id = c.req.param('id');
    const row = await c.env.DB.prepare(
        'SELECT provider, api_key, model, base_url FROM ai_providers WHERE id = ?'
    ).bind(id).first<{ provider: string; api_key: string; model: string; base_url: string }>();

    if (!row) return c.json({ error: 'not_found' }, 404);

    let testStatus: 'ok' | 'error' = 'error';
    let testError = '';

    try {
        if (row.provider === 'workers_ai') {
            // Workers is always available — test via binding
            await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 5
            });
            testStatus = 'ok';
        } else if (row.provider === 'openai' || row.provider === 'openrouter' || row.provider === 'moonshot') {
            const baseUrl = row.base_url || PROVIDER_DEFAULTS[row.provider as ProviderName].base_url;
            const res = await fetch(`${baseUrl}/models`, {
                headers: { Authorization: `Bearer ${row.api_key}` }
            });
            testStatus = res.ok ? 'ok' : 'error';
            if (!res.ok) testError = `HTTP ${res.status}`;
        } else if (row.provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': row.api_key,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 5,
                    messages: [{ role: 'user', content: 'ping' }]
                })
            });
            testStatus = res.ok ? 'ok' : 'error';
            if (!res.ok) testError = `HTTP ${res.status}`;
        } else if (row.provider === 'gemini') {
            const res = await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models',
                { headers: { 'x-goog-api-key': row.api_key } }
            );
            testStatus = res.ok ? 'ok' : 'error';
            if (!res.ok) testError = `HTTP ${res.status}`;
        }
    } catch (e: unknown) {
        testError = e instanceof Error ? e.message : 'Connection failed';
    }

    await c.env.DB.prepare(`
        UPDATE ai_providers
        SET last_tested_at = datetime('now'), last_test_status = ?, last_test_error = ?, updated_at = datetime('now')
        WHERE id = ?
    `).bind(testStatus, testError || null, id).run();

    return c.json({ success: testStatus === 'ok', status: testStatus, error: testError || null });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //providers/config — get the active zeroclaw-compatible provider config
// (used by ZeroClaw at startup to pick up credentials dynamically)
// API keys are redacted from the HTTP response; ZeroClaw reads them directly from KV.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/config', async (c) => {
    const config = await buildProviderConfig(c.env);
    return c.json(redactProviderConfig(config));
});

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

async function buildProviderConfig(env: Env): Promise<Record<string, unknown>> {
    const rows = await env.DB.prepare(`
        SELECT provider, api_key, model, base_url, is_default
        FROM ai_providers WHERE is_active = 1
        ORDER BY is_default DESC, created_at ASC
    `).all<{ provider: string; api_key: string; model: string; base_url: string; is_default: number }>();

    const providers: Record<string, unknown> = {};
    const defaultProvider = 'workers_ai';
    const defaultModel = MODELS.TEXT_GENERATION;

    for (const row of rows.results) {
        if (row.provider === 'workers_ai') {
            providers.workers_ai = { type: 'workers_ai' };
        } else if (row.provider === 'openai') {
            providers.openai = { api_key: row.api_key, base_url: row.base_url };
        } else if (row.provider === 'anthropic') {
            providers.anthropic = { api_key: row.api_key };
        } else if (row.provider === 'gemini') {
            providers.gemini = { api_key: row.api_key };
        } else if (row.provider === 'openrouter') {
            providers.openrouter = { api_key: row.api_key, base_url: row.base_url || 'https://openrouter./api/v1' };
        } else if (row.provider === 'moonshot') {
            providers.moonshot = { api_key: row.api_key, base_url: row.base_url || 'https://api.moonshot.cn/v1' };
        }

        // Provider records remain available for specialist integrations, but
        // informational agents are deliberately pinned below to GPT-OSS 120B.
    }

    // Workers always available as a fallback
    if (!providers.workers_ai) {
        providers.workers_ai = { type: 'workers_ai' };
    }
    return {
        providers,
        agents: { defaults: { provider: defaultProvider, model: defaultModel } },
    };
}

function redactProviderConfig(config: Record<string, unknown>): Record<string, unknown> {
    const providers = config.providers as Record<string, Record<string, unknown>>;
    const redacted: Record<string, Record<string, unknown>> = {};
    for (const [name, val] of Object.entries(providers)) {
        const { api_key: _, ...safe } = val;
        redacted[name] = safe;
    }
    return { ...config, providers: redacted };
}

async function syncProvidersToKV(env: Env): Promise<void> {
    try {
        const config = await buildProviderConfig(env);
        // Cache for 5 minutes — ZeroClaw polls this on each cron run
        await env.CACHE.put('zeroclaw:provider_config', JSON.stringify(config), { expirationTtl: 300 });
    } catch {
        // Non-critical — don't fail the main request
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST //providers/bootstrap/:provider
// Inject an API key at runtime — stored in KV, no redeployment needed.
//
// Body: { "api_key": "sk-...", "expires_in": 86400 }
// expires_in is optional (seconds); omit for non-expiring keys.
// ───────────────────────────────────────────────────────────────────────────────
router.post('/bootstrap/:provider', async (c) => {
    const provider = c.req.param('provider') as ProviderName;
    if (!VALID_PROVIDERS.includes(provider) || provider === 'workers_ai') {
        return c.json({ error: 'invalid_provider', message: `Bootstrap supports: ${VALID_PROVIDERS.filter(p => p !== 'workers_ai').join(', ')}` }, 400);
    }

    const body = await c.req.json<{ api_key: string; expires_in?: number }>();
    if (!body.api_key) return c.json({ error: 'api_key is required' }, 400);

    const { expires_at } = await storeProviderToken(c.env, provider, body.api_key, body.expires_in);

    return c.json({
        success: true,
        provider,
        expires_at,
        message: `${PROVIDER_DEFAULTS[provider].label} API key bootstrapped for explicit specialist integrations. Informational generation remains pinned to GPT-OSS 120B.`,
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// GET //providers/bootstrap/:provider/status
// Check if a provider has a bootstrapped key.
// ───────────────────────────────────────────────────────────────────────────────
router.get('/bootstrap/:provider/status', async (c) => {
    const provider = c.req.param('provider') as ProviderName;
    if (!VALID_PROVIDERS.includes(provider)) {
        return c.json({ error: 'invalid_provider' }, 400);
    }

    const token = await getProviderToken(c.env, provider);
    const envVarMap: Partial<Record<ProviderName, string | undefined>> = {
        anthropic:  c.env.ANTHROPIC_API_KEY,
        gemini:     c.env.GOOGLE_AI_API_KEY,
        moonshot:   c.env.MOONSHOT_API_KEY,
        openai:     c.env.OPENAI_API_KEY,
        openrouter: c.env.OPENROUTER_API_KEY,
    };

    return c.json({
        provider,
        bootstrap_active: !!token,
        env_var_set: !!envVarMap[provider],
        ready: !!token || !!envVarMap[provider],
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// DELETE //providers/bootstrap/:provider
// Clear bootstrapped key — reverts to DB config or env var.
// ───────────────────────────────────────────────────────────────────────────────
router.delete('/bootstrap/:provider', async (c) => {
    const provider = c.req.param('provider') as ProviderName;
    if (!VALID_PROVIDERS.includes(provider)) {
        return c.json({ error: 'invalid_provider' }, 400);
    }

    await clearProviderToken(c.env, provider);
    return c.json({ success: true, message: `Bootstrapped key for ${PROVIDER_DEFAULTS[provider].label} cleared.` });
});

// ───────────────────────────────────────────────────────────────────────────────
// POST //providers/bootstrap/:provider/probe
// Validate a key by making a cheap live call to the provider's API.
// Body: { "api_key": "sk-..." }
// ───────────────────────────────────────────────────────────────────────────────
router.post('/bootstrap/:provider/probe', async (c) => {
    const provider = c.req.param('provider') as ProviderName;
    const { api_key } = await c.req.json<{ api_key: string }>();
    if (!api_key) return c.json({ error: 'api_key is required' }, 400);

    try {
        let valid = false;
        if (provider === 'anthropic') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'x-api-key': api_key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
                body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5, messages: [{ role: 'user', content: 'ping' }] }),
            });
            valid = res.ok;
        } else if (provider === 'gemini') {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${api_key}`);
            valid = res.ok;
        } else if (provider === 'openai' || provider === 'openrouter') {
            const base = PROVIDER_DEFAULTS[provider].base_url;
            const res = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${api_key}` } });
            valid = res.ok;
        } else if (provider === 'moonshot') {
            const res = await fetch('https://api.moonshot.cn/v1/models', { headers: { Authorization: `Bearer ${api_key}` } });
            valid = res.ok;
        }
        return c.json({ valid, provider });
    } catch (err) {
        return c.json({ valid: false, error: err instanceof Error ? err.message : 'Connection failed' });
    }
});

export { router as agentProvidersRouter };
