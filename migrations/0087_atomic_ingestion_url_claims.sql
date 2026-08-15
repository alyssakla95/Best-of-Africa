-- A separate reservation ledger makes canonical URL admission atomic across
-- concurrently fetched country lanes without deleting historical records.
CREATE TABLE IF NOT EXISTS ingestion_url_claims (
    external_id TEXT PRIMARY KEY,
    ingested_item_id TEXT NOT NULL,
    claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ingestion_url_claims_item
ON ingestion_url_claims(ingested_item_id);

-- Preserve existing history and reserve every URL already encountered. Where
-- earlier races created duplicates, the earliest item becomes the canonical
-- reservation while all records remain available for audit.
INSERT OR IGNORE INTO ingestion_url_claims (external_id, ingested_item_id, claimed_at)
SELECT i.external_id, i.id, MIN(i.created_at)
FROM ingested_items i
WHERE i.external_id IS NOT NULL AND TRIM(i.external_id) <> ''
GROUP BY i.external_id;
