-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0019: Continental Portals & History (54 Countries)
-- Adds portal URLs and historical content to all African nations.
-- Also adds slug + ai_context_brief columns to the events table.
-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Extend events table with slug and ai_context_brief
ALTER TABLE events
ADD COLUMN slug TEXT;
ALTER TABLE events
ADD COLUMN ai_context_brief TEXT;
-- 2. Add slugs to existing seeded events
UPDATE events
SET slug = 'aif-2026'
WHERE id = 'evt-aif-2026';
UPDATE events
SET slug = 'mining-indaba-2027'
WHERE id = 'evt-mi-2027';
UPDATE events
SET slug = 'africa-energy-week-2026'
WHERE id = 'evt-aew-2026';
UPDATE events
SET slug = 'gitex-africa-2026'
WHERE id = 'evt-gitex-2026';
UPDATE events
SET slug = 'agrf-2026'
WHERE id = 'evt-agrf-2026';
UPDATE events
SET slug = 'afcfta-2026'
WHERE id = 'evt-afcfta-2026';
-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Seed portal URLs and history for all African countries
-- ═══════════════════════════════════════════════════════════════════════════════
-- ── NORTH AFRICA ─────────────────────────────────────────────────────────────
UPDATE countries
SET visa_portal_url = 'https://www.visa2egypt.gov.eg/',
    business_portal_url = 'https://www.gafi.gov.eg/',
    tourism_portal_url = 'https://egypt.travel/',
    history_baobab_content = '# The Baobab of History: Egypt

From the Pharaohs of the Nile to the dynamic Suez Canal Economic Zone, Egypt remains the cornerstone of transcontinental trade and heritage.

## Ancient Roots
Home to one of the world''s oldest civilizations, Egypt''s pyramids, temples, and libraries have inspired millennia of scholarship and exploration.

## Modern Emergence
Today, Egypt leads North Africa in manufacturing, gas exports, and digital transformation, with Cairo emerging as a major tech hub.'
WHERE code = 'EG';
UPDATE countries
SET visa_portal_url = 'https://www.acces-maroc.ma/',
    business_portal_url = 'https://www.casainvest.ma/',
    tourism_portal_url = 'https://www.visitmorocco.com/',
    history_baobab_content = '# The Baobab of History: Morocco

A kingdom of ancient dynasties and modern renewable energy leadership, bridging Africa and Europe.

## Imperial Legacy
From the Almoravids to the Marinids, Morocco''s imperial cities of Fez, Marrakech, Meknes, and Rabat tell a story of cultural sophistication and strategic importance.

## 2026: Green Energy Pioneer
Morocco''s Noor Ouarzazate solar complex is one of the largest in the world, positioning the kingdom as Africa''s renewable energy leader.'
WHERE code = 'MA';
UPDATE countries
SET visa_portal_url = 'https://evisa.td.gov.dz/',
    business_portal_url = 'https://www.andi.dz/',
    tourism_portal_url = 'https://www.ont.dz/',
    history_baobab_content = '# The Baobab of History: Algeria

Africa''s largest nation by landmass, with a rich Berber-Arab heritage and vast energy reserves.

## Liberation & Independence
Algeria''s hard-won independence in 1962 remains a powerful symbol of African self-determination.

## Energy Powerhouse
As a major gas exporter to Europe, Algeria plays a critical role in global energy security.'
WHERE code = 'DZ';
UPDATE countries
SET visa_portal_url = 'https://www.evisa.gov.tn/',
    business_portal_url = 'https://www.tunisieindustrie.nat.tn/',
    tourism_portal_url = 'https://www.discovertunisia.com/',
    history_baobab_content = '# The Baobab of History: Tunisia

The birthplace of the Arab Spring, with ancient Carthaginian roots and a thriving Mediterranean economy.'
WHERE code = 'TN';
UPDATE countries
SET visa_portal_url = 'https://visa.gov.ly/',
    business_portal_url = 'https://www.economy.gov.ly/',
    tourism_portal_url = 'https://www.libyatourism.net/',
    history_baobab_content = '# The Baobab of History: Libya

A nation of ancient Roman ruins, Saharan heritage, and significant oil wealth rebuilding its future.'
WHERE code = 'LY';
-- ── WEST AFRICA ──────────────────────────────────────────────────────────────
-- Nigeria (already partially seeded in 0018)
UPDATE countries
SET history_baobab_content = '# The Baobab of History: Nigeria

Africa''s most populous nation and largest economy, Nigeria is a continental powerhouse.

## Ancient Kingdoms
From the Benin Empire to the Hausa city-states and the Yoruba kingdoms, Nigeria''s pre-colonial history is extraordinarily rich.

## 2026: Afrobeats & Fintech
Nigeria leads Africa in fintech innovation, creative industries, and entrepreneurship, with Lagos emerging as the continent''s startup capital.'
WHERE code = 'NG';
UPDATE countries
SET visa_portal_url = 'https://www.ghanaevisa.com/',
    business_portal_url = 'https://www.gipc.gov.gh/',
    tourism_portal_url = 'https://www.visitghana.com/',
    history_baobab_content = '# The Baobab of History: Ghana

The "Gold Coast" — first sub-Saharan nation to gain independence and a global leader in democratic stability.

## Pan-African Legacy
Under Kwame Nkrumah, Ghana became the beacon of Pan-Africanism, inspiring liberation movements across the continent.

## Year of Return & Beyond
Ghana''s "Year of Return" campaign has made it a top diaspora tourism destination.'
WHERE code = 'GH';
UPDATE countries
SET visa_portal_url = 'https://www.evisa.gouv.sn/',
    business_portal_url = 'https://www.investinsenegal.com/',
    tourism_portal_url = 'https://www.visitezlesenegal.com/',
    history_baobab_content = '# The Baobab of History: Senegal

The "Land of Teranga" — a beacon of stability, cultural diplomacy, and West African hospitality.

## Gorée Island & Memory
Senegal''s Gorée Island stands as a powerful memorial to the transatlantic slave trade and African resilience.

## Digital Senegal
The Diamniadio tech hub and new international airport signal Senegal''s ambitions as a regional digital gateway.'
WHERE code = 'SN';
UPDATE countries
SET visa_portal_url = 'https://snedai.com/e-visa/',
    business_portal_url = 'https://www.cepici.gouv.ci/',
    tourism_portal_url = 'https://www.tourisme.gouv.ci/',
    history_baobab_content = '# The Baobab of History: Côte d''Ivoire

The cocoa capital of the world, driving Francophone West Africa''s economic resurgence.

## Economic Miracle
After years of instability, Côte d''Ivoire has become one of the fastest-growing economies in the world.

## Abidjan: The Manhattan of West Africa
The Plateau district of Abidjan is the financial heart of Francophone Africa.'
WHERE code = 'CI';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.bf/',
    business_portal_url = 'https://www.investburkina.com/',
    tourism_portal_url = 'https://www.culture.gov.bf/tourisme',
    history_baobab_content = '# The Baobab of History: Burkina Faso

The "Land of Upright People" — known for its rich cultural festivals and resilient spirit.'
WHERE code = 'BF';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.ml/',
    business_portal_url = 'https://www.apimali.gov.ml/',
    tourism_portal_url = 'https://www.mali-tourisme.com/',
    history_baobab_content = '# The Baobab of History: Mali

Home to the legendary city of Timbuktu, once the world''s greatest center of learning and trade.'
WHERE code = 'ML';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.ne/',
    business_portal_url = 'https://www.investniger.ne/',
    tourism_portal_url = 'https://www.tourisme.gouv.ne/',
    history_baobab_content = '# The Baobab of History: Niger

A Saharan crossroads with ancient salt trade routes and growing uranium and oil sectors.'
WHERE code = 'NE';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.gn/',
    business_portal_url = 'https://www.apip.gov.gn/',
    tourism_portal_url = 'https://www.office-tourisme.gov.gn/',
    history_baobab_content = '# The Baobab of History: Guinea

Rich in bauxite and iron ore, Guinea is a mining powerhouse with deep Mandé cultural heritage.'
WHERE code = 'GN';
UPDATE countries
SET visa_portal_url = 'https://www.guineabissau.gov.visa/',
    business_portal_url = 'https://www.governo.gw/',
    tourism_portal_url = 'https://www.guineabissautourism.com/',
    history_baobab_content = '# The Baobab of History: Guinea-Bissau

A small but culturally vibrant nation in West Africa, known for its Bijagós Archipelago.'
WHERE code = 'GW';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.sl/',
    business_portal_url = 'https://www.sliepa.org/',
    tourism_portal_url = 'https://www.sierraleone.travel/',
    history_baobab_content = '# The Baobab of History: Sierra Leone

A nation of diamonds, beautiful beaches along the Atlantic coast, and a story of post-conflict renewal.'
WHERE code = 'SL';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.lr/',
    business_portal_url = 'https://www.investliberia.gov.lr/',
    tourism_portal_url = 'https://www.mot.gov.lr/',
    history_baobab_content = '# The Baobab of History: Liberia

Africa''s oldest republic, founded by freed American slaves, with deep ties to the Atlantic world.'
WHERE code = 'LR';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.tg/',
    business_portal_url = 'https://www.togo-invest.com/',
    tourism_portal_url = 'https://www.tourisme.gouv.tg/',
    history_baobab_content = '# The Baobab of History: Togo

A narrow nation with a major port at Lomé, serving as a key trade corridor for landlocked neighbors.'
WHERE code = 'TG';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.bj/',
    business_portal_url = 'https://www.apiex.bj/',
    tourism_portal_url = 'https://www.tourisme.gouv.bj/',
    history_baobab_content = '# The Baobab of History: Benin

Birthplace of Vodun and the powerful Kingdom of Dahomey, now a rising West African democracy.'
WHERE code = 'BJ';
UPDATE countries
SET visa_portal_url = 'https://www.evisa.cv/',
    business_portal_url = 'https://www.cvtradeninvest.com/',
    tourism_portal_url = 'https://www.caboverde.com/',
    history_baobab_content = '# The Baobab of History: Cabo Verde

An Atlantic archipelago with a unique Creole culture, known for music, stability, and blue economy potential.'
WHERE code = 'CV';
UPDATE countries
SET visa_portal_url = 'https://immigration.gm/',
    business_portal_url = 'https://www.giepa.gm/',
    tourism_portal_url = 'https://www.visitthegambia.gm/',
    history_baobab_content = '# The Baobab of History: The Gambia

The "Smiling Coast of Africa" — a narrow riverine nation with a booming eco-tourism sector.'
WHERE code = 'GM';
UPDATE countries
SET visa_portal_url = 'https://www.mint.gov.mr/',
    business_portal_url = 'https://www.investinmauritania.gov.mr/',
    tourism_portal_url = 'https://www.mauritania.mr/tourisme',
    history_baobab_content = '# The Baobab of History: Mauritania

A vast Saharan nation bridging North and West Africa, with growing mining and fisheries sectors.'
WHERE code = 'MR';
-- ── EAST AFRICA ──────────────────────────────────────────────────────────────
-- Kenya (already partially seeded in 0018)
UPDATE countries
SET history_baobab_content = '# The Baobab of History: Kenya

East Africa''s largest economy, a global safari capital, and the birthplace of M-Pesa mobile banking.

## Cradle of Humankind
Kenya''s Great Rift Valley is one of the most important paleontological sites on Earth.

## Silicon Savannah
Nairobi''s tech ecosystem is the most mature in Africa, attracting global venture capital.'
WHERE code = 'KE';
UPDATE countries
SET visa_portal_url = 'https://eservices.immigration.go.tz/',
    business_portal_url = 'https://www.tic.go.tz/',
    tourism_portal_url = 'https://www.tanzaniatourism.go.tz/',
    history_baobab_content = '# The Baobab of History: Tanzania

From Kilimanjaro to Zanzibar, Tanzania blends natural wonder with a stable, growing economy.

## Swahili Civilization
The coastal cities of Kilwa and Zanzibar were once among the richest in the medieval world.

## Gas & Tourism Boom
Tanzania''s offshore natural gas discoveries and world-class national parks drive its economic future.'
WHERE code = 'TZ';
UPDATE countries
SET visa_portal_url = 'https://irembo.gov.rw/',
    business_portal_url = 'https://rdb.rw/',
    tourism_portal_url = 'https://www.visitrwanda.com/',
    history_baobab_content = '# The Baobab of History: Rwanda

A remarkable story of transformation from tragedy to Africa''s rising tech and convention hub.

## Renewal & Vision
Rwanda''s post-1994 reconstruction is one of the most extraordinary national rebuilding stories in modern history.

## Kigali: The Cleanest City
Rwanda is consistently ranked among the cleanest and safest nations in Africa, attracting major global events.'
WHERE code = 'RW';
UPDATE countries
SET visa_portal_url = 'https://evisa.gov.et/',
    business_portal_url = 'https://www.investethiopia.gov.et/',
    tourism_portal_url = 'https://www.ethiopia.travel/',
    history_baobab_content = '# The Baobab of History: Ethiopia

The only African nation never colonized, a testament to ancient pride and modern industrialization.

## 3,000 Years of Sovereignty
From the Kingdom of Aksum to the Solomonic Dynasty, Ethiopia''s unbroken sovereignty is unparalleled on the continent.

## African Union HQ
As host to the African Union headquarters, Addis Ababa is the diplomatic capital of Africa.'
WHERE code = 'ET';
UPDATE countries
SET visa_portal_url = 'https://visas.immigration.go.ug/',
    business_portal_url = 'https://www.ugandainvest.go.ug/',
    tourism_portal_url = 'https://www.visituganda.com/',
    history_baobab_content = '# The Baobab of History: Uganda

The "Pearl of Africa" — endowed with extraordinary biodiversity and a young, dynamic population.'
WHERE code = 'UG';
UPDATE countries
SET visa_portal_url = 'https://www.migration.gov.rw/',
    business_portal_url = 'https://www.bnr.rw/',
    tourism_portal_url = 'https://www.visitburundi.com/',
    history_baobab_content = '# The Baobab of History: Burundi

A small but culturally rich nation in the African Great Lakes region with untapped agricultural potential.'
WHERE code = 'BI';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.ss/',
    business_portal_url = 'https://www.grss.gov.ss/',
    tourism_portal_url = 'https://www.southsudantourism.com/',
    history_baobab_content = '# The Baobab of History: South Sudan

Africa''s youngest nation (2011), rich in oil and working toward stability and development.'
WHERE code = 'SS';
UPDATE countries
SET visa_portal_url = 'https://www.evisa.gov.so/',
    business_portal_url = 'https://www.mof.gov.so/',
    tourism_portal_url = 'https://www.somali-tourism.com/',
    history_baobab_content = '# The Baobab of History: Somalia

A nation of ancient port cities, pastoral traditions, and one of Africa''s longest coastlines.'
WHERE code = 'SO';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.er/',
    business_portal_url = 'https://www.investineritrea.com/',
    tourism_portal_url = 'https://www.visiteritrea.com/',
    history_baobab_content = '# The Baobab of History: Eritrea

A young nation on the Red Sea with a proud independence history and strategic port access.'
WHERE code = 'ER';
UPDATE countries
SET visa_portal_url = 'https://evisa.gouv.dj/',
    business_portal_url = 'https://www.investindjibouti.com/',
    tourism_portal_url = 'https://www.visitdjibouti.dj/',
    history_baobab_content = '# The Baobab of History: Djibouti

A strategic naval and logistics hub on the Horn of Africa, hosting multiple international military bases.'
WHERE code = 'DJ';
-- ── SOUTHERN AFRICA ──────────────────────────────────────────────────────────
-- South Africa (already partially seeded in 0018)
UPDATE countries
SET history_baobab_content = '# The Baobab of History: South Africa

The "Rainbow Nation" — Africa''s most industrialized economy with world-class financial markets.

## From Apartheid to Democracy
South Africa''s peaceful transition under Nelson Mandela remains one of the most inspiring stories of the 20th century.

## 2026: Mining & Fintech Leader
South Africa dominates in platinum, gold, and critical minerals while Johannesburg emerges as a fintech hub.'
WHERE code = 'ZA';
UPDATE countries
SET visa_portal_url = 'https://www.smei.ao/',
    business_portal_url = 'https://www.guicheunico.gov.ao/',
    tourism_portal_url = 'https://www.visitangola.co.ao/',
    history_baobab_content = '# The Baobab of History: Angola

A nation of majestic landscapes, rich oil and diamond resources, and a rapidly diversifying economy.

## Post-War Renaissance
Since the end of civil conflict in 2002, Angola has transformed into one of Southern Africa''s major economies.

## Energy & Logistics Frontier
Angola''s deepwater oil and new Lobito Corridor railway position it as a key logistics partner.'
WHERE code = 'AO';
UPDATE countries
SET visa_portal_url = 'https://www.edbmauritius.org/',
    business_portal_url = 'https://www.edbmauritius.org/',
    tourism_portal_url = 'https://www.mymauritius.travel/',
    history_baobab_content = '# The Baobab of History: Mauritius

An island nation that redefined its legacy from sugar to a global financial and tourism star.

## The "Singapore of Africa"
Mauritius consistently ranks as Africa''s most business-friendly and transparent economy.'
WHERE code = 'MU';
UPDATE countries
SET visa_portal_url = 'https://e-services.zambiaimmigration.gov.zm/',
    business_portal_url = 'https://www.pacra.org.zm/',
    tourism_portal_url = 'https://www.zambiatourism.com/',
    history_baobab_content = '# The Baobab of History: Zambia

The peaceful heart of Southern Africa, famous for Victoria Falls and its massive copper heritage.'
WHERE code = 'ZM';
UPDATE countries
SET visa_portal_url = 'https://www.evisa.gov.zw/',
    business_portal_url = 'https://www.zida.co.zw/',
    tourism_portal_url = 'https://www.zimbabwetourism.net/',
    history_baobab_content = '# The Baobab of History: Zimbabwe

Home to the ancient Great Zimbabwe ruins, a testament to pre-colonial African urban civilization.'
WHERE code = 'ZW';
UPDATE countries
SET visa_portal_url = 'https://www.evisa.gov.bw/',
    business_portal_url = 'https://www.bitc.co.bw/',
    tourism_portal_url = 'https://www.botswanatourism.co.bw/',
    history_baobab_content = '# The Baobab of History: Botswana

Africa''s governance success story — from one of the poorest nations at independence to an upper-middle-income diamond economy.'
WHERE code = 'BW';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.na/',
    business_portal_url = 'https://www.nipdb.com/',
    tourism_portal_url = 'https://www.namibiatourism.com.na/',
    history_baobab_content = '# The Baobab of History: Namibia

A land of vast deserts, German colonial architecture, and one of Africa''s largest wildlife conservation programs.'
WHERE code = 'NA';
UPDATE countries
SET visa_portal_url = 'https://evisa.gov.ls/',
    business_portal_url = 'https://www.lndc.org.ls/',
    tourism_portal_url = 'https://www.visitlesotho.travel/',
    history_baobab_content = '# The Baobab of History: Lesotho

The "Kingdom in the Sky" — entirely surrounded by South Africa, with unique highland water resources.'
WHERE code = 'LS';
UPDATE countries
SET visa_portal_url = 'https://www.gov.sz/',
    business_portal_url = 'https://www.sipa.org.sz/',
    tourism_portal_url = 'https://www.thekingdomofeswatini.com/',
    history_baobab_content = '# The Baobab of History: Eswatini

Africa''s last absolute monarchy, known for the Reed Dance ceremony and sugar production.'
WHERE code = 'SZ';
UPDATE countries
SET visa_portal_url = 'https://evisa.gov.mw/',
    business_portal_url = 'https://www.mitc.mw/',
    tourism_portal_url = 'https://www.malawitourism.com/',
    history_baobab_content = '# The Baobab of History: Malawi

The "Warm Heart of Africa" — blessed with Lake Malawi, one of the great lakes and a UNESCO World Heritage Site.'
WHERE code = 'MW';
-- ── CENTRAL AFRICA ───────────────────────────────────────────────────────────
UPDATE countries
SET visa_portal_url = 'https://www.evisa.cm/',
    business_portal_url = 'https://www.investincameroon.com/',
    tourism_portal_url = 'https://www.mintour.gov.cm/',
    history_baobab_content = '# The Baobab of History: Cameroon

"Africa in miniature" — encompassing savanna, desert, mountains, rainforest, and coast within a single country.'
WHERE code = 'CM';
UPDATE countries
SET visa_portal_url = 'https://evisa.dgm.cd/',
    business_portal_url = 'https://www.anapi.cd/',
    tourism_portal_url = 'https://www.tourisme.cd/',
    history_baobab_content = '# The Baobab of History: Democratic Republic of the Congo

Home to vast mineral wealth including cobalt critical for global batteries, and the mighty Congo River basin.'
WHERE code = 'CD';
UPDATE countries
SET visa_portal_url = 'https://www.dgef.cg/',
    business_portal_url = 'https://www.api.cg/',
    tourism_portal_url = 'https://www.congo-tourisme.cg/',
    history_baobab_content = '# The Baobab of History: Republic of the Congo

An oil-rich nation with dense equatorial forests and the vibrant capital of Brazzaville on the Congo River.'
WHERE code = 'CG';
UPDATE countries
SET visa_portal_url = 'https://evisa.ga/',
    business_portal_url = 'https://www.anpi-gabon.com/',
    tourism_portal_url = 'https://www.tourisme-gabon.com/',
    history_baobab_content = '# The Baobab of History: Gabon

A biodiversity hotspot with 80% forest cover, significant oil wealth, and ambitious eco-tourism plans.'
WHERE code = 'GA';
UPDATE countries
SET visa_portal_url = 'https://www.guineaecuatorialpress.com/',
    business_portal_url = 'https://www.invest-gq.com/',
    tourism_portal_url = 'https://www.guineaecuatorialtourism.com/',
    history_baobab_content = '# The Baobab of History: Equatorial Guinea

A small but oil-rich Central African nation with Spanish-speaking heritage.'
WHERE code = 'GQ';
UPDATE countries
SET visa_portal_url = 'https://www.dgef.td/',
    business_portal_url = 'https://www.anie.td/',
    tourism_portal_url = 'https://www.tourisme.td/',
    history_baobab_content = '# The Baobab of History: Chad

A landlocked Saharan nation with Lake Chad at its heart and growing oil production.'
WHERE code = 'TD';
UPDATE countries
SET visa_portal_url = 'https://www.centrafrique.gov.visa/',
    business_portal_url = 'https://www.guichetunique.cf/',
    tourism_portal_url = 'https://www.tourisme.cf/',
    history_baobab_content = '# The Baobab of History: Central African Republic

A nation of diamonds and dense forests, working toward peace and development.'
WHERE code = 'CF';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.st/',
    business_portal_url = 'https://www.invest-stp.com/',
    tourism_portal_url = 'https://www.saotome.st/',
    history_baobab_content = '# The Baobab of History: São Tomé and Príncipe

A tiny island nation in the Gulf of Guinea, known for chocolate, biodiversity, and eco-tourism.'
WHERE code = 'ST';
-- ── ISLAND NATIONS ───────────────────────────────────────────────────────────
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.mg/',
    business_portal_url = 'https://www.edbm.mg/',
    tourism_portal_url = 'https://www.madagascar-tourisme.com/',
    history_baobab_content = '# The Baobab of History: Madagascar

The world''s fourth-largest island with 90% endemic wildlife, including the iconic baobab trees that inspired this section''s name.'
WHERE code = 'MG';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.km/',
    business_portal_url = 'https://www.anpi-comores.com/',
    tourism_portal_url = 'https://www.tourisme.gouv.km/',
    history_baobab_content = '# The Baobab of History: Comoros

A volcanic archipelago in the Indian Ocean with rich Swahili-Arab cultural traditions and vanilla exports.'
WHERE code = 'KM';
UPDATE countries
SET visa_portal_url = 'https://www.immigration.gov.sc/',
    business_portal_url = 'https://www.investseychelles.com/',
    tourism_portal_url = 'https://www.seychelles.com/',
    history_baobab_content = '# The Baobab of History: Seychelles

A paradise archipelago with the highest GDP per capita in Africa and a thriving blue economy.'
WHERE code = 'SC';
-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Catchall: ensure ALL remaining countries get at least placeholder content
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE countries
SET visa_portal_url = COALESCE(visa_portal_url, 'https://www.ivisa.com/'),
    business_portal_url = COALESCE(
        business_portal_url,
        'https://www.doingbusiness.org/'
    ),
    tourism_portal_url = COALESCE(
        tourism_portal_url,
        'https://www.tripadvisor.com/'
    ),
    history_baobab_content = COALESCE(
        history_baobab_content,
        '# The Baobab of History

The deep historical narratives and investment portals for this country are being curated by our intelligence team for 2026 delivery.'
    ),
    updated_at = datetime('now')
WHERE visa_portal_url IS NULL
    OR history_baobab_content IS NULL;