-- Re-run the repaired FAO endpoint after HTML acquisition gained explicit
-- blocked-response telemetry. Preserve the non-null yield timestamp while
-- clearing only the cooldown counter.
UPDATE sources
SET last_fetched_at = NULL
WHERE id = 'primary-fao-africa-news';

UPDATE source_acquisition_yield
SET consecutive_zero_qualified = 0
WHERE source_id = 'primary-fao-africa-news';
