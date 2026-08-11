-- Legacy country portal columns contain historical seed data that was not
-- independently verified. New public resources must enter through this
-- evidence-bearing registry and are exposed only after editorial verification.
CREATE TABLE IF NOT EXISTS country_official_resources (
    id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL REFERENCES countries(code) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('business', 'investment', 'tourism', 'visa', 'statistics', 'trade', 'regulator')),
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    verification_source_url TEXT NOT NULL,
    verified_at TEXT NOT NULL,
    last_checked_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'withdrawn', 'review_due')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(country_code, resource_type, url)
);

CREATE INDEX IF NOT EXISTS idx_country_official_resources_public
ON country_official_resources(country_code, status, verified_at);
