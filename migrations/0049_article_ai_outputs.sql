-- Persist the three generated article outputs read by the public article API
-- and written by both the queue and agent-webhook generation paths.
ALTER TABLE articles ADD COLUMN ai_investor_brief TEXT;
ALTER TABLE articles ADD COLUMN ai_push_message TEXT;
ALTER TABLE articles ADD COLUMN ai_social_post TEXT;
