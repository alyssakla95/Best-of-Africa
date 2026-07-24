-- Test fixture: seed a pending article generation task for local development.
-- Apply manually with: wrangler d1 execute best-of-africa-db --local --file=fixtures/test_task_seed.sql
-- DO NOT apply this to production.

INSERT INTO ingested_items (id, title, status, url, source_id, published_at)
VALUES ('test-item-123', 'Async Task Test Article', 'pending', 'https://example.com/test', 'reuters', datetime('now'));

INSERT INTO agent_tasks (id, type, payload, status)
VALUES ('test-task-123', 'generate_article', '{"ingested_item_id":"test-item-123", "title":"Async Task Test Article", "content":"This is test content", "country_code":"MZ"}', 'pending');
