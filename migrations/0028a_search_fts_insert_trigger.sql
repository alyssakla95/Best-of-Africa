-- Keep the external-content FTS index synchronized with new articles.
-- Each trigger is isolated because D1 migration batches cannot parse several
-- trigger bodies in the same migration reliably.
CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
  INSERT INTO articles_fts(rowid, id, title, summary, content)
  VALUES (new.rowid, new.id, new.title, new.summary, new.content);
END;
