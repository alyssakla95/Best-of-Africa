-- Separate interactive client passwords from API-key credentials.
-- Existing clients continue to authenticate through the legacy fallback and
-- are upgraded into password_hash after their next successful password login.
ALTER TABLE clients ADD COLUMN password_hash TEXT;
