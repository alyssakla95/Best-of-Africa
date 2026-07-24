-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0021: Agent Media
-- Adds columns for AI-generated images and videos to support the 
-- "produce videos and images attached to articles" priority.
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE articles
ADD COLUMN ai_image_url TEXT;
ALTER TABLE articles
ADD COLUMN ai_video_url TEXT;
-- Create an index to quickly find articles that have media
CREATE INDEX IF NOT EXISTS idx_articles_media ON articles(ai_image_url)
WHERE ai_image_url IS NOT NULL;