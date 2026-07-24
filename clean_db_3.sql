DROP TRIGGER IF EXISTS articles_ai;
DROP TRIGGER IF EXISTS articles_ad;
DROP TRIGGER IF EXISTS articles_au;
DROP TABLE IF EXISTS articles_fts;
DROP TABLE IF EXISTS articles;

CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    summary TEXT,
    country_code TEXT REFERENCES countries(code),
    sector_id TEXT REFERENCES sectors(id),
    tags TEXT,
    meta_title TEXT,
    meta_description TEXT,
    hero_image_url TEXT,
    reading_time_minutes INTEGER,
    source_url TEXT,
    source_title TEXT,
    source_published_at TEXT,
    generation_model TEXT,
    generation_prompt_version TEXT,
    embedding_id TEXT,
    status TEXT DEFAULT 'draft',
    is_sponsored INTEGER DEFAULT 0,
    sponsor_id TEXT,
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    avg_read_time_seconds REAL DEFAULT 0,
    engagement_score REAL DEFAULT 0,
    published_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_articles_country ON articles(country_code);
CREATE INDEX idx_articles_sector ON articles(sector_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_engagement ON articles(engagement_score DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
    id UNINDEXED,
    title,
    summary,
    content,
    content='articles',
    content_rowid='rowid'
);

CREATE TRIGGER articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, id, title, summary, content)
  VALUES (new.rowid, new.id, new.title, new.summary, new.content);
END;

CREATE TRIGGER articles_ad AFTER DELETE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, id, title, summary, content)
  VALUES ('delete', old.rowid, old.id, old.title, old.summary, old.content);
END;

CREATE TRIGGER articles_au AFTER UPDATE ON articles BEGIN
  INSERT INTO articles_fts(articles_fts, rowid, id, title, summary, content)
  VALUES ('delete', old.rowid, old.id, old.title, old.summary, old.content);
  INSERT INTO articles_fts(rowid, id, title, summary, content)
  VALUES (new.rowid, new.id, new.title, new.summary, new.content);
END;

UPDATE agent_tasks SET status = 'pending', result = NULL, error_message = NULL, completed_at = NULL WHERE type = 'generate_article';
