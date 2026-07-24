-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0025: AI Provider Configuration
-- Stores user-configured AI provider credentials for powering ZeroClaw agents.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL, -- 'openai' | 'anthropic' | 'gemini' | 'openrouter' | 'workers_ai'
    label TEXT,             -- User-defined label (e.g. "My Anthropic Key")
    api_key TEXT,           -- Encrypted API key (set via backend, never returned in GET)
    model TEXT,             -- Default model for this provider
    base_url TEXT,          -- Optional custom base URL (for OpenAI-compat APIs)
    is_active INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,  -- Only one default at a time
    last_tested_at TEXT,
    last_test_status TEXT,  -- 'ok' | 'error'
    last_test_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_providers_provider ON ai_providers(provider);

-- Ensure only one default at a time (soft constraint — enforced in application layer)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_providers_default ON ai_providers(is_default)
WHERE is_default = 1;
