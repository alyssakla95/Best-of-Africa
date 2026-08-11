-- Structured, moderated decision rooms connecting Enterprise questions,
-- screened specialists and public BOA intelligence without exposing private work.

CREATE TABLE IF NOT EXISTS decision_rooms (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    owner_client_id TEXT NOT NULL REFERENCES clients(id),
    originating_request_id TEXT REFERENCES specialist_requests(id),
    knowledge_group_id TEXT REFERENCES knowledge_groups(id),
    title TEXT NOT NULL,
    decision_question TEXT NOT NULL,
    decision_context TEXT NOT NULL,
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    intended_users TEXT NOT NULL DEFAULT '[]',
    visibility TEXT NOT NULL DEFAULT 'private'
        CHECK (visibility IN ('private', 'consented_public')),
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'evidence_review', 'resolved', 'archived')),
    moderation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    editorial_summary TEXT NOT NULL DEFAULT '',
    verification_priorities TEXT NOT NULL DEFAULT '[]',
    next_review_at TEXT,
    decision_deadline TEXT,
    no_sensitive_data_confirmed INTEGER NOT NULL DEFAULT 1
        CHECK (no_sensitive_data_confirmed IN (0, 1)),
    public_consent_confirmed INTEGER NOT NULL DEFAULT 0
        CHECK (public_consent_confirmed IN (0, 1)),
    moderation_notes TEXT,
    moderated_by TEXT,
    moderated_at TEXT,
    published_at TEXT,
    resolved_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_decision_rooms_public
    ON decision_rooms(visibility, moderation_status, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_rooms_owner
    ON decision_rooms(owner_client_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS decision_room_items (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES decision_rooms(id),
    parent_id TEXT REFERENCES decision_room_items(id),
    submitted_by_client_id TEXT REFERENCES clients(id),
    author_display_name TEXT NOT NULL,
    author_role TEXT NOT NULL CHECK (author_role IN ('reader', 'specialist', 'enterprise', 'editorial')),
    item_type TEXT NOT NULL CHECK (item_type IN (
        'official_evidence', 'boa_intelligence', 'specialist_response', 'field_perspective',
        'evidence_challenge', 'contradiction', 'unresolved_question', 'verification_priority',
        'decision_update', 'documented_outcome'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    source_urls TEXT NOT NULL DEFAULT '[]',
    countries TEXT NOT NULL DEFAULT '[]',
    sectors TEXT NOT NULL DEFAULT '[]',
    confidence TEXT NOT NULL DEFAULT 'unresolved'
        CHECK (confidence IN ('documented', 'supported_interpretation', 'professional_experience', 'unresolved')),
    conflict_disclosure TEXT NOT NULL DEFAULT '',
    moderation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    moderation_notes TEXT,
    moderated_by TEXT,
    moderated_at TEXT,
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_decision_room_items_public
    ON decision_room_items(room_id, moderation_status, item_type, published_at);

CREATE TABLE IF NOT EXISTS decision_room_participants (
    room_id TEXT NOT NULL REFERENCES decision_rooms(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    specialist_profile_id TEXT REFERENCES specialist_profiles(id),
    participant_role TEXT NOT NULL DEFAULT 'specialist'
        CHECK (participant_role IN ('owner', 'specialist', 'editorial_observer')),
    status TEXT NOT NULL DEFAULT 'invited'
        CHECK (status IN ('invited', 'accepted', 'declined', 'removed')),
    invited_by TEXT NOT NULL DEFAULT 'admin',
    invited_at TEXT NOT NULL DEFAULT (datetime('now')),
    responded_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (room_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_decision_room_participants_client
    ON decision_room_participants(client_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS decision_room_follows (
    room_id TEXT NOT NULL REFERENCES decision_rooms(id),
    client_id TEXT NOT NULL REFERENCES clients(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (room_id, client_id)
);
