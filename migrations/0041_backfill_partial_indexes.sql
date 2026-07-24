-- Partial indexes for the per-minute self-terminating backfill crons.
--
-- Each backfill selects "published rows still missing X, newest first". With
-- only full-column indexes, SQLite walks published_at DESC and FILTERS —
-- e.g. the audio backfill scanned ~5,700 already-narrated rows every minute
-- to find its next 3, a cost that grows linearly as coverage completes.
-- A partial index contains ONLY the not-yet-done rows: the probe is O(batch),
-- and the index physically shrinks to empty as the work finishes.
--
-- Predicates mirror the queries in src/workers/generator.ts verbatim — the
-- planner only uses a partial index when the query's WHERE implies it.
-- (Applied via d1 execute; the migrations journal is out of sync.)

CREATE INDEX IF NOT EXISTS idx_articles_audio_missing
    ON articles(published_at DESC)
    WHERE status = 'published' AND (audio_url IS NULL OR audio_url = '');

CREATE INDEX IF NOT EXISTS idx_articles_hero_missing
    ON articles(published_at DESC)
    WHERE status = 'published' AND (hero_image_url IS NULL OR hero_image_url = '');

CREATE INDEX IF NOT EXISTS idx_articles_regen_pending
    ON articles(published_at DESC)
    WHERE status = 'published' AND (hero_regen IS NULL OR hero_regen = 0);

CREATE INDEX IF NOT EXISTS idx_articles_sector_missing
    ON articles(published_at DESC)
    WHERE status = 'published' AND sector_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_variant_missing
    ON articles(published_at DESC)
    WHERE status = 'published' AND (hero_variant IS NULL OR hero_variant = 0);
