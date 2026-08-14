-- Verified 14 August 2026: AfDB's RSS endpoint returns HTTP 403 to
-- Cloudflare Worker egress. Keep afdb.org in the approved discovery catalogue,
-- but do not advertise or repeatedly schedule an inaccessible fixed feed.
UPDATE sources
SET is_active = 0
WHERE id = 'primary-afdb-news'
  AND url = 'https://www.afdb.org/en/rss.xml';
