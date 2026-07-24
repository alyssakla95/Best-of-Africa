-- Aura-era audio regeneration queue. MeloTTS (robotic, and dead server-side
-- since 2026-07-09) narrated the first 5,680 articles; audio_regen=0 marks
-- rows whose stored audio predates the Deepgram Aura voice and should be
-- re-narrated. Rows without audio get 1 (their eventual audio IS Aura), and
-- every new narration writes 1. (Applied via d1 execute; journal out of sync.)
ALTER TABLE articles ADD COLUMN audio_regen INTEGER DEFAULT 0;
UPDATE articles SET audio_regen = 1 WHERE audio_url IS NULL OR audio_url = '';
CREATE INDEX IF NOT EXISTS idx_articles_audio_regen
    ON articles(published_at DESC)
    WHERE status = 'published' AND audio_url IS NOT NULL AND (audio_regen IS NULL OR audio_regen = 0);
