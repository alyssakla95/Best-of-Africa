import { Env } from '../types';
import { generateCountryBrief, generateSectorAnalysis, generateReportHTML, storeReport } from '../lib/reports';

export async function runDailyReporting(env: Env) {
    console.log('Running daily reporting task...');
    const startedAt = Date.now();
    let completed = 0;

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
        completed++;
        console.log(`Stored Country Brief: ${countryReport.title}`);

        // 2. Generate a Sector Analysis (Randomly selected)
        const sectors = await env.DB.prepare(`
            SELECT s.id, COUNT(a.id) AS recent_articles
            FROM sectors s
            LEFT JOIN articles a ON a.sector_id = s.id
                AND a.status = 'published'
                AND a.published_at >= datetime('now', '-30 days')
            GROUP BY s.id
            ORDER BY recent_articles DESC, s.id ASC
            LIMIT 1
        `).all();
        if (sectors.results && sectors.results.length > 0) {
            const selectedSector = sectors.results[0] as Record<string, any>;

            console.log(`Generating Sector Analysis for ${selectedSector.id}...`);
            const sectorReport = await generateSectorAnalysis(env, selectedSector.id);
            const sectorHtml = generateReportHTML(sectorReport);
            await storeReport(env, sectorReport, sectorHtml);
            completed++;
            console.log(`Stored Sector Analysis: ${sectorReport.title}`);
        }

        await env.DB.prepare(`
            INSERT INTO agent_metrics (
                id, agent_name, run_at, duration_ms, tasks_seen,
                tasks_done, tasks_failed, model_used
            ) VALUES (?, 'daily-reporting', datetime('now'), ?, 2, ?, 0, ?)
        `).bind(crypto.randomUUID(), Date.now() - startedAt, completed, '@cf/openai/gpt-oss-120b').run();
    } catch (error) {
        console.error('Error in daily reporting task:', error);
        await env.DB.prepare(`
            INSERT INTO agent_metrics (
                id, agent_name, run_at, duration_ms, tasks_seen,
                tasks_done, tasks_failed, model_used, error
            ) VALUES (?, 'daily-reporting', datetime('now'), ?, 2, ?, 1, ?, ?)
        `).bind(
            crypto.randomUUID(),
            Date.now() - startedAt,
            completed,
            '@cf/openai/gpt-oss-120b',
            error instanceof Error ? error.message.slice(0, 1000) : 'Unknown reporting error',
        ).run();
        throw error;
    }
}
