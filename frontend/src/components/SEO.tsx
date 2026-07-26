import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    image?: string;
    type?: string;
    publishedTime?: string;
    author?: string;
}

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image,
    type = 'website',
    publishedTime,
    author = 'Mailles Cortes | BOA-Story'
}) => {
    useEffect(() => {
        // Update Title
        document.title = `${title} | BOA-Story`;

        // Helper to update meta tags
        const updateMeta = (name: string, content: string, attribute = 'name') => {
            if (!content) return;
            let element = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attribute, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Add RSS alternate link if not already present
        if (!document.querySelector('link[rel="alternate"][type="application/rss+xml"]')) {
            const rssLink = document.createElement('link');
            rssLink.setAttribute('rel', 'alternate');
            rssLink.setAttribute('type', 'application/rss+xml');
            rssLink.setAttribute('title', 'BOA-Story, Africa Intelligence RSS Feed');
            rssLink.setAttribute('href', '/rss.xml');
            document.head.appendChild(rssLink);
        }

        // Standard Meta
        updateMeta('description', description || '');
        updateMeta('theme-color', '#1a1a1a'); // Dark theme color
        updateMeta('keywords', 'Africa market intelligence, African market entry, country intelligence, sector evidence, Canada Africa trade, due diligence, BOA-Story');

        // Open Graph / Facebook
        updateMeta('og:type', type, 'property');
        updateMeta('og:title', title, 'property');
        updateMeta('og:description', description || '', 'property');
        updateMeta('og:image', image || '', 'property');
        updateMeta('og:site_name', 'BOA-Story', 'property');

        // Twitter
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:title', title);
        updateMeta('twitter:description', description || '');
        updateMeta('twitter:image', image || '');

        // Article Specific
        if (publishedTime) {
            updateMeta('article:published_time', publishedTime, 'property');
        }
        updateMeta('author', author);

    }, [title, description, image, type, publishedTime, author]);

    return null;
};
