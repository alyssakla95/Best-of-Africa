-- The /services/booking INSERT has referenced ai_concierge_notes since the
-- preliminary-brief feature landed, but the column was never migrated — every
-- consultation submission 500'd (D1: "table booking_requests has no column
-- named ai_concierge_notes").
ALTER TABLE booking_requests ADD COLUMN ai_concierge_notes TEXT;
