-- Make source-provenance recovery cheap enough to run continuously. The
-- partial index excludes ingestion rows that cannot supply an image.
CREATE INDEX IF NOT EXISTS idx_ingested_items_url_with_image
ON ingested_items(url, created_at DESC)
WHERE image_url IS NOT NULL AND image_url != '';
