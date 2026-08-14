-- The HTML listing exposes short cards and yielded only one queued record.
-- AfDB's official RSS endpoint carries full article bodies suitable for the
-- source-evidence gate, including underserved-country project reporting.
UPDATE sources
SET type = 'rss',
    url = 'https://www.afdb.org/en/rss.xml',
    fetch_interval_minutes = 30,
    last_fetched_at = NULL
WHERE id = 'primary-afdb-news';
