-- Track whether a 768w mobile variant exists for the article's hero image.
-- 0/NULL = original only (variant backfill cron will process it);
-- 1 = variant generated (or original is already ≤768w / not resizable).
ALTER TABLE articles ADD COLUMN hero_variant INTEGER DEFAULT 0;
