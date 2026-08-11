-- Invite-only specialist marketplace MVP.
-- Specialists pay BOA-Story for directory access; client engagement payments
-- and payouts are deliberately outside this schema.

CREATE TABLE IF NOT EXISTS specialist_invites (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'issued'
        CHECK (status IN ('issued', 'redeemed', 'revoked', 'expired')),
    expires_at TEXT NOT NULL,
    redeemed_at TEXT,
    application_id TEXT,
    created_by TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_specialist_invites_email_status
    ON specialist_invites(email, status, created_at DESC);

CREATE TABLE IF NOT EXISTS specialist_applications (
    id TEXT PRIMARY KEY,
    invite_id TEXT NOT NULL UNIQUE REFERENCES specialist_invites(id),
    client_id TEXT NOT NULL UNIQUE REFERENCES clients(id),
    contact_name TEXT NOT NULL,
    work_email TEXT NOT NULL UNIQUE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('individual', 'organization')),
    organization TEXT,
    role_title TEXT,
    headline TEXT NOT NULL,
    biography TEXT NOT NULL,
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    service_categories TEXT NOT NULL DEFAULT '[]',
    languages TEXT NOT NULL DEFAULT '[]',
    credential_summary TEXT NOT NULL,
    credential_links TEXT NOT NULL DEFAULT '[]',
    indicative_pricing TEXT,
    availability TEXT,
    conflicts_declaration TEXT NOT NULL,
    no_sensitive_data_confirmed INTEGER NOT NULL DEFAULT 1
        CHECK (no_sensitive_data_confirmed IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN (
            'draft', 'submitted', 'screening', 'needs_information',
            'approved', 'rejected', 'withdrawn'
        )),
    screening_notes TEXT,
    screened_by TEXT,
    screened_at TEXT,
    retention_until TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_specialist_applications_status_created
    ON specialist_applications(status, created_at DESC);

CREATE TABLE IF NOT EXISTS specialist_profiles (
    id TEXT PRIMARY KEY,
    application_id TEXT NOT NULL UNIQUE REFERENCES specialist_applications(id),
    client_id TEXT NOT NULL UNIQUE REFERENCES clients(id),
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    organization TEXT,
    headline TEXT NOT NULL,
    biography TEXT NOT NULL,
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    service_categories TEXT NOT NULL DEFAULT '[]',
    languages TEXT NOT NULL DEFAULT '[]',
    credential_summary TEXT NOT NULL,
    credential_links TEXT NOT NULL DEFAULT '[]',
    indicative_pricing TEXT,
    availability TEXT,
    screening_status TEXT NOT NULL DEFAULT 'approved'
        CHECK (screening_status IN ('approved', 'suspended', 'revoked')),
    is_listed INTEGER NOT NULL DEFAULT 0 CHECK (is_listed IN (0, 1)),
    listed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_specialist_profiles_public
    ON specialist_profiles(is_listed, screening_status, listed_at DESC);

CREATE TABLE IF NOT EXISTS specialist_subscriptions (
    client_id TEXT PRIMARY KEY REFERENCES clients(id),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (status IN (
            'not_started', 'checkout_open', 'active', 'past_due',
            'unpaid', 'canceled', 'incomplete', 'incomplete_expired'
        )),
    current_period_end TEXT,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0
        CHECK (cancel_at_period_end IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'processed', 'failed')),
    error TEXT,
    attempts INTEGER NOT NULL DEFAULT 1,
    received_at TEXT NOT NULL DEFAULT (datetime('now')),
    processed_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS marketplace_client_access (
    client_id TEXT PRIMARY KEY REFERENCES clients(id),
    status TEXT NOT NULL DEFAULT 'enabled'
        CHECK (status IN ('enabled', 'suspended', 'revoked')),
    granted_by TEXT NOT NULL DEFAULT 'admin',
    granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS specialist_requests (
    id TEXT PRIMARY KEY,
    requester_client_id TEXT NOT NULL REFERENCES clients(id),
    title TEXT NOT NULL,
    decision_question TEXT NOT NULL,
    countries TEXT NOT NULL DEFAULT '[]',
    sector TEXT NOT NULL,
    required_expertise TEXT NOT NULL DEFAULT '[]',
    preferred_languages TEXT NOT NULL DEFAULT '[]',
    decision_deadline TEXT,
    context_summary TEXT,
    no_sensitive_data_confirmed INTEGER NOT NULL DEFAULT 1
        CHECK (no_sensitive_data_confirmed IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'matching', 'proposals_ready', 'closed', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_specialist_requests_client_created
    ON specialist_requests(requester_client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS specialist_matches (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES specialist_requests(id),
    specialist_client_id TEXT NOT NULL REFERENCES clients(id),
    match_score INTEGER NOT NULL DEFAULT 0,
    match_reasons TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'suggested'
        CHECK (status IN ('suggested', 'invited', 'declined', 'proposal_submitted', 'closed')),
    confirmed_by TEXT,
    confirmed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(request_id, specialist_client_id)
);

CREATE INDEX IF NOT EXISTS idx_specialist_matches_specialist
    ON specialist_matches(specialist_client_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS specialist_proposals (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL UNIQUE REFERENCES specialist_matches(id),
    request_id TEXT NOT NULL REFERENCES specialist_requests(id),
    specialist_client_id TEXT NOT NULL REFERENCES clients(id),
    scope_summary TEXT NOT NULL,
    assumptions TEXT,
    timeline TEXT NOT NULL,
    indicative_fee TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'accepted', 'declined', 'withdrawn')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_specialist_proposals_request
    ON specialist_proposals(request_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS marketplace_audit_events (
    id TEXT PRIMARY KEY,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'specialist', 'enterprise', 'stripe', 'system')),
    actor_id TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_marketplace_audit_entity
    ON marketplace_audit_events(entity_type, entity_id, created_at DESC);
