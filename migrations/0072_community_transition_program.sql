-- Consent-led transition programme for established external communities.
-- No external membership lists or posts are copied into BOA-Story.

CREATE TABLE IF NOT EXISTS community_transition_applications (
    id TEXT PRIMARY KEY,
    contact_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    organization TEXT NOT NULL DEFAULT '',
    community_name TEXT NOT NULL,
    source_platform TEXT NOT NULL CHECK (source_platform IN (
        'reddit', 'linkedin', 'facebook', 'whatsapp', 'discord', 'telegram',
        'slack', 'forum', 'association', 'other'
    )),
    community_url TEXT NOT NULL,
    steward_role TEXT NOT NULL,
    stewardship_evidence TEXT NOT NULL,
    member_range TEXT NOT NULL CHECK (member_range IN (
        'under_100', '100_499', '500_1999', '2000_9999', '10000_plus', 'not_public'
    )),
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    languages TEXT NOT NULL DEFAULT '[]',
    transition_goals TEXT NOT NULL,
    proposed_boundary TEXT NOT NULL,
    authority_confirmed INTEGER NOT NULL CHECK (authority_confirmed = 1),
    no_member_data_confirmed INTEGER NOT NULL CHECK (no_member_data_confirmed = 1),
    consent_confirmed INTEGER NOT NULL CHECK (consent_confirmed = 1),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'withdrawn')),
    review_notes TEXT NOT NULL DEFAULT '',
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transition_applications_status
    ON community_transition_applications(status, created_at);

CREATE TABLE IF NOT EXISTS community_transition_programs (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    application_id TEXT NOT NULL UNIQUE REFERENCES community_transition_applications(id),
    knowledge_group_id TEXT NOT NULL REFERENCES knowledge_groups(id),
    community_name TEXT NOT NULL,
    source_platform TEXT NOT NULL,
    external_url TEXT NOT NULL,
    public_summary TEXT NOT NULL,
    steward_display_name TEXT NOT NULL,
    member_range TEXT NOT NULL,
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    languages TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'planning'
        CHECK (status IN ('planning', 'open', 'paused', 'completed')),
    transition_started_at TEXT,
    target_review_at TEXT,
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transition_programs_public
    ON community_transition_programs(status, published_at DESC);

CREATE TABLE IF NOT EXISTS community_transition_invitations (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL REFERENCES community_transition_programs(id),
    token TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN (
        'community_post', 'moderator_message', 'newsletter', 'event', 'direct', 'other'
    )),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    expires_at TEXT,
    click_count INTEGER NOT NULL DEFAULT 0,
    last_clicked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transition_invitations_program
    ON community_transition_invitations(program_id, is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS community_transition_activations (
    program_id TEXT NOT NULL REFERENCES community_transition_programs(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    invitation_id TEXT REFERENCES community_transition_invitations(id),
    activation_role TEXT NOT NULL DEFAULT 'member'
        CHECK (activation_role IN ('member', 'contributor', 'steward')),
    consent_confirmed INTEGER NOT NULL CHECK (consent_confirmed = 1),
    activated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (program_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_transition_activations_program
    ON community_transition_activations(program_id, activated_at DESC);
