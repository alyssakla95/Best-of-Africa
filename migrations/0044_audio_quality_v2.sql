-- Track the real provider and requeue every pre-Aura-2 narration.
ALTER TABLE articles ADD COLUMN audio_provider TEXT;
DROP INDEX IF EXISTS idx_articles_audio_regen;
CREATE INDEX idx_articles_audio_regen
    ON articles(published_at DESC)
    WHERE status = 'published' AND audio_url IS NOT NULL
      AND (audio_regen IS NULL OR audio_regen < 2);
