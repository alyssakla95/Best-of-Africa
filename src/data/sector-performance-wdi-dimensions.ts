export type SectorPerformanceDimension = {
    indicator_code: string;
    indicator_name: string;
    label: string;
    value: number;
    unit: string;
    comparison_value: number;
    comparison_unit: string;
    markets_rising_pct: number;
    countries_reported: number;
    coverage_pct: number;
    period_start: number;
    period_end: number;
    movement: 'rising' | 'falling' | 'stable';
    interpretation: string;
    caveat: string;
    source_name: 'World Bank World Development Indicators';
    source_url: string;
};

type Metadata = Pick<SectorPerformanceDimension, 'indicator_name' | 'label' | 'unit' | 'comparison_unit' | 'interpretation' | 'caveat'>;
type Reading = Pick<SectorPerformanceDimension, 'value' | 'comparison_value' | 'markets_rising_pct' | 'countries_reported' | 'coverage_pct' | 'period_start' | 'period_end'>;

const metadata: Record<string, Metadata> = {
    'NV.AGR.TOTL.ZS': { indicator_name: 'Agriculture share of GDP', label: 'Productive structure', unit: '% of GDP', comparison_unit: 'percentage points', interpretation: 'Shows how much national output remains directly tied to agriculture, forestry and fishing.', caveat: 'A larger share can indicate sector importance or limited diversification; it is not a profitability measure.' },
    'SL.AGR.EMPL.ZS': { indicator_name: 'Employment in agriculture', label: 'Employment exposure', unit: '% of employment', comparison_unit: 'percentage points', interpretation: 'Measures the workforce share dependent on agricultural activity and structural transition.', caveat: 'Employment shares do not show wages, informality, labour productivity or seasonal underemployment.' },
    'AG.YLD.CREL.KG': { indicator_name: 'Cereal yield', label: 'Crop productivity', unit: 'kg per hectare', comparison_unit: 'kg per hectare', interpretation: 'Provides a comparable physical productivity signal for harvested cereal land.', caveat: 'Crop mix, weather, irrigation and input use differ materially; cereal yield does not represent all agriculture.' },
    'EG.ELC.ACCS.ZS': { indicator_name: 'Access to electricity', label: 'Electricity access', unit: '% of population', comparison_unit: 'percentage points', interpretation: 'Measures the population able to use electricity and the remaining addressable access gap.', caveat: 'Connection does not establish reliability, affordability, available capacity or service quality.' },
    'EG.FEC.RNEW.ZS': { indicator_name: 'Renewable energy consumption', label: 'Renewable energy share', unit: '% of final energy use', comparison_unit: 'percentage points', interpretation: 'Shows renewable sources in total final energy consumption, including traditional biomass.', caveat: 'A high share may reflect modern clean power or reliance on traditional biomass; generation mix must be checked separately.' },
    'EG.ELC.LOSS.ZS': { indicator_name: 'Electric power transmission and distribution losses', label: 'Grid losses', unit: '% of output', comparison_unit: 'percentage points', interpretation: 'Indicates how much generated electricity is lost before billed consumption.', caveat: 'Higher values are generally adverse, but reporting quality and network geography affect comparability.' },
    'FX.OWN.TOTL.ZS': { indicator_name: 'Account ownership at a financial institution or mobile-money provider', label: 'Financial account access', unit: '% of adults', comparison_unit: 'percentage points', interpretation: 'Measures formal or mobile-money account penetration among adults.', caveat: 'Ownership does not show account activity, balances, credit access, affordability or consumer protection.' },
    'FB.ATM.TOTL.P5': { indicator_name: 'Automated teller machines', label: 'Physical banking access', unit: 'per 100,000 adults', comparison_unit: 'per 100,000 adults', interpretation: 'Tracks the physical cash-access footprint of the regulated financial system.', caveat: 'ATM density may decline as digital finance advances and should not be interpreted alone as financial-sector contraction.' },
    'FR.INR.LEND': { indicator_name: 'Lending interest rate', label: 'Cost of bank credit', unit: '%', comparison_unit: 'percentage points', interpretation: 'Shows the reported rate charged by banks on private-sector loans.', caveat: 'Higher rates are generally restrictive; definitions, inflation and borrower risk differ across countries.' },
    'SH.XPD.CHEX.GD.ZS': { indicator_name: 'Current health expenditure', label: 'Health-system funding', unit: '% of GDP', comparison_unit: 'percentage points', interpretation: 'Measures current public and private health spending relative to the economy.', caveat: 'A higher share can reflect stronger resourcing, high costs or weak GDP; it does not measure outcomes or efficiency.' },
    'SH.MED.PHYS.ZS': { indicator_name: 'Physicians', label: 'Physician capacity', unit: 'per 1,000 people', comparison_unit: 'per 1,000 people', interpretation: 'Provides a comparable signal of physician availability relative to population.', caveat: 'National density obscures urban-rural distribution, specialisation, vacancies and quality of care.' },
    'SH.MED.BEDS.ZS': { indicator_name: 'Hospital beds', label: 'Inpatient capacity', unit: 'per 1,000 people', comparison_unit: 'per 1,000 people', interpretation: 'Measures reported inpatient bed capacity relative to population.', caveat: 'Coverage is materially thinner and bed counts do not establish staffing, equipment, occupancy or clinical quality.' },
    'NE.GDI.FTOT.ZS': { indicator_name: 'Gross fixed capital formation', label: 'Investment intensity', unit: '% of GDP', comparison_unit: 'percentage points', interpretation: 'Shows economy-wide spending on fixed assets relative to output.', caveat: 'It includes public and private machinery, buildings and other assets, not only infrastructure projects.' },
    'IS.AIR.PSGR': { indicator_name: 'Air transport passengers carried', label: 'Air traffic growth', unit: '% annual change', comparison_unit: 'percentage points', interpretation: 'Measures the latest annual change in passengers carried by registered air carriers.', caveat: 'Carrier nationality, route networks and post-pandemic base effects can separate this series from destination demand.' },
    'IS.SHP.GOOD.TU': { indicator_name: 'Container port traffic', label: 'Port throughput growth', unit: '% annual change', comparison_unit: 'percentage points', interpretation: 'Measures annual movement in twenty-foot-equivalent container throughput.', caveat: 'Transshipment, commodity mix, port disruptions and missing ports affect country comparability.' },
    'NV.IND.MANF.ZS': { indicator_name: 'Manufacturing value added', label: 'Manufacturing weight', unit: '% of GDP', comparison_unit: 'percentage points', interpretation: 'Shows manufacturing value added as a share of total economic output.', caveat: 'The share can fall while real output grows if other sectors expand faster.' },
    'TX.VAL.MANF.ZS.UN': { indicator_name: 'Manufactured exports', label: 'Export sophistication', unit: '% of merchandise exports', comparison_unit: 'percentage points', interpretation: 'Measures manufactured products within merchandise exports.', caveat: 'A higher share does not establish domestic value capture, complexity, margins or ownership.' },
    'SL.IND.EMPL.ZS': { indicator_name: 'Employment in industry', label: 'Industrial employment', unit: '% of employment', comparison_unit: 'percentage points', interpretation: 'Tracks the workforce share employed in industry, including construction.', caveat: 'The measure is broader than manufacturing and does not show wages, formality or productivity.' },
    'IT.CEL.SETS.P2': { indicator_name: 'Mobile cellular subscriptions', label: 'Mobile connectivity', unit: 'per 100 people', comparison_unit: 'per 100 people', interpretation: 'Measures active mobile subscriptions relative to population.', caveat: 'Multiple SIM ownership means values can exceed 100 and does not establish device quality, coverage or affordability.' },
    'IT.NET.BBND.P2': { indicator_name: 'Fixed broadband subscriptions', label: 'Fixed broadband depth', unit: 'per 100 people', comparison_unit: 'per 100 people', interpretation: 'Measures fixed high-speed internet subscriptions relative to population.', caveat: 'It excludes mobile broadband and can understate access where mobile networks dominate.' },
    'IT.NET.SECR.P6': { indicator_name: 'Secure internet servers', label: 'Digital transaction infrastructure', unit: 'per 1 million people', comparison_unit: 'per 1 million people', interpretation: 'Provides a supply-side signal of internet infrastructure able to host encrypted transactions.', caveat: 'Cloud hosting location and server configuration make it an infrastructure proxy, not a digital-economy valuation.' },
    'ST.INT.RCPT.CD': { indicator_name: 'International tourism receipts', label: 'Reported inbound receipts', unit: 'current US$', comparison_unit: 'current US$', interpretation: 'Shows the latest reported inbound visitor receipts and their absolute movement.', caveat: 'The current WDI release is dated for many countries and values are affected by exchange rates and pandemic-era reporting.' },
    'ST.INT.ARVL': { indicator_name: 'International tourism arrivals', label: 'Reported international arrivals', unit: 'visitors', comparison_unit: 'visitors', interpretation: 'Shows the latest reported count of international inbound arrivals.', caveat: 'The current WDI release is dated for many countries and national counting methods differ.' },
};

const readings: Record<string, Reading> = {
    'NV.AGR.TOTL.ZS': { value: 20, comparison_value: 0, markets_rising_pct: 51, countries_reported: 51, coverage_pct: 94.4, period_start: 2025, period_end: 2025 },
    'SL.AGR.EMPL.ZS': { value: 40.2, comparison_value: -0.5, markets_rising_pct: 3.8, countries_reported: 53, coverage_pct: 98.1, period_start: 2022, period_end: 2025 },
    'AG.YLD.CREL.KG': { value: 1353.5, comparison_value: 0.3, markets_rising_pct: 50, countries_reported: 52, coverage_pct: 96.3, period_start: 2023, period_end: 2024 },
    'EG.ELC.ACCS.ZS': { value: 60.9, comparison_value: 1.8, markets_rising_pct: 72.2, countries_reported: 54, coverage_pct: 100, period_start: 2024, period_end: 2024 },
    'EG.FEC.RNEW.ZS': { value: 65.7, comparison_value: -0.3, markets_rising_pct: 20.4, countries_reported: 54, coverage_pct: 100, period_start: 2021, period_end: 2022 },
    'EG.ELC.LOSS.ZS': { value: 18.3, comparison_value: 0, markets_rising_pct: 59.5, countries_reported: 37, coverage_pct: 68.5, period_start: 2023, period_end: 2024 },
    'FX.OWN.TOTL.ZS': { value: 52.2, comparison_value: 4.9, markets_rising_pct: 75.6, countries_reported: 41, coverage_pct: 75.9, period_start: 2021, period_end: 2024 },
    'FB.ATM.TOTL.P5': { value: 7.2, comparison_value: 0, markets_rising_pct: 62.7, countries_reported: 51, coverage_pct: 94.4, period_start: 2017, period_end: 2024 },
    'FR.INR.LEND': { value: 11.8, comparison_value: 0, markets_rising_pct: 47.4, countries_reported: 38, coverage_pct: 70.4, period_start: 2016, period_end: 2025 },
    'SH.XPD.CHEX.GD.ZS': { value: 4.5, comparison_value: 0, markets_rising_pct: 50, countries_reported: 54, coverage_pct: 100, period_start: 2023, period_end: 2023 },
    'SH.MED.PHYS.ZS': { value: 0.2, comparison_value: 0, markets_rising_pct: 63.5, countries_reported: 52, coverage_pct: 96.3, period_start: 2017, period_end: 2023 },
    'SH.MED.BEDS.ZS': { value: 0.9, comparison_value: 0, markets_rising_pct: 33.3, countries_reported: 24, coverage_pct: 44.4, period_start: 2017, period_end: 2023 },
    'NE.GDI.FTOT.ZS': { value: 21, comparison_value: 0, markets_rising_pct: 50, countries_reported: 46, coverage_pct: 85.2, period_start: 2023, period_end: 2025 },
    'IS.AIR.PSGR': { value: 9.5, comparison_value: -55.6, markets_rising_pct: 17.5, countries_reported: 40, coverage_pct: 74.1, period_start: 2019, period_end: 2023 },
    'IS.SHP.GOOD.TU': { value: 5.1, comparison_value: 5.9, markets_rising_pct: 60.5, countries_reported: 38, coverage_pct: 70.4, period_start: 2019, period_end: 2024 },
    'NV.IND.MANF.ZS': { value: 9.5, comparison_value: -0.3, markets_rising_pct: 34.7, countries_reported: 49, coverage_pct: 90.7, period_start: 2017, period_end: 2025 },
    'TX.VAL.MANF.ZS.UN': { value: 10.4, comparison_value: -0.3, markets_rising_pct: 41.7, countries_reported: 48, coverage_pct: 88.9, period_start: 2016, period_end: 2025 },
    'SL.IND.EMPL.ZS': { value: 14.6, comparison_value: 0.1, markets_rising_pct: 83, countries_reported: 53, coverage_pct: 98.1, period_start: 2022, period_end: 2025 },
    'IT.CEL.SETS.P2': { value: 96.3, comparison_value: 3.3, markets_rising_pct: 75.9, countries_reported: 54, coverage_pct: 100, period_start: 2022, period_end: 2024 },
    'IT.NET.BBND.P2': { value: 0.7, comparison_value: 0.1, markets_rising_pct: 75.9, countries_reported: 54, coverage_pct: 100, period_start: 2021, period_end: 2024 },
    'IT.NET.SECR.P6': { value: 52.3, comparison_value: 4.2, markets_rising_pct: 77.8, countries_reported: 54, coverage_pct: 100, period_start: 2024, period_end: 2024 },
    'ST.INT.RCPT.CD': { value: 191000000, comparison_value: -90000000, markets_rising_pct: 20.9, countries_reported: 43, coverage_pct: 79.6, period_start: 2016, period_end: 2020 },
    'ST.INT.ARVL': { value: 351000, comparison_value: -70600, markets_rising_pct: 35.6, countries_reported: 45, coverage_pct: 83.3, period_start: 2016, period_end: 2020 },
};

const sectors: Record<string, string[]> = {
    agriculture: ['NV.AGR.TOTL.ZS', 'SL.AGR.EMPL.ZS', 'AG.YLD.CREL.KG'],
    energy: ['EG.ELC.ACCS.ZS', 'EG.FEC.RNEW.ZS', 'EG.ELC.LOSS.ZS'],
    finance: ['FX.OWN.TOTL.ZS', 'FB.ATM.TOTL.P5', 'FR.INR.LEND'],
    healthcare: ['SH.XPD.CHEX.GD.ZS', 'SH.MED.PHYS.ZS', 'SH.MED.BEDS.ZS'],
    infrastructure: ['NE.GDI.FTOT.ZS', 'IS.AIR.PSGR', 'IS.SHP.GOOD.TU'],
    manufacturing: ['NV.IND.MANF.ZS', 'TX.VAL.MANF.ZS.UN', 'SL.IND.EMPL.ZS'],
    technology: ['IT.CEL.SETS.P2', 'IT.NET.BBND.P2', 'IT.NET.SECR.P6'],
    tourism: ['IS.AIR.PSGR', 'ST.INT.RCPT.CD', 'ST.INT.ARVL'],
};

export const BUNDLED_WDI_SECTOR_DIMENSIONS: Record<string, SectorPerformanceDimension[]> = Object.fromEntries(
    Object.entries(sectors).map(([sector, codes]) => [sector, codes.map(indicator_code => {
        const reading = readings[indicator_code];
        const comparison = reading.comparison_value;
        return {
            indicator_code,
            ...metadata[indicator_code],
            ...reading,
            movement: comparison > 0.25 ? 'rising' : comparison < -0.25 ? 'falling' : 'stable',
            source_name: 'World Bank World Development Indicators' as const,
            source_url: `https://data.worldbank.org/indicator/${indicator_code}`,
        };
    })]),
);
