-- Queue consumers need a claim timestamp distinct from item creation time so
-- crashed work can be reclaimed without racing a legitimately active job.
ALTER TABLE ingested_items ADD COLUMN processing_started_at TEXT;

CREATE INDEX IF NOT EXISTS idx_ingested_items_processing_claim
ON ingested_items(status, processing_started_at)
WHERE status = 'processing' AND article_id IS NULL;
