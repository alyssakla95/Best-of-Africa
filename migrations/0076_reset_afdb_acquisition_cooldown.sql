-- The cooldown belongs to the retired HTML listing, not the replacement RSS
-- endpoint. Clear only its latest-attempt state so normal cumulative yield
-- history remains available and the scheduler can verify the new feed now.
UPDATE source_acquisition_yield
SET consecutive_zero_qualified = 0,
    last_items_found = 0,
    last_qualified_found = 0,
    last_duplicates_found = 0,
    last_queued = 0,
    last_error = NULL,
    last_fetched_at = NULL
WHERE source_id = 'primary-afdb-news';
