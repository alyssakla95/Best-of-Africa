-- FAO's public Africa news route is a client-rendered shell. Its own page
-- loads this first-party server-rendered endpoint, which exposes the current
-- news-detail links required by the existing full-evidence scraper.
UPDATE sources
SET type = 'html',
    url = 'https://www.fao.org/africa/news-stories/news/GetContent/1/en/',
    is_active = 1,
    fetch_interval_minutes = 60,
    last_fetched_at = NULL
WHERE id = 'primary-fao-africa-news';

UPDATE source_acquisition_yield
SET consecutive_zero_qualified = 0
WHERE source_id = 'primary-fao-africa-news';
