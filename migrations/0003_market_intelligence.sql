-- ═══════════════════════════════════════════════════════════════════════════════
-- BEST OF AFRICA - MARKET INTELLIGENCE MIGRATION
-- New tables for financial metrics, country scores, and enhanced auth
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- MARKET METRICS - Sector financial data for Premium Sector Trends
-- Powers the frontend "PremiumSectorTrends" page with hard financial data
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_metrics (
    id TEXT PRIMARY KEY,
    -- metric_sector_year (e.g., "energy_2026")
    sector_id TEXT REFERENCES sectors(id),
    year INTEGER NOT NULL,
    market_size_usd BIGINT,
    -- Total market size in USD
    growth_rate REAL,
    -- Year-over-year growth as decimal (e.g., 5.2)
    investment_volume_usd BIGINT,
    -- FDI + Private investment
    regulatory_outlook TEXT,
    -- 'Positive', 'Stable', 'Volatile'
    top_companies_json TEXT,
    -- JSON array of company names
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_market_metrics_sector ON market_metrics(sector_id);
CREATE INDEX idx_market_metrics_year ON market_metrics(year DESC);
-- ───────────────────────────────────────────────────────────────────────────────
-- COUNTRY SCORES - Historical intelligence scores per country
-- Powers the frontend "CountryOutlook" with calculated indices
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS country_scores (
    id TEXT PRIMARY KEY,
    -- iso_date (e.g., "ng_2026-01-12")
    country_code TEXT REFERENCES countries(code),
    date TEXT NOT NULL,
    -- ISO date string
    diplomacy_score INTEGER,
    -- 0-100: International relations health
    investment_readiness INTEGER,
    -- 0-100: Ease of doing business
    security_rating INTEGER,
    -- 0-100: Stability index
    narrative_control INTEGER,
    -- 0-100: Media alignment score
    calculated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_country_scores_country ON country_scores(country_code);
CREATE INDEX idx_country_scores_date ON country_scores(date DESC);
-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA - Initial Market Metrics (2024-2026)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Energy & Mining Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'energy_2026',
        'energy',
        2026,
        185000000000,
        6.8,
        28000000000,
        'Positive',
        '["TotalEnergies Africa", "Shell Nigeria", "Dangote Refinery", "Eskom", "Sasol"]'
    ),
    (
        'energy_2025',
        'energy',
        2025,
        173000000000,
        5.2,
        24000000000,
        'Stable',
        '["TotalEnergies Africa", "Shell Nigeria", "Eskom", "Sonangol", "Sasol"]'
    ),
    (
        'energy_2024',
        'energy',
        2024,
        164000000000,
        4.1,
        21000000000,
        'Stable',
        '["Shell Nigeria", "TotalEnergies Africa", "Eskom", "Sonangol", "NNPC"]'
    );
-- Technology & Innovation Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'technology_2026',
        'technology',
        2026,
        115000000000,
        18.5,
        8500000000,
        'Positive',
        '["MTN Group", "Safaricom", "Flutterwave", "Interswitch", "Jumia"]'
    ),
    (
        'technology_2025',
        'technology',
        2025,
        97000000000,
        15.2,
        6200000000,
        'Positive',
        '["MTN Group", "Safaricom", "Flutterwave", "Paystack", "Jumia"]'
    ),
    (
        'technology_2024',
        'technology',
        2024,
        84000000000,
        12.8,
        4800000000,
        'Stable',
        '["MTN Group", "Safaricom", "Interswitch", "Jumia", "OPay"]'
    );
-- Agriculture & Agribusiness Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'agriculture_2026',
        'agriculture',
        2026,
        280000000000,
        4.2,
        12000000000,
        'Stable',
        '["Dangote Farms", "Olam Africa", "Tiger Brands", "ETG", "Zambeef"]'
    ),
    (
        'agriculture_2025',
        'agriculture',
        2025,
        269000000000,
        3.8,
        10500000000,
        'Stable',
        '["Olam Africa", "Dangote Farms", "Tiger Brands", "Illovo Sugar", "Zambeef"]'
    ),
    (
        'agriculture_2024',
        'agriculture',
        2024,
        259000000000,
        3.5,
        9200000000,
        'Stable',
        '["Olam Africa", "Tiger Brands", "Illovo Sugar", "ETG", "Bunge Africa"]'
    );
-- Finance & Investment Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'finance_2026',
        'finance',
        2026,
        420000000000,
        8.5,
        35000000000,
        'Positive',
        '["Standard Bank", "FirstRand", "Access Bank", "Zenith Bank", "Ecobank"]'
    ),
    (
        'finance_2025',
        'finance',
        2025,
        387000000000,
        7.2,
        30000000000,
        'Stable',
        '["Standard Bank", "FirstRand", "Nedbank", "Access Bank", "GTBank"]'
    ),
    (
        'finance_2024',
        'finance',
        2024,
        361000000000,
        6.1,
        26000000000,
        'Stable',
        '["Standard Bank", "FirstRand", "Nedbank", "Absa", "Access Bank"]'
    );
-- Infrastructure & Construction Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'infrastructure_2026',
        'infrastructure',
        2026,
        145000000000,
        7.8,
        42000000000,
        'Positive',
        '["Julius Berger", "AVENG", "Murray & Roberts", "Group Five", "PowerChina"]'
    ),
    (
        'infrastructure_2025',
        'infrastructure',
        2025,
        134000000000,
        6.5,
        38000000000,
        'Stable',
        '["Julius Berger", "AVENG", "Murray & Roberts", "WBHO", "China State Construction"]'
    ),
    (
        'infrastructure_2024',
        'infrastructure',
        2024,
        126000000000,
        5.2,
        33000000000,
        'Stable',
        '["Julius Berger", "Murray & Roberts", "AVENG", "China Railway", "Dangote"]'
    );
-- Tourism & Hospitality Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'tourism_2026',
        'tourism',
        2026,
        68000000000,
        12.5,
        5500000000,
        'Positive',
        '["Sun International", "Tsogo Sun", "Marriott Africa", "Accor Africa", "Legacy Hotels"]'
    ),
    (
        'tourism_2025',
        'tourism',
        2025,
        60000000000,
        9.8,
        4200000000,
        'Positive',
        '["Sun International", "Tsogo Sun", "Hilton Africa", "Radisson", "Protea Hotels"]'
    ),
    (
        'tourism_2024',
        'tourism',
        2024,
        55000000000,
        7.2,
        3500000000,
        'Stable',
        '["Sun International", "Tsogo Sun", "Marriott", "Accor", "Southern Sun"]'
    );
-- Healthcare & Pharma Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'healthcare_2026',
        'healthcare',
        2026,
        95000000000,
        9.2,
        7800000000,
        'Positive',
        '["Aspen Pharmacare", "Netcare", "Life Healthcare", "Cipla", "Adcock Ingram"]'
    ),
    (
        'healthcare_2025',
        'healthcare',
        2025,
        87000000000,
        7.8,
        6500000000,
        'Stable',
        '["Aspen Pharmacare", "Netcare", "Mediclinic", "Life Healthcare", "Discovery"]'
    ),
    (
        'healthcare_2024',
        'healthcare',
        2024,
        81000000000,
        6.5,
        5800000000,
        'Stable',
        '["Aspen Pharmacare", "Netcare", "Mediclinic", "Discovery Health", "Cipla"]'
    );
-- Manufacturing & Industry Sector
INSERT
    OR IGNORE INTO market_metrics (
        id,
        sector_id,
        year,
        market_size_usd,
        growth_rate,
        investment_volume_usd,
        regulatory_outlook,
        top_companies_json
    )
VALUES (
        'manufacturing_2026',
        'manufacturing',
        2026,
        210000000000,
        5.5,
        18000000000,
        'Stable',
        '["Dangote Industries", "Bidvest", "Steinhoff", "Nampak", "ArcelorMittal SA"]'
    ),
    (
        'manufacturing_2025',
        'manufacturing',
        2025,
        199000000000,
        4.8,
        15500000000,
        'Stable',
        '["Dangote Industries", "Bidvest", "Sappi", "Mondi", "ArcelorMittal SA"]'
    ),
    (
        'manufacturing_2024',
        'manufacturing',
        2024,
        190000000000,
        4.2,
        14000000000,
        'Volatile',
        '["Dangote Industries", "Sappi", "Mondi", "Nampak", "PPC"]'
    );
-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA - Initial Country Scores (Top Markets)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT
    OR IGNORE INTO country_scores (
        id,
        country_code,
        date,
        diplomacy_score,
        investment_readiness,
        security_rating,
        narrative_control
    )
VALUES -- Nigeria
    (
        'ng_2026-01-12',
        'NG',
        '2026-01-12',
        72,
        65,
        58,
        70
    ),
    -- South Africa
    (
        'za_2026-01-12',
        'ZA',
        '2026-01-12',
        85,
        78,
        72,
        82
    ),
    -- Kenya
    (
        'ke_2026-01-12',
        'KE',
        '2026-01-12',
        80,
        75,
        68,
        78
    ),
    -- Egypt
    (
        'eg_2026-01-12',
        'EG',
        '2026-01-12',
        78,
        72,
        65,
        75
    ),
    -- Morocco
    (
        'ma_2026-01-12',
        'MA',
        '2026-01-12',
        82,
        76,
        80,
        85
    ),
    -- Ghana
    (
        'gh_2026-01-12',
        'GH',
        '2026-01-12',
        75,
        70,
        78,
        72
    ),
    -- Rwanda
    (
        'rw_2026-01-12',
        'RW',
        '2026-01-12',
        88,
        85,
        90,
        92
    ),
    -- Ethiopia
    (
        'et_2026-01-12',
        'ET',
        '2026-01-12',
        68,
        62,
        52,
        60
    ),
    -- Tanzania
    (
        'tz_2026-01-12',
        'TZ',
        '2026-01-12',
        74,
        68,
        75,
        70
    ),
    -- Côte d'Ivoire
    (
        'ci_2026-01-12',
        'CI',
        '2026-01-12',
        76,
        72,
        70,
        74
    );
-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED DATA - Test API Client for Login
-- Password: "test_secret_123" -> SHA-256 hash
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT
    OR IGNORE INTO clients (
        id,
        name,
        email,
        organization,
        type,
        api_key_hash,
        tier,
        rate_limit_per_hour,
        is_active
    )
VALUES (
        'client_test_001',
        'Test User',
        'test@bestofafrica.com',
        'Best of Africa Platform',
        'partner',
        '7b3d979c7c0f9e8e8e9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6',
        -- placeholder hash
        'premium',
        1000,
        1
    );