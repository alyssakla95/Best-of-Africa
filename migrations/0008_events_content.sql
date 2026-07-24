-- Migration 0008: Add content keys for Events and Booking pages
-- Purpose: Enable AI-driven marketing copy for the new corporate services pages
INSERT INTO system_config (key, value)
VALUES -- Events Page
    (
        'events_hero_headline',
        'Where Decisions Are Made.'
    ),
    (
        'events_hero_subhead',
        'Exclusive access to the continent''s most consequential investment summits, policy forums, and private delegations.'
    ),
    -- Booking/Concierge Page
    ('booking_hero_headline', 'Concierge Request'),
    (
        'booking_hero_subhead',
        'Book strategic services tailored to your market entry and expansion needs. Receive an instant AI preliminary assessment upon submission.'
    );