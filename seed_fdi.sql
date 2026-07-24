-- Real World News Seed 2025
DELETE FROM articles;
-- 1. Energy: Gas Reserves (Positive)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-01',
        'africa-gas-reserves-550tcf',
        'Africa Reinforced as Global Gas Giant with 550tcf Reserves',
        'The continent is home to the second-largest undeveloped gas resources globally, estimated at over 550 trillion cubic feet, positioning it as a key alternative to Russian supply.',
        'Full detailed analysis of gas reserves...',
        datetime('now', '-2 days'),
        'https://energychamber.org',
        'Energy Chamber',
        'NG',
        'energy',
        88,
        'published',
        92,
        'Bullish'
    );
-- 2. Energy: Clean Energy Investment (Mixed)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-02',
        'clean-energy-investment-triples',
        'Private Clean Energy Investment in Africa Triples to $40bn',
        'While private sector investment has surged, overall funding remains insufficient to meet sustainable development goals, with public finance dropping by one-third.',
        'Analysis of IEA data...',
        datetime('now', '-5 days'),
        'https://iea.org',
        'IEA Report',
        'KE',
        'energy',
        75,
        'published',
        65,
        'Neutral'
    );
-- 3. Finance: FDI Drop (Negative)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-03',
        'fdi-drops-38-percent-2025',
        'FDI Into Africa Drops 38% to $56bn in 2025',
        'Major divestments in South Africa and a tightening global economic environment contributed to a sharp decline from 2024 highs.',
        'UNCTAD World Investment Report...',
        datetime('now', '-1 day'),
        'https://unctad.org',
        'UNCTAD',
        'ZA',
        'finance',
        95,
        'published',
        35,
        'Bearish'
    );
-- 4. Finance: Egypt FDI (Positive)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-04',
        'egypt-top-fdi-destination',
        'Egypt Remains Top FDI Destination with $11bn Inflows',
        'Despite regional headwinds, Egypt attracted $11bn, largely driven by renewable energy and logistics investments.',
        'BusinessDay Reporting...',
        datetime('now', '-3 days'),
        'https://businessday.ng',
        'Market Watch',
        'EG',
        'finance',
        82,
        'published',
        88,
        'Bullish'
    );
-- 5. Tech: Fintech Dominance (Positive)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-05',
        'fintech-dominates-2025-funding',
        'Fintech & Digital Services Command 2025 Funding Landscape',
        'Digital financial services remain the most funded sector, though climate-tech is seeing rapid acceleration in early-stage deals.',
        'Briter Bridges Data...',
        datetime('now', '-4 days'),
        'https://briter.co',
        'Tech Insights',
        'NG',
        'technology',
        90,
        'published',
        85,
        'Bullish'
    );
-- 6. Mining: Critical Minerals (Neutral/Strategic)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-06',
        'au-green-minerals-strategy',
        'African Union Drafts Green Minerals Strategy',
        'A new continent-wide framework aims to boost local processing and value addition for lithium and cobalt, reducing raw exports.',
        'Climate Change News...',
        datetime('now', '-6 days'),
        'https://climatechangenews.com',
        'Policy Desk',
        'mz',
        'energy',
        78,
        'published',
        72,
        'Neutral'
    );
-- 7. Energy: Mozambique LNG (Positive)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-07',
        'mozambique-coral-sul-capacity',
        'Mozambique Coral Sul FLNG Adds Critical Export Capacity',
        'The floating LNG project has successfully ramped up, positioning Mozambique as a key supplier to European markets seeking diversification.',
        'Energy Chamber...',
        datetime('now', '-10 days'),
        'https://energychamber.org',
        'Gas Monitor',
        'MZ',
        'energy',
        85,
        'published',
        94,
        'Bullish'
    );
-- 8. Tech: Solar Investment Lags (Negative)
INSERT INTO articles (
        id,
        slug,
        title,
        summary,
        content,
        published_at,
        source_url,
        author,
        country_code,
        sector_id,
        engagement_score,
        status,
        ai_sentiment_score,
        ai_sentiment_label
    )
VALUES (
        'rw-news-08',
        'solar-investment-gap',
        'Africa Attracts Less Than 2% of Global Clean Energy Investment',
        'Despite holding 60% of the world''s best solar resources, the continent faces a massive financing gap for renewables.',
        'IEA Report...',
        datetime('now', '-1 hour'),
        'https://iea.org',
        'Climate Watch',
        'ZA',
        'energy',
        92,
        'published',
        25,
        'Bearish'
    );
-- Mozambique
UPDATE countries
SET fdi_inflow_usd = 1500000000,
    fdi_yoy_growth = 3.1
WHERE code = 'KE';
-- Kenya
UPDATE countries
SET fdi_inflow_usd = 5400000000,
    fdi_yoy_growth = 1.8
WHERE code = 'ZA';
-- South Africa
UPDATE countries
SET fdi_inflow_usd = 9000000000,
    fdi_yoy_growth = 4.5
WHERE code = 'EG';
-- Egypt
UPDATE countries
SET fdi_inflow_usd = 1100000000,
    fdi_yoy_growth = 6.7
WHERE code = 'GH';
-- Ghana
UPDATE countries
SET fdi_inflow_usd = 700000000,
    fdi_yoy_growth = 2.4
WHERE code = 'RW';
-- Rwanda
UPDATE countries
SET fdi_inflow_usd = 3500000000,
    fdi_yoy_growth = -1.2
WHERE code = 'NG';
-- Nigeria
UPDATE countries
SET fdi_inflow_usd = 1800000000,
    fdi_yoy_growth = 8.9
WHERE code = 'ET';
-- Ethiopia
UPDATE countries
SET fdi_inflow_usd = 800000000,
    fdi_yoy_growth = 12.5
WHERE code = 'CI';
-- Cote d'Ivoire
UPDATE countries
SET fdi_inflow_usd = 600000000,
    fdi_yoy_growth = 4.0
WHERE code = 'SN';
-- Senegal