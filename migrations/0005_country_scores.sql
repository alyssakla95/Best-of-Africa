-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0005: Country Scores & Type Alignment
-- Add diplomacy_score and image_strength_score to countries table
-- ═══════════════════════════════════════════════════════════════════════════════
-- Add score columns to countries
-- ALTER TABLE countries
-- ADD COLUMN diplomacy_score REAL DEFAULT 0.5;
-- ALTER TABLE countries
-- ADD COLUMN image_strength_score REAL DEFAULT 0.5;
-- Update some sample scores for key countries
UPDATE countries
SET diplomacy_score = 0.85,
    image_strength_score = 0.78
WHERE code = 'ZA';
UPDATE countries
SET diplomacy_score = 0.72,
    image_strength_score = 0.81
WHERE code = 'NG';
UPDATE countries
SET diplomacy_score = 0.78,
    image_strength_score = 0.75
WHERE code = 'KE';
UPDATE countries
SET diplomacy_score = 0.80,
    image_strength_score = 0.82
WHERE code = 'EG';
UPDATE countries
SET diplomacy_score = 0.70,
    image_strength_score = 0.88
WHERE code = 'MA';
UPDATE countries
SET diplomacy_score = 0.65,
    image_strength_score = 0.72
WHERE code = 'GH';
UPDATE countries
SET diplomacy_score = 0.75,
    image_strength_score = 0.70
WHERE code = 'RW';
UPDATE countries
SET diplomacy_score = 0.68,
    image_strength_score = 0.65
WHERE code = 'ET';
UPDATE countries
SET diplomacy_score = 0.62,
    image_strength_score = 0.60
WHERE code = 'TZ';
UPDATE countries
SET diplomacy_score = 0.58,
    image_strength_score = 0.55
WHERE code = 'SN';