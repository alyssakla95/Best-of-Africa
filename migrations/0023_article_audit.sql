-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0023: Article Audit
-- Adds a last_audited_at column to track proactive maintenance
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE articles
ADD COLUMN last_audited_at TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_audit ON articles(last_audited_at)
WHERE last_audited_at IS NOT NULL;
