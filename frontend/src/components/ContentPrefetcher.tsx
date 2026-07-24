import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';

const articlePath = /^\/posts\/([^/?#]+)/;

export function ContentPrefetcher() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  useEffect(() => {
    const queued = new Set<string>();
    const completed = new Set<string>();
    const queue: string[] = [];
    let active = 0;
    let disposed = false;

    // Fetch the reader route code before the first article navigation.
    void import('@/pages/beta/BetaArticle');

    const drain = () => {
      while (!disposed && active < 2 && queue.length) {
        const slug = queue.shift()!;
        queued.delete(slug);
        if (completed.has(slug)) continue;
        active += 1;
        void queryClient.prefetchQuery({
          queryKey: ['article', slug, language],
          queryFn: () => api.getArticle(slug, language),
          staleTime: 30 * 60 * 1000,
        }).then(() => completed.add(slug)).finally(() => {
          active -= 1;
          drain();
        });
      }
    };

    const enqueue = (slug?: string) => {
      if (!slug || queued.has(slug) || completed.has(slug)) return;
      queued.add(slug);
      queue.push(slug);
      drain();
    };

    const slugFromAnchor = (anchor: HTMLAnchorElement | null) => {
      if (!anchor) return undefined;
      const match = articlePath.exec(new URL(anchor.href, window.location.origin).pathname);
      return match?.[1];
    };

    const onIntent = (event: Event) => {
      enqueue(slugFromAnchor((event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null));
    };
    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('pointerdown', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) enqueue(slugFromAnchor(entry.target as HTMLAnchorElement));
      });
    }, { rootMargin: '320px 0px' });

    const observed = new WeakSet<Element>();
    const observeLinks = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLAnchorElement>('a[href^="/posts/"]').forEach(anchor => {
        if (!observed.has(anchor)) {
          observed.add(anchor);
          observer.observe(anchor);
        }
      });
    };
    observeLinks();
    const mutations = new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(node => {
        if (node instanceof Element) {
          if (node.matches('a[href^="/posts/"]') && !observed.has(node)) {
            observed.add(node);
            observer.observe(node);
          }
          observeLinks(node);
        }
      });
    }));
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener('pointerover', onIntent);
      document.removeEventListener('pointerdown', onIntent);
      document.removeEventListener('focusin', onIntent);
    };
  }, [language, queryClient]);

  return null;
}
