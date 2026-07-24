-- Migration number: 0022_agent_task_queue

CREATE TABLE IF NOT EXISTS agent_tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- e.g., 'generate_article', 'summarize'
    payload TEXT NOT NULL, -- JSON payload of the task details
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    assigned_to TEXT, -- Agent ID or wallet address that picked it up
    result TEXT, -- JSON result when completed
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Index for fast queue polling
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);

-- Add assigned_to_agent status to ingested_items
-- No schema change needed for ingested_items as status is just text, but we'll note it here:
-- ingested_items.status will transition: 'pending' -> 'assigned_to_agent' -> 'processed'
