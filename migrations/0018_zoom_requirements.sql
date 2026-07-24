-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0018: Zoom Meeting Requirements (Portals & History)
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Add new fields to countries table
ALTER TABLE countries
ADD COLUMN visa_portal_url TEXT;
ALTER TABLE countries
ADD COLUMN business_portal_url TEXT;
ALTER TABLE countries
ADD COLUMN tourism_portal_url TEXT;
ALTER TABLE countries
ADD COLUMN history_baobab_content TEXT;
-- 2. Seed Mozambique (MZ) data as requested in meeting
UPDATE countries
SET visa_portal_url = 'https://evisa.gov.mz/',
    business_portal_url = 'https://www.portaldogoverno.gov.mz/por/Empresario/Registo-de-Empresas',
    tourism_portal_url = 'https://visitmozambique.gov.mz/',
    history_baobab_content = '# The Baobab of History: Mozambique\n\nMozambique''s history is as resilient as the giant Baobabs that dot its landscape. From the ancient Kingdom of Mutapa to the thriving trade hubs of Sofala, the nation has always been a gateway between the Indian Ocean and the African interior.\n\n## Colonial Legacy & Liberation\nAfter centuries of Portuguese influence, Mozambique achieved independence in 1975. The subsequent decades have been a story of transformation, peace-building, and economic emergence.\n\n## 2026: A New Era\nToday, Mozambique stands at the forefront of the Southern African energy and logistics sectors, leveraging its strategic coastline and vast natural resources to drive regional integration.',
    updated_at = datetime('now')
WHERE code = 'MZ';
-- 3. Add generic placeholders for other key regions mentioned (South Africa, Kenya, Nigeria)
UPDATE countries
SET visa_portal_url = 'https://www.dha.gov.za/index.php/immigration-services/types-of-visas',
    business_portal_url = 'https://www.cipc.co.za/',
    tourism_portal_url = 'https://www.southafrica.net/'
WHERE code = 'ZA';
UPDATE countries
SET visa_portal_url = 'https://evisa.go.ke/',
    business_portal_url = 'https://www.ecitizen.go.ke/',
    tourism_portal_url = 'https://www.magicalkenya.com/'
WHERE code = 'KE';
UPDATE countries
SET visa_portal_url = 'https://portal.immigration.gov.ng/',
    business_portal_url = 'https://www.cac.gov.ng/',
    tourism_portal_url = 'https://tournigeria.gov.ng/'
WHERE code = 'NG';