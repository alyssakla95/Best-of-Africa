-- Prefer machine-readable first-party feeds where the institutions publish
-- them. SADC remains in the approved discovery catalogue, but its direct HTML
-- connector is disabled because the site exposes no RSS/Atom endpoint and the
-- Worker response does not contain stable article links.
UPDATE sources
SET type = 'rss', url = 'https://www.ecowas.int/feed/', last_fetched_at = NULL
WHERE id = 'primary-ecowas-news';

UPDATE sources
SET type = 'rss', url = 'https://www.comesa.int/feed/', last_fetched_at = NULL
WHERE id = 'primary-comesa-news';

UPDATE sources
SET is_active = 0
WHERE id = 'primary-sadc-news';
