// ═══════════════════════════════════════════════════════════════════════════════
// AFRICA RELEVANCE GATE — regression tests
//
// This gate leaked ~50 foreign articles (the Tamil-Nadu / Modi-Seychelles
// incident) before it was rewritten as title-weighted scoring with a
// foreign-primary veto and a body-evidence rescue. These cases encode the
// exact leak classes and the legitimate coverage the fixes must not lose.
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { extractParagraphEvidence, isAfricanContent, isMarketEvidence, mentionsTargetCountry } from '../../src/workers/ingestion';

describe('isAfricanContent', () => {
    describe('plain African coverage passes', () => {
        it('accepts a domestic African headline', () => {
            expect(isAfricanContent("Nigeria's fintech boom accelerates", '')).toBe(true);
        });
        it('accepts city-level headlines', () => {
            expect(isAfricanContent('Falling commodity prices hit home in Johannesburg', '')).toBe(true);
        });
        it('accepts demonyms via the open-ended word boundary', () => {
            expect(isAfricanContent('Moroccan startups raise record funding', '')).toBe(true);
        });
        it('accepts the accented Côte d’Ivoire spelling', () => {
            expect(isAfricanContent("Côte d'Ivoire cocoa harvest beats forecast", '')).toBe(true);
        });
        it('accepts Gqeberha (added after a false-negative during cleanup)', () => {
            expect(isAfricanContent('Gqeberha port expansion approved', '')).toBe(true);
        });
    });

    describe('the leak classes stay out', () => {
        it('rejects the Tamil-Nadu class (foreign headline, no African mention)', () => {
            expect(isAfricanContent(
                "Tamil Nadu's Solar Surge: Sunsure Energy's Big Bet",
                'Sunsure Energy commissioned a 150 MW solar project in Tamil Nadu, India.'
            )).toBe(false);
        });
        it('rejects the Modi-Seychelles class (one incidental African mention)', () => {
            expect(isAfricanContent(
                "India slams Pakistan minister's remark on PM Modi's Seychelles honor",
                'New Delhi responded sharply after comments about the honor conferred in Seychelles.'
            )).toBe(false);
        });
        it('rejects Indianapolis matching \\bindia via the open word boundary', () => {
            expect(isAfricanContent('Indianapolis housing market cools', 'Midwest real estate trends.')).toBe(false);
        });
        it('rejects a pure foreign story with no African signal anywhere', () => {
            expect(isAfricanContent('China tech stocks rally', 'Beijing markets rose on stimulus hopes.')).toBe(false);
        });
        it('rejects a French domestic story carried by an African publisher', () => {
            expect(isAfricanContent(
                'France bans under-15s from social media',
                'The French law takes effect in Paris. This item was republished by a Mozambique news outlet in Maputo.'
            )).toBe(false);
        });
    });

    describe('foreign-led but genuinely African stories are rescued by body evidence', () => {
        it('accepts China-in-Kenya coverage when the body is substantially African', () => {
            expect(isAfricanContent(
                'China pledges $1bn for Kenya railway',
                'The line will link Nairobi to Mombasa, deepening Kenya’s freight corridor.'
            )).toBe(true);
        });
        it('still rejects a foreign-led headline whose body barely mentions Africa', () => {
            expect(isAfricanContent(
                'China pledges $1bn for Kenya railway',
                'The announcement came during a summit in Beijing focused on Belt and Road.'
            )).toBe(false);
        });
        it('accepts two-African-signal headlines even with a foreign primary', () => {
            expect(isAfricanContent('Morocco and Egypt court Chinese investment', '')).toBe(true);
        });
    });

    describe('keyword-free headlines need two distinct African body signals', () => {
        it('accepts with two body keywords', () => {
            expect(isAfricanContent(
                'Continental free trade shows early wins',
                'Exporters in Ghana and Kenya report faster customs clearance under the pact.'
            )).toBe(true);
        });
        it('rejects with a single body keyword', () => {
            expect(isAfricanContent(
                'Global shipping rates fall',
                'Analysts cite weaker demand; even Lagos-bound routes saw declines.'
            )).toBe(false);
        });
    });
});

describe('mentionsTargetCountry', () => {
    it('rejects trusted-domain results that ignore the requested country', () => {
        expect(mentionsTargetCountry(
            "Congo's Ebola outbreak is second-largest on record",
            'Health officials published new figures.',
            'Liberia',
        )).toBe(false);
    });

    it('finds the requested country beyond the first-ranked general stories', () => {
        expect(mentionsTargetCountry(
            'Liberia expands investment and trade programme',
            'The World Bank published the procurement plan.',
            'Liberia',
        )).toBe(true);
    });

    it('supports official and common country-name variants', () => {
        expect(mentionsTargetCountry('Ivory Coast cocoa exports rise', '', "Côte d'Ivoire")).toBe(true);
        expect(mentionsTargetCountry('DRC revises its mining code', '', 'Democratic Republic of Congo')).toBe(true);
    });
});

describe('isMarketEvidence', () => {
    it('accepts economic, investment and infrastructure evidence', () => {
        expect(isMarketEvidence('Liberia expands investment and trade programme', '')).toBe(true);
        expect(isMarketEvidence('New procurement plan', 'The infrastructure project includes port logistics.')).toBe(true);
    });

    it('rejects unrelated high-ranking stories from trusted publishers', () => {
        expect(isMarketEvidence('Liberia burns four tons of cocaine after seizure', 'Police completed the operation.')).toBe(false);
        expect(isMarketEvidence('Fighting erupts in Tigray as both sides trade blame', 'A fragile peace deal is under threat.')).toBe(false);
        expect(isMarketEvidence('Sudan civil war: drones strike a classroom', 'Attacks hit civilian infrastructure.')).toBe(false);
        expect(isMarketEvidence('Refugee policy changes', 'Families seek entry after a humanitarian crisis.')).toBe(false);
        expect(isMarketEvidence('West Bank raids continue', 'Police reported further arrests.')).toBe(false);
    });

    it('requires explicit economic context for ambiguous market words', () => {
        expect(isMarketEvidence('Regional trade corridor opens', 'Exports will move through a new logistics route.')).toBe(true);
        expect(isMarketEvidence('Solar sector secures financing', 'The energy project attracted institutional investors.')).toBe(true);
        expect(isMarketEvidence('Central bank changes monetary policy', 'Inflation remains above target.')).toBe(true);
    });
});

describe('extractParagraphEvidence', () => {
    it('retains all substantive paragraphs from nested publisher layouts', () => {
        const html = `
            <main><div class="article-body"><div><p>First substantive paragraph about a national investment programme and its financing.</p></div></div>
            <div><p>Second substantive paragraph explaining the trade mechanism and implementation timetable.</p></div>
            <footer><p>Short</p></footer></main>`;
        const evidence = extractParagraphEvidence(html);
        expect(evidence).toContain('First substantive paragraph');
        expect(evidence).toContain('Second substantive paragraph');
        expect(evidence).not.toContain('Short');
    });
});
