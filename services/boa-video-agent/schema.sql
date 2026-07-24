-- Compatible with both SQLite and Postgres
CREATE TABLE IF NOT EXISTS article_videos (
    article_id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (
        status IN ('pending', 'generating', 'ready', 'failed')
    ),
    seedance_video_id TEXT,
    video_url TEXT,
    variant TEXT DEFAULT 'tourist',
    priority TEXT DEFAULT 'normal',
    -- 'front_page', 'sponsored', 'normal'
    prompt_used TEXT,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Index for queue processing (finding users with pending status, high priority first)
CREATE INDEX IF NOT EXISTS idx_video_queue ON article_videos(status, priority, created_at);