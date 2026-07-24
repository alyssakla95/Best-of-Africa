import { describe, expect, it } from 'vitest';
import { publicArticleUrl, publicSiteBase } from '../../src/lib/public-url';

describe('public URLs', () => {
    it('uses the configured live site and the real article route', () => {
        const env = { PUBLIC_SITE_URL: 'https://publication.example/' } as any;
        expect(publicSiteBase(env)).toBe('https://publication.example');
        expect(publicArticleUrl(env, 'a story')).toBe('https://publication.example/posts/a%20story');
    });

    it('falls back to the deployed Pages origin', () => {
        expect(publicSiteBase()).toBe('https://best-of-africa.pages.dev');
    });
});
