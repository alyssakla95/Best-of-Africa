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
        expect(source).toContain('Ready for a measurable design-partner pilot.');
        expect(source).toContain('research baseline, delivery cycle, evidence traceability and unresolved diligence work');
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

    it('keeps implementation and provider language out of application presentation', () => {
        const trust = readFileSync('frontend/src/pages/TrustCenterPage.tsx', 'utf8');
        const enterprise = readFileSync('frontend/src/pages/EnterprisePage.tsx', 'utf8');
        const systemPanel = readFileSync('frontend/src/components/beta/AgentStatusPanel.tsx', 'utf8');
        const visibleSources = `${trust}\n${enterprise}\n${systemPanel}`;

        expect(visibleSources).not.toMatch(/\bAI\b|artificial intelligence|OpenAI|Anthropic|Gemini|language model|information model|prompt|GPT-OSS/i);
        expect(trust).toContain('Source and editorial quality');
        expect(systemPanel).toContain('Article preparation');
    });

    it('adds a truthful reader habit without reducing the enterprise position', () => {
        const landing = readFileSync('frontend/src/pages/beta/BetaLanding.tsx', 'utf8');
        const briefing = readFileSync('frontend/src/pages/beta/BetaFeed.tsx', 'utf8');

        expect(landing).toContain('Intelligence for decisions across Africa.');
        expect(landing).toContain('Explore the market-entry pilot');
        expect(landing).toContain('For organizations worldwide deciding which African market deserves deeper entry diligence');
        expect(landing).toContain('For diaspora and globally connected readers');
        expect(landing).toContain('Open Africa Briefing');
        expect(briefing).toContain('Your Africa Briefing');
        expect(briefing).not.toMatch(/every morning|every single day|54 Nations|Daily Briefing/);
    });

    it('discloses stored audience identifiers and bounded retention', () => {
        const privacy = readFileSync('frontend/src/pages/PrivacyPage.tsx', 'utf8');
        expect(privacy).toContain('connecting IP address');
        expect(privacy).toContain('one-way SHA-256 fingerprint');
        expect(privacy).toContain('retained for no more than 90 days');
        expect(privacy).toContain('raw user-agent string is not stored');
    });
});
