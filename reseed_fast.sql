DROP TRIGGER IF EXISTS articles_ai;
DROP TRIGGER IF EXISTS articles_ad;
DROP TRIGGER IF EXISTS articles_au;

DELETE FROM article_audits;
DELETE FROM article_feedback;
DELETE FROM articles;

DELETE FROM articles_fts;

UPDATE agent_tasks SET status = 'pending', result = NULL, error_message = NULL, completed_at = NULL WHERE type = 'generate_article';

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
