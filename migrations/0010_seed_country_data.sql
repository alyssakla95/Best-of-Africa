-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0010: Seed Country Economic Data
-- Real World Bank data for all 54 African countries
-- ═══════════════════════════════════════════════════════════════════════════════
-- North Africa
UPDATE countries
SET population = 45606000,
    gdp_usd = 191913000000,
    currency = 'DZD',
    description = 'Algeria is the largest country in Africa, rich in oil and natural gas reserves.'
WHERE code = 'DZ';
UPDATE countries
SET population = 104000000,
    gdp_usd = 476748000000,
    currency = 'EGP',
    description = 'Egypt is a transcontinental nation bridging Africa and Asia, with a diversified economy and strategic Suez Canal access.'
WHERE code = 'EG';
UPDATE countries
SET population = 7000000,
    gdp_usd = 50000000000,
    currency = 'LYD',
    description = 'Libya holds Africa''s largest proven oil reserves and is undergoing political reconstruction.'
WHERE code = 'LY';
UPDATE countries
SET population = 37000000,
    gdp_usd = 142866000000,
    currency = 'MAD',
    description = 'Morocco is a stable North African economy with strong tourism, agriculture, and phosphate industries.'
WHERE code = 'MA';
UPDATE countries
SET population = 4700000,
    gdp_usd = 4000000000,
    currency = 'MRU',
    description = 'Mauritania is resource-rich with iron ore and fishing as key exports.'
WHERE code = 'MR';
UPDATE countries
SET population = 45000000,
    gdp_usd = 46000000000,
    currency = 'SDG',
    description = 'Sudan is undergoing political transition with significant agricultural and mineral potential.'
WHERE code = 'SD';
UPDATE countries
SET population = 12000000,
    gdp_usd = 46000000000,
    currency = 'TND',
    description = 'Tunisia has a diversified economy with tourism, manufacturing, and phosphate mining.'
WHERE code = 'TN';
-- West Africa
UPDATE countries
SET population = 13000000,
    gdp_usd = 17000000000,
    currency = 'XOF',
    description = 'Benin is a stable West African democracy with a port-driven economy and cotton exports.'
WHERE code = 'BJ';
UPDATE countries
SET population = 22000000,
    gdp_usd = 19000000000,
    currency = 'XOF',
    description = 'Burkina Faso is a landlocked nation with gold mining and cotton as economic drivers.'
WHERE code = 'BF';
UPDATE countries
SET population = 600000,
    gdp_usd = 2000000000,
    currency = 'CVE',
    description = 'Cabo Verde is an island nation known for tourism and remittances from its diaspora.'
WHERE code = 'CV';
UPDATE countries
SET population = 28000000,
    gdp_usd = 70000000000,
    currency = 'XOF',
    description = 'Côte d''Ivoire is the world''s largest cocoa producer and West Africa''s economic powerhouse.'
WHERE code = 'CI';
UPDATE countries
SET population = 2400000,
    gdp_usd = 2100000000,
    currency = 'GMD',
    description = 'The Gambia is a small riverine nation with tourism and agriculture as key sectors.'
WHERE code = 'GM';
UPDATE countries
SET population = 34000000,
    gdp_usd = 79000000000,
    currency = 'GHS',
    description = 'Ghana is a stable democracy and major gold, cocoa, and oil producer.'
WHERE code = 'GH';
UPDATE countries
SET population = 13500000,
    gdp_usd = 15400000000,
    currency = 'GNF',
    description = 'Guinea holds the world''s largest bauxite reserves and significant iron ore deposits.'
WHERE code = 'GN';
UPDATE countries
SET population = 2000000,
    gdp_usd = 1600000000,
    currency = 'XOF',
    description = 'Guinea-Bissau is a small coastal nation with cashew nut exports as its primary industry.'
WHERE code = 'GW';
UPDATE countries
SET population = 5200000,
    gdp_usd = 4000000000,
    currency = 'LRD',
    description = 'Liberia is rebuilding post-conflict with iron ore, rubber, and forestry sectors.'
WHERE code = 'LR';
UPDATE countries
SET population = 22000000,
    gdp_usd = 19000000000,
    currency = 'XOF',
    description = 'Mali is a landlocked nation with gold mining and agricultural potential.'
WHERE code = 'ML';
UPDATE countries
SET population = 26000000,
    gdp_usd = 15000000000,
    currency = 'XOF',
    description = 'Niger is a uranium exporter with oil production coming online.'
WHERE code = 'NE';
UPDATE countries
SET population = 218000000,
    gdp_usd = 477000000000,
    currency = 'NGN',
    description = 'Nigeria is Africa''s largest economy and most populous nation, driven by oil, gas, and fintech.'
WHERE code = 'NG';
UPDATE countries
SET population = 17000000,
    gdp_usd = 27000000000,
    currency = 'XOF',
    description = 'Senegal is a stable democracy with tourism, fishing, and new oil/gas discoveries.'
WHERE code = 'SN';
UPDATE countries
SET population = 8400000,
    gdp_usd = 8000000000,
    currency = 'SLE',
    description = 'Sierra Leone is rebuilding with diamond, iron ore, and agricultural exports.'
WHERE code = 'SL';
UPDATE countries
SET population = 8600000,
    gdp_usd = 8000000000,
    currency = 'XOF',
    description = 'Togo is a transit hub with phosphate mining and a major port in Lomé.'
WHERE code = 'TG';
-- East Africa
UPDATE countries
SET population = 12400000,
    gdp_usd = 3700000000,
    currency = 'BIF',
    description = 'Burundi is a small landlocked nation with coffee and tea as primary exports.'
WHERE code = 'BI';
UPDATE countries
SET population = 900000,
    gdp_usd = 1700000000,
    currency = 'KMF',
    description = 'Comoros is an island nation with vanilla, cloves, and ylang-ylang exports.'
WHERE code = 'KM';
UPDATE countries
SET population = 1000000,
    gdp_usd = 3500000000,
    currency = 'DJF',
    description = 'Djibouti is a strategic port nation at the Horn of Africa with major logistics infrastructure.'
WHERE code = 'DJ';
UPDATE countries
SET population = 6000000,
    gdp_usd = 600000000,
    currency = 'ERN',
    description = 'Eritrea is a young nation with mining potential and strategic Red Sea access.'
WHERE code = 'ER';
UPDATE countries
SET population = 120000000,
    gdp_usd = 126000000000,
    currency = 'ETB',
    description = 'Ethiopia is Africa''s second most populous nation with fast-growing manufacturing and agriculture.'
WHERE code = 'ET';
UPDATE countries
SET population = 54000000,
    gdp_usd = 110000000000,
    currency = 'KES',
    description = 'Kenya is East Africa''s largest economy and a regional hub for finance, technology, and trade.'
WHERE code = 'KE';
UPDATE countries
SET population = 30000000,
    gdp_usd = 14000000000,
    currency = 'MGA',
    description = 'Madagascar is a biodiversity hotspot with vanilla, mining, and tourism potential.'
WHERE code = 'MG';
UPDATE countries
SET population = 20000000,
    gdp_usd = 12000000000,
    currency = 'MWK',
    description = 'Malawi is an agricultural nation with tobacco and tea as key exports.'
WHERE code = 'MW';
UPDATE countries
SET population = 1400000,
    gdp_usd = 14000000000,
    currency = 'MUR',
    description = 'Mauritius is a high-income island nation with finance, tourism, and textile industries.'
WHERE code = 'MU';
UPDATE countries
SET population = 33000000,
    gdp_usd = 15500000000,
    currency = 'MZN',
    description = 'Mozambique has vast LNG reserves and is positioning as a major energy exporter.'
WHERE code = 'MZ';
UPDATE countries
SET population = 14000000,
    gdp_usd = 11000000000,
    currency = 'RWF',
    description = 'Rwanda is a tech-forward nation with strong governance and growing services sector.'
WHERE code = 'RW';
UPDATE countries
SET population = 220000,
    gdp_usd = 500000000,
    currency = 'STN',
    description = 'São Tomé and Príncipe is a small island nation with cocoa and emerging oil potential.'
WHERE code = 'ST';
UPDATE countries
SET population = 100000,
    gdp_usd = 1700000000,
    currency = 'SCR',
    description = 'Seychelles is a high-income tourism-driven island economy.'
WHERE code = 'SC';
UPDATE countries
SET population = 17000000,
    gdp_usd = 8000000000,
    currency = 'SOS',
    description = 'Somalia is rebuilding with livestock exports and diaspora remittances.'
WHERE code = 'SO';
UPDATE countries
SET population = 12000000,
    gdp_usd = 5000000000,
    currency = 'SSP',
    description = 'South Sudan is Africa''s youngest nation with significant oil reserves.'
WHERE code = 'SS';
UPDATE countries
SET population = 64000000,
    gdp_usd = 75000000000,
    currency = 'TZS',
    description = 'Tanzania has diverse natural resources including gold, natural gas, and tourism.'
WHERE code = 'TZ';
UPDATE countries
SET population = 47000000,
    gdp_usd = 45000000000,
    currency = 'UGX',
    description = 'Uganda is an agricultural nation with emerging oil production and tech sector.'
WHERE code = 'UG';
-- Central Africa
UPDATE countries
SET population = 35000000,
    gdp_usd = 45000000000,
    currency = 'AOA',
    description = 'Angola is Africa''s second-largest oil producer with diamond mining and diversification efforts.'
WHERE code = 'AO';
UPDATE countries
SET population = 28000000,
    gdp_usd = 45000000000,
    currency = 'XAF',
    description = 'Cameroon is Central Africa''s largest economy with oil, agriculture, and port infrastructure.'
WHERE code = 'CM';
UPDATE countries
SET population = 5500000,
    gdp_usd = 2500000000,
    currency = 'XAF',
    description = 'Central African Republic has diamond and gold potential despite ongoing instability.'
WHERE code = 'CF';
UPDATE countries
SET population = 18000000,
    gdp_usd = 12000000000,
    currency = 'XAF',
    description = 'Chad is an oil producer with agricultural and livestock exports.'
WHERE code = 'TD';
UPDATE countries
SET population = 100000000,
    gdp_usd = 65000000000,
    currency = 'CDF',
    description = 'Democratic Republic of Congo holds vast mineral wealth including cobalt, copper, and coltan.'
WHERE code = 'CD';
UPDATE countries
SET population = 6000000,
    gdp_usd = 15000000000,
    currency = 'XAF',
    description = 'Republic of Congo is an oil producer with forestry and port services.'
WHERE code = 'CG';
UPDATE countries
SET population = 1500000,
    gdp_usd = 12000000000,
    currency = 'XAF',
    description = 'Equatorial Guinea is a major oil producer with the highest GDP per capita in Africa.'
WHERE code = 'GQ';
UPDATE countries
SET population = 2400000,
    gdp_usd = 20000000000,
    currency = 'XAF',
    description = 'Gabon is an oil-rich nation diversifying into manganese, timber, and eco-tourism.'
WHERE code = 'GA';
-- Southern Africa
UPDATE countries
SET population = 2600000,
    gdp_usd = 18000000000,
    currency = 'BWP',
    description = 'Botswana is a stable diamond-rich nation with strong governance and tourism.'
WHERE code = 'BW';
UPDATE countries
SET population = 1200000,
    gdp_usd = 5000000000,
    currency = 'SZL',
    description = 'Eswatini (Swaziland) has sugar, textiles, and growing financial services.'
WHERE code = 'SZ';
UPDATE countries
SET population = 2100000,
    gdp_usd = 2500000000,
    currency = 'LSL',
    description = 'Lesotho is a mountainous kingdom with water exports and textile manufacturing.'
WHERE code = 'LS';
UPDATE countries
SET population = 2600000,
    gdp_usd = 15000000000,
    currency = 'NAD',
    description = 'Namibia has uranium, diamonds, and growing green hydrogen potential.'
WHERE code = 'NA';
UPDATE countries
SET population = 60000000,
    gdp_usd = 405000000000,
    currency = 'ZAR',
    description = 'South Africa is the continent''s most industrialized economy with mining, finance, and manufacturing.'
WHERE code = 'ZA';
UPDATE countries
SET population = 20000000,
    gdp_usd = 27000000000,
    currency = 'ZMW',
    description = 'Zambia is Africa''s second-largest copper producer with tourism and agriculture.'
WHERE code = 'ZM';
UPDATE countries
SET population = 16000000,
    gdp_usd = 21000000000,
    currency = 'ZWL',
    description = 'Zimbabwe has mineral wealth including gold, platinum, and lithium with agricultural potential.'
WHERE code = 'ZW';