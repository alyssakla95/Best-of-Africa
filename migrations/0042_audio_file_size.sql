-- Podcast enclosures require a byte length; the feed emitted length="0" for
-- every episode because nothing stored the size. Populated by a one-off R2
-- metadata backfill and kept current at upload time (src/lib/audio.ts).
-- (Applied via d1 execute; the migrations journal is out of sync.)
ALTER TABLE articles ADD COLUMN audio_file_size INTEGER;
