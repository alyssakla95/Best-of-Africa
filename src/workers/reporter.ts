import { Env } from '../types';
import { generateCountryBrief, generateSectorAnalysis, generateReportHTML, storeReport } from '../lib/reports';

export async function runDailyReporting(env: Env) {
    console.log('Running daily reporting task...');

    try {
        // 1. Generate a Country Brief (Smart Scheduling)
        // Find the country with the most news in the last 24 hours
        const topCountry = await env.DB.prepare(`
            SELECT country_code, COUNT(*) as count 
            FROM articles 
            WHERE status = 'published' AND published_at > datetime('now', '-24 hours') 
            AND country_code IS NOT NULL
            GROUP BY country_code 
            ORDER BY count DESC 
            LIMIT 1
        `).first();

        // Default to 'NG' (Nigeria) or 'ZA' if no news today
        const targetCountry = (topCountry as Record<string, any>)?.country_code || 'NG';

        console.log(`Generating Country Brief for ${targetCountry} (Trending Topic)...`);
        const countryReport = await generateCountryBrief(env, targetCountry);
        const countryHtml = generateReportHTML(countryReport);
        await storeReport(env, countryReport, countryHtml);
        console.log(`Stored Country Brief: ${countryReport.title}`);

        // 2. Generate a Sector Analysis (Randomly selected)
        const sectors = await env.DB.prepare('SELECT id FROM sectors').all();
        if (sectors.results && sectors.results.length > 0) {
            const randomSector = sectors.results[Math.floor(Math.random() * sectors.results.length)] as Record<string, any>;

            console.log(`Generating Sector Analysis for ${randomSector.id}...`);
            const sectorReport = await generateSectorAnalysis(env, randomSector.id);
            const sectorHtml = generateReportHTML(sectorReport);
            await storeReport(env, sectorReport, sectorHtml);
            console.log(`Stored Sector Analysis: ${sectorReport.title}`);
        }

    } catch (error) {
        console.error('Error in daily reporting task:', error);
    }
}
