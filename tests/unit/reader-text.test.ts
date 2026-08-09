import { describe, expect, it } from 'vitest';
import { containsBrokenReaderText, normaliseReaderArticle, readerSummary, repairReaderText } from '../../src/lib/reader-text';
import { classifySectorEvidence, matchSectorByKeywords } from '../../src/lib/ai';

describe('reader text integrity', () => {
    it('repairs common UTF-8 decoded as Windows-1252', () => {
        expect(repairReaderText('Nigeria\u00e2\u0080\u0091Kenya trade corridor')).toBe('Nigeria‑Kenya trade corridor');
        expect(repairReaderText('Informa\u00c3\u00a7\u00c3\u00a3o actual')).toBe('Informação actual');
        expect(containsBrokenReaderText('Informação actual')).toBe(false);
        expect(containsBrokenReaderText('SÃO TOMÉ')).toBe(false);
    });

    it('derives a readable non-null summary from historical article content', () => {
        const content = 'The regulator published a dated market notice explaining the new capital requirement. '.repeat(8);
        const article = normaliseReaderArticle({ title: 'Market notice', summary: null, content });
        expect(article.summary).toContain('regulator published');
        expect(article.summary.length).toBeGreaterThan(100);
        expect(readerSummary('', null)).toContain('full evidence record');
    });
});

describe('sector classification confidence', () => {
    it('does not classify an unrelated political story from one incidental word', () => {
        expect(matchSectorByKeywords('Former president elected to senate', 'The chamber will review legislation and oversee national production policy.')).toBeNull();
    });

    it('still classifies a clear market-sector story', () => {
        expect(matchSectorByKeywords('New solar power grid reaches rural districts', 'The renewable electricity project connects the national grid.')).toBe('energy');
    });

    it('defers an ambiguous cross-sector record instead of inventing precision', () => {
        expect(matchSectorByKeywords('Bank backs solar project', '')).toBeNull();
    });

    it('exposes the score and margin used by historical assignment review', () => {
        const clear = classifySectorEvidence('Solar electricity grid expansion', 'Renewable power generation connected to the national grid.');
        expect(clear).toMatchObject({ sector: 'energy', confident: true });
        expect(clear.bestScore).toBeGreaterThan(clear.runnerUpScore);

        const ambiguous = classifySectorEvidence('Bank backs solar project', '');
        expect(ambiguous.sector).toBeNull();
        expect(ambiguous.confident).toBe(false);
    });
});
