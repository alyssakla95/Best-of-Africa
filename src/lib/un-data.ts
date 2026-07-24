// ═══════════════════════════════════════════════════════════════════════════════
// UN DATA SERVICE
// Free development indicators from UN APIs
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getCached } from './cache';

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
export interface DevelopmentIndicator {
    code: string;
    name: string;
    value: number | null;
    year: number;
    country_code: string;
}

export interface SDGProgress {
    goal_number: number;
    goal_title: string;
    score: number | null;
    trend: 'improving' | 'stable' | 'declining' | 'unknown';
}

// ───────────────────────────────────────────────────────────────────────────────
// Key Development Indicators
// ───────────────────────────────────────────────────────────────────────────────
const UN_INDICATORS = {
    HDI: 'Human Development Index',
    LITERACY: 'Adult Literacy Rate',
    LIFE_EXPECTANCY: 'Life Expectancy at Birth',
    POVERTY: 'Population Below Poverty Line',
    GENDER_EQUALITY: 'Gender Inequality Index',
    ACCESS_ELECTRICITY: 'Access to Electricity (%)',
    ACCESS_INTERNET: 'Internet Users (%)',
    CO2_EMISSIONS: 'CO2 Emissions per Capita',
};

// ───────────────────────────────────────────────────────────────────────────────
// Fetch HDI Data (UNDP Human Development)
// ───────────────────────────────────────────────────────────────────────────────
export async function getHDIData(
    env: Env,
    countryCode: string
): Promise<{
    hdi: number | null;
    hdi_rank: number | null;
    hdi_category: string;
}> {
    return getCached(
        env,
        `hdi:${countryCode}`,
        async () => {
            try {
                // UNDP HDI API
                const response = await fetch(
                    `https://hdr.undp.org/api/v1/data/countries/${countryCode}`,
                    { headers: { 'Accept': 'application/json' } }
                );

                if (!response.ok) {
                    return { hdi: null, hdi_rank: null, hdi_category: 'unknown' };
                }

                const data = await response.json() as Record<string, any>;

                const hdi = data.hdi || null;
                let category = 'unknown';

                if (hdi !== null) {
                    if (hdi >= 0.8) category = 'Very High';
                    else if (hdi >= 0.7) category = 'High';
                    else if (hdi >= 0.55) category = 'Medium';
                    else category = 'Low';
                }

                return {
                    hdi,
                    hdi_rank: data.rank || null,
                    hdi_category: category,
                };
            } catch {
                return { hdi: null, hdi_rank: null, hdi_category: 'unknown' };
            }
        },
        { ttl: 86400 * 30 } // Cache for 30 days (HDI updates annually)
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// SDG Progress Tracker
// ───────────────────────────────────────────────────────────────────────────────
const SDG_GOALS = [
    { number: 1, title: 'No Poverty' },
    { number: 2, title: 'Zero Hunger' },
    { number: 3, title: 'Good Health and Well-being' },
    { number: 4, title: 'Quality Education' },
    { number: 5, title: 'Gender Equality' },
    { number: 6, title: 'Clean Water and Sanitation' },
    { number: 7, title: 'Affordable and Clean Energy' },
    { number: 8, title: 'Decent Work and Economic Growth' },
    { number: 9, title: 'Industry, Innovation and Infrastructure' },
    { number: 10, title: 'Reduced Inequalities' },
    { number: 11, title: 'Sustainable Cities and Communities' },
    { number: 12, title: 'Responsible Consumption and Production' },
    { number: 13, title: 'Climate Action' },
    { number: 16, title: 'Peace, Justice and Strong Institutions' },
    { number: 17, title: 'Partnerships for the Goals' },
];

export async function getSDGProgress(
    env: Env,
    countryCode: string
): Promise<SDGProgress[]> {
    return getCached(
        env,
        `sdg:${countryCode}`,
        async () => {
            // SDG Tracker API would be integrated here
            // For now, return structure without data
            return SDG_GOALS.map(goal => ({
                goal_number: goal.number,
                goal_title: goal.title,
                score: null,
                trend: 'unknown' as const,
            }));
        },
        { ttl: 86400 * 7 }
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Population and Demographics
// ───────────────────────────────────────────────────────────────────────────────
export interface Demographics {
    population: number;
    population_growth: number;
    urban_population_percent: number;
    median_age: number;
    youth_population_percent: number; // Under 25
}

export async function getDemographics(
    env: Env,
    countryCode: string
): Promise<Demographics | null> {
    return getCached(
        env,
        `demographics:${countryCode}`,
        async () => {
            try {
                // UN Population Division API
                const response = await fetch(
                    `https://population.un.org/dataportalapi/api/v1/data/indicators/49/locations/${countryCode}?startYear=2023&endYear=2023`,
                    { headers: { 'Accept': 'application/json' } }
                );

                if (!response.ok) return null;

                const data = await response.json() as Record<string, any>;

                // Parse and return
                return {
                    population: data.data?.[0]?.value || 0,
                    population_growth: 0,
                    urban_population_percent: 0,
                    median_age: 0,
                    youth_population_percent: 0,
                };
            } catch {
                return null;
            }
        },
        { ttl: 86400 * 30 }
    );
}

// ───────────────────────────────────────────────────────────────────────────────
// Get Full Development Profile
// ───────────────────────────────────────────────────────────────────────────────
export async function getDevelopmentProfile(
    env: Env,
    countryCode: string
): Promise<{
    hdi: { hdi: number | null; hdi_rank: number | null; hdi_category: string };
    sdg_progress: SDGProgress[];
    demographics: Demographics | null;
}> {
    const [hdi, sdg, demographics] = await Promise.all([
        getHDIData(env, countryCode),
        getSDGProgress(env, countryCode),
        getDemographics(env, countryCode),
    ]);

    return { hdi, sdg_progress: sdg, demographics };
}
