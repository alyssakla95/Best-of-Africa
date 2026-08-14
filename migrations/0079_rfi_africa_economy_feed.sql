-- Add a productive multilingual international feed for African market
-- evidence. The general RFI Africa feed is predominantly politics and sport;
-- the economy feed is filtered by the existing Africa and market-evidence
-- gates before any item can enter generation.
INSERT OR IGNORE INTO sources
    (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
VALUES
    ('global-rfi-africa-economy', 'Radio France Internationale', 'rss', 'https://www.rfi.fr/fr/economie/rss', NULL, NULL, 1, 30);

UPDATE sources
SET name = 'Radio France Internationale',
    type = 'rss',
    url = 'https://www.rfi.fr/fr/economie/rss',
    country_code = NULL,
    sector_id = NULL,
    is_active = 1,
    fetch_interval_minutes = 30,
    last_fetched_at = NULL
WHERE id = 'global-rfi-africa-economy';
