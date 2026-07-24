-- Reversible, auditable production-corpus remediation runs.
CREATE TABLE IF NOT EXISTS editorial_remediation_runs (
    id TEXT PRIMARY KEY,
    rule TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    matched_count INTEGER NOT NULL DEFAULT 0,
    processed_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE IF NOT EXISTS editorial_remediation_items (
    run_id TEXT NOT NULL REFERENCES editorial_remediation_runs(id),
    article_id TEXT NOT NULL REFERENCES articles(id),
    previous_status TEXT NOT NULL,
    previous_moderation_status TEXT,
    previous_moderation_score REAL,
    reason TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    restored_at DATETIME,
    PRIMARY KEY (run_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_editorial_remediation_article
    ON editorial_remediation_items(article_id);
