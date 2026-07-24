-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 0007: Dynamic Content Keys
-- Expands system_config for AI-generated marketing content
-- ═══════════════════════════════════════════════════════════════════════════════
-- ───────────────────────────────────────────────────────────────────────────────
-- HOME PAGE CONTENT
-- ───────────────────────────────────────────────────────────────────────────────
INSERT
    OR IGNORE INTO system_config (key, value)
VALUES (
        'home_mission_headline',
        'Mission Support & Logistics.'
    ),
    (
        'home_mission_body',
        'We don''t just provide intelligence; we enable presence. From secure aviation to expedited visas and security details, we ensure your team lands, operates, and succeeds in any jurisdiction.'
    ),
    ('home_mission_cta', 'Secure Mobility Support'),
    ('home_stat_countries', '54'),
    ('home_stat_countries_label', 'Countries Covered'),
    ('home_stat_security', '24/7'),
    ('home_stat_security_label', 'Security Overwatch'),
    (
        'home_testimonial_quote',
        'The only partner we trust for Sahel transitions.'
    ),
    (
        'home_testimonial_author',
        'Fortune 500 Security Director'
    );
-- ───────────────────────────────────────────────────────────────────────────────
-- ABOUT PAGE CONTENT
-- ───────────────────────────────────────────────────────────────────────────────
INSERT
    OR IGNORE INTO system_config (key, value)
VALUES (
        'about_headline',
        'New Narratives for a <br /> New Continent.'
    ),
    (
        'about_mission_text',
        'Best of Africa is a unified public relations and strategic narrative platform, designed to strengthen Africa''s image on the global stage by promoting—country by country—opportunities for tourism, investment, and sustainable development.'
    ),
    ('about_intel_title', 'Our Intelligence Core'),
    (
        'about_intel_body',
        'Although we present as a human-curated brand to ensure authenticity, Best of Africa is at its core a native artificial intelligence platform. Our autonomous backend collects real-time data, processes signal from noise, and generates actionable intelligence for investors and policymakers.'
    ),
    ('about_role_media_title', 'Media Outlet'),
    (
        'about_role_media_desc',
        'Premium pan-African content platform.'
    ),
    ('about_role_intel_title', 'Market Intelligence'),
    (
        'about_role_intel_desc',
        'Ground-truth reporting combined with our proprietary Intelligence Engine.'
    ),
    (
        'about_role_narrative_title',
        'Narrative Diplomacy'
    ),
    (
        'about_role_narrative_desc',
        'Amplifying Africa''s voice with rigor.'
    ),
    ('about_role_gateway_title', 'Business Gateway'),
    (
        'about_role_gateway_desc',
        'Trusted portal for opportunity.'
    );
-- ───────────────────────────────────────────────────────────────────────────────
-- MEMBERSHIP PAGE CONTENT
-- ───────────────────────────────────────────────────────────────────────────────
INSERT
    OR IGNORE INTO system_config (key, value)
VALUES (
        'membership_headline',
        'Intelligence for <br /> Decision Makers.'
    ),
    (
        'membership_subhead',
        'For investors, governments, and corporations who cannot afford to be surprised.'
    ),
    ('membership_tier_badge', 'PREMIER ACCESS'),
    ('membership_tier_name', 'Partner Tier'),
    (
        'membership_tier_desc',
        'The complete intelligence suite for strategic operations.'
    ),
    ('membership_tier_price', '$2,500'),
    ('membership_tier_period', '/ year'),
    ('membership_cta', 'Start Operational Advantage'),
    (
        'membership_feature_1_title',
        'Daily Intelligence Briefing'
    ),
    (
        'membership_feature_1_desc',
        'Curated executive synthesis every morning at 6 AM.'
    ),
    (
        'membership_feature_2_title',
        'Real-time Warning Signals'
    ),
    (
        'membership_feature_2_desc',
        'Mobile alerts for critical narrative shifts.'
    ),
    (
        'membership_feature_3_title',
        'Deep-Dive Sector Reports'
    ),
    (
        'membership_feature_3_desc',
        'Full PDF access to Energy, Tech, and Finance verticals.'
    ),
    ('membership_feature_4_title', 'Analyst On-Call'),
    (
        'membership_feature_4_desc',
        'Direct line to our narrative strategy desk.'
    ),
    (
        'membership_trust_label',
        'Trusted by strategic teams at:'
    ),
    (
        'membership_trust_logos',
        'AFRICA FINANCE CORP,DANGOTE GROUP,STANDARDBANK,MTN'
    );
-- ───────────────────────────────────────────────────────────────────────────────
-- TRAVEL PAGE CONTENT
-- ───────────────────────────────────────────────────────────────────────────────
INSERT
    OR IGNORE INTO system_config (key, value)
VALUES (
        'travel_hero_headline',
        'Corporate <br/> Logistics & Security'
    ),
    (
        'travel_hero_subhead',
        'Comprehensive mission support for executives entering high-growth African markets.'
    ),
    ('travel_service_1_title', 'Executive Mobility'),
    (
        'travel_service_1_desc',
        'Private aviation charters, expedited visa processing, and VIP ground transport coordination across 54 jurisdictions.'
    ),
    (
        'travel_service_2_title',
        'Security Intelligence'
    ),
    (
        'travel_service_2_desc',
        'Real-time threat assessments, secure routing, and close protection detail for high-stakes environments.'
    ),
    ('travel_service_3_title', 'Logistics & Fixers'),
    (
        'travel_service_3_desc',
        'Local "fixers" to navigate bureaucracy, equipment importation, and regulatory compliance on the ground.'
    );
-- ───────────────────────────────────────────────────────────────────────────────
-- ERROR PAGES
-- ───────────────────────────────────────────────────────────────────────────────
INSERT
    OR IGNORE INTO system_config (key, value)
VALUES ('error_404_headline', 'Page Not Found'),
    (
        'error_404_subhead',
        'The intelligence you seek has moved or no longer exists.'
    ),
    ('error_500_headline', 'System Error'),
    (
        'error_500_subhead',
        'Our analysts are working to resolve this issue.'
    );