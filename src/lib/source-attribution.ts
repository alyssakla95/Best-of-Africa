export type SourceAttributionInput = {
    publisher_name?: string | null;
    source_name?: string | null;
};

/** Prefer the original publisher captured by an aggregator over the aggregator. */
export function publisherNameForArticle(input: SourceAttributionInput): string {
    return input.publisher_name?.trim()
        || input.source_name?.trim()
        || 'Original reporting source';
}

export function publisherNameForStoredArticle(input: { source_title?: string | null; source_url?: string | null }): string {
    const stored = input.source_title?.trim() || '';
    if (!stored) return 'Original reporting source';
    if (!input.source_url?.includes('news.google.com')) return stored;

    // Google News titles conventionally end in " - Publisher". Historical
    // rows predate publisher_name, so recover that suffix for reader display.
    const separator = stored.lastIndexOf(' - ');
    return separator > 0 && separator < stored.length - 3
        ? stored.slice(separator + 3).trim()
        : 'Original reporting source';
}
