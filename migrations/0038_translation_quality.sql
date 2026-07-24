-- Quality tier for stored translations:
--  0 = legacy m2m100 output (short fields usable; BODY is truncated/degenerate
--      and must never be served) — the regeneration cron processes these
--  1 = regenerated with the large model and passed the degeneracy check;
--      body is safe to serve
-- -1 = regeneration produced degenerate output for this row; skipped (don't loop)
ALTER TABLE article_translations ADD COLUMN quality INTEGER DEFAULT 0;
