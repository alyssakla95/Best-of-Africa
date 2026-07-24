-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0009: Developer APIs and Infrastructure
-- Webhooks, moderation, scheduling, analytics tables
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- Webhooks
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT NOT NULL,
    -- JSON array of event types
    secret TEXT,
    is_active INTEGER DEFAULT 1,
    failure_count INTEGER DEFAULT 0,
    last_triggered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_webhooks_client ON webhooks(client_id, is_active);
CREATE TABLE IF NOT EXISTS webhook_logs (
    id TEXT PRIMARY KEY,
    event TEXT NOT NULL,
    payload TEXT,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- ───────────────────────────────────────────────────────────────────────────────
-- Content Moderation
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_results (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES articles(id),
    approved INTEGER NOT NULL,
    confidence REAL,
    flags TEXT,
    -- JSON array
    suggestions TEXT,
    -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_moderation_article ON moderation_results(article_id);
-- Add moderation fields to articles
ALTER TABLE articles
ADD COLUMN moderation_notes TEXT;
ALTER TABLE articles
ADD COLUMN reviewed_by TEXT;
ALTER TABLE articles
ADD COLUMN reviewed_at DATETIME;
-- ───────────────────────────────────────────────────────────────────────────────
-- Content Scheduling
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE articles
ADD COLUMN scheduled_at DATETIME;
-- ───────────────────────────────────────────────────────────────────────────────
-- Analytics Log (extended)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_log (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    page TEXT,
    article_id TEXT,
    country_code TEXT,
    sector_id TEXT,
    search_query TEXT,
    time_on_page INTEGER,
    referrer TEXT,
    device_type TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_log(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_log(event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_article ON analytics_log(article_id);
-- ───────────────────────────────────────────────────────────────────────────────
-- API Keys for clients
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE clients
ADD COLUMN api_key TEXT;
ALTER TABLE clients
ADD COLUMN api_key_created_at DATETIME;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_api_key ON clients(api_key);
-- ───────────────────────────────────────────────────────────────────────────────
-- Add view_count to articles if not exists
-- ───────────────────────────────────────────────────────────────────────────────
-- view_count already exists