import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Remove drafting notes, model disclaimers, and process narration. */
export function stripProcessLeakage(text?: string | null): string {
    if (!text) return '';
    let value = String(text)
        .replace(/<think(?:ing)?\b[^>]*>[\s\S]*?<\/think(?:ing)?>/gi, '')
        .replace(/<analysis\b[^>]*>[\s\S]*?<\/analysis>/gi, '')
        .replace(/```(?:thinking|reasoning|analysis|chain[- ]of[- ]thought)[^\n]*\n[\s\S]*?```/gi, '');

    const processOnly = /^\s*(?:#{1,6}\s*)?(?:analysis|reasoning|thinking|thought process|chain of thought|internal notes?|scratchpad|draft approach|planning)(?:\s*:)?\s*$/i;
    const modelPreamble = /^\s*(?:as an (?:ai|artificial intelligence|language model)|i (?:need to|should|will now|cannot|considered|reasoned|think)|let me|the (?:user|prompt) (?:asks?|requires?|wants?)|we need to|here(?:'s| is) my (?:analysis|reasoning|approach))/i;
    value = value.split('\n')
        .filter(line => !processOnly.test(line) && !modelPreamble.test(line))
        .map(line => line.replace(/^\s*(?:analysis|reasoning|thinking|conclusion)\s*:\s*/i, ''))
        .join('\n');

    return value.replace(/\n{3,}/g, '\n\n').trim();
}

/** Return a card-sized article image URL when a backend derivative exists. */
export function heroThumb(url?: string | null): string {
    if (!url) return '';
    if (url.includes('/assets/articles/') && !url.includes('?')) return `${url}?w=768`;
    return url;
}

/**
 * Convert authoring notation into clean, single-line display prose for titles,
 * summaries, labels, and table cells. Long-form content belongs in the native
 * EditorialContent component instead.
 */
export function stripMarkdown(text?: string | null): string {
    if (!text) return '';
    let value = stripProcessLeakage(text);

    value = value.replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
        .replace(/^📰\s*/, '')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/```[^\n]*\n?/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/^\s*\|?\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*\|?\s*$/gm, ' ');

    // Flatten real table rows, while retaining pipe characters in proper names
    // such as Namibia's ||Kharas region.
    value = value.split('\n').map(line => {
        const trimmed = line.trim();
        const cells = trimmed.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
        if (cells.length > 1 && (trimmed.startsWith('|') || /\s\|\s/.test(trimmed))) {
            return cells.filter(Boolean).join(' — ');
        }
        return line;
    }).join('\n');

    // Keep explicit ordered-list values meaningful after compacting the field.
    value = value.replace(/^\s*[-+*]\s+/gm, '')
        .replace(/^\s*(\d+)[.)]\s+/gm, '$1. ')
        .replace(/\*\*|__/g, '')
        .replace(/(^|\s)#{1,6}\s+/g, '$1')
        .replace(/[`>]/g, '')
        .replace(/(^|\s)[*_]([^*_\n]+)[*_](?=\s|$|[.,;:!?])/g, '$1$2')
        .replace(/^\s*(?:\*{1,3}|_{2,}|#{1,6})\s*$/gm, ' ')
        .replace(/^\*{1,2}\s*/g, '')
        .replace(/\s*\*{1,2}$/g, '');

    if (value.startsWith('"') && value.endsWith('"') && value.length > 2) value = value.slice(1, -1);
    return value.replace(/\s+/g, ' ').trim();
}
