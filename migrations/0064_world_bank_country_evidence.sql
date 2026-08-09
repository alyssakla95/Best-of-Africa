-- The World Bank's public content index supports provider-side country filters.
-- Create one equal-frequency first-party acquisition lane for every African
-- country instead of relying on a JavaScript-heavy regional listing that has
-- returned no usable records in production.
UPDATE sources
SET is_active = 0
WHERE id = 'primary-world-bank-africa-news';

INSERT OR REPLACE INTO sources
    (id, name, type, url, country_code, sector_id, is_active, fetch_interval_minutes)
SELECT
    'primary-world-bank-' || lower(code),
    'World Bank Group · ' || name,
    'worldbank-api',
    'https://webapi.worldbank.org/aemsite/everything/search?boa_country=' || lower(code),
    code,
    NULL,
    1,
    720
FROM countries;
