import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { stripMarkdown, stripProcessLeakage } from '../../frontend/src/lib/utils';

describe('reader-facing presentation text', () => {
    it('removes authoring syntax from compact fields', () => {
        expect(stripMarkdown('** Lagos, Nigeria launches a new corridor.')).toBe('Lagos, Nigeria launches a new corridor.');
        expect(stripMarkdown('## Market outlook\n[Primary source](https://example.com)')).toBe('Market outlook Primary source');
        expect(stripMarkdown('`Quoted term` and **reported evidence**')).toBe('Quoted term and reported evidence');
    });

    it('preserves ordered-list values when compacting a summary', () => {
        expect(stripMarkdown('3. Verify the licence\n4) Review the filing')).toBe('3. Verify the licence 4. Review the filing');
    });

    it('flattens actual table rows without corrupting pipe characters in proper names', () => {
        expect(stripMarkdown('| Country | Stories |\n| --- | --- |\n| Ghana | 12 |')).toBe('Country — Stories Ghana — 12');
        expect(stripMarkdown('Investment activity in Namibia\'s ||Kharas region')).toBe('Investment activity in Namibia\'s ||Kharas region');
    });

    it('removes orphan markers and model process narration', () => {
        expect(stripMarkdown('**')).toBe('');
        expect(stripProcessLeakage('Analysis: internal framing\nPublished finding.')).toBe('internal framing\nPublished finding.');
        expect(stripProcessLeakage('<think>private reasoning</think>Published finding.')).toBe('Published finding.');
    });

    it('keeps the enterprise proposition narrow and commercially honest', () => {
        const source = readFileSync('frontend/src/pages/EnterprisePage.tsx', 'utf8');
        expect(source).toContain('Corporate strategy, investment, growth and market-entry teams worldwide');
        expect(source).not.toMatch(/Canadian organizations|Canadian companies/i);
        expect(source).toContain('Pilot-ready, not enterprise-proven.');
        expect(source).toContain('verified customer counts, revenue, renewal, time-saved or decision-outcome claims');
        expect(source).not.toMatch(/trusted by|industry-leading|guaranteed returns|we are enterprise-proven/i);
    });

    it('publishes procurement gaps without inventing assurance', () => {
        const trust = readFileSync('frontend/src/pages/TrustCenterPage.tsx', 'utf8');
        const routes = readFileSync('frontend/src/App.tsx', 'utf8');
        expect(trust).toContain('Not certified');
        expect(trust).toContain('No public SLA');
        expect(trust).toContain('No external attestation');
        expect(routes).toContain('path="/enterprise"');
        expect(routes).toContain('path="/trust"');
    });
});
