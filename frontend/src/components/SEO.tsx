import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translatePortugueseInterfaceText } from '../i18n/pt-PT-1945';

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
    const { language } = useLanguage();
    const localise = (value?: string) => {
        if (!value || language !== 'pt') return value || '';
        return translatePortugueseInterfaceText(value) || value;
    };
    const localizedTitle = localise(title);
    const localizedDescription = localise(description);

    useEffect(() => {
        // Update Title (callers historically append "| BOA-Story" themselves — strip it to avoid duplication)
        const cleanTitle = localizedTitle.replace(/\s*\|\s*BOA-Story\s*$/i, '');
        document.title = cleanTitle.toLowerCase() === 'boa-story' ? 'BOA-Story' : `${cleanTitle} | BOA-Story`;

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
            rssLink.setAttribute('title', language === 'pt' ? 'BOA-Story, canal RSS de informação sobre África' : 'BOA-Story, Africa Intelligence RSS Feed');
            rssLink.setAttribute('href', '/rss.xml');
            document.head.appendChild(rssLink);
        }

        // Standard Meta
        updateMeta('description', localizedDescription);
        updateMeta('theme-color', '#1a1a1a'); // Dark theme color
        updateMeta('keywords', language === 'pt'
            ? 'inteligência de mercado africana, entrada em mercados africanos, informação nacional, evidência sectorial, comércio africano, diligência, BOA-Story'
            : 'Africa market intelligence, African market entry, country intelligence, sector evidence, Africa trade, due diligence, BOA-Story');

        // Open Graph / Facebook
        updateMeta('og:type', type, 'property');
        updateMeta('og:title', localizedTitle, 'property');
        updateMeta('og:description', localizedDescription, 'property');
        updateMeta('og:site_name', 'BOA-Story', 'property');

        // Twitter
        updateMeta('twitter:title', localizedTitle);
        updateMeta('twitter:description', localizedDescription);

        if (image) {
            updateMeta('og:image', image, 'property');
            updateMeta('twitter:image', image);
            updateMeta('twitter:card', 'summary_large_image');
        } else {
            document.querySelector('meta[property="og:image"]')?.remove();
            document.querySelector('meta[name="twitter:image"]')?.remove();
            updateMeta('twitter:card', 'summary');
        }

        // Article Specific
        if (publishedTime) {
            updateMeta('article:published_time', publishedTime, 'property');
        }
        updateMeta('author', author);

    }, [localizedTitle, localizedDescription, image, type, publishedTime, author, language]);

    return null;
};
