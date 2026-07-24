-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0024: Article Feedback
-- Tracks human rejections and significant edits for agent self-improvement.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS article_feedback (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES articles(id),
    feedback_type TEXT NOT NULL, -- 'rejection', 'edit', 'comment'
    comment TEXT,
    original_content TEXT,
    edited_content TEXT,
    is_processed_by_agent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_article ON article_feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_feedback_processed ON article_feedback(is_processed_by_agent);
