-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0007: AI Platform Enhancements
-- Multi-language, digests, alerts, social, economic data
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- Article Translations (Multi-language support)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_translations (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL REFERENCES articles(id),
    language TEXT NOT NULL,
    -- 'en', 'fr', 'ar', 'pt'
    title TEXT NOT NULL,
    subtitle TEXT,
    summary TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, language)
);
CREATE INDEX IF NOT EXISTS idx_translations_article ON article_translations(article_id);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON article_translations(language);
-- ───────────────────────────────────────────────────────────────────────────────
-- Email Digest Subscriptions
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digest_subscriptions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    frequency TEXT NOT NULL DEFAULT 'daily',
    -- 'daily', 'weekly'
    regions TEXT,
    -- JSON array: ["West", "East"]
    sectors TEXT,
    -- JSON array: ["technology", "finance"]
    language TEXT DEFAULT 'en',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME
);
CREATE INDEX IF NOT EXISTS idx_digest_freq ON digest_subscriptions(frequency, is_active);
-- ───────────────────────────────────────────────────────────────────────────────
-- User Notifications (for alerts)
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notifications (
    id TEXT PRIMARY KEY,
    user_preference_id TEXT REFERENCES user_preferences(id),
    article_id TEXT REFERENCES articles(id),
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON user_notifications(user_preference_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notif_article ON user_notifications(article_id);
-- ───────────────────────────────────────────────────────────────────────────────
-- Social Media Posts Log
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    article_id TEXT REFERENCES articles(id),
    platform TEXT NOT NULL,
    -- 'twitter', 'linkedin', etc.
    post_id TEXT,
    -- External platform post ID
    content TEXT NOT NULL,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    engagement_clicks INTEGER DEFAULT 0,
    engagement_likes INTEGER DEFAULT 0,
    engagement_retweets INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_social_article ON social_posts(article_id);
CREATE INDEX IF NOT EXISTS idx_social_platform ON social_posts(platform, posted_at);
-- ───────────────────────────────────────────────────────────────────────────────
-- Economic Data Cache
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS economic_indicators (
    id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL REFERENCES countries(code),
    indicator_code TEXT NOT NULL,
    indicator_name TEXT NOT NULL,
    value REAL,
    year INTEGER,
    unit TEXT,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(country_code, indicator_code)
);
CREATE INDEX IF NOT EXISTS idx_econ_country ON economic_indicators(country_code);
-- ───────────────────────────────────────────────────────────────────────────────
-- Update countries table to track language preference
-- ───────────────────────────────────────────────────────────────────────────────
ALTER TABLE countries
ADD COLUMN primary_language TEXT DEFAULT 'en';
-- Set primary languages for key countries
UPDATE countries
SET primary_language = 'fr'
WHERE code IN (
        'SN',
        'CI',
        'CM',
        'CD',
        'CG',
        'GA',
        'BF',
        'ML',
        'NE',
        'TG',
        'BJ',
        'GN',
        'MR',
        'DZ',
        'TN',
        'MA'
    );
UPDATE countries
SET primary_language = 'ar'
WHERE code IN ('EG', 'SD', 'LY');
UPDATE countries
SET primary_language = 'pt'
WHERE code IN ('AO', 'MZ', 'CV', 'GW', 'ST');