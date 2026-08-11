-- Public specialist interest registry.
-- This is deliberately separate from specialist_applications: completing a
-- registry entry never creates an account or bypasses the invitation gate.

CREATE TABLE IF NOT EXISTS specialist_interest_registrations (
    id TEXT PRIMARY KEY,
    contact_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    entity_type TEXT NOT NULL DEFAULT 'individual'
        CHECK (entity_type IN ('individual', 'organization')),
    organization TEXT,
    role_title TEXT,
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    service_categories TEXT NOT NULL DEFAULT '[]',
    languages TEXT NOT NULL DEFAULT '[]',
    interest_summary TEXT,
    no_sensitive_data_confirmed INTEGER NOT NULL DEFAULT 1
        CHECK (no_sensitive_data_confirmed IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'invited', 'closed')),
    invite_id TEXT REFERENCES specialist_invites(id) ON DELETE SET NULL,
    qualification_notes TEXT,
    retention_until TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_specialist_interest_status_created
    ON specialist_interest_registrations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_specialist_interest_email
    ON specialist_interest_registrations(work_email, created_at DESC);
