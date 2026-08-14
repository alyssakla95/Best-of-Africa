-- Retry the verified feed after deploying standards-compliant RSS request
-- headers and explicit invalid-response telemetry.
UPDATE sources
SET last_fetched_at = NULL
WHERE id = 'primary-afdb-news';

UPDATE source_acquisition_yield
SET consecutive_zero_qualified = 0,
    last_error = NULL,
    last_fetched_at = datetime('now', '-2 days')
WHERE source_id = 'primary-afdb-news';
