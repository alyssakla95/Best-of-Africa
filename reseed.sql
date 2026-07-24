DELETE FROM article_audits;
DELETE FROM article_feedback;
DELETE FROM articles;
UPDATE agent_tasks SET status = 'pending', result = NULL, error_message = NULL, completed_at = NULL WHERE type = 'generate_article';
