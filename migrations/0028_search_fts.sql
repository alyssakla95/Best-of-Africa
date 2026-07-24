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

-- Create Triggers to keep FTS index synced with the articles table
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
