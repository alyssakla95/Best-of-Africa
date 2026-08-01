import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { readFileSync, readdirSync } from 'node:fs';
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
import { translateText } from '../../src/lib/translate';
import { createMockEnv } from '../mocks/env';

describe('coded Portuguese interface locale', () => {
    it('contains a Portuguese source string for every maintained English key', () => {
        const missing = Object.keys(TRANSLATIONS.en)
            .filter((key) => !TRANSLATIONS.pt?.[key]?.trim());

        expect(missing).toEqual([]);
    });

    it('uses European Portuguese and the pre-1990 spellings requested for the product', () => {
        expect(PORTUGUESE_LOCALE).toBe('pt-PT');
        expect(PORTUGUESE_ORTHOGRAPHY).toBe('1945');
        expect(applyPortuguese1945Orthography('setor, atividade, atual, projeto, objetivo e perspetiva'))
            .toBe('sector, actividade, actual, projecto, objectivo e perspectiva');

        const maintainedCopy = Object.values(TRANSLATIONS.pt).join('\n');
        expect(maintainedCopy).not.toMatch(/\bsetor(?:es|ial|iais)?\b/i);
        expect(maintainedCopy).not.toMatch(/\batividade(?:s)?\b/i);
        expect(maintainedCopy).not.toMatch(/\bperspetiva(?:s)?\b/i);
    });

    it('ships source-owned copy for both foreground intelligence products', () => {
        expect(PORTUGUESE_INTERFACE_PHRASES['African markets, measured sector by sector.'])
            .toBe('Os mercados africanos, medidos sector a sector.');
        expect(PORTUGUESE_INTERFACE_PHRASES['Africa’s economy in one verifiable record.'])
            .toBe('A economia africana num registo verificável.');
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
                    && !/(?:^|\s)(?:bg|text|border|hover|focus):?-/.test(value)
                    && !maintainedEnglish.has(value)
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

    it('covers direct copy across every reader-facing routed page', () => {
        const maintainedEnglish = new Set(Object.values(TRANSLATIONS.en));
        const pageFiles = readdirSync('frontend/src/pages', { recursive: true })
            .map(entry => String(entry).replaceAll('\\', '/'))
            .filter(entry => entry.endsWith('.tsx'))
            .filter(entry => !entry.endsWith('AdminPage.tsx'))
            .map(entry => `frontend/src/pages/${entry}`);
        const missingByFile: Record<string, string[]> = {};

        for (const file of pageFiles) {
            const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            const missing = new Set<string>();
            const record = (raw: string) => {
                const value = raw.replace(/\s+/g, ' ').trim();
                if (value.length > 1 && /[A-Za-z]{2}/.test(value)
                    && (value.includes(' ') || /^[A-Z]/.test(value))
                    && !/(?:^|\s)(?:bg|text|border|hover|focus):?-/.test(value)
                    && !maintainedEnglish.has(value)
                    && !translatePortugueseInterfaceText(value)) {
                    missing.add(value);
                }
            };
            const visit = (node: ts.Node) => {
                if (ts.isJsxText(node)) record(node.text);
                ts.forEachChild(node, visit);
            };
            visit(source);
            if (missing.size) missingByFile[file.replace('frontend/src/pages/', '')] = [...missing].sort();
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

    it('rejects Portuguese even if an untyped caller reaches the generated text helper', async () => {
        const env = createMockEnv();
        await expect(translateText(env, 'Market performance', 'pt' as never))
            .rejects.toThrow('Portuguese is a source-owned editorial locale');
    });
});
