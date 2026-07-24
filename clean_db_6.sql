DROP TRIGGER IF EXISTS articles_ai;
DROP TRIGGER IF EXISTS articles_ad;
DROP TRIGGER IF EXISTS articles_au;

DELETE FROM articles WHERE created_at >= datetime('now', '-24 hours') AND title != 'Welcome to BOA-Story';

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

UPDATE agent_tasks SET status = 'pending', result = NULL, completed_at = NULL WHERE id IN (SELECT id FROM agent_tasks WHERE type = 'generate_article' AND status = 'completed' LIMIT 15);
