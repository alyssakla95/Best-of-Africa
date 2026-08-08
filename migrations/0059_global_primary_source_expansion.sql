-- Expand the independently approved discovery network and add productive,
-- first-party regional evidence pages. These institutions cover several
-- smaller markets that are routinely missed by large English-language feeds.
INSERT OR REPLACE INTO discovery_source_catalog
    (domain, publisher_name, quality_tier, lane, is_active)
VALUES
    ('wsj.com', 'The Wall Street Journal', 4, 'global-news', 1),
    ('cnbc.com', 'CNBC', 4, 'global-news', 1),
    ('cnn.com', 'CNN', 4, 'global-news', 1),
    ('nikkei.com', 'Nikkei', 4, 'global-news', 1),
    ('afp.com', 'Agence France-Presse', 4, 'global-news', 1),
    ('bis.org', 'Bank for International Settlements', 4, 'markets', 1),
    ('eiti.org', 'Extractive Industries Transparency Initiative', 4, 'sector-evidence', 1),
    ('ifad.org', 'International Fund for Agricultural Development', 4, 'sector-evidence', 1),
    ('ecowas.int', 'Economic Community of West African States', 4, 'primary-evidence', 1),
    ('sadc.int', 'Southern African Development Community', 4, 'primary-evidence', 1),
    ('eac.int', 'East African Community', 4, 'primary-evidence', 1),
    ('comesa.int', 'Common Market for Eastern and Southern Africa', 4, 'primary-evidence', 1),
    ('igad.int', 'Intergovernmental Authority on Development', 4, 'primary-evidence', 1);

INSERT OR IGNORE INTO sources
    (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
VALUES
    ('primary-ecowas-news', 'Economic Community of West African States', 'html', 'https://www.ecowas.int/c/news/press-releases/', NULL, NULL, 1, 30),
    ('primary-sadc-news', 'Southern African Development Community', 'html', 'https://www.sadc.int/latest-news', NULL, NULL, 1, 30),
    ('primary-eac-news', 'East African Community', 'html', 'https://www.eac.int/press-releases', NULL, NULL, 1, 30),
    ('primary-comesa-news', 'Common Market for Eastern and Southern Africa', 'html', 'https://www.comesa.int/news/', NULL, NULL, 1, 30);
