-- The Gulf of Guinea is a multi-country region, not the Republic of Guinea.
-- Preserve both historical articles and make only the reversible geographic
-- classification correction; reader surfaces render a null country as Africa.
UPDATE articles
SET country_code = NULL,
    updated_at = datetime('now')
WHERE country_code = 'GN'
  AND (
    LOWER(title) LIKE '%gulf of guinea%'
    OR EXISTS (
      SELECT 1
      FROM ingested_items evidence
      WHERE evidence.article_id = articles.id
        AND LOWER(evidence.title) LIKE '%gulf of guinea%'
    )
  );
