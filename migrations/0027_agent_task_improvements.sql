-- Migration: 0027_agent_task_improvements
-- Adds task TTL/priority/retry to agent_tasks and URL dedup to ingested_items
-- Required for 24/7 autonomous agent operation

-- ── agent_tasks: task lifecycle improvements ─────────────────────────────────
ALTER TABLE agent_tasks ADD COLUMN expires_at DATETIME;
ALTER TABLE agent_tasks ADD COLUMN priority INTEGER DEFAULT 5;
  -- 1=urgent (gap-fill/breaking), 5=normal, 10=low (audit)
ALTER TABLE agent_tasks ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE agent_tasks ADD COLUMN max_retries INTEGER DEFAULT 3;
ALTER TABLE agent_tasks ADD COLUMN agent_version TEXT;
  -- tracks which ZeroClaw version processed this task

-- Fast priority-ordered queue polling (replaces status-only index)
CREATE INDEX IF NOT EXISTS idx_agent_tasks_queue
  ON agent_tasks(status, priority ASC, created_at ASC);

-- Find stalled tasks quickly (processing tasks past their TTL)
CREATE INDEX IF NOT EXISTS idx_agent_tasks_stalled
  ON agent_tasks(status, expires_at)
  WHERE status = 'processing';

-- ── ingested_items: URL deduplication ────────────────────────────────────────
ALTER TABLE ingested_items ADD COLUMN url_hash TEXT;
  -- SHA-256 hex of the normalised URL (lowercase, no tracking params)

-- Enforces cross-source uniqueness: same story from two feeds = one row
CREATE UNIQUE INDEX IF NOT EXISTS idx_ingested_items_url_hash
  ON ingested_items(url_hash)
  WHERE url_hash IS NOT NULL;

-- ── agent_metrics: ZeroClaw execution telemetry ───────────────────────────────
CREATE TABLE IF NOT EXISTS agent_metrics (
    id          TEXT PRIMARY KEY,
    agent_name  TEXT NOT NULL,       -- 'article-generator', 'proactive-editorial', …
    run_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,             -- wall-clock time for the run
    tasks_seen  INTEGER DEFAULT 0,
    tasks_done  INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    model_used  TEXT,
    tokens_used INTEGER,
    error       TEXT                 -- last error message if any
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_name_time
  ON agent_metrics(agent_name, run_at DESC);

-- Keep only 7 days of metric rows (older rows pruned by cleanup cron)
CREATE INDEX IF NOT EXISTS idx_agent_metrics_run_at
  ON agent_metrics(run_at);
