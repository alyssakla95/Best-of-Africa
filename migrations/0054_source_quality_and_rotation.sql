-- Remove feeds that consume generation capacity without producing usable
-- source evidence, and fetch authoritative sources more frequently.
UPDATE sources
SET is_active = 0
WHERE name LIKE 'AllAfrica%'
   OR name IN ('Nairametrics', 'Moneyweb', 'IT News Africa', 'Bizcommunity');

UPDATE sources
SET fetch_interval_minutes = CASE
    WHEN name IN (
        'UN Economic Commission for Africa', 'African Union', 'UN News Africa',
        'World Trade Organization', 'African Development Bank Group'
    ) THEN 15
    WHEN name IN (
        'BBC Africa', 'The Africa Report', 'African Business', 'The Conversation Africa',
        'Semafor Africa', 'Daily Maverick', 'TechCabal'
    ) THEN 30
    ELSE MAX(COALESCE(fetch_interval_minutes, 60), 60)
END
WHERE is_active = 1;
