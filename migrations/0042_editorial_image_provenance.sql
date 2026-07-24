-- Editorial images must be photographs supplied by, and traceable to, the
-- reporting source. Generated archive heroes are removed rather than silently
-- presented as documentary photography.
ALTER TABLE ingested_items ADD COLUMN image_url TEXT;
ALTER TABLE ingested_items ADD COLUMN image_credit TEXT;
ALTER TABLE ingested_items ADD COLUMN image_source_url TEXT;

ALTER TABLE articles ADD COLUMN image_credit TEXT;
ALTER TABLE articles ADD COLUMN image_source_url TEXT;

UPDATE articles
SET hero_image_url = NULL,
    image_credit = NULL,
    image_source_url = NULL
WHERE hero_image_url LIKE '%/assets/articles/%'
   OR ai_image_url IS NOT NULL;

UPDATE articles SET ai_image_url = NULL WHERE ai_image_url IS NOT NULL;
