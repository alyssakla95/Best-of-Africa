-- Migration: 0002_i18n_schema.sql
-- 1. Editorial Audits (Migrated from SQLite)
CREATE TABLE IF NOT EXISTS article_audits (
    article_id TEXT PRIMARY KEY,
    country TEXT,
    topic TEXT,
    audit_report TEXT,
    variants TEXT,
    -- Stores localized variants: { "variant_tourist_en": "...", "variant_tourist_fr": "..." }
    translation_status TEXT DEFAULT '{}',
    -- Stores status: { "fr": "ready", "de": "pending" }
    metadata TEXT,
    confidence_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 2. Translation Queue
CREATE TABLE IF NOT EXISTS translation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    -- pending, processing, completed, failed
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, target_lang)
);
-- 3. Usage Counters (Rate Limiting)
CREATE TABLE IF NOT EXISTS usage_counters (
    date DATE NOT NULL,
    service TEXT NOT NULL,
    -- 'translation', 'video_metadata'
    lang TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date, service, lang)
);
-- 4. Update Videos Table (if not already compatible)
-- SQLite does not support DO $$ blocks or IF NOT EXISTS for ADD COLUMN natively in a safe way without pragmas.
-- Assuming videos table exists and needs this column (standard linear migration).
-- Commenting out the ALTER statement since this DB might already have it, 
-- or it shouldn't be safely re-run without causing an error if it exists.
-- ALTER TABLE videos ADD COLUMN metadata TEXT DEFAULT '{}';