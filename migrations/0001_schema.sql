-- ═══════════════════════════════════════════════════════════════════════════════
-- BEST OF AFRICA - DATABASE SCHEMA
-- D1 (SQLite) - Core data storage
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- COUNTRIES - All 54 African nations
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY,
    -- ISO 3166-1 alpha-2 (e.g., 'NG', 'KE', 'ZA')
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    -- North, West, East, Central, Southern
    capital TEXT,
    population INTEGER,
    gdp_usd REAL,
    currency TEXT,
    languages TEXT,
    -- JSON array
    description TEXT,
    investment_highlights TEXT,
    -- JSON array of key opportunities
    tourism_highlights TEXT,
    -- JSON array of attractions
    flag_emoji TEXT,
    hero_image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
-- ───────────────────────────────────────────────────────────────────────────────
-- SECTORS - Industry verticals
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sectors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
-- ───────────────────────────────────────────────────────────────────────────────
-- ARTICLES - AI-generated content
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    content TEXT NOT NULL,
    -- Markdown content
    summary TEXT,
    -- AI-generated 2-3 sentence summary
    -- Categorization
    country_code TEXT REFERENCES countries(code),
    sector_id TEXT REFERENCES sectors(id),
    tags TEXT,
    -- JSON array
    -- SEO & Display
    meta_title TEXT,
    meta_description TEXT,
    hero_image_url TEXT,
    reading_time_minutes INTEGER,
    -- Source tracking
    source_url TEXT,
    source_title TEXT,
    source_published_at TEXT,
    -- AI generation metadata
    generation_model TEXT,
    generation_prompt_version TEXT,
    embedding_id TEXT,
    -- Reference to Vectorize
    -- Status
    status TEXT DEFAULT 'draft',
    -- draft, published, archived
    is_sponsored INTEGER DEFAULT 0,
    sponsor_id TEXT,
    -- Engagement metrics (denormalized for speed)
    view_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    avg_read_time_seconds REAL DEFAULT 0,
    engagement_score REAL DEFAULT 0,
    -- Timestamps
    published_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_articles_country ON articles(country_code);
CREATE INDEX idx_articles_sector ON articles(sector_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_engagement ON articles(engagement_score DESC);
-- ───────────────────────────────────────────────────────────────────────────────
-- SOURCES - News feeds for ingestion
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    -- rss, newsapi, custom
    url TEXT NOT NULL,
    country_code TEXT REFERENCES countries(code),
    sector_id TEXT REFERENCES sectors(id),
    is_active INTEGER DEFAULT 1,
    last_fetched_at TEXT,
    fetch_interval_minutes INTEGER DEFAULT 30,
    created_at TEXT DEFAULT (datetime('now'))
);
-- ───────────────────────────────────────────────────────────────────────────────
-- INGESTED_ITEMS - Raw items before AI processing
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingested_items (
    id TEXT PRIMARY KEY,
    source_id TEXT REFERENCES sources(id),
    external_id TEXT,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    published_at TEXT,
    status TEXT DEFAULT 'pending',
    -- pending, processing, completed, rejected
    article_id TEXT REFERENCES articles(id),
    rejection_reason TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_ingested_external ON ingested_items(source_id, external_id);
-- ───────────────────────────────────────────────────────────────────────────────
-- CLIENTS - Paid API customers (governments, investors)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    organization TEXT,
    type TEXT,
    -- government, investor, partner, media
    api_key_hash TEXT NOT NULL,
    tier TEXT DEFAULT 'basic',
    -- basic, premium, enterprise
    rate_limit_per_hour INTEGER DEFAULT 100,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT
);
-- ───────────────────────────────────────────────────────────────────────────────
-- CAMPAIGNS - Sponsored content
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id),
    name TEXT NOT NULL,
    description TEXT,
    target_countries TEXT,
    -- JSON array of country codes
    target_sectors TEXT,
    -- JSON array of sector IDs
    budget_usd REAL,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'draft',
    -- draft, active, paused, completed
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
-- ───────────────────────────────────────────────────────────────────────────────
-- OPTIMIZATION_CONFIG - Self-tuning parameters
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS optimization_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    -- JSON value
    description TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);
-- ───────────────────────────────────────────────────────────────────────────────
-- HEADLINE_TESTS - A/B testing for headlines
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS headline_tests (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES articles(id),
    variant TEXT NOT NULL,
    -- 'A' or 'B'
    headline TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr REAL DEFAULT 0,
    is_winner INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA - Sectors
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT
    OR IGNORE INTO sectors (id, name, description, icon, color)
VALUES (
        'tourism',
        'Tourism & Hospitality',
        'Travel destinations, hotels, cultural experiences',
        '🏨',
        '#10B981'
    ),
    (
        'energy',
        'Energy & Mining',
        'Oil, gas, renewables, minerals extraction',
        '⚡',
        '#F59E0B'
    ),
    (
        'agriculture',
        'Agriculture & Agribusiness',
        'Farming, food processing, export crops',
        '🌾',
        '#84CC16'
    ),
    (
        'technology',
        'Technology & Innovation',
        'Tech startups, fintech, digital infrastructure',
        '💻',
        '#6366F1'
    ),
    (
        'infrastructure',
        'Infrastructure & Construction',
        'Roads, ports, housing, urban development',
        '🏗️',
        '#8B5CF6'
    ),
    (
        'finance',
        'Finance & Investment',
        'Banking, capital markets, private equity',
        '💰',
        '#EC4899'
    ),
    (
        'manufacturing',
        'Manufacturing & Industry',
        'Factories, processing, industrial zones',
        '🏭',
        '#64748B'
    ),
    (
        'healthcare',
        'Healthcare & Pharma',
        'Hospitals, pharmaceuticals, medical tourism',
        '🏥',
        '#EF4444'
    );
-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA - African Countries
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT
    OR IGNORE INTO countries (code, name, region, capital, flag_emoji)
VALUES -- North Africa
    ('DZ', 'Algeria', 'North', 'Algiers', '🇩🇿'),
    ('EG', 'Egypt', 'North', 'Cairo', '🇪🇬'),
    ('LY', 'Libya', 'North', 'Tripoli', '🇱🇾'),
    ('MA', 'Morocco', 'North', 'Rabat', '🇲🇦'),
    ('SD', 'Sudan', 'North', 'Khartoum', '🇸🇩'),
    ('TN', 'Tunisia', 'North', 'Tunis', '🇹🇳'),
    -- West Africa
    ('BJ', 'Benin', 'West', 'Porto-Novo', '🇧🇯'),
    (
        'BF',
        'Burkina Faso',
        'West',
        'Ouagadougou',
        '🇧🇫'
    ),
    ('CV', 'Cabo Verde', 'West', 'Praia', '🇨🇻'),
    (
        'CI',
        'Côte d''Ivoire',
        'West',
        'Yamoussoukro',
        '🇨🇮'
    ),
    ('GM', 'Gambia', 'West', 'Banjul', '🇬🇲'),
    ('GH', 'Ghana', 'West', 'Accra', '🇬🇭'),
    ('GN', 'Guinea', 'West', 'Conakry', '🇬🇳'),
    ('GW', 'Guinea-Bissau', 'West', 'Bissau', '🇬🇼'),
    ('LR', 'Liberia', 'West', 'Monrovia', '🇱🇷'),
    ('ML', 'Mali', 'West', 'Bamako', '🇲🇱'),
    ('MR', 'Mauritania', 'West', 'Nouakchott', '🇲🇷'),
    ('NE', 'Niger', 'West', 'Niamey', '🇳🇪'),
    ('NG', 'Nigeria', 'West', 'Abuja', '🇳🇬'),
    ('SN', 'Senegal', 'West', 'Dakar', '🇸🇳'),
    ('SL', 'Sierra Leone', 'West', 'Freetown', '🇸🇱'),
    ('TG', 'Togo', 'West', 'Lomé', '🇹🇬'),
    -- East Africa
    ('BI', 'Burundi', 'East', 'Gitega', '🇧🇮'),
    ('KM', 'Comoros', 'East', 'Moroni', '🇰🇲'),
    ('DJ', 'Djibouti', 'East', 'Djibouti', '🇩🇯'),
    ('ER', 'Eritrea', 'East', 'Asmara', '🇪🇷'),
    ('ET', 'Ethiopia', 'East', 'Addis Ababa', '🇪🇹'),
    ('KE', 'Kenya', 'East', 'Nairobi', '🇰🇪'),
    (
        'MG',
        'Madagascar',
        'East',
        'Antananarivo',
        '🇲🇬'
    ),
    ('MU', 'Mauritius', 'East', 'Port Louis', '🇲🇺'),
    ('RW', 'Rwanda', 'East', 'Kigali', '🇷🇼'),
    ('SC', 'Seychelles', 'East', 'Victoria', '🇸🇨'),
    ('SO', 'Somalia', 'East', 'Mogadishu', '🇸🇴'),
    ('SS', 'South Sudan', 'East', 'Juba', '🇸🇸'),
    ('TZ', 'Tanzania', 'East', 'Dodoma', '🇹🇿'),
    ('UG', 'Uganda', 'East', 'Kampala', '🇺🇬'),
    -- Central Africa
    ('AO', 'Angola', 'Central', 'Luanda', '🇦🇴'),
    ('CM', 'Cameroon', 'Central', 'Yaoundé', '🇨🇲'),
    (
        'CF',
        'Central African Republic',
        'Central',
        'Bangui',
        '🇨🇫'
    ),
    ('TD', 'Chad', 'Central', 'N''Djamena', '🇹🇩'),
    ('CG', 'Congo', 'Central', 'Brazzaville', '🇨🇬'),
    ('CD', 'DR Congo', 'Central', 'Kinshasa', '🇨🇩'),
    (
        'GQ',
        'Equatorial Guinea',
        'Central',
        'Malabo',
        '🇬🇶'
    ),
    ('GA', 'Gabon', 'Central', 'Libreville', '🇬🇦'),
    (
        'ST',
        'São Tomé and Príncipe',
        'Central',
        'São Tomé',
        '🇸🇹'
    ),
    -- Southern Africa
    ('BW', 'Botswana', 'Southern', 'Gaborone', '🇧🇼'),
    ('SZ', 'Eswatini', 'Southern', 'Mbabane', '🇸🇿'),
    ('LS', 'Lesotho', 'Southern', 'Maseru', '🇱🇸'),
    ('MW', 'Malawi', 'Southern', 'Lilongwe', '🇲🇼'),
    ('MZ', 'Mozambique', 'Southern', 'Maputo', '🇲🇿'),
    ('NA', 'Namibia', 'Southern', 'Windhoek', '🇳🇦'),
    (
        'ZA',
        'South Africa',
        'Southern',
        'Pretoria',
        '🇿🇦'
    ),
    ('ZM', 'Zambia', 'Southern', 'Lusaka', '🇿🇲'),
    ('ZW', 'Zimbabwe', 'Southern', 'Harare', '🇿🇼');