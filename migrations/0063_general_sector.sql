-- The application has always treated `general` as the explicit classification
-- for source-grounded reporting that cannot support one economic-sector label.
-- The original sector seed omitted the row, causing valid audit decisions to
-- fail their articles.sector_id foreign-key constraint.
INSERT OR IGNORE INTO sectors (id, name, description, icon, color)
VALUES (
    'general',
    'General & Cross-sector',
    'Reporting without sufficient evidence for one specific economic sector',
    'layers',
    '#10213F'
);
