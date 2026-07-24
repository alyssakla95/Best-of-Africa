-- Add moderation fields to articles table
ALTER TABLE articles
ADD COLUMN moderation_status TEXT DEFAULT 'pending';
-- pending, approved, flagged, needs_review
ALTER TABLE articles
ADD COLUMN moderation_score REAL DEFAULT 1.0;
-- 0.0 to 1.0 confidence
-- ALTER TABLE articles
-- ADD COLUMN moderation_notes TEXT;
-- JSON array of findings
ALTER TABLE articles
ADD COLUMN source_credibility_score REAL DEFAULT 1.0;
-- 0.0 to 1.0 based on source history
-- Index for moderation workflow
CREATE INDEX idx_articles_moderation ON articles(moderation_status);