-- System Configuration for Dynamic UI Strings & AI Content
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Seed initial values (so UI doesn't break before first AI run)
INSERT OR IGNORE INTO system_config (key, value)
VALUES (
        'sector_energy_desc',
        'Oil, Gas, Critical Minerals'
    ),
    (
        'sector_technology_desc',
        'Fintech, Mobile Money, Digital Infra'
    ),
    (
        'sector_agriculture_desc',
        'Agri-processing, Food Security'
    ),
    (
        'sector_infrastructure_desc',
        'Logistics, Ports, Railways'
    ),
    (
        'sector_finance_desc',
        'Capital Markets, FDI Trends'
    ),
    (
        'sector_tourism_desc',
        'Luxury Travel, Conservation'
    ),
    (
        'feed_welcome_message',
        'Welcome to your daily intelligence briefing.'
    );