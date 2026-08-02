-- Direct first-party evidence pages reduce dependence on search aggregators and
-- make authoritative institutions a routine part of the acquisition schedule.
-- These listing pages are deliberately broad; the ingestion market-evidence
-- and Africa-relevance gates still apply to every individual record.
INSERT OR REPLACE INTO sources
    (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
VALUES
    ('primary-afdb-news', 'African Development Bank News', 'html', 'https://www.afdb.org/en/news-and-events', NULL, NULL, 1, 20),
    ('primary-world-bank-africa-news', 'World Bank Africa News', 'html', 'https://www.worldbank.org/en/region/afr/news', NULL, NULL, 1, 30),
    ('primary-imf-news', 'International Monetary Fund News', 'html', 'https://www.imf.org/en/News', NULL, 'finance', 1, 30),
    ('primary-unctad-news', 'UN Trade and Development News', 'html', 'https://unctad.org/news', NULL, NULL, 1, 30),
    ('primary-ifc-africa', 'International Finance Corporation Africa', 'html', 'https://www.ifc.org/en/pressroom?regions=Africa', NULL, 'finance', 1, 30),
    ('primary-iea-africa', 'International Energy Agency Africa', 'html', 'https://www.iea.org/news?region%5B0%5D=africa', NULL, 'energy', 1, 30),
    ('primary-irena-news', 'International Renewable Energy Agency News', 'html', 'https://www.irena.org/news/', NULL, 'energy', 1, 30),
    ('primary-fao-africa-news', 'FAO Africa News', 'html', 'https://www.fao.org/africa/news-stories/news/en', NULL, 'agriculture', 1, 30);
