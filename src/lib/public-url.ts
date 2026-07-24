import type { Env } from '../types';

export function publicSiteBase(env?: Pick<Env, 'PUBLIC_SITE_URL'>): string {
    return (env?.PUBLIC_SITE_URL || 'https://best-of-africa.pages.dev').replace(/\/$/, '');
}

export function publicArticleUrl(env: Pick<Env, 'PUBLIC_SITE_URL'>, slug: string): string {
    return `${publicSiteBase(env)}/posts/${encodeURIComponent(slug)}`;
}
