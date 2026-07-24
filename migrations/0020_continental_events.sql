-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0020: Continental Strategic Summits (Regional Coverage)
-- Depends on: 0019 (adds slug + ai_context_brief columns to events)
-- ═══════════════════════════════════════════════════════════════════════════════
-- Mozambique: Gas & Energy Summit
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-mz-gas-2026',
        'Mozambique Gas & Energy Summit 2026',
        'moz-gas-energy-2026',
        '2026-09-14',
        '2026-09-16',
        'Maputo, Mozambique',
        'MZ',
        'Energy',
        'upcoming',
        1,
        1,
        'The 9th edition bringing together global energy leaders and Mozambique LNG stakeholders.',
        'https://www.mozambique-gas-energy.com/',
        'Strategic for oil and gas infrastructure partnerships in the Rovuma Basin.'
    );
-- Egypt: Petroleum Show
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-eg-egypes-2026',
        'EGYPES 2026 - Egypt Petroleum Show',
        'egypes-2026',
        '2026-02-13',
        '2026-02-15',
        'Cairo, Egypt',
        'EG',
        'Energy',
        'upcoming',
        1,
        1,
        'North Africa''s premier oil and gas event connecting the Mediterranean energy corridor.',
        'https://www.egypes.com/',
        'Central for Mediterranean and North African energy security.'
    );
-- Kenya: Connected Africa
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-ke-connected-2026',
        'Connected East Africa Summit 2026',
        'connected-east-africa-2026',
        '2026-05-18',
        '2026-05-20',
        'Nairobi, Kenya',
        'KE',
        'Technology',
        'upcoming',
        1,
        0,
        'Leading tech, digital infrastructure, and fintech forum for East Africa.',
        'https://tmt.knect365.com/',
        'Key for fintech, M-Pesa ecosystem, and digital infrastructure investors.'
    );
-- Rwanda: Africa CEO Forum
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-rw-ceo-2026',
        'Africa CEO Forum 2026',
        'africa-ceo-forum-2026',
        '2026-05-16',
        '2026-05-17',
        'Kigali, Rwanda',
        'RW',
        'Business',
        'upcoming',
        1,
        1,
        'The largest international gathering of African private sector leaders.',
        'https://www.theafricaceoforum.com/',
        'High-level networking for regional economic integration and deal-making.'
    );
-- Senegal: DakarBizTech
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-sn-biztech-2026',
        'Dakar Digital Economy Forum 2026',
        'dakar-digital-economy-2026',
        '2026-06-10',
        '2026-06-12',
        'Dakar, Senegal',
        'SN',
        'Technology',
        'upcoming',
        0,
        0,
        'Exploring Senegal''s Diamniadio tech hub and Francophone digital ecosystems.',
        'https://www.diamniadio.sn/',
        'Key for Francophone West African tech and innovation partnerships.'
    );
-- Tanzania: East African Mining Forum
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-tz-mining-2026',
        'Tanzania Mining Forum 2026',
        'tanzania-mining-forum-2026',
        '2026-11-04',
        '2026-11-06',
        'Dar es Salaam, Tanzania',
        'TZ',
        'Mining',
        'upcoming',
        0,
        0,
        'Spotlight on Tanzania''s gold, nickel, and rare earth minerals sectors.',
        'https://www.miningforum.co.tz/',
        'Growing interest in East African critical minerals for EV supply chains.'
    );
-- Ethiopia: Addis Business Forum
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-et-abf-2026',
        'Addis Business & Investment Forum 2026',
        'addis-investment-forum-2026',
        '2026-10-08',
        '2026-10-10',
        'Addis Ababa, Ethiopia',
        'ET',
        'Investment',
        'upcoming',
        1,
        1,
        'Ethiopia''s flagship investment event at the seat of the African Union.',
        'https://www.investethiopia.gov.et/',
        'Critical for manufacturing, industrialization, and AU policy engagement.'
    );
-- Angola: Oil & Gas Conference
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-ao-oilgas-2026',
        'Angola Oil & Gas Conference 2026',
        'angola-oil-gas-2026',
        '2026-06-03',
        '2026-06-05',
        'Luanda, Angola',
        'AO',
        'Energy',
        'upcoming',
        1,
        1,
        'Angola''s deepwater oil industry summit and Lobito Corridor logistics showcase.',
        'https://www.angolaoilgas.com/',
        'Focus on deepwater exploration and the Lobito Corridor railway project.'
    );
-- Côte d'Ivoire: CGECI Academy
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-ci-cgeci-2026',
        'CGECI Academy 2026',
        'cgeci-academy-2026',
        '2026-04-14',
        '2026-04-16',
        'Abidjan, Côte d''Ivoire',
        'CI',
        'Business',
        'upcoming',
        0,
        0,
        'The premier private sector forum for Francophone West Africa.',
        'https://www.cgeci.ci/',
        'Key for Francophone Africa private sector engagement and investment.'
    );
-- Mauritius: Africa Financial Markets
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-mu-finmkt-2026',
        'Africa Financial Markets Summit 2026',
        'africa-financial-markets-2026',
        '2026-09-22',
        '2026-09-24',
        'Port Louis, Mauritius',
        'MU',
        'Finance',
        'upcoming',
        0,
        1,
        'Exploring Mauritius as Africa''s offshore financial center and gateway to Asia.',
        'https://www.edbmauritius.org/',
        'Crucial for fintech, offshore banking, and India-Africa trade corridors.'
    );
-- DRC: Congo Mining Week
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-cd-cmw-2026',
        'DRC Mining Week 2026',
        'drc-mining-week-2026',
        '2026-06-18',
        '2026-06-20',
        'Lubumbashi, Democratic Republic of the Congo',
        'CD',
        'Mining',
        'upcoming',
        1,
        1,
        'The epicenter for cobalt, copper, and critical minerals trade in Central Africa.',
        'https://www.drcminingweek.com/',
        'Essential for EV battery supply chain and critical minerals sourcing.'
    );
-- Zambia: Copperbelt Mining Expo
INSERT
    OR IGNORE INTO events (
        id,
        title,
        slug,
        date_start,
        date_end,
        location,
        country_code,
        category,
        status,
        is_featured,
        is_vip,
        description,
        registration_url,
        ai_context_brief
    )
VALUES (
        'evt-zm-cbe-2026',
        'Copperbelt Mining Trade Expo 2026',
        'copperbelt-expo-2026',
        '2026-07-22',
        '2026-07-24',
        'Kitwe, Zambia',
        'ZM',
        'Mining',
        'upcoming',
        0,
        0,
        'Zambia''s annual mining equipment and services exhibition in the heart of the Copperbelt.',
        'https://www.cbmexpo.com/',
        'Critical for mining equipment, services, and copper supply chain.'
    );