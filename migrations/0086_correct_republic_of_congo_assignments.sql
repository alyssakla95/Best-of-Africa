-- Correct the deterministic ambiguity between Republic of Congo (CG) and the
-- Democratic Republic of Congo (CD). Restrict remediation to explicit naming;
-- a bare "Congo" remains intentionally unresolved by this migration.
UPDATE articles
SET country_code = 'CG',
    updated_at = datetime('now')
WHERE country_code = 'CD'
  AND (
    LOWER(title) LIKE '%republic of congo%'
    OR LOWER(COALESCE(subtitle, '')) LIKE '%republic of congo%'
    OR LOWER(COALESCE(summary, '')) LIKE '%republic of congo%'
    OR EXISTS (
      SELECT 1
      FROM ingested_items evidence
      WHERE evidence.article_id = articles.id
        AND LOWER(evidence.title) LIKE '%republic of congo%'
        AND LOWER(evidence.title) NOT LIKE '%democratic republic%'
    )
  )
  AND LOWER(title || ' ' || COALESCE(subtitle, '') || ' ' || COALESCE(summary, '')) NOT LIKE '%democratic republic%';
