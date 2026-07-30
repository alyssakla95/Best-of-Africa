import { Env } from '../types';
import { generateCountryBrief, generateSectorAnalysis, generateReportHTML, storeReport } from '../lib/reports';

export const COUNTRY_BRIEF_ROTATION_SQL = `
    WITH latest_country_briefs AS (
        SELECT
            json_extract(metadata, '$.country_code') AS country_code,
            MAX(created_at) AS last_brief_at
        FROM generated_reports
        WHERE type = 'country_brief'
          AND json_extract(metadata, '$.country_code') IS NOT NULL
        GROUP BY json_extract(metadata, '$.country_code')
    )
    SELECT
        c.code AS country_code,
        SUM(
            CASE
                WHEN COALESCE(a.published_at, a.updated_at, a.created_at) >= datetime('now', '-30 days')
                THEN 1 ELSE 0
            END
        ) AS recent_articles,
        latest_country_briefs.last_brief_at
    FROM countries c
    JOIN articles a
      ON a.country_code = c.code
     AND a.status = 'published'
    LEFT JOIN latest_country_briefs
      ON latest_country_briefs.country_code = c.code
    GROUP BY c.code, latest_country_briefs.last_brief_at
    ORDER BY
        CASE WHEN latest_country_briefs.last_brief_at IS NULL THEN 0 ELSE 1 END ASC,
        CASE WHEN SUM(
            CASE
                WHEN COALESCE(a.published_at, a.updated_at, a.created_at) >= datetime('now', '-30 days')
                THEN 1 ELSE 0
            END
        ) > 0 THEN 0 ELSE 1 END ASC,
        latest_country_briefs.last_brief_at ASC,
        recent_articles DESC,
        c.code ASC
    LIMIT 1
`;

export async function selectNextCountryBriefTarget(env: Env): Promise<string | null> {
    // Rotate fairly through countries that actually have published evidence.
    // The previous "top in 24 hours" query repeatedly selected the same
    // high-volume country and left the rest of the continent permanently stale.
    const target = await env.DB.prepare(COUNTRY_BRIEF_ROTATION_SQL)
        .first<{ country_code: string }>();

    return target?.country_code || null;
}

export async function runDailyReporting(
    env: Env,
    options: { includeSectorAnalysis?: boolean } = {},
) {
    const includeSectorAnalysis = options.includeSectorAnalysis ?? true;
    console.log('Running scheduled reporting task...');
    const startedAt = Date.now();
    let completed = 0;
    const tasksSeen = includeSectorAnalysis ? 2 : 1;

    try {
        // Generate the least-recently briefed country. A country must have at
        // least one published record, so an empty placeholder is never stored.
        const targetCountry = await selectNextCountryBriefTarget(env);
        if (targetCountry) {
            console.log(`Generating Country Brief for ${targetCountry} (fair rotation)...`);
            const countryReport = await generateCountryBrief(env, targetCountry);
            const countryHtml = generateReportHTML(countryReport);
            await storeReport(env, countryReport, countryHtml);
            completed++;
            console.log(`Stored Country Brief: ${countryReport.title}`);
        } else {
            console.log('Country Brief skipped: no country has published evidence.');
        }

        // Sector analysis remains daily even though country briefs rotate six
        // times per day. This increases continental freshness without also
        // multiplying the more expensive pan-African sector workload.
        if (includeSectorAnalysis) {
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
        }

        await env.DB.prepare(`
            INSERT INTO agent_metrics (
                id, agent_name, run_at, duration_ms, tasks_seen,
                tasks_done, tasks_failed, model_used
            ) VALUES (?, 'scheduled-reporting', datetime('now'), ?, ?, ?, 0, ?)
        `).bind(crypto.randomUUID(), Date.now() - startedAt, tasksSeen, completed, '@cf/openai/gpt-oss-120b').run();
    } catch (error) {
        console.error('Error in daily reporting task:', error);
        await env.DB.prepare(`
            INSERT INTO agent_metrics (
                id, agent_name, run_at, duration_ms, tasks_seen,
                tasks_done, tasks_failed, model_used, error
            ) VALUES (?, 'scheduled-reporting', datetime('now'), ?, ?, ?, 1, ?, ?)
        `).bind(
            crypto.randomUUID(),
            Date.now() - startedAt,
            tasksSeen,
            completed,
            '@cf/openai/gpt-oss-120b',
            error instanceof Error ? error.message.slice(0, 1000) : 'Unknown reporting error',
        ).run();
        throw error;
    }
}
