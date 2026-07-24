-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0011: Events Table for Summits
-- ═══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS events;
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date_start TEXT NOT NULL,
    date_end TEXT,
    location TEXT NOT NULL,
    country_code TEXT REFERENCES countries(code),
    category TEXT NOT NULL,
    status TEXT DEFAULT 'upcoming',
    is_featured INTEGER DEFAULT 0,
    is_vip INTEGER DEFAULT 0,
    description TEXT,
    registration_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_start);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
-- Seed real African summit events
INSERT
    OR IGNORE INTO events (
        id,
        title,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description
    )
VALUES (
        'evt-aif-2026',
        'Africa Investment Forum 2026',
        '2026-11-12',
        '2026-11-14',
        'Johannesburg, South Africa',
        'ZA',
        'Investment',
        'registration_open',
        1,
        1,
        'The premier deal-making platform for African investments.'
    ),
    (
        'evt-mi-2027',
        'Mining Indaba 2027',
        '2027-02-05',
        '2027-02-08',
        'Cape Town, South Africa',
        'ZA',
        'Resources',
        'upcoming',
        1,
        0,
        'The world''s largest mining investment event.'
    ),
    (
        'evt-aew-2026',
        'Africa Energy Week 2026',
        '2026-10-22',
        '2026-10-26',
        'Lagos, Nigeria',
        'NG',
        'Energy',
        'registration_open',
        0,
        0,
        'Shaping the future of Africa''s energy sector.'
    ),
    (
        'evt-gitex-2026',
        'GITEX Africa 2026',
        '2026-05-14',
        '2026-05-16',
        'Marrakech, Morocco',
        'MA',
        'Tech',
        'upcoming',
        0,
        0,
        'The largest tech and startup event in Africa.'
    ),
    (
        'evt-agrf-2026',
        'Africa Green Revolution Forum 2026',
        '2026-09-07',
        '2026-09-09',
        'Nairobi, Kenya',
        'KE',
        'Agriculture',
        'upcoming',
        0,
        0,
        'Driving African agricultural transformation.'
    ),
    (
        'evt-afcfta-2026',
        'AfCFTA Business Forum 2026',
        '2026-07-15',
        '2026-07-17',
        'Accra, Ghana',
        'GH',
        'Trade',
        'upcoming',
        0,
        1,
        'Unlocking opportunities under the African Continental Free Trade Area.'
    );