import { describe, expect, it } from 'vitest';
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
});
