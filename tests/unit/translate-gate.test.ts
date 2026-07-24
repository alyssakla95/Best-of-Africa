// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION DEGENERACY GATE — regression tests
//
// looksDegenerate refuses model output that collapsed into repetition loops or
// wildly wrong lengths. Its repetition check is RELATIVE to the source: bodies
// legitimately contain repeated markdown (enrichment table separator rows),
// and an absolute threshold rejected faithful translations of them.
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { looksDegenerate } from '../../src/lib/translate';

// Realistic varied prose — identical-sentence repetition would trip the
// repetition detector by design, which is not the faithful-translation case.
const PROSE = [
    'The port expansion in Mombasa will double container capacity by 2028, according to the authority.',
    'Freight operators expect shorter dwell times once the new berths open next year.',
    'Regional exporters in Uganda and Rwanda have long complained about congestion at the terminal.',
    'The financing package combines a sovereign loan with private terminal concessions.',
    'Analysts caution that road and rail links inland must be upgraded in parallel.',
].join(' ');

describe('looksDegenerate', () => {
    it('accepts a faithful-length translation', () => {
        const out = [
            "L'extension du port de Mombasa doublera la capacité de conteneurs d'ici 2028, selon l'autorité.",
            "Les opérateurs de fret s'attendent à des délais réduits une fois les nouveaux quais ouverts l'an prochain.",
            'Les exportateurs régionaux en Ouganda et au Rwanda se plaignent depuis longtemps de la congestion du terminal.',
            'Le montage financier combine un prêt souverain et des concessions privées de terminaux.',
            'Les analystes préviennent que les liaisons routières et ferroviaires doivent être modernisées en parallèle.',
        ].join(' ');
        expect(looksDegenerate(PROSE, out)).toBe(false);
    });

    it('rejects empty output', () => {
        expect(looksDegenerate(PROSE, '')).toBe(true);
    });

    it('rejects a truncated stump (the m2m100 failure mode)', () => {
        expect(looksDegenerate(PROSE, 'Extension du port.')).toBe(true);
    });

    it('rejects runaway continuation (English continuation failure mode)', () => {
        expect(looksDegenerate('Short source text about Mombasa.', PROSE.repeat(4))).toBe(true);
    });

    it('rejects a repetition loop the source does not contain', () => {
        const loop = 'le port le port le port '.repeat(60);
        expect(looksDegenerate(PROSE, loop)).toBe(true);
    });

    it('tolerates repetition the SOURCE itself contains (markdown tables)', () => {
        const sep = '| --- | --- | --- |\n';
        const srcTable = 'Indicator table:\n' + (sep + '| GDP | 3.1% | 2026 |\n').repeat(10);
        const outTable = 'Tableau des indicateurs :\n' + (sep + '| PIB | 3,1 % | 2026 |\n').repeat(10);
        expect(looksDegenerate(srcTable, outTable)).toBe(false);
    });

    it('accepts complete Chinese prose despite its naturally compact character count', () => {
        const source = 'African manufacturers expanded regional production after new transport links reduced delivery times. '.repeat(8);
        const chinese = '新的交通连接缩短交付时间后，非洲制造商扩大了区域生产。'.repeat(8);
        expect(looksDegenerate(source, chinese, 'zh')).toBe(false);
    });
});
