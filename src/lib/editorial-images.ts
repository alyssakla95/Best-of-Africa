const GENERATED_IMAGE_MARKERS = [
    '/assets/articles/',
    'dall-e',
    'dalle',
    'midjourney',
    'stability.ai',
    'replicate.delivery',
    'black-forest-labs',
    'flux-1-',
    'generated-image',
    'ai_image',
];

const GENERIC_PUBLISHER_ART_MARKERS = [
    '/favicon',
    '/logo',
    'logo.',
    'site-icon',
    'default-image',
    'default_image',
    'placeholder',
];

/**
 * Accept only public HTTP(S) image URLs and explicitly reject every image path
 * previously used by BOA's generation pipeline. Relative publisher URLs are
 * resolved against the original article URL.
 */
export function normalizeEditorialImageUrl(candidate: string | null | undefined, articleUrl?: string): string | null {
    if (!candidate) return null;
    const decoded = candidate.replace(/&amp;/g, '&').trim();
    if (!decoded || /^(?:data|blob|javascript):/i.test(decoded)) return null;

    try {
        const url = new URL(decoded, articleUrl);
        if (!/^https?:$/.test(url.protocol)) return null;
        const lower = url.toString().toLowerCase();
        if (GENERATED_IMAGE_MARKERS.some(marker => lower.includes(marker))) return null;
        if (GENERIC_PUBLISHER_ART_MARKERS.some(marker => lower.includes(marker))) return null;
        return url.toString();
    } catch {
        return null;
    }
}
export function extractPublisherImage(html: string, articleUrl: string): { imageUrl: string | null; imageCredit: string | null } {
    const meta = (key: string) => {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const patterns = [
            new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
            new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
        ];
        return patterns.map(pattern => html.match(pattern)?.[1]).find(Boolean) || null;
    };

    // A publisher-hosted URL is not sufficient proof that an image is
    // photographic. Honour explicit captions/credits that identify generated
    // artwork and reject the image before it reaches reader-facing records.
    const visibleImageCredit = html
        .replace(/<(?:script|style|noscript|template)(?:\s[^>]*)?>[\s\S]*?<\/(?:script|style|noscript|template)>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ');
    const publisherLabelsGeneratedArtwork = /\b(?:credit|image|illustration)\s*:\s*(?:an?\s+)?(?:AI[- ]generated|generated\s+(?:with|by)\s+AI)\b/i.test(visibleImageCredit);
    if (publisherLabelsGeneratedArtwork) return { imageUrl: null, imageCredit: null };

    const imageUrl = normalizeEditorialImageUrl(
        meta('og:image:secure_url') || meta('og:image') || meta('twitter:image'),
        articleUrl,
    );
    const imageCredit = meta('article:image:credit') || meta('image:credit') || meta('twitter:image:alt');
    return { imageUrl, imageCredit: imageCredit?.trim() || null };
}

/**
 * Aggregators such as AllAfrica explicitly link back to the publisher that
 * supplied the reporting. Only accept a link labelled by the page itself as
 * the original/source article; never guess a destination from headline text.
 */
export function extractOriginalArticleUrl(html: string, aggregatorUrl: string): string | null {
    const patterns = [
        /<a[^>]+class=["'][^"']*source-url[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
        /<a[^>]+href=["']([^"']+)["'][^>]+class=["'][^"']*source-url[^"']*["'][^>]*>/i,
    ];
    const candidate = patterns.map(pattern => html.match(pattern)?.[1]).find(Boolean);
    if (!candidate) return null;

    const resolved = normalizeEditorialImageUrl(candidate, aggregatorUrl);
    if (!resolved) return null;
    try {
        return new URL(resolved).hostname === new URL(aggregatorUrl).hostname ? null : resolved;
    } catch {
        return null;
    }
}
