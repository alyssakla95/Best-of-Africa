-- Provider-independent global feeds. These are fetched directly so the
-- evidence pipeline continues even when a search aggregator blocks Workers.
INSERT OR IGNORE INTO sources
    (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
VALUES
    ('global-ft-africa', 'Financial Times Africa', 'rss', 'https://www.ft.com/world/africa?format=rss', NULL, 'finance', 1, 30),
    ('global-economist-africa', 'The Economist Africa', 'rss', 'https://www.economist.com/middle-east-and-africa/rss.xml', NULL, 'finance', 1, 30),
    ('global-guardian-africa', 'The Guardian Africa', 'rss', 'https://www.theguardian.com/world/africa/rss', NULL, NULL, 1, 30),
    ('global-france24-africa', 'France 24 Africa', 'rss', 'https://www.france24.com/en/africa/rss', NULL, NULL, 1, 30),
    ('global-dw-africa', 'Deutsche Welle Africa', 'rss', 'https://rss.dw.com/rdf/rss-en-africa', NULL, NULL, 1, 30),
    ('global-aljazeera', 'Al Jazeera', 'rss', 'https://www.aljazeera.com/xml/rss/all.xml', NULL, NULL, 1, 30);

UPDATE sources
SET is_active = 0
WHERE name = 'Africa News' AND url = 'https://www.africanews.com/rss';
