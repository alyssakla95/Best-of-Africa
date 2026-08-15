-- Repair feeds from current publisher-owned metadata and reset their measured
-- acquisition state so the next scheduled run verifies production yield.
UPDATE sources
SET type = 'rss',
    url = 'https://www.businessdailyafrica.com/bd/rss.xml',
    is_active = 1,
    last_fetched_at = NULL
WHERE id = 's-business-daily-ke';

UPDATE sources
SET type = 'rss',
    url = 'https://continent.substack.com/feed',
    is_active = 1,
    last_fetched_at = NULL
WHERE id = 's-the-continent';

UPDATE source_acquisition_yield
SET consecutive_zero_qualified = 0,
    last_items_found = 0,
    last_qualified_found = 0,
    last_duplicates_found = 0,
    last_queued = 0,
    last_error = NULL,
    last_fetched_at = datetime('now', '-2 days')
WHERE source_id IN ('s-business-daily-ke', 's-the-continent');

-- These direct connectors have never produced a queued record. The first-party
-- sites either block the Worker, return a permanent error, or expose only a
-- stale feed. Their domains remain in trusted discovery, but inactive sources
-- must not inflate operational source counts or consume scheduled capacity.
UPDATE sources
SET is_active = 0
WHERE id IN (
    'primary-unctad-news',
    'primary-irena-news',
    'primary-imf-news',
    's-cnbc-africa'
);
