-- Release any review claim left behind by an interrupted Worker invocation.
-- The runtime subsequently uses a more conservative 15-minute stale window;
-- this deployment cleanup targets only claims already idle for five minutes.
UPDATE articles
SET moderation_status = 'pending',
    last_audited_at = NULL,
    updated_at = datetime('now')
WHERE status = 'pending_audit'
  AND moderation_status = 'reviewing'
  AND updated_at <= datetime('now', '-5 minutes');
