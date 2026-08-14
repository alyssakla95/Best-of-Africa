-- ECOWAS now serves a current, parseable WordPress RSS feed from the Worker
-- network. Reactivate the first-party connector after verifying that recent
-- market-policy entries expose full article bodies above the evidence floor.
UPDATE sources
SET type = 'rss',
    url = 'https://www.ecowas.int/feed/',
    is_active = 1,
    fetch_interval_minutes = 30,
    last_fetched_at = NULL
WHERE id = 'primary-ecowas-news';

UPDATE source_acquisition_yield
SET consecutive_zero_qualified = 0,
    last_items_found = 0,
    last_qualified_found = 0,
    last_duplicates_found = 0,
    last_queued = 0,
    last_error = NULL,
    last_fetched_at = datetime('now', '-2 days')
WHERE source_id = 'primary-ecowas-news';
