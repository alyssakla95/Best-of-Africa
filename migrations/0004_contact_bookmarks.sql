-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0004: Contact & Bookmarks
-- Support for contact form submissions and user bookmarks
-- ═══════════════════════════════════════════════════════════════════════════════
-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organization TEXT,
    email TEXT NOT NULL,
    inquiry_type TEXT DEFAULT 'General',
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    -- pending, reviewed, responded
    created_at TEXT DEFAULT (datetime('now')),
    responded_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at);
-- User bookmarks (session-based)
CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    article_id TEXT NOT NULL REFERENCES articles(id),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_id, article_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_session ON bookmarks(session_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_article ON bookmarks(article_id);