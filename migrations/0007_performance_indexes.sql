-- ═══════════════════════════════════════════════════════════════════════════════
-- Performance Indexes Migration
-- Adds composite indexes for common query patterns
-- ═══════════════════════════════════════════════════════════════════════════════
-- Optimize article listing with status filter and date ordering
-- Used by: GET /articles, GET /articles/latest, GET /articles/featured
CREATE INDEX IF NOT EXISTS idx_articles_status_published_at ON articles(status, published_at DESC);
-- Optimize country-specific article queries
-- Used by: GET /countries/:code, GET /articles/country/:code
CREATE INDEX IF NOT EXISTS idx_articles_country_status ON articles(country_code, status);
-- Optimize sector-specific article queries
-- Used by: GET /articles/sector/:id, GET /intel/sector/:id/trends
CREATE INDEX IF NOT EXISTS idx_articles_sector_status ON articles(sector_id, status);
-- Optimize engagement-based sorting for published articles
-- Used by: GET /articles (sort by engagement), related articles
CREATE INDEX IF NOT EXISTS idx_articles_engagement ON articles(status, engagement_score DESC);
-- Optimize full-text prefix search on titles
-- Used by: GET /search/suggest (autocomplete)
CREATE INDEX IF NOT EXISTS idx_articles_title_prefix ON articles(title COLLATE NOCASE);
-- Optimize country name lookups for autocomplete
-- Used by: GET /search/suggest
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name COLLATE NOCASE);
-- Optimize sector name lookups for autocomplete
-- Used by: GET /search/suggest
CREATE INDEX IF NOT EXISTS idx_sectors_name ON sectors(name COLLATE NOCASE);