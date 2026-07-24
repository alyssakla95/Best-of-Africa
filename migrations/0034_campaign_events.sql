-- 0034: Per-campaign impression/click events, so the sponsor dashboard chart
-- can show a REAL daily timeseries instead of a mock derived from totals.
CREATE TABLE IF NOT EXISTS campaign_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  event_type TEXT NOT NULL,        -- 'impression' | 'click'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_campaign_events_cid_time ON campaign_events(campaign_id, created_at);
