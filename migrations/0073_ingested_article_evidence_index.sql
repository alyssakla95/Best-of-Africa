-- Country acquisition and editorial health repeatedly resolve the source
-- record attached to a generated article. Keep that evidence lookup bounded
-- as the ingestion archive grows.
CREATE INDEX IF NOT EXISTS idx_ingested_items_article_id
ON ingested_items(article_id);
