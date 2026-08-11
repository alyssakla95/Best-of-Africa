-- Stripe does not guarantee webhook delivery order. Persist the newest event
-- timestamp so an older invoice or subscription event cannot restore stale
-- listing state after cancellation or payment failure.
ALTER TABLE specialist_subscriptions ADD COLUMN last_event_created INTEGER;
