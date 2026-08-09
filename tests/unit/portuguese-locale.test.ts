import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import { TRANSLATIONS } from '../../frontend/src/i18n/dict';
import {
    applyPortuguese1945Orthography,
    PORTUGUESE_INTERFACE_PHRASES,
    PORTUGUESE_LOCALE,
    PORTUGUESE_ORTHOGRAPHY,
    translatePortugueseInterfaceText,
} from '../../frontend/src/i18n/pt-PT-1945';
import { translationRouter } from '../../src/routes/translation';
import { localiseStoredReportForPortuguese } from '../../src/routes/market-intel';
import { translateText } from '../../src/lib/translate';
import { createMockEnv } from '../mocks/env';
import {
    normalisePortuguesePortugal1945,
    portugueseCountryName,
    portugueseSectorName,
} from '../../src/lib/portuguese';

const looksPortuguese = (value: string) => {
    if (value === 'Best of Africa.') return true;
    if (/^(?:Idioma|Remover|Fotografia|Fontes|Contacto|Conta|Confiança|Definições|Empresas|Inteligência|Ler|Privacidade|Sobre|Termos|Facultativo|Obrigatório)$/i.test(value)) return true;
    if (/\b(?:abrir|actual|ajudá-lo|análise|apoiar|candidato|candidata|consultado|direitos|documentada|económicos|fotografia|históricas|identificadas|mercado|nome|observações|oficial|país|países|pesquisar|portal|preparado|primeiro|priorizar|projecções|publicações|recurso|registo|reservados|segundo|seleccione|síntese|tentar|terceiro)\b/i.test(value)) return true;
    const markers = value.match(/\b(?:aos?|as|com|da|das|de|do|dos|em|entre|num|numa|não|o|os|para|pela|pelas|pelo|pelos|por|que|sem|uma|um)\b/gi) || [];
    return /[ãõçáéíóúâêôà]/i.test(value) && markers.length > 0;
};

describe('coded Portuguese interface locale', () => {
    it('covers exact user-facing English copy throughout the frontend source', () => {
        const audit = spawnSync(process.execPath, [
            'scripts/audit-portuguese-interface.mjs',
        ], { cwd: process.cwd(), encoding: 'utf8' });

        expect(audit.status, `${audit.stdout}\n${audit.stderr}`).toBe(0);
    }, 15_000);

    it('contains a Portuguese source string for every maintained English key', () => {
        const missing = Object.keys(TRANSLATIONS.en)
            .filter((key) => !TRANSLATIONS.pt?.[key]?.trim());

        expect(missing).toEqual([]);
    });

    it('uses European Portuguese and the pre-1990 spellings requested for the product', () => {
        expect(PORTUGUESE_LOCALE).toBe('pt-PT');
        expect(PORTUGUESE_ORTHOGRAPHY).toBe('1945');
        expect(applyPortuguese1945Orthography('setor, atividade, atual, atualizada, projeto, objetivo e perspetiva'))
            .toBe('sector, actividade, actual, actualizada, projecto, objectivo e perspectiva');

        const maintainedCopy = Object.values(TRANSLATIONS.pt).join('\n');
        expect(maintainedCopy).not.toMatch(/\bsetor(?:es|ial|iais)?\b/i);
        expect(maintainedCopy).not.toMatch(/\batividade(?:s)?\b/i);
        expect(maintainedCopy).not.toMatch(/\bperspetiva(?:s)?\b/i);

        const completeInterfaceCopy = Object.values(PORTUGUESE_INTERFACE_PHRASES)
            .map(applyPortuguese1945Orthography)
            .join('\n');
        expect(completeInterfaceCopy).not.toMatch(/\b(?:setor(?:es|ial|iais)?|atividade(?:s)?|perspetiva(?:s)?|projeto(?:s)?|objetivo(?:s)?)\b/i);
    });

    it('normalises stored publication copy without breaking Portuguese grammar or capitalisation', () => {
        expect(normalisePortuguesePortugal1945('Faturas vazadas e gastos; regras de política sobre os gastos. Uma justificativa em Cape Town durante maio-junho 2026.'))
            .toBe('Facturas divulgadas e despesas; regras internas sobre as despesas. Uma justificação na Cidade do Cabo entre Maio e Junho 2026.');
        expect(normalisePortuguesePortugal1945('Desafios socioeconômicos de sua zona numa cerimônia em Liberia.'))
            .toBe('Desafios socioeconómicos da sua zona numa cerimónia em Libéria.');
        expect(normalisePortuguesePortugal1945('Addis Ababa sediará a cúpula, uma vitrine apoiada por coalizões. O indicador registrou alta de 48.4% YoY.'))
            .toBe('Addis Ababa acolherá a cimeira, uma montra apoiada por coligações. O indicador registou aumento de 48,4% em termos homólogos.');
        expect(normalisePortuguesePortugal1945('A região deve priorizar projectos rumo à indústria.'))
            .toBe('A região deve dar prioridade a projectos no sentido da indústria.');
        expect(normalisePortuguesePortugal1945('Indo além de commodities, precisamos entender nossas regras, planejar e fortalecer o mercado de câmbio.'))
            .toBe('Para além de matérias-primas, precisamos compreender as nossas regras, planear e reforçar o mercado cambial.');
        expect(portugueseCountryName('NG', 'Nigeria')).toBe('Nigéria');
        expect(portugueseCountryName('EG', 'Egypt')).toBe('Egipto');
        expect(portugueseSectorName('Finance & Investment')).toBe('Finanças e investimento');
    });

    it('ships source-owned copy for both foreground intelligence products', () => {
        expect(PORTUGUESE_INTERFACE_PHRASES['African markets, measured sector by sector.'])
            .toBe('Os mercados africanos, medidos sector a sector.');
        expect(PORTUGUESE_INTERFACE_PHRASES['Africa’s economy in one verifiable record.'])
            .toBe('A economia africana num registo verificável.');
    });

    it('covers every enterprise pricing-card label and deliverable', () => {
        const enterprisePricingCopy = [
            '10 business days', 'Four weeks', 'per month',
            'One-country evidence file', 'Decision brief and source ledger',
            'Priority diligence questions', '45-minute findings review',
            'Up to three candidate countries', 'All six published pilot deliverables',
            'One consolidated revision', '60-minute closeout review',
            'Weekly source monitoring', 'Monthly change memorandum',
            'Material-signal alerts', 'Cancel before the next month',
        ];

        expect(enterprisePricingCopy.filter(value => !translatePortugueseInterfaceText(value))).toEqual([]);
    });

    it('covers every membership-card benefit and credibility statement', () => {
        const membershipCopy = [
            'Every published story and evidence brief in full',
            'Country, sector and continental intelligence pages',
            'Article audio, available translations and personal library',
            'Everything in Reader Member',
            'Supports deeper country and sector evidence updates',
            'Early-member recognition while the product is being proven',
            'Everything in Sustaining Member',
            'Optional founding-backer recognition on your profile',
            'Helps fund broader country coverage and source acquisition',
            'Do higher tiers unlock more reader features?',
            'What is proven today?',
        ];

        expect(membershipCopy.filter(value => !translatePortugueseInterfaceText(value))).toEqual([]);
    });

    it('covers every direct interface phrase on the two foreground intelligence pages', () => {
        const maintainedEnglish = new Set(Object.values(TRANSLATIONS.en));
        const missing = new Set<string>();
        for (const file of [
            'frontend/src/pages/beta/BetaIntelligence.tsx',
            'frontend/src/pages/beta/BetaContinentalOverview.tsx',
            'frontend/src/components/PageReadingGuide.tsx',
        ]) {
            const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            const record = (raw: string) => {
                const value = raw.replace(/\s+/g, ' ').trim();
                if (value.length > 1 && /[A-Za-z]{2}/.test(value)
                    && (value.includes(' ') || /^[A-Z]/.test(value))
                    && !/(?:^|\s)(?:bg-|text-|border-|hover:|focus:)/.test(value)
                    && !maintainedEnglish.has(value)
                    && !looksPortuguese(value)
                    && !PORTUGUESE_INTERFACE_PHRASES[value]) {
                    missing.add(value);
                }
            };
            const visit = (node: ts.Node) => {
                if (ts.isJsxText(node)) {
                    record(node.text);
                } else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
                    && node.parent && !ts.isImportDeclaration(node.parent)) {
                    let parent: ts.Node | undefined = node.parent;
                    let withinJsxExpression = false;
                    while (parent && !ts.isSourceFile(parent)) {
                        if (ts.isJsxAttribute(parent)) break;
                        if (ts.isJsxExpression(parent)) {
                            withinJsxExpression = true;
                            break;
                        }
                        parent = parent.parent;
                    }
                    if (withinJsxExpression) record(node.text);
                }
                ts.forEachChild(node, visit);
            };
            visit(source);
        }
        expect([...missing].sort()).toEqual([]);
    });

    it('translates the continental reading guide as complete Portuguese sentences', () => {
        expect(translatePortugueseInterfaceText('What exactly is measured, and what part of the economy or sector does it represent?'))
            .toBe('O que é medido exactamente e que parte da economia ou do sector representa?');
        expect(translatePortugueseInterfaceText('Is it a dollar total, percentage, percentage-point change, number of people or per-person value?'))
            .toBe('Trata-se de um total em dólares, de uma percentagem, de uma variação em pontos percentuais, de um número de pessoas ou de um valor por pessoa?');
        expect(translatePortugueseInterfaceText('How many countries supplied usable data, and could missing countries change the continental picture?'))
            .toBe('Quantos países forneceram dados utilizáveis e poderiam os países em falta alterar o panorama continental?');
    });

    it('translates the shared default page guide without mixed-language fragments', () => {
        expect(translatePortugueseInterfaceText('The introduction explains the page’s purpose. Major sections move from overview to detail, while links and controls let you inspect the underlying content.'))
            .toBe('A introdução explica a finalidade da página. As secções principais avançam da visão geral para o pormenor, enquanto as ligações e os controlos permitem consultar o conteúdo subjacente.');
        expect(translatePortugueseInterfaceText('You should be able to find the main information, understand its context and move to the relevant story, country, event or intelligence page.'))
            .toBe('Deverá conseguir encontrar a informação principal, compreender o seu contexto e seguir para a história, o país, o evento ou a página de inteligência pertinente.');
        expect(translatePortugueseInterfaceText('Use the sticky main navigation and section navigation on long pages.'))
            .toBe('Nas páginas extensas, utilize a navegação principal fixa e a navegação entre secções.');
    });

    it('translates split labels and interpolated interface copy without generated text', () => {
        expect(translatePortugueseInterfaceText('Value')).toBe('Valor');
        expect(translatePortugueseInterfaceText('unit')).toBe('unidade');
        expect(translatePortugueseInterfaceText('Section 4')).toBe('Secção 4');
        expect(translatePortugueseInterfaceText('Prepared 8 de Agosto de 2026')).toBe('Preparado em 8 de Agosto de 2026');
        expect(translatePortugueseInterfaceText('12 source-linked records')).toBe('12 registos ligados às fontes');
        expect(translatePortugueseInterfaceText('Return to Nigéria hub')).toBe('Voltar ao dossiê de Nigéria');
        expect(translatePortugueseInterfaceText('Middle reading from 31 countries · 2024'))
            .toBe('Leitura mediana de 31 países · 2024');
        expect(translatePortugueseInterfaceText('% of GDP')).toBe('% do PIB');
        expect(translatePortugueseInterfaceText('% of merchandise exports')).toBe('% das exportações de mercadorias');
        expect(translatePortugueseInterfaceText('percentage points')).toBe('pontos percentuais');
    });

    it('localises preview identity, document titles and discovery metadata with the coded catalogue', () => {
        const seo = readFileSync('frontend/src/components/SEO.tsx', 'utf8');
        expect(translatePortugueseInterfaceText('Member Preview')).toBe('Pré-visualização de membro');
        expect(seo).toContain('translatePortugueseInterfaceText(value) || value');
        expect(seo).toContain("updateMeta('og:title', localizedTitle");
        expect(seo).toContain("updateMeta('twitter:description', localizedDescription");
        expect(seo).toContain("cleanTitle.toLowerCase() === 'boa-story'");
        expect(translatePortugueseInterfaceText('African Market Intelligence | BOA-Story'))
            .toBe('Inteligência dos Mercados Africanos | BOA-Story');
        expect(translatePortugueseInterfaceText('Continental Economic Overview | BOA-Story'))
            .toBe('Panorama Económico Continental | BOA-Story');
        expect(translatePortugueseInterfaceText('Decision Workspace'))
            .toBe('Área de trabalho de decisão');
    });

    it('serves generated evidence reports as coded Portuguese structures', () => {
        const report = localiseStoredReportForPortuguese({
            id: 'country-report',
            type: 'country_brief',
            title: 'Egypt Country Brief',
            subtitle: 'Market Intelligence Report',
            metadata: { country_code: 'EG', country_name: 'Egypt' },
            sections: [
                { title: 'Executive Summary', content: 'English generated narrative.' },
                { title: 'Economic Indicators', content: '', data: { gdp_usd: 10, population: 20 } },
                { title: 'Sector Coverage', content: '', data: [{ sector: 'Technology & Innovation', articles: 3 }] },
            ],
        }, [{ título: 'Registo revisto', fonte: 'Fonte oficial', data: '2026-08-08' }]);

        expect(report.title).toBe('Síntese nacional — Egipto');
        expect(report.subtitle).toBe('Dossiê documental de mercado | Egipto');
        expect(report.sections.map((section: Record<string, unknown>) => section.title)).toEqual([
            'Como ler esta síntese',
            'Indicadores económicos',
            'Cobertura sectorial documentada',
            'Registos recentes em português',
        ]);
        expect(JSON.stringify(report)).not.toContain('English generated narrative');
        expect(report.sections[2].data[0]).toEqual({ sector: 'Tecnologia e inovação', registos: 3 });
    });

    it('covers direct copy across every reader-facing routed page', () => {
        const maintainedEnglish = new Set(Object.values(TRANSLATIONS.en));
        const readerCopyProperties = new Set([
            'action', 'answer', 'body', 'caption', 'caution', 'copy', 'description',
            'detail', 'disclaimer', 'empty', 'error', 'eyebrow', 'heading', 'helper',
            'interpretation', 'kicker', 'label', 'limitation', 'message', 'method',
            'name', 'note', 'outcome', 'placeholder', 'purpose', 'question', 'status',
            'subtitle', 'summary', 'text', 'title', 'unit', 'value', 'ctaLabel',
            'features', 'perks', 'benefits', 'desc',
        ]);
        const pageFiles = [
            ...readdirSync('frontend/src/pages', { recursive: true })
                .map(entry => String(entry).replaceAll('\\', '/'))
                .filter(entry => entry.endsWith('.tsx'))
                .filter(entry => !entry.endsWith('AdminPage.tsx'))
                .map(entry => `frontend/src/pages/${entry}`),
            ...readdirSync('frontend/src/components', { recursive: true })
                .map(entry => String(entry).replaceAll('\\', '/'))
                .filter(entry => entry.endsWith('.tsx'))
                .filter(entry => !entry.startsWith('admin/'))
                .map(entry => `frontend/src/components/${entry}`),
            ...readdirSync('frontend/src/constants', { recursive: true })
                .map(entry => String(entry).replaceAll('\\', '/'))
                .filter(entry => entry.endsWith('.ts') || entry.endsWith('.tsx'))
                .map(entry => `frontend/src/constants/${entry}`),
            ...readdirSync('frontend/src/config', { recursive: true })
                .map(entry => String(entry).replaceAll('\\', '/'))
                .filter(entry => entry.endsWith('.ts') || entry.endsWith('.tsx'))
                .map(entry => `frontend/src/config/${entry}`),
        ];
        const missingByFile: Record<string, string[]> = {};

        for (const file of pageFiles) {
            const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            const missing = new Set<string>();
            const record = (raw: string) => {
                const value = raw.replace(/\s+/g, ' ').trim();
                if (value.length > 1 && /[A-Za-z]{2}/.test(value)
                    && (value.includes(' ') || /^[A-Z]/.test(value))
                    && !/(?:^|\s)(?:bg-|text-|border-|hover:|focus:)/.test(value)
                    && !/(?:^|\s)(?:sm:|md:|lg:|xl:|data-\[|group|flex|grid|relative|absolute|hidden|block|inline-|w-|h-|min-|max-|p[trblxy]?[-[]|m[trblxy]?[-[]|opacity-|cursor-|transition-)/.test(value)
                    && !/(?:@keyframes|rgba\(|linear-gradient\(|var\(--|chrome-(?:flow|shimmer))/.test(value)
                    && !/^(?:GET|POST|PUT|PATCH|DELETE|USD)$/.test(value)
                    && !maintainedEnglish.has(value)
                    && !looksPortuguese(value)
                    && !translatePortugueseInterfaceText(value)) {
                    missing.add(value);
                }
            };
            const visit = (node: ts.Node) => {
                if (ts.isJsxText(node)) {
                    record(node.text);
                } else if (ts.isStringLiteral(node) && ts.isJsxAttribute(node.parent)) {
                    const attribute = node.parent.name.getText(source);
                    if (['alt', 'aria-label', 'placeholder', 'title'].includes(attribute)) record(node.text);
                } else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
                    && ts.isPropertyAssignment(node.parent)) {
                    const property = node.parent.name.getText(source).replace(/^['"]|['"]$/g, '');
                    if (readerCopyProperties.has(property)) {
                        record(node.text);
                    }
                } else if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.parent) {
                    let parent: ts.Node | undefined = node.parent;
                    let withinJsxExpression = false;
                    while (parent && !ts.isSourceFile(parent)) {
                        if (ts.isJsxAttribute(parent)) break;
                        if (ts.isJsxExpression(parent)) {
                            withinJsxExpression = true;
                            break;
                        }
                        parent = parent.parent;
                    }
                    if (withinJsxExpression) record(node.text);
                } else if (ts.isTemplateExpression(node)) {
                    let parent: ts.Node | undefined = node.parent;
                    let jsxAttribute = '';
                    let withinJsx = false;
                    let hasPortugueseBranch = false;
                    while (parent && !ts.isSourceFile(parent)) {
                        if (ts.isConditionalExpression(parent) && parent.getText(source).includes("language === 'pt'")) {
                            hasPortugueseBranch = true;
                        }
                        if (ts.isJsxAttribute(parent)) {
                            jsxAttribute = parent.name.getText(source);
                            withinJsx = true;
                            break;
                        }
                        if (ts.isJsxExpression(parent)) withinJsx = true;
                        parent = parent.parent;
                    }
                    if (withinJsx && !['className', 'href', 'src', 'style', 'to'].includes(jsxAttribute)) {
                        const literalCopy = [node.head.text, ...node.templateSpans.map(span => span.literal.text)].join(' ').replace(/\s+/g, ' ').trim();
                        const technical = /^(?:flag|ms|report-section-|locked-|https?:\/\/|\| BOA-Story)/.test(literalCopy);
                        const translatedInterpolation = node.getText(source).includes('t(');
                        if (!hasPortugueseBranch && !technical && !translatedInterpolation && /[A-Za-z]{2}/.test(literalCopy) && !translatePortugueseInterfaceText(literalCopy)) {
                            missing.add(`[dynamic] ${literalCopy}`);
                        }
                    }
                }
                ts.forEachChild(node, visit);
            };
            visit(source);
            if (missing.size) missingByFile[file.replace('frontend/src/', '')] = [...missing].sort();
        }

        expect(missingByFile).toEqual({});
    });

    it('covers fixed explanatory copy returned by reader-facing data services', () => {
        const readerCopyProperties = new Set([
            'description', 'evidenceFallback', 'interpretation', 'investment_commentary',
            'limitation', 'limitations', 'message', 'methodology', 'observation_status',
            'status', 'summary', 'title', 'questions', 'definition', 'headline_label',
            'indicator_name', 'meaning', 'use', 'dimension', 'caveat', 'scope', 'label',
        ]);
        const missingByFile: Record<string, string[]> = {};
        for (const file of [
            'src/lib/country-evidence.ts',
            'src/lib/sector-performance.ts',
            'src/routes/campaigns.ts',
            'src/routes/countries.ts',
            'src/routes/dashboards.ts',
            'src/routes/intelligence.ts',
            'src/routes/market-intel.ts',
            'src/routes/system.ts',
        ]) {
            const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
            const missing = new Set<string>();
            const record = (value: string) => {
                const phrase = value.replace(/\s+/g, ' ').trim();
                if (phrase.length > 3 && /[A-Za-z]{2}/.test(phrase) && phrase.includes(' ') && !looksPortuguese(phrase)
                    && !translatePortugueseInterfaceText(phrase)) missing.add(phrase);
            };
            const visitCopyValue = (node: ts.Node) => {
                if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) record(node.text);
                ts.forEachChild(node, visitCopyValue);
            };
            const visit = (node: ts.Node) => {
                if (ts.isPropertyAssignment(node)) {
                    const property = node.name.getText(source).replace(/^['"]|['"]$/g, '');
                    if (readerCopyProperties.has(property)) visitCopyValue(node.initializer);
                }
                ts.forEachChild(node, visit);
            };
            visit(source);
            if (missing.size) missingByFile[file] = [...missing].sort();
        }
        expect(missingByFile).toEqual({});
    });

    it('covers reader-facing notifications and validation errors', () => {
        const missingByFile: Record<string, string[]> = {};
        const files = [
            ...readdirSync('frontend/src/pages', { recursive: true }),
            ...readdirSync('frontend/src/components', { recursive: true }),
        ].map(String).filter(file => file.endsWith('.tsx') && !file.includes('Admin') && !file.startsWith('admin/'));
        for (const relative of files) {
            const candidates = [`frontend/src/pages/${relative}`, `frontend/src/components/${relative}`];
            const file = candidates.find(candidate => {
                try { readFileSync(candidate); return true; } catch { return false; }
            });
            if (!file) continue;
            const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            const missing = new Set<string>();
            const visit = (node: ts.Node) => {
                if (ts.isCallExpression(node)) {
                    const callee = node.expression.getText(source);
                    if (/^(?:toast\.(?:success|error|info|warning)|setError(?:Message|Msg)?)$/.test(callee)) {
                        for (const argument of node.arguments) {
                            const inspect = (child: ts.Node) => {
                                if (ts.isStringLiteral(child) || ts.isNoSubstitutionTemplateLiteral(child)) {
                                    const phrase = child.text.trim();
                                    if (phrase.length > 3 && /[A-Za-z]{2}/.test(phrase) && !translatePortugueseInterfaceText(phrase)) missing.add(phrase);
                                }
                                ts.forEachChild(child, inspect);
                            };
                            inspect(argument);
                        }
                    }
                }
                ts.forEachChild(node, visit);
            };
            visit(source);
            if (missing.size) missingByFile[file.replace('frontend/src/', '')] = [...missing].sort();
        }
        expect(missingByFile).toEqual({});
    });

    it('rejects Portuguese at the generated interface-copy boundary', async () => {
        const env = createMockEnv();
        const app = new Hono<{ Bindings: typeof env }>();
        app.route('/translate', translationRouter);

        const response = await app.fetch(new Request('http://localhost/translate/interface', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: 'pt', texts: ['Market performance'] }),
        }), env);

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: 'unsupported_language' });
    });

    it('normalises generated publication copy into Portuguese pre-1990 orthography', async () => {
        const env = createMockEnv({
            AI: {
                run: async () => ({ translated_text: 'O setor atual definiu um novo projeto e objetivo.' }),
            } as unknown as Ai,
        });
        await expect(translateText(env, 'The current sector defined a new project and objective.', 'pt'))
            .resolves.toBe('O sector actual definiu um novo projecto e objectivo.');
    });
});
