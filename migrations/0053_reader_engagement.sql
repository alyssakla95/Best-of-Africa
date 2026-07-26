CREATE TABLE IF NOT EXISTS reader_engagement_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'page_view',
        'briefing_open',
        'article_read',
        'article_share',
        'audio_start',
        'audio_complete',
        'search',
        'click'
    )),
    session_hash TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent_fingerprint TEXT NOT NULL,
    resource_id TEXT,
    path TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reader_engagement_created
    ON reader_engagement_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reader_engagement_session_created
    ON reader_engagement_events(session_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reader_engagement_type_created
    ON reader_engagement_events(event_type, created_at DESC);
