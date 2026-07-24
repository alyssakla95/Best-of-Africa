-- Preserve the original publisher behind aggregators and prevent duplicate
-- source rows from producing duplicate stories.
ALTER TABLE ingested_items ADD COLUMN publisher_name TEXT;
ALTER TABLE ingested_items ADD COLUMN publisher_url TEXT;

CREATE INDEX IF NOT EXISTS idx_ingested_external_global
ON ingested_items(external_id);

CREATE INDEX IF NOT EXISTS idx_ingested_url_source_repair
ON ingested_items(url, source_id, created_at);

UPDATE ingested_items
SET publisher_name = (
    SELECT s.name FROM sources s WHERE s.id = ingested_items.source_id
)
WHERE publisher_name IS NULL;

-- Older generation stored the source article headline in articles.source_title.
-- Repair fixed-feed attribution where the matching ingestion record is known.
UPDATE articles
SET source_title = (
    SELECT COALESCE(i.publisher_name, s.name)
    FROM ingested_items i
    JOIN sources s ON s.id = i.source_id
    WHERE i.url = articles.source_url
      AND i.source_id != 'google-news-aggregator'
    ORDER BY i.created_at ASC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1
    FROM ingested_items i
    WHERE i.url = articles.source_url
      AND i.source_id != 'google-news-aggregator'
);

-- Keep one active row per feed URL. Historical rows remain intact for lineage.
UPDATE sources AS current
SET is_active = 0
WHERE EXISTS (
    SELECT 1 FROM sources AS earlier
    WHERE earlier.url = current.url
      AND earlier.is_active = 1
      AND (
        earlier.created_at < current.created_at
        OR (earlier.created_at = current.created_at AND earlier.id < current.id)
      )
);

-- Working, directly verified institutional feeds (checked 2026-07-18).
INSERT OR IGNORE INTO sources (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes) VALUES
('official-uneca', 'UN Economic Commission for Africa', 'rss', 'https://www.uneca.org/rss.xml', NULL, NULL, 1, 60),
('official-african-union', 'African Union', 'rss', 'https://au.int/en/rss.xml', NULL, NULL, 1, 60),
('official-un-news-africa', 'UN News Africa', 'rss', 'https://news.un.org/feed/subscribe/en/news/region/africa/feed/rss.xml', NULL, NULL, 1, 60),
('official-wto', 'World Trade Organization', 'rss', 'https://www.wto.org/library/rss/latest_news_e.xml', NULL, 'finance', 1, 60);
