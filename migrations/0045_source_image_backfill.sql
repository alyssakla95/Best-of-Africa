-- Track publisher-page image recovery so inaccessible sources do not block the
-- newest-first archive backfill indefinitely.
ALTER TABLE articles ADD COLUMN source_image_checked_at TEXT;
ALTER TABLE articles ADD COLUMN source_image_status TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_source_image_backfill
ON articles(status, source_image_checked_at, published_at DESC)
WHERE source_url IS NOT NULL AND source_url != '' AND (hero_image_url IS NULL OR hero_image_url = '');
