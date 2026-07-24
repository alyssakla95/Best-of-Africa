-- ═══════════════════════════════════════════════════════════════════════════════
-- BEST OF AFRICA - VISION UPDATE MIGRATION
-- New tables for narrative diplomacy, dashboards, market intelligence
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- NARRATIVE_STRATEGIES - Strategic positioning per country/sector
-- Enables "narrative diplomacy" and strategic PR engine capabilities
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS narrative_strategies (
    id TEXT PRIMARY KEY,
    country_code TEXT REFERENCES countries(code),
    sector_id TEXT REFERENCES sectors(id),
    narrative_theme TEXT NOT NULL,
    key_messages TEXT,
    -- JSON array of core messages
    target_audience TEXT NOT NULL,
    -- investor, tourist, partner, media, general
    priority INTEGER DEFAULT 0,
    -- Higher = more important
    tone TEXT DEFAULT 'authoritative',
    -- authoritative, inspiring, analytical
    status TEXT DEFAULT 'active',
    -- active, draft, archived
    effectiveness_score REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_narratives_country ON narrative_strategies(country_code);
CREATE INDEX idx_narratives_sector ON narrative_strategies(sector_id);
CREATE INDEX idx_narratives_audience ON narrative_strategies(target_audience);
-- ───────────────────────────────────────────────────────────────────────────────
-- DASHBOARDS - Real-time regional updates
-- Provides Guardian-style regional overview dashboards
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dashboards (
    id TEXT PRIMARY KEY,
    region TEXT NOT NULL,
    -- North, West, East, Central, Southern, Continental
    dashboard_type TEXT DEFAULT 'regional',
    -- regional, sector, thematic
    title TEXT NOT NULL,
    summary TEXT,
    key_metrics TEXT,
    -- JSON: {articles_24h, trending_countries, top_sectors}
    trending_topics TEXT,
    -- JSON array of trending themes
    featured_articles TEXT,
    -- JSON array of article IDs
    sentiment_overview TEXT,
    -- JSON: {positive, neutral, negative percentages}
    generated_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,
    is_current INTEGER DEFAULT 1
);
CREATE INDEX idx_dashboards_region ON dashboards(region);
CREATE INDEX idx_dashboards_current ON dashboards(is_current);
-- ───────────────────────────────────────────────────────────────────────────────
-- MARKET_INTELLIGENCE - Sector analysis and investment reports
-- Premium intelligence products for governments/investors
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_intelligence (
    id TEXT PRIMARY KEY,
    report_type TEXT NOT NULL,
    -- sector_analysis, country_outlook, investment_brief, risk_assessment
    country_code TEXT REFERENCES countries(code),
    sector_id TEXT REFERENCES sectors(id),
    region TEXT,
    -- For regional reports
    title TEXT NOT NULL,
    executive_summary TEXT,
    content TEXT NOT NULL,
    -- Full markdown report
    key_findings TEXT,
    -- JSON array
    opportunities TEXT,
    -- JSON array
    risks TEXT,
    -- JSON array
    data_sources TEXT,
    -- JSON array of source references
    confidence_score REAL DEFAULT 0.8,
    generated_at TEXT DEFAULT (datetime('now')),
    valid_until TEXT,
    view_count INTEGER DEFAULT 0,
    is_premium INTEGER DEFAULT 1 -- Requires paid tier
);
CREATE INDEX idx_intel_type ON market_intelligence(report_type);
CREATE INDEX idx_intel_country ON market_intelligence(country_code);
CREATE INDEX idx_intel_sector ON market_intelligence(sector_id);
-- ───────────────────────────────────────────────────────────────────────────────
-- USER_PREFERENCES - Personalization tracking
-- Enables behavior-based content optimization
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
    id TEXT PRIMARY KEY,
    session_id TEXT UNIQUE,
    countries_of_interest TEXT,
    -- JSON array of country codes
    sectors_of_interest TEXT,
    -- JSON array of sector IDs
    regions_of_interest TEXT,
    -- JSON array of regions
    language_preference TEXT DEFAULT 'en',
    format_preference TEXT DEFAULT 'full',
    -- full, summary, bullet, headline
    reading_level TEXT DEFAULT 'professional',
    -- professional, general, expert
    articles_read TEXT,
    -- JSON array of article IDs
    search_history TEXT,
    -- JSON array of queries
    engagement_patterns TEXT,
    -- JSON: time spent, scroll depth, shares
    last_seen_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_prefs_session ON user_preferences(session_id);
-- ───────────────────────────────────────────────────────────────────────────────
-- CONTENT_REFINEMENTS - AI self-improvement logging
-- Tracks all autonomous optimizations for learning
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_refinements (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES articles(id),
    refinement_type TEXT NOT NULL,
    -- headline, format, language, structure, tone
    before_value TEXT,
    after_value TEXT,
    trigger_reason TEXT,
    -- low_engagement, user_preference, ab_test, narrative_gap
    model_used TEXT,
    prompt_version TEXT,
    impact_score REAL DEFAULT 0,
    -- Measured improvement in engagement
    was_successful INTEGER,
    -- Did it improve metrics?
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_refinements_article ON content_refinements(article_id);
CREATE INDEX idx_refinements_type ON content_refinements(refinement_type);
-- ───────────────────────────────────────────────────────────────────────────────
-- ENHANCE COUNTRIES - Image strength and diplomacy tracking
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE countries
ADD COLUMN diplomacy_score REAL DEFAULT 50;
ALTER TABLE countries
ADD COLUMN image_strength_score REAL DEFAULT 50;
ALTER TABLE countries
ADD COLUMN narrative_priority INTEGER DEFAULT 0;
ALTER TABLE countries
ADD COLUMN key_narratives TEXT;
-- JSON array of narrative themes
ALTER TABLE countries
ADD COLUMN sustainable_dev_focus TEXT;
-- JSON array of SDG goals
-- ───────────────────────────────────────────────────────────────────────────────
-- ENHANCE ARTICLES - Personalization and refinement tracking
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE articles
ADD COLUMN narrative_strategy_id TEXT REFERENCES narrative_strategies(id);
ALTER TABLE articles
ADD COLUMN target_audience TEXT DEFAULT 'general';
ALTER TABLE articles
ADD COLUMN tone TEXT DEFAULT 'authoritative';
ALTER TABLE articles
ADD COLUMN format_type TEXT DEFAULT 'long-form';
-- long-form, brief, analysis, bulletin
ALTER TABLE articles
ADD COLUMN refinement_count INTEGER DEFAULT 0;
ALTER TABLE articles
ADD COLUMN last_refined_at TEXT;
-- ───────────────────────────────────────────────────────────────────────────────
-- ENHANCE CAMPAIGNS - ROI and impact tracking
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE campaigns
ADD COLUMN narrative_strategy_id TEXT REFERENCES narrative_strategies(id);
ALTER TABLE campaigns
ADD COLUMN roi_score REAL DEFAULT 0;
ALTER TABLE campaigns
ADD COLUMN reach_score REAL DEFAULT 0;
ALTER TABLE campaigns
ADD COLUMN credibility_impact REAL DEFAULT 0;
ALTER TABLE campaigns
ADD COLUMN target_audience TEXT;