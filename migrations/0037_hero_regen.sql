-- Track which heroes have been (re)generated with the FLUX-era image model.
-- 0 = SDXL-era image (regen cron will replace it, most-visible first);
-- 1 = flux-generated (new pipeline output, or already regenerated).
ALTER TABLE articles ADD COLUMN hero_regen INTEGER DEFAULT 0;

-- Articles generated after the FLUX.1-schnell deploy already have flux heroes.
-- (D1 datetime('now') stores "YYYY-MM-DD HH:MM:SS" — space separator, not T.)
UPDATE articles SET hero_regen = 1 WHERE created_at >= '2026-07-05 14:00:00';
