-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0008: Advanced AI Features
-- Predictive intelligence, audio, reports, premium features
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- Sentiment tracking on articles
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE articles
ADD COLUMN sentiment_score TEXT;
-- 'positive', 'neutral', 'negative'
ALTER TABLE articles
ADD COLUMN sentiment_confidence REAL;
ALTER TABLE articles
ADD COLUMN sentiment_signals TEXT;
-- JSON
-- ───────────────────────────────────────────────────────────────────────────────
-- Audio narration tracking
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE articles
ADD COLUMN audio_url TEXT;
ALTER TABLE articles
ADD COLUMN audio_duration_seconds INTEGER;
-- ───────────────────────────────────────────────────────────────────────────────
-- Usage tracking for tier limits
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    feature TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_log(user_id, feature, created_at);
-- ───────────────────────────────────────────────────────────────────────────────
-- Saved Searches
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    query TEXT NOT NULL,
    filters TEXT,
    -- JSON
    notify_on_match INTEGER DEFAULT 0,
    last_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
-- ───────────────────────────────────────────────────────────────────────────────
-- Custom Alerts
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS custom_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    -- 'keyword', 'country', 'sector', 'sentiment'
    trigger_value TEXT NOT NULL,
    notification_channels TEXT,
    -- JSON array
    is_active INTEGER DEFAULT 1,
    last_triggered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON custom_alerts(user_id, is_active);
-- Alert notifications
CREATE TABLE IF NOT EXISTS alert_notifications (
    id TEXT PRIMARY KEY,
    alert_id TEXT REFERENCES custom_alerts(id),
    article_id TEXT REFERENCES articles(id),
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Search notifications
CREATE TABLE IF NOT EXISTS search_notifications (
    id TEXT PRIMARY KEY,
    saved_search_id TEXT REFERENCES saved_searches(id),
    article_id TEXT REFERENCES articles(id),
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- ───────────────────────────────────────────────────────────────────────────────
-- Generated Reports
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS generated_reports (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    -- 'country_brief', 'sector_analysis', 'weekly_digest'
    title TEXT NOT NULL,
    metadata TEXT,
    -- JSON
    html_content TEXT,
    pdf_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reports_type ON generated_reports(type, created_at);
-- ───────────────────────────────────────────────────────────────────────────────
-- User subscription tiers
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE clients
ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE clients
ADD COLUMN subscription_expires_at DATETIME;
-- ───────────────────────────────────────────────────────────────────────────────
-- Trend snapshots
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trend_snapshots (
    id TEXT PRIMARY KEY,
    entity TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    -- 'country', 'sector', 'topic'
    article_count_24h INTEGER,
    article_count_7d INTEGER,
    velocity REAL,
    change_percent REAL,
    is_trending INTEGER DEFAULT 0,
    snapshot_date DATE DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trends_date ON trend_snapshots(snapshot_date, entity_type);