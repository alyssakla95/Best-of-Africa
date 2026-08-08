-- The ECOWAS RSS endpoint is valid publicly but returns no parseable items from
-- the deployed Worker network. Keep ecowas.int in authoritative discovery,
-- while excluding this unproductive direct connector from active-source counts
-- and scheduled fetch capacity.
UPDATE sources
SET is_active = 0
WHERE id = 'primary-ecowas-news';
