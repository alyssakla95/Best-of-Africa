-- Make sector labels auditable and keep unverified historical assignments out
-- of sector-level reporting statistics until the bounded review worker has
-- confirmed or corrected them.
ALTER TABLE articles ADD COLUMN sector_assignment_method TEXT NOT NULL DEFAULT 'pending_review';
ALTER TABLE articles ADD COLUMN sector_assignment_confidence REAL;
ALTER TABLE articles ADD COLUMN sector_reviewed_at DATETIME;
ALTER TABLE articles ADD COLUMN sector_assignment_previous TEXT;

UPDATE articles
SET sector_assignment_method = 'legacy_pending_review',
    sector_assignment_confidence = NULL,
    sector_reviewed_at = NULL
WHERE status = 'published' AND sector_id IS NOT NULL AND sector_id != '';

CREATE INDEX IF NOT EXISTS idx_articles_sector_review_queue
ON articles(status, sector_reviewed_at, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_sector_confidence
ON articles(status, sector_assignment_confidence, sector_id, published_at DESC);
