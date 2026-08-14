-- IFC's pressroom is client-rendered. Use its first-party public search service
-- rather than treating the empty HTML shell as an article listing.
UPDATE sources
SET type = 'ifc-api',
    url = 'https://www.ifc.org/en/pressroom?regions=Africa',
    is_active = 1,
    fetch_interval_minutes = 30,
    last_fetched_at = NULL
WHERE id = 'primary-ifc-africa';
