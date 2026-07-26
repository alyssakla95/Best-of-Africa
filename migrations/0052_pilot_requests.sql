CREATE TABLE IF NOT EXISTS pilot_requests (
    id TEXT PRIMARY KEY,
    contact_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    organization TEXT NOT NULL,
    role_title TEXT NOT NULL,
    organization_type TEXT NOT NULL,
    target_sector TEXT NOT NULL,
    candidate_countries TEXT NOT NULL DEFAULT '[]',
    decision_question TEXT NOT NULL,
    decision_deadline TEXT,
    current_research_process TEXT NOT NULL,
    success_measure TEXT NOT NULL,
    no_sensitive_data_confirmed INTEGER NOT NULL DEFAULT 1
        CHECK (no_sensitive_data_confirmed IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'qualified', 'pilot_proposed', 'closed')),
    qualification_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pilot_requests_status_created
    ON pilot_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pilot_requests_email
    ON pilot_requests(work_email);
