-- PUT /members/profile writes updated_at on clients, but the column never
-- existed — every profile save 500'd. (Applied directly via d1 execute; the
-- migrations journal is out of sync with manual applies.)
ALTER TABLE clients ADD COLUMN updated_at TEXT;
