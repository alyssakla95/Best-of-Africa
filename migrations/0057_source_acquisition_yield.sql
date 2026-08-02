-- A source catalogue is only meaningful when its sources return qualifying,
-- usable evidence. Persist the latest and cumulative acquisition yield so
-- production health can distinguish a configured source from a productive one.
CREATE TABLE IF NOT EXISTS source_acquisition_yield (
    source_id TEXT PRIMARY KEY REFERENCES sources(id) ON DELETE CASCADE,
    fetch_count INTEGER NOT NULL DEFAULT 0,
    consecutive_zero_qualified INTEGER NOT NULL DEFAULT 0,
    last_items_found INTEGER NOT NULL DEFAULT 0,
    last_qualified_found INTEGER NOT NULL DEFAULT 0,
    last_duplicates_found INTEGER NOT NULL DEFAULT 0,
    last_queued INTEGER NOT NULL DEFAULT 0,
    total_qualified_found INTEGER NOT NULL DEFAULT 0,
    total_queued INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    last_fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_productive_at TEXT
);

-- AP's Africa hub is a direct first-party listing. It avoids dependence on a
-- search aggregator and is filtered to African market evidence before any
-- article is queued.
INSERT OR IGNORE INTO sources
    (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
VALUES
    ('global-ap-africa', 'Associated Press Africa', 'html', 'https://apnews.com/hub/africa', NULL, NULL, 1, 30);
