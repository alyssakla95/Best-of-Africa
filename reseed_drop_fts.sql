DROP TRIGGER IF EXISTS articles_ai;
DROP TRIGGER IF EXISTS articles_ad;
DROP TRIGGER IF EXISTS articles_au;
DROP TABLE IF EXISTS articles_fts;

DELETE FROM article_audits;
DELETE FROM article_feedback;
DELETE FROM articles;

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
