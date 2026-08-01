-- Persist evidence quality and country-discovery rotation so the production
-- pipeline can enforce a global source mix and an all-country coverage target.
ALTER TABLE articles ADD COLUMN source_quality_tier INTEGER NOT NULL DEFAULT 2;

UPDATE articles
SET source_quality_tier = CASE
    WHEN LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%reuters%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%apnews.com%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%associated press%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%ft.com%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%financial times%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%bloomberg%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%bbc.%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%worldbank.org%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%imf.org%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%afdb.org%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%uneca.org%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%au.int%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%wto.org%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%unctad.org%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%ifc.org%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%afreximbank.com%'
    THEN 4
    WHEN LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%theafricareport%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%african.business%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%theconversation%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%semafor%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%dailymaverick%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%techcabal%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%cnbcafrica%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%france24%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%dw.com%'
      OR LOWER(COALESCE(source_title, '') || ' ' || COALESCE(source_url, '')) LIKE '%aljazeera%'
    THEN 3
    ELSE 2
END;

CREATE INDEX IF NOT EXISTS idx_articles_source_quality_window
ON articles(source_quality_tier, published_at DESC);

CREATE TABLE IF NOT EXISTS coverage_discovery_state (
    country_code TEXT PRIMARY KEY REFERENCES countries(code),
    last_attempted_at TEXT,
    last_queued_at TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    queued_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS discovery_source_catalog (
    domain TEXT PRIMARY KEY,
    publisher_name TEXT NOT NULL,
    quality_tier INTEGER NOT NULL CHECK (quality_tier BETWEEN 3 AND 4),
    lane TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR REPLACE INTO discovery_source_catalog
    (domain, publisher_name, quality_tier, lane, is_active)
VALUES
    ('reuters.com', 'Reuters', 4, 'global-news', 1),
    ('apnews.com', 'Associated Press', 4, 'global-news', 1),
    ('ft.com', 'Financial Times', 4, 'global-news', 1),
    ('bloomberg.com', 'Bloomberg', 4, 'global-news', 1),
    ('bbc.com', 'BBC', 4, 'global-news', 1),
    ('economist.com', 'The Economist', 4, 'global-news', 1),
    ('spglobal.com', 'S&P Global', 4, 'markets', 1),
    ('fitchratings.com', 'Fitch Ratings', 4, 'markets', 1),
    ('moodys.com', 'Moodys', 4, 'markets', 1),
    ('afdb.org', 'African Development Bank', 4, 'primary-evidence', 1),
    ('worldbank.org', 'World Bank', 4, 'primary-evidence', 1),
    ('imf.org', 'International Monetary Fund', 4, 'primary-evidence', 1),
    ('uneca.org', 'UN Economic Commission for Africa', 4, 'primary-evidence', 1),
    ('au.int', 'African Union', 4, 'primary-evidence', 1),
    ('unctad.org', 'UN Trade and Development', 4, 'primary-evidence', 1),
    ('wto.org', 'World Trade Organization', 4, 'primary-evidence', 1),
    ('ifc.org', 'International Finance Corporation', 4, 'primary-evidence', 1),
    ('miga.org', 'Multilateral Investment Guarantee Agency', 4, 'primary-evidence', 1),
    ('afreximbank.com', 'Afreximbank', 4, 'primary-evidence', 1),
    ('africacdc.org', 'Africa CDC', 4, 'primary-evidence', 1),
    ('iea.org', 'International Energy Agency', 4, 'sector-evidence', 1),
    ('irena.org', 'International Renewable Energy Agency', 4, 'sector-evidence', 1),
    ('ilo.org', 'International Labour Organization', 4, 'sector-evidence', 1),
    ('fao.org', 'Food and Agriculture Organization', 4, 'sector-evidence', 1),
    ('unido.org', 'UN Industrial Development Organization', 4, 'sector-evidence', 1),
    ('intracen.org', 'International Trade Centre', 4, 'sector-evidence', 1),
    ('undp.org', 'United Nations Development Programme', 4, 'sector-evidence', 1),
    ('who.int', 'World Health Organization', 4, 'sector-evidence', 1),
    ('eib.org', 'European Investment Bank', 4, 'markets', 1),
    ('ebrd.com', 'European Bank for Reconstruction and Development', 4, 'markets', 1),
    ('oecd.org', 'OECD', 4, 'markets', 1),
    ('untourism.int', 'UN Tourism', 4, 'sector-evidence', 1),
    ('theafricareport.com', 'The Africa Report', 3, 'africa-specialist', 1),
    ('african.business', 'African Business', 3, 'africa-specialist', 1),
    ('theconversation.com', 'The Conversation Africa', 3, 'africa-specialist', 1),
    ('semafor.com', 'Semafor Africa', 3, 'africa-specialist', 1),
    ('cnbcafrica.com', 'CNBC Africa', 3, 'africa-specialist', 1),
    ('africanews.com', 'Africanews', 3, 'multilingual', 1),
    ('france24.com', 'France 24', 3, 'multilingual', 1),
    ('dw.com', 'Deutsche Welle', 3, 'multilingual', 1),
    ('aljazeera.com', 'Al Jazeera', 3, 'multilingual', 1),
    ('rfi.fr', 'Radio France Internationale', 3, 'multilingual', 1),
    ('jeuneafrique.com', 'Jeune Afrique', 3, 'multilingual', 1),
    ('lusa.pt', 'Lusa', 3, 'multilingual', 1),
    ('rtp.pt', 'RTP Africa', 3, 'multilingual', 1),
    ('oxfordbusinessgroup.com', 'Oxford Business Group', 3, 'markets', 1),
    ('issafrica.org', 'Institute for Security Studies Africa', 3, 'africa-specialist', 1);
