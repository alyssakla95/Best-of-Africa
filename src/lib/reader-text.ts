const MOJIBAKE_TAIL = '\\u0080-\\u00bf\\u20ac\\u201a\\u0192\\u201e\\u2026\\u2020\\u2021\\u02c6\\u2030\\u0160\\u2039\\u0152\\u017d\\u2018\\u2019\\u201c\\u201d\\u2022\\u2013\\u2014\\u02dc\\u2122\\u0161\\u203a\\u0153\\u017e\\u0178';
const MOJIBAKE_SIGNAL = new RegExp(`(?:\\u00c3[${MOJIBAKE_TAIL}]|\\u00c2[${MOJIBAKE_TAIL}]|\\u00e2[${MOJIBAKE_TAIL}]|\\u00f0[${MOJIBAKE_TAIL}])`);

const WINDOWS_1252_BYTES = new Map<number, number>([
    [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84],
    [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
    [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c],
    [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
    [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97],
    [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
    [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

function decodeOnePass(value: string): string | null {
    const bytes: number[] = [];
    for (const character of value) {
        const code = character.codePointAt(0)!;
        if (code <= 0xff) bytes.push(code);
        else if (WINDOWS_1252_BYTES.has(code)) bytes.push(WINDOWS_1252_BYTES.get(code)!);
        else return null;
    }
    try {
        return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(Uint8Array.from(bytes));
    } catch {
        return null;
    }
}

/** Repair UTF-8 that an upstream publisher or feed decoded as Latin-1/Windows-1252. */
export function repairReaderText(value?: string | null): string {
    let result = (value || '').trim();
    for (let pass = 0; pass < 2 && MOJIBAKE_SIGNAL.test(result); pass += 1) {
        const repaired = decodeOnePass(result);
        if (!repaired || repaired === result) break;
        result = repaired;
    }
    return result;
}

export function containsBrokenReaderText(value?: string | null): boolean {
    return MOJIBAKE_SIGNAL.test(value || '') || /\ufffd/.test(value || '');
}

export function readerSummary(content?: string | null, summary?: string | null, title?: string | null): string {
    const existing = repairReaderText(summary);
    if (existing) return existing;
    const plain = repairReaderText(content)
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/[>*_`~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!plain) {
        const subject = repairReaderText(title);
        return subject
            ? `Source-linked briefing: ${subject}. Open the full record for its verified facts, context and source attribution.`
            : 'Open the full evidence record for the verified facts, context and source attribution.';
    }
    if (plain.length <= 420) return plain;
    const excerpt = plain.slice(0, 420);
    const sentence = excerpt.match(/^(.{180,420}?[.!?])(?:\s|$)/);
    return (sentence?.[1] || `${excerpt.replace(/\s+\S*$/, '')}\u2026`).trim();
}

const READER_TEXT_FIELDS = [
    'title', 'subtitle', 'summary', 'content', 'country_name', 'country_flag',
    'sector_name', 'source_title', 'image_credit', 'ai_investor_brief',
] as const;

/** Normalize public article DTOs without mutating database rows or non-text fields. */
export function normaliseReaderArticle<T extends Record<string, unknown>>(row: T): T {
    const normalized = { ...row };
    const output = normalized as Record<string, unknown>;
    for (const field of READER_TEXT_FIELDS) {
        if (typeof normalized[field] === 'string') {
            output[field] = repairReaderText(normalized[field] as string);
        }
    }
    if ('summary' in normalized || 'content' in normalized) {
        output.summary = readerSummary(
            typeof normalized.content === 'string' ? normalized.content : null,
            typeof normalized.summary === 'string' ? normalized.summary : null,
            typeof normalized.title === 'string' ? normalized.title : null,
        );
    }
    return normalized;
}
