-- Create FTS5 Virtual Table for Article Search
-- NOTE: Initial population of existing articles is done separately via
-- a batched backfill script to avoid D1 CPU time limits.
CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
    id UNINDEXED,
    title,
    summary,
    content,
    content='articles',
    content_rowid='rowid'
);
