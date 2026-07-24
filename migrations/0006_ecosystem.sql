-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0006: Ecosystem Expansion
-- Corporate services, events, and narrative-article linking
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- NARRATIVE-ARTICLE JUNCTION TABLE
-- Links narratives to articles with relevance scores (for RAG/Vector search)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS narrative_articles (
    narrative_id TEXT NOT NULL REFERENCES narrative_strategies(id) ON DELETE CASCADE,
    article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    relevance_score REAL DEFAULT 0.5,
    -- 0.0 to 1.0 (Vector Distance)
    linked_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (narrative_id, article_id)
);
CREATE INDEX IF NOT EXISTS idx_narrative_articles_narrative ON narrative_articles(narrative_id);
CREATE INDEX IF NOT EXISTS idx_narrative_articles_article ON narrative_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_narrative_articles_relevance ON narrative_articles(relevance_score DESC);
-- ───────────────────────────────────────────────────────────────────────────────
-- BOOKING REQUESTS
-- Corporate concierge services (hotels, flights, visa, security)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES clients(id),
    -- Optional (can be guest)
    guest_email TEXT,
    -- For non-authenticated users
    guest_name TEXT,
    guest_organization TEXT,
    service_type TEXT NOT NULL,
    -- 'Hotel', 'Flight', 'Concierge', 'Visa', 'Security'
    destination_country TEXT REFERENCES countries(code),
    dates_json TEXT,
    -- JSON: { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }
    requirements TEXT,
    -- Free-text requirements
    budget_range TEXT,
    -- 'Standard', 'Premium', 'Luxury'
    urgency TEXT DEFAULT 'Normal',
    -- 'Normal', 'Urgent', 'Critical'
    status TEXT DEFAULT 'New',
    -- 'New', 'Processing', 'Confirmed', 'Closed', 'Cancelled'
    assigned_to TEXT,
    -- Internal concierge agent
    notes TEXT,
    -- Internal notes
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_booking_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_user ON booking_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_destination ON booking_requests(destination_country);
CREATE INDEX IF NOT EXISTS idx_booking_created ON booking_requests(created_at DESC);
-- ───────────────────────────────────────────────────────────────────────────────
-- EVENTS & SUMMITS (Now handled by 0011_events_table.sql)
-- ───────────────────────────────────────────────────────────────────────────────
-- ───────────────────────────────────────────────────────────────────────────────
-- EVENT REGISTRATIONS
-- Attendee registrations for events
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES clients(id),
    -- Optional for authenticated users
    user_email TEXT NOT NULL,
    user_name TEXT,
    user_organization TEXT,
    user_title TEXT,
    -- Job title
    ticket_type TEXT DEFAULT 'Standard',
    -- 'Standard', 'VIP', 'Executive', 'Media', 'Speaker'
    dietary_requirements TEXT,
    special_requests TEXT,
    status TEXT DEFAULT 'Pending',
    -- 'Pending', 'Confirmed', 'Waitlist', 'Cancelled', 'Attended'
    payment_status TEXT DEFAULT 'Unpaid',
    -- 'Unpaid', 'Paid', 'Refunded', 'Complimentary'
    confirmation_code TEXT UNIQUE,
    registered_at TEXT DEFAULT (datetime('now')),
    confirmed_at TEXT,
    checked_in_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(user_email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON event_registrations(status);
-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA (Now handled by 0011, 0018, 0019, 0020)
-- ═══════════════════════════════════════════════════════════════════════════════