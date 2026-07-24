// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS SERVICE
// PDF generation and scheduled report automation
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';
import { getKeyEconomicStats } from './economics';
import { callConfiguredAI } from './ai';

// ───────────────────────────────────────────────────────────────────────────────
// Report Types
// ───────────────────────────────────────────────────────────────────────────────
export type ReportType = 'country_brief' | 'sector_analysis' | 'weekly_digest' | 'investment_outlook';

export interface ReportData {
    type: ReportType;
    title: string;
    subtitle: string;
    generated_at: string;
    sections: ReportSection[];
    metadata: Record<string, any>;
}

export interface ReportSection {
    title: string;
    content: string;
    data?: any;
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Country Brief Report
// ───────────────────────────────────────────────────────────────────────────────
export async function generateCountryBrief(
    env: Env,
    countryCode: string
): Promise<ReportData> {
    // Get country info
    const country = await env.DB.prepare(`
        SELECT name, flag_emoji, region, diplomacy_score, image_strength_score
        FROM countries WHERE code = ?
    `).bind(countryCode).first();

    if (!country) throw new Error('Country not found');

    const c = country as Record<string, any>;

    // Get recent articles
    const articles = await env.DB.prepare(`
        SELECT a.title, a.summary, a.source_title, a.source_url, s.name as sector_name, a.published_at
        FROM articles a
        LEFT JOIN sectors s ON a.sector_id = s.id
        WHERE a.country_code = ? AND a.status = 'published'
        ORDER BY a.published_at DESC
        LIMIT 10
    `).bind(countryCode).all();

    // Get sector coverage
    const sectors = await env.DB.prepare(`
        SELECT s.name, COUNT(a.id) as count, AVG(a.engagement_score) as avg_engagement
        FROM sectors s
        LEFT JOIN articles a ON a.sector_id = s.id AND a.country_code = ?
        GROUP BY s.id
        ORDER BY count DESC
    `).bind(countryCode).all();

    // Get economic data
    const economics = await getKeyEconomicStats(env, countryCode);

    // Generate executive summary
    const articleContext = (articles.results || []).slice(0, 10).map((a: any, index: number) =>
        `[${index + 1}] ${a.published_at || 'date unavailable'} — ${a.title}\nSector: ${a.sector_name || 'unavailable'}\nSource: ${a.source_title || 'unavailable'} | ${a.source_url || 'URL unavailable'}\nEvidence: ${(a.summary || 'summary unavailable').slice(0, 1000)}`
    ).join('\n');

    let aiSummary = '';
    try {
        const prompt = `System: You are BOA-Story's country evidence editor. Be comprehensive, source-explicit and exact. Separate reported facts, analysis, uncertainty and missing evidence.

User: Write a full country evidence brief for ${c.name} based on recent coverage:

${articleContext}`;
        aiSummary = (await callConfiguredAI(env, { prompt: `${prompt}\n\nUse only this evidence. Include chronology, exact named actors and figures, documented mechanisms, stakeholder effects, policy and operating implications, alternative explanations, counter-evidence, limitations, a claim ledger, and prioritized verification steps. Do not invent missing facts.`, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' })) || '';
    } catch (e) {
        console.error('AI summary failed:', e);
    }

    return {
        type: 'country_brief',
        title: `${c.name} Country Brief`,
        subtitle: `Market Intelligence Report | ${c.region} Africa`,
        generated_at: new Date().toISOString(),
        sections: [
            {
                title: 'Executive Summary',
                content: aiSummary,
            },
            {
                title: 'Economic Indicators',
                content: '',
                data: economics,
            },
            {
                title: 'Sector Coverage',
                content: '',
                data: (sectors.results || []).map((s: any) => ({
                    sector: s.name,
                    articles: s.count,
                    engagement: Math.round(s.avg_engagement || 0),
                })),
            },
            {
                title: 'Recent Headlines',
                content: '',
                data: (articles.results || []).map((a: any) => ({
                    title: a.title,
                    sector: a.sector_name,
                    date: a.published_at,
                })),
            },
        ],
        metadata: {
            country_code: countryCode,
            country_name: c.name,
            flag: c.flag_emoji,
            diplomacy_score: c.diplomacy_score,
            image_strength: c.image_strength_score,
        },
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate Sector Analysis Report
// ───────────────────────────────────────────────────────────────────────────────
export async function generateSectorAnalysis(
    env: Env,
    sectorId: string
): Promise<ReportData> {
    const sector = await env.DB.prepare(
        'SELECT name, description FROM sectors WHERE id = ?'
    ).bind(sectorId).first();

    if (!sector) throw new Error('Sector not found');
    const s = sector as Record<string, any>;

    // Country breakdown
    const countryBreakdown = await env.DB.prepare(`
        SELECT c.name, c.code, COUNT(a.id) as count, AVG(a.engagement_score) as engagement
        FROM countries c
        LEFT JOIN articles a ON a.country_code = c.code AND a.sector_id = ?
        WHERE a.status = 'published'
        GROUP BY c.code
        HAVING count > 0
        ORDER BY count DESC
        LIMIT 10
    `).bind(sectorId).all();

    // Recent articles
    const articles = await env.DB.prepare(`
        SELECT a.title, a.summary, a.source_title, a.source_url, c.name as country_name, a.published_at
        FROM articles a
        LEFT JOIN countries c ON a.country_code = c.code
        WHERE a.sector_id = ? AND a.status = 'published'
        ORDER BY a.published_at DESC
        LIMIT 10
    `).bind(sectorId).all();

    // analysis
    let aiAnalysis = '';
    try {
        const context = (articles.results || []).slice(0, 10).map((a: any, index: number) =>
            `[${index + 1}] ${a.published_at || 'date unavailable'} — ${a.title}\nCountry: ${a.country_name || 'unavailable'}\nSource: ${a.source_title || 'unavailable'} | ${a.source_url || 'URL unavailable'}\nEvidence: ${(a.summary || 'summary unavailable').slice(0, 1000)}`
        ).join('\n');

        const prompt = `System: You are BOA-Story's sector evidence editor. Produce a comprehensive, source-explicit analysis and separate facts, supported interpretation, uncertainty and missing evidence.

User: Write a sector analysis for "${s.name}" across Africa based on:
${context}`;
        aiAnalysis = (await callConfiguredAI(env, { prompt: `${prompt}\n\nProduce a detailed evidence record: market context, dated developments, actors, documented mechanisms, country differences, regulatory implications, operational constraints, dependencies, counter-evidence, alternative explanations, limitations, claim ledger and further diligence. Do not estimate absent figures.`, max_tokens: 7000, temperature: 0.2, response_profile: 'deep-analysis' })) || '';
    } catch (e) {
        console.error('AI analysis failed:', e);
    }

    return {
        type: 'sector_analysis',
        title: `${s.name} Sector Analysis`,
        subtitle: 'Pan-African Industry Intelligence',
        generated_at: new Date().toISOString(),
        sections: [
            { title: 'Industry Outlook', content: aiAnalysis },
            { title: 'Country Breakdown', content: '', data: countryBreakdown.results },
            { title: 'Recent Coverage', content: '', data: articles.results },
        ],
        metadata: { sector_id: sectorId, sector_name: s.name },
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Generate HTML Report (for PDF conversion)
// ───────────────────────────────────────────────────────────────────────────────
export function generateReportHTML(report: ReportData): string {
    const sectionsHTML = report.sections.map(section => `
        <div class="section">
            <h2>${section.title}</h2>
            ${section.content ? `<p>${section.content}</p>` : ''}
            ${section.data ? `<pre>${JSON.stringify(section.data, null, 2)}</pre>` : ''}
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${report.title}</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { border-bottom: 3px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
        h1 { color: #1a1a2e; margin: 0; }
        .subtitle { color: #666; margin-top: 8px; }
        .section { margin: 30px 0; }
        h2 { color: #d4af37; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        pre { background: #f5f5f5; padding: 15px; overflow-x: auto; font-size: 12px; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${report.title}</h1>
        <div class="subtitle">${report.subtitle}</div>
        <div class="date">Prepared: ${new Date(report.generated_at).toLocaleDateString()}</div>
    </div>
    
    ${sectionsHTML}
    
    <div class="footer">
        <p>Prepared by the BOA-Story briefing desk.</p>
        <p>© ${new Date().getFullYear()} BOA-Story. All rights reserved.</p>
    </div>
</body>
</html>
    `;
}

// ───────────────────────────────────────────────────────────────────────────────
// Store Generated Report
// ───────────────────────────────────────────────────────────────────────────────
export async function storeReport(
    env: Env,
    report: ReportData,
    html: string
): Promise<string> {
    const reportId = crypto.randomUUID();

    await env.DB.prepare(`
        INSERT INTO generated_reports (id, type, title, metadata, html_content, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
        reportId,
        report.type,
        report.title,
        JSON.stringify(report.metadata),
        html
    ).run();

    return reportId;
}
