-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 0026: Seed Investment Highlights for all 54 African Countries
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── NORTH AFRICA ─────────────────────────────────────────────────────────────
UPDATE countries SET investment_highlights = '["Energy & Gas Exports","Green Hydrogen","Manufacturing Zones"]' WHERE code = 'DZ';
UPDATE countries SET investment_highlights = '["Suez Canal Logistics","Tourism & Heritage","Renewable Energy"]' WHERE code = 'EG';
UPDATE countries SET investment_highlights = '["Proven Oil Reserves","Post-Conflict Reconstruction","Port Infrastructure"]' WHERE code = 'LY';
UPDATE countries SET investment_highlights = '["Phosphate Mining","Tourism & Culture","Automotive Manufacturing"]' WHERE code = 'MA';
UPDATE countries SET investment_highlights = '["Agricultural Potential","Mineral Resources","Political Transition"]' WHERE code = 'SD';
UPDATE countries SET investment_highlights = '["Offshore Oil & Gas","Tourism","Phosphate Exports"]' WHERE code = 'TN';
UPDATE countries SET investment_highlights = '["Resource-Rich North","Strategic Location","Iron Ore & Fishing"]' WHERE code = 'MR';

-- ── WEST AFRICA ──────────────────────────────────────────────────────────────
UPDATE countries SET investment_highlights = '["Cotton Exports","Port of Cotonou","Stable Democracy"]' WHERE code = 'BJ';
UPDATE countries SET investment_highlights = '["Gold Mining","Cotton Agriculture","Mineral Exploration"]' WHERE code = 'BF';
UPDATE countries SET investment_highlights = '["Diaspora Remittances","Tourism","Atlantic Fisheries"]' WHERE code = 'CV';
UPDATE countries SET investment_highlights = '["Cocoa Production","Port of Abidjan","Financial Hub"]' WHERE code = 'CI';
UPDATE countries SET investment_highlights = '["Eco-Tourism","Groundnut Exports","Atlantic Fisheries"]' WHERE code = 'GM';
UPDATE countries SET investment_highlights = '["Gold & Cocoa Exports","Stable Democracy","Tech Ecosystem"]' WHERE code = 'GH';
UPDATE countries SET investment_highlights = '["World''s Largest Bauxite Reserves","Iron Ore","Hydropower"]' WHERE code = 'GN';
UPDATE countries SET investment_highlights = '["Cashew Production","Coastal Fisheries","Agricultural Land"]' WHERE code = 'GW';
UPDATE countries SET investment_highlights = '["Iron Ore Exports","Rubber Industry","Rebuilding Economy"]' WHERE code = 'LR';
UPDATE countries SET investment_highlights = '["Gold Mining","Agricultural Land","Trans-Saharan Trade"]' WHERE code = 'ML';
UPDATE countries SET investment_highlights = '["Iron Ore Export","Atlantic Fisheries","Uranium Potential"]' WHERE code = 'MR';
UPDATE countries SET investment_highlights = '["Uranium Exports","Oil Production","Agricultural Expansion"]' WHERE code = 'NE';
UPDATE countries SET investment_highlights = '["Africa''s Largest Economy","Fintech Hub","Oil & Gas"]' WHERE code = 'NG';
UPDATE countries SET investment_highlights = '["New Oil & Gas Discoveries","Tourism","Stable Democracy"]' WHERE code = 'SN';
UPDATE countries SET investment_highlights = '["Diamond Exports","Iron Ore","Agricultural Rebuilding"]' WHERE code = 'SL';
UPDATE countries SET investment_highlights = '["Phosphate Mining","Port of Lomé","Transit Hub"]' WHERE code = 'TG';

-- ── EAST AFRICA ──────────────────────────────────────────────────────────────
UPDATE countries SET investment_highlights = '["Coffee & Tea Exports","Agricultural Land","Rebuilding Institutions"]' WHERE code = 'BI';
UPDATE countries SET investment_highlights = '["Vanilla & Cloves","Marine Tourism","Biodiversity"]' WHERE code = 'KM';
UPDATE countries SET investment_highlights = '["Strategic Logistics Port","Military Bases","Data Cables Hub"]' WHERE code = 'DJ';
UPDATE countries SET investment_highlights = '["Red Sea Access","Mining Potential","Fisheries"]' WHERE code = 'ER';
UPDATE countries SET investment_highlights = '["Aviation & Logistics Hub","Manufacturing","Agriculture"]' WHERE code = 'ET';
UPDATE countries SET investment_highlights = '["Fintech & Mobile Money","Geothermal Energy","Regional Tech Hub"]' WHERE code = 'KE';
UPDATE countries SET investment_highlights = '["Vanilla Production","Mining (Nickel, Cobalt)","Biodiversity Tourism"]' WHERE code = 'MG';
UPDATE countries SET investment_highlights = '["Financial Services","Tourism","Textile Manufacturing"]' WHERE code = 'MU';
UPDATE countries SET investment_highlights = '["Tech-Forward Governance","Services Sector","Tourism"]' WHERE code = 'RW';
UPDATE countries SET investment_highlights = '["LNG Exports","Agricultural Expansion","Tourism"]' WHERE code = 'MZ';
UPDATE countries SET investment_highlights = '["Island Tourism","High-Income Economy","Financial Services"]' WHERE code = 'SC';
UPDATE countries SET investment_highlights = '["Livestock Exports","Diaspora Remittances","Coastal Fisheries"]' WHERE code = 'SO';
UPDATE countries SET investment_highlights = '["Oil Reserves","Agricultural Land","Infrastructure Rebuilding"]' WHERE code = 'SS';
UPDATE countries SET investment_highlights = '["Gold Mining","Natural Gas","Safari Tourism"]' WHERE code = 'TZ';
UPDATE countries SET investment_highlights = '["Emerging Oil Sector","Agricultural Hub","Tech Growth"]' WHERE code = 'UG';
UPDATE countries SET investment_highlights = '["Malawi Gold","Tea & Tobacco","Agricultural Exports"]' WHERE code = 'MW';

-- ── CENTRAL AFRICA ───────────────────────────────────────────────────────────
UPDATE countries SET investment_highlights = '["Oil Production","Diamond Mining","Economic Diversification"]' WHERE code = 'AO';
UPDATE countries SET investment_highlights = '["Oil & Gas","Port of Douala","Agricultural Exports"]' WHERE code = 'CM';
UPDATE countries SET investment_highlights = '["Diamond & Gold Potential","Forestry","Rebuilding Economy"]' WHERE code = 'CF';
UPDATE countries SET investment_highlights = '["Oil Production","Livestock Exports","Agricultural Land"]' WHERE code = 'TD';
UPDATE countries SET investment_highlights = '["Oil with Diversification","Port of Brazzaville","Forestry"]' WHERE code = 'CG';
UPDATE countries SET investment_highlights = '["Cobalt & Copper Reserves","Coltan Mining","Hydropower Potential"]' WHERE code = 'CD';
UPDATE countries SET investment_highlights = '["Major Oil Producer","Highest GDP Per Capita in Region","LNG"]' WHERE code = 'GQ';
UPDATE countries SET investment_highlights = '["Manganese Exports","Eco-Tourism","Timber Industry"]' WHERE code = 'GA';
UPDATE countries SET investment_highlights = '["Cocoa Exports","Emerging Oil Potential","Sustainable Agriculture"]' WHERE code = 'ST';

-- ── SOUTHERN AFRICA ──────────────────────────────────────────────────────────
UPDATE countries SET investment_highlights = '["Diamond Mining","Strong Governance","Wildlife Tourism"]' WHERE code = 'BW';
UPDATE countries SET investment_highlights = '["Sugar Production","Textile Manufacturing","Financial Services"]' WHERE code = 'SZ';
UPDATE countries SET investment_highlights = '["Water Exports","Textile Manufacturing","Mountainous Tourism"]' WHERE code = 'LS';
UPDATE countries SET investment_highlights = '["Copper Mining","Safari Tourism","Agricultural Exports"]' WHERE code = 'MW';
UPDATE countries SET investment_highlights = '["Uranium & Diamonds","Green Hydrogen Potential","Safari Tourism"]' WHERE code = 'NA';
UPDATE countries SET investment_highlights = '["Mining & Manufacturing","Financial Services Hub","Biotech"]' WHERE code = 'ZA';
UPDATE countries SET investment_highlights = '["Copper Production","Safari Tourism","Agricultural Exports"]' WHERE code = 'ZM';
UPDATE countries SET investment_highlights = '["Gold & Platinum","Lithium Reserves","Agricultural Comeback"]' WHERE code = 'ZW';
