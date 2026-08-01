import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Twitter, Linkedin, Link2, Check, Loader2, Bookmark } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BetaAudioPlayer } from '../../components/beta';
import { ScrollReveal } from '../../components/beta/ScrollReveal';
import { SEO } from '../../components/SEO';

import { useMember } from '../../context/MemberContext';
import { useLanguage } from '@/context/LanguageContext';
import { api } from '../../services/api';
import { KO_FI_URL } from '../../constants/beta';
import { CountryFlag } from '../../components/CountryFlag';
import { heroThumb, stripMarkdown } from '@/lib/utils';
import { EditorialContent } from '../../components/EditorialContent';
import { useSetBreadcrumb } from '@/context/BreadcrumbContext';
import type { Article, ArticleListItem, Country } from '../../types';
import { hideFailedEditorialImage, sourcedEditorialImage } from '../../lib/editorialImage';
import { formatReaderDate } from '../../i18n/locale';
import { PhotoCredit } from '../../components/PhotoCredit';

interface ArticleResponse {
  article: Article;
  country?: Country;
  member?: boolean;
}

// Track reading progress based on a target element's position
function useReadingProgress(targetId: string) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(targetId);
          if (!el) { ticking = false; return; }
          const { top, height } = el.getBoundingClientRect();
          const windowH = window.innerHeight;
          const scrollable = height - windowH;
          if (scrollable <= 0) { setProgress(100); ticking = false; return; }
          setProgress(Math.min(100, Math.max(0, (-top / scrollable) * 100)));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetId]);
  return progress;
}

// Inline share buttons, copy link, Twitter/X, LinkedIn
function ShareButtons({ title, url, articleId }: { title: string; url: string; articleId?: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  // Every share affordance counts as a share (feeds articles.share_count).
  const recordShare = () => {
    if (articleId) api.trackEvent({ type: 'article_share', article_id: articleId });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    recordShare();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    // navigator.share is usually available in secure contexts (HTTPS) and mobile
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        recordShare();
      } catch (err) {
        // user cancelled or share failed, fallback to copy
        if ((err as Error).name !== 'AbortError') copyLink();
      }
    } else {
      copyLink();
    }
  };

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  // We only show Twitter/LinkedIn buttons on larger screens, and rely on native share on small screens
  // if navigator.share is supported.
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-primary/70 uppercase tracking-widest font-semibold hidden sm:block">{t('article.share', 'Share')}</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('article.share_x', 'Share on X / Twitter')}
        onClick={recordShare}
        className={`p-2 rounded-lg bg-background/5 hover:bg-foreground/10 text-primary/40 hover:text-primary transition-all ${hasShare ? 'hidden sm:inline-flex' : ''}`}
      >
        <Twitter size={13} />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('article.share_li', 'Share on LinkedIn')}
        onClick={recordShare}
        className={`p-2 rounded-lg bg-background/5 hover:bg-foreground/10 text-primary/40 hover:text-primary transition-all ${hasShare ? 'hidden sm:inline-flex' : ''}`}
      >
        <Linkedin size={13} />
      </a>
      <button
        onClick={hasShare ? handleNativeShare : copyLink}
        aria-label={hasShare ? t('article.share_story', 'Share story') : t('article.copy_link', 'Copy link')}
        className="p-2 rounded-lg bg-background/5 hover:bg-foreground/10 text-primary/40 hover:text-primary transition-all"
      >
        {copied ? <Check size={13} className="text-accent" /> : <Link2 size={13} />}
      </button>
    </div>
  );
}

// Save-to-library toggle. Bookmarks are session-scoped (X-Session-ID), so this
// works for every visitor — the Library page reads the same ['bookmarks'] query.
function BookmarkButton({ articleId }: { articleId: string }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: api.getBookmarks,
    staleTime: 60_000,
  });
  const saved = (data?.data || []).some((b: { article_id: string }) => b.article_id === articleId);
  const toggle = useMutation({
    mutationFn: () => (saved ? api.removeBookmarkByArticleId(articleId) : api.addBookmark(articleId)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });
  return (
    <button
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      aria-pressed={saved}
      aria-label={saved ? t('article.unsave', 'Remove from your library') : t('article.save', 'Save to your library')}
      title={saved ? t('article.unsave', 'Remove from your library') : t('article.save', 'Save to your library')}
      className={`p-2 rounded-lg transition-all ${
        saved
          ? 'bg-accent/15 text-accent-ink hover:bg-accent/25'
          : 'bg-background/5 text-primary/40 hover:bg-foreground/10 hover:text-primary'
      }`}
    >
      <Bookmark size={13} className={saved ? 'fill-current' : ''} />
    </button>
  );
}

const ArticleSkeleton = () => (
  <div className="bg-background text-primary font-sans">
    <div className="w-full h-[300px] md:h-[400px] bg-background animate-pulse" />
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="h-4 bg-background/10 rounded w-32 mb-6 animate-pulse" />
      <div className="h-10 bg-background/10 rounded w-full mb-3 animate-pulse" />
      <div className="h-10 bg-background/10 rounded w-3/4 mb-8 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-4 bg-background/5 rounded animate-pulse ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Markdown prose component with the BoA design system applied ──────────────
// Lightweight markdown → styled HTML (replaces react-markdown + remark-gfm, which
// were the article page's heaviest bundle and tanked LCP). Raw < > are encoded
// first, so only the known tags we inject below are emitted (XSS-safe for our
// material prepared by the publishing pipeline).
export function renderArticleHtml(md: string): string {
  if (!md) return '';
  let s = md.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/^#{4,6}\s+(.*)$/gm, '<h4 class="font-serif text-[1.375rem] md:text-[1.625rem] text-foreground mt-10 mb-4 leading-snug">$1</h4>');
  s = s.replace(/^###\s+(.*)$/gm, '<h3 class="font-serif text-[1.75rem] md:text-[2.25rem] text-foreground mt-12 mb-6 leading-snug">$1</h3>');
  s = s.replace(/^##\s+(.*)$/gm, '<h2 class="font-serif text-[2.5rem] md:text-[3.5rem] text-foreground mt-16 mb-8 leading-[1.1] tracking-tight">$1</h2>');
  s = s.replace(/^#\s+(.*)$/gm, '<h2 class="font-serif text-[2.5rem] md:text-[3.5rem] text-foreground mt-16 mb-8 leading-[1.1] tracking-tight">$1</h2>');
  s = s.replace(/^---$/gm, '<hr class="my-10 border-primary/10"/>');
  s = s.replace(/^>\s+(.*)$/gm, '<blockquote class="my-10 border-l-[3px] border-accent pl-8 py-2 text-foreground/75 font-serif italic text-[1.5rem] leading-[1.6]">$1</blockquote>');
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-accent-ink font-semibold">$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em class="italic text-foreground">$1</em>');
  s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-accent underline hover:text-gold-italic" target="_blank" rel="noopener noreferrer">$1</a>');
  // Use [ \t]* (not \s*) so the blank-line separator between a paragraph and a
  // list isn't swallowed into the first item, that merges the list into the
  // preceding <p> and breaks <ul>/<ol> grouping.
  s = s.replace(/^[ \t]*[-*][ \t]+(.*)$/gm, '<li class="ul-item text-foreground/90 text-[1.125rem] leading-[1.8] flex gap-4 font-normal tracking-wide mb-3"><span class="text-accent mt-1 shrink-0">→</span><span>$1</span></li>');
  s = s.replace(/^[ \t]*\d+\.[ \t]+(.*)$/gm, '<li class="ol-item text-foreground/90 text-[1.125rem] leading-[1.8] font-normal tracking-wide mb-3 pl-1">$1</li>');
  s = s.split(/\n\n+/).map(b => {
    const t = b.trim();
    if (!t) return '';
    if (/^<(h\d|li|blockquote|hr|ul|ol)/.test(t)) return t;
    return '<p class="text-foreground/90 text-[1.125rem] md:text-[1.25rem] leading-[1.8] mb-8 font-sans font-normal tracking-wide">' + t.replace(/\n/g, '<br/>') + '</p>';
  }).join('\n');
  // Wrap ordered runs first (decimal markers), then any remaining bullet runs.
  s = s.replace(/((?:<li class="ol-item[\s\S]*?<\/li>\s*)+)/g, '<ol class="my-6 space-y-2 list-decimal pl-7 marker:text-accent marker:font-semibold">$1</ol>');
  s = s.replace(/((?:<li class="ul-item[\s\S]*?<\/li>\s*)+)/g, '<ul class="my-6 space-y-2 list-none">$1</ul>');
  return s;
}

function ArticleContent({ content }: { content: string }) {
  return <EditorialContent content={content} variant="article" className="article-body" />;
}

export const BetaArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const readingProgress = useReadingProgress('article-root');
  const { isMember } = useMember();
  const { t, language } = useLanguage();

  const [lens, setLens] = useState<'original' | 'investor' | 'government' | 'explorer'>('original');
  const [isReframing, setIsReframing] = useState(false);
  const [reframedContent, setReframedContent] = useState<Record<string, string>>({});

  // Refetch when the UI language changes — the API overlays a stored fr/ar/pt
  // translation when one exists for this article.
  const { data, isLoading, isError } = useQuery<ArticleResponse>({
    queryKey: ['article', slug, language],
    queryFn: () => api.getArticle(slug!, language),
    enabled: !!slug,
    retry: 1 });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000 });

  // Dedicated related-articles query: same country or sector, excluding current
  // Must be called unconditionally before any early returns (Rules of Hooks)
  const articleCountryCode = data?.article?.country_code || '';
  const articleSectorId = data?.article?.sector_id || '';
  const { data: relatedData } = useQuery({
    queryKey: ['related-articles', articleCountryCode, articleSectorId],
    queryFn: () => api.getArticles({
      country: articleCountryCode,
      limit: '6' }),
    enabled: !!articleCountryCode,
    staleTime: 10 * 60 * 1000 });

  // Record a sponsored-article impression once per article view. The backend
  // resolves the sponsor's active campaign and no-ops for non-sponsored articles.
  const trackedImpressionFor = useRef<string | null>(null);
  useEffect(() => {
    const a = data?.article;
    if (a?.is_sponsored && a.id && trackedImpressionFor.current !== a.id) {
      trackedImpressionFor.current = a.id;
      api.trackSponsorImpression(a.id).catch(() => { /* non-critical */ });
    }
  }, [data]);

  // Read-time beacon: report seconds-on-article (and max scroll depth) when
  // the reader leaves — tab hide, route change, or unmount. This feeds
  // articles.avg_read_time_seconds, one of the three engagement inputs; until
  // this existed nothing in the app ever emitted an analytics event.
  const readStartRef = useRef<number>(0);
  const maxProgressRef = useRef<number>(0);
  const readSentRef = useRef<boolean>(false);
  useEffect(() => {
    if (readingProgress > maxProgressRef.current) {
      maxProgressRef.current = readingProgress;
    }
  }, [readingProgress]);
  useEffect(() => {
    const articleId = data?.article?.id;
    if (!articleId) return;
    readStartRef.current = Date.now();
    maxProgressRef.current = 0;
    readSentRef.current = false;
    const send = () => {
      if (readSentRef.current) return;
      const seconds = Math.round((Date.now() - readStartRef.current) / 1000);
      if (seconds < 5) return; // bounces aren't reads
      readSentRef.current = true;
      api.trackEvent({
        type: 'article_read',
        article_id: articleId,
        duration_seconds: seconds,
        scroll_depth: Math.round(maxProgressRef.current),
      });
    };
    const onHide = () => { if (document.visibilityState === 'hidden') send(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', send);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', send);
      send(); // SPA route change
    };
  }, [data?.article?.id]);

  // Show the real headline in the breadcrumb instead of the de-slugified URL.
  useSetBreadcrumb(data?.article ? stripMarkdown(data.article.title) : null);

  if (isLoading) return <ArticleSkeleton />;

  // Show a proper error page instead of silently redirecting
  if (isError || !data?.article) {
    return (
      <div className="bg-background text-primary font-sans">
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <span className="text-6xl mb-6">📰</span>
          <h2 className="font-serif text-3xl mb-3">{t('article.not_found', 'Story not found')}</h2>
          <p className="text-primary/60 mb-8 max-w-sm">
            {t('article.not_found_desc', 'This story may have moved or been updated. Browse all our coverage below.')}
          </p>
          <Link
            to="/posts"
            className="inline-flex items-center gap-2 text-accent font-semibold hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={16} /> {t('article.browse_all', 'Browse all stories')}
          </Link>
        </div>
      </div>
    );
  }

  const { article, country } = data;
  // Text direction follows each block's OWN language, not the UI language:
  // an Arabic headline renders RTL while the (still-English) body stays LTR.
  const headerDir: 'rtl' | 'ltr' = article.title_language === 'ar' ? 'rtl' : 'ltr';
  const contentDir: 'rtl' | 'ltr' = article.content_language === 'ar' ? 'rtl' : 'ltr';
  // Category = the sector ("Energy & Mining"), NOT tags[0] which is the country name.
  const countryLabel = country?.name || article.country_name || article.country_code;
  // tags may arrive as a JSON string ('["a","b"]'), an array, or be absent —
  // normalise to an array before using .find (a string has no .find → crash).
  const tagList: string[] = Array.isArray(article.tags)
    ? article.tags
    : (typeof article.tags === 'string'
        ? (() => { try { const p = JSON.parse(article.tags as unknown as string); return Array.isArray(p) ? p : []; } catch { return []; } })()
        : []);
  const categoryLabel = article.sector_name
    || tagList.find(t => typeof t === 'string' && t.toLowerCase() !== countryLabel.toLowerCase())
    || '';
  // Byline comes from the API: curated stories carry the personal byline,
  // automated briefing coverage is attributed to the desk.
  const authorName = article.author_name || 'BOA Briefing Desk';

  // ── Paywall: trust the API's server-side decision ─────────────────────────
  // The backend already truncated content for non-members and set paywall:true
  const isPaywalled = !!article.paywall;

  // Content is whatever the API returned, full for members, truncated for guests
  const articleContent = article.content || '';

  const activeContent = lens === 'original' ? articleContent : (reframedContent[lens] || articleContent);

  const handleLensChange = async (newLens: 'original' | 'investor' | 'government' | 'explorer') => {
    setLens(newLens);
    if (newLens === 'original' || reframedContent[newLens]) return;
    
    setIsReframing(true);
    try {
      const res = await api.reframeArticle(slug!, newLens);
      setReframedContent(prev => ({...prev, [newLens]: res.content}));
    } catch(e) {
      console.error(e);
      setLens('original');
    } finally {
      setIsReframing(false);
    }
  };

  const relatedArticles: ArticleListItem[] = (featuredData?.data || [])
    .filter((a: ArticleListItem) => a.slug !== slug)
    .slice(0, 3);


  const smartRelated: ArticleListItem[] = (relatedData?.data || [])
    .filter((a: ArticleListItem) => a.slug !== slug)
    .slice(0, 3);

  // Fall back to featured if country query returned nothing
  const displayRelated = smartRelated.length > 0 ? smartRelated : relatedArticles;

  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
  const editorialImage = sourcedEditorialImage(article);

  return (
    <div id="article-root" className="bg-background text-primary font-sans selection:bg-accent selection:text-primary">
      <SEO 
        title={stripMarkdown(article.meta_title || article.title)}
        description={stripMarkdown(article.meta_description || article.summary || '')}
        image={editorialImage || undefined}
        type="article"
        publishedTime={article.published_at || undefined}
        author={authorName}
      />
      {/* Reading progress bar, fixed gold line at the very top */}
      <div
        className="fixed top-0 left-0 z-[45] h-[2px] bg-accent transition-[width] duration-100 ease-linear pointer-events-none"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      

      {/* Back breadcrumb */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <Link
          to="/posts"
          className="inline-flex items-center gap-1.5 text-sm text-primary/70 hover:text-primary transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          {t('article.all_stories', 'All Stories')}
        </Link>
      </div>

      {/* Hero */}
      {editorialImage ? (
        <div className="hidden">
          {/* ?w=768 serves the pre-resized mobile variant (or the original if
              none exists yet) — same breakpoint as the prerendered fold. */}
          <picture>
            <source media="(max-width: 768px)" srcSet={editorialImage} />
            <motion.img
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              src={editorialImage}
              alt={stripMarkdown(article.title)}
              fetchPriority="high"
              decoding="async"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.dataset.fellback) { img.dataset.fellback = '1'; img.src = '/images/fallback_business.webp'; }
              }}
              className="w-full h-full object-cover"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
          <div className="absolute bottom-6 left-6 md:left-12 z-10">
            <CountryFlag code={article.country_code} title={countryLabel} size={56} className="!rounded-lg shadow-lg" />
          </div>
        </div>
      ) : (
        <div className="hidden">
          <motion.img
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={`/images/fallback_${categoryLabel?.toLowerCase().includes('tech') ? 'tech' : categoryLabel?.toLowerCase().includes('culture') ? 'culture' : 'business'}.webp`}
            alt={stripMarkdown(article.title)}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy/60 to-transparent mix-blend-multiply" />
          <div className="absolute bottom-6 left-6 md:left-12 z-10">
            <CountryFlag code={article.country_code} title={countryLabel} size={56} className="!rounded-lg shadow-lg" />
          </div>
        </div>
      )}

      <motion.main 
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12"
      >
        <header dir={headerDir} className="mb-8 md:mb-12">
          {(categoryLabel || countryLabel) && (
            <span className="text-accent-ink text-[11px] font-bold tracking-[0.2em] uppercase mb-6 block">
              {[categoryLabel, countryLabel].filter(Boolean).join(' • ')}
            </span>
          )}
          <h1 data-source-language={article.title_language} className="font-serif text-[clamp(2.5rem,5vw,4rem)] leading-[1.04] tracking-tight mb-6 max-w-4xl">
            {stripMarkdown(article.title)}
          </h1>

          {/* Lede / standfirst, rendered from article.summary */}
          {article.summary && (
            <p data-source-language={article.title_language} className="text-lg md:text-xl leading-relaxed text-foreground/70 mb-8 max-w-3xl">
              {stripMarkdown(article.summary)}
            </p>
          )}

          {/* Byline row */}
          <div className="flex items-center justify-between text-sm font-medium text-primary/75 border-y border-primary/10 py-4 gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <span className="uppercase tracking-wider text-xs whitespace-nowrap">{t('article.by', 'By')} {authorName}</span>
              <span className="text-primary/20">·</span>
              <span className="whitespace-nowrap">{article.reading_time_minutes} {t('article.min_read', 'min read')}</span>
              {article.published_at && (
                <>
                  <span className="text-primary/20">·</span>
                  <time dateTime={article.published_at} className="whitespace-nowrap text-ink-blue">
                    {formatReaderDate(article.published_at, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <BookmarkButton articleId={article.id} />
              <ShareButtons title={stripMarkdown(article.title)} url={articleUrl} articleId={article.id} />
            </div>
          </div>
        </header>

        {editorialImage && (
          <figure className="mb-8 md:mb-10 overflow-hidden rounded-xl border border-border bg-muted">
            <img
              src={heroThumb(editorialImage)}
              alt={stripMarkdown(article.title)}
              onError={(event) => hideFailedEditorialImage(event.currentTarget)}
              className="w-full aspect-[16/9] object-cover"
              loading="eager"
            />
            <figcaption className="border-t border-border bg-white px-4 py-2 text-muted-foreground"><PhotoCredit credit={article.image_credit} sourceUrl={article.image_source_url} /></figcaption>
          </figure>
        )}

        {/* Audio Player */}
        <div className="mb-10">
          <BetaAudioPlayer
            slug={slug!}
            title={stripMarkdown(article.title)}
            subtitle={categoryLabel} 
            imageUrl={editorialImage || undefined}
          />
        </div>



        <article className="relative pb-32">
          {/* Lens Switcher for Members */}
          {isMember && !isPaywalled && articleContent.length > 0 && (
            <div className="mb-8 flex items-center gap-2 p-1.5 bg-secondary border border-primary/10 rounded-full w-fit">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/40 pl-3 pr-2">{t('article.read_as', 'Read as:')}</span>
              {(['original', 'investor', 'government', 'explorer'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => handleLensChange(l)}
                  disabled={isReframing && lens === l}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                    lens === l 
                      ? 'bg-background text-primary shadow-sm' 
                      : 'text-primary/50 hover:text-primary hover:bg-foreground/50'
                  }`}
                >
                  {isReframing && lens === l && <Loader2 size={12} className="animate-spin" />}
                  {t('article.lens_' + l, l)}
                </button>
              ))}
            </div>
          )}

          {/* Article content */}
          <div data-source-language={lens === 'original' ? article.content_language : 'en'} dir={contentDir} className={`transition-opacity duration-500 ${isReframing ? 'opacity-50' : 'opacity-100'}`}>
            <ArticleContent content={activeContent} />
            {/* End mark — the classic editorial "story ends here" slug. */}
            {!isPaywalled && (
              <div aria-hidden="true" className="mt-2 flex items-center gap-3">
                <span className="inline-block w-2 h-2 rotate-45 bg-accent" />
                <span className="h-px flex-1 bg-foreground/10" />
              </div>
            )}
          </div>

          {!isPaywalled && article.ai_context && (
            <section className="mt-12 overflow-hidden rounded-2xl border border-accent/25 bg-card">
              <div className="border-b border-border bg-navy px-6 py-6 text-white md:px-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Evidence and implications</p>
                <h2 className="mt-2 font-serif text-2xl md:text-3xl">The deeper decision brief</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">A source-bounded reading of the article’s established facts, implications, limitations and unresolved verification questions.</p>
              </div>
              <div className="space-y-9 px-6 py-7 md:px-8 md:py-9">
                {article.ai_context.key_takeaways?.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl text-foreground">Supported takeaways</h3>
                    <ol className="mt-4 space-y-4">
                      {article.ai_context.key_takeaways.map((item, index) => (
                        <li key={index} className="flex gap-4 text-[15px] leading-7 text-foreground/75">
                          <span className="mt-0.5 font-serif text-lg text-accent-ink">{String(index + 1).padStart(2, '0')}</span>
                          <span>{stripMarkdown(item)}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {article.ai_context.strategic_implication && (
                  <div className="border-l-2 border-accent/50 pl-5">
                    <h3 className="font-serif text-xl text-foreground">Strategic implication</h3>
                    <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-foreground/75">{stripMarkdown(article.ai_context.strategic_implication)}</p>
                  </div>
                )}
                <div className="grid gap-8 md:grid-cols-2">
                  {article.ai_context.limitations && article.ai_context.limitations.length > 0 && (
                    <div>
                      <h3 className="font-serif text-lg text-foreground">Limits and counter-signals</h3>
                      <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-6 text-foreground/70">
                        {article.ai_context.limitations.map((item, index) => <li key={index}>{stripMarkdown(item)}</li>)}
                      </ul>
                    </div>
                  )}
                  {article.ai_context.diligence_questions && article.ai_context.diligence_questions.length > 0 && (
                    <div>
                      <h3 className="font-serif text-lg text-foreground">What still needs verification</h3>
                      <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-foreground/70">
                        {article.ai_context.diligence_questions.map((item, index) => <li key={index}>{stripMarkdown(item)}</li>)}
                      </ol>
                    </div>
                  )}
                </div>
                {article.ai_context.claim_ledger && article.ai_context.claim_ledger.length > 0 && (
                  <details className="rounded-xl border border-border bg-background/40 px-5 py-4">
                    <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.16em] text-accent-ink">Open claim ledger</summary>
                    <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground/65">
                      {article.ai_context.claim_ledger.map((item, index) => <li key={index}>{stripMarkdown(item)}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            </section>
          )}

          {/* Paywall, premium, value-forward membership prompt */}
          {isPaywalled && (
            <div className="relative mt-2">
              {/* Faded teaser so the story visibly continues beneath the prompt */}
              <div className="opacity-30 select-none pointer-events-none blur-[5px]" aria-hidden="true">
                <p className="text-foreground/80 text-[1.125rem] md:text-[1.25rem] leading-[1.8] mb-6 font-light">
                  {t('article.teaser1', 'The brief goes deeper here — the numbers, the background, and how it connects across the region, available in full for members.')}
                </p>
                <p className="text-foreground/70 text-[1.125rem] leading-[1.8] mb-6 font-light">
                  {t('article.teaser2', 'It continues with the detail and context that make this more than a headline, and there is much more still to read below.')}
                </p>
                <p className="text-foreground/60 text-[1.125rem] leading-[1.8] font-light">
                  {t('article.teaser3', 'Become a founding member to keep reading every story in full.')}
                </p>
              </div>

              {/* Gradient fade into the membership card */}
              <div className="absolute inset-x-0 -top-16 bottom-0 flex flex-col items-center justify-end bg-gradient-to-b from-transparent via-white/85 to-white px-4 pb-4">
                <ScrollReveal className="w-full max-w-lg" intensity={1.15}>
                <div className="w-full rounded-3xl bg-navy text-white border border-accent/30 shadow-[0_20px_60px_rgba(15,31,61,0.28)] p-8 md:p-10 text-center">
                  <span className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-[0.16em] text-[11px] mb-5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    {t('article.members_only', 'Members only')}
                  </span>
                  <h3 className="font-serif text-white text-[1.75rem] md:text-[2.125rem] leading-tight mb-3">
                    {t('article.keep_reading', 'Keep reading the full story')}
                  </h3>
                  <p className="text-white/70 mb-7 max-w-sm mx-auto leading-relaxed">
                    {t('article.paywall_desc', 'Back independent African coverage and unlock full stories, audio and personalized reading tools.')}
                  </p>
                  <ul className="text-left space-y-2.5 mb-7 max-w-xs mx-auto text-[15px] text-white/85">
                    {[t('article.bullet_full', 'Every story & report, in full'), t('article.bullet_bts', 'Behind-the-scenes founder updates'), t('article.bullet_vote', 'Founding members vote on what we cover next')].map(b => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="text-accent mt-0.5 shrink-0">✓</span>{b}
                      </li>
                    ))}
                  </ul>
                  <div className="mb-5 flex items-baseline justify-center gap-2">
                    <span className="font-serif text-[2.75rem] leading-none text-white">$5</span>
                    <span className="text-white/60 text-sm">{t('article.per_month_start', '/month to start')}</span>
                  </div>
                  <a
                    href={KO_FI_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-accent text-navy font-bold uppercase tracking-[0.06em] text-[12px] px-8 py-4 rounded-full shadow-[0_4px_24px_rgba(15,31,61,0.35)] hover:bg-gold-italic transition-all hover:-translate-y-0.5"
                  >
                    {t('article.unlock_now', 'Unlock every story')}
                  </a>
                  <Link to="/membership" className="block mt-4 text-white/70 text-sm hover:text-accent transition-colors">
                    {t('article.compare_tiers', 'Compare membership tiers →')}
                  </Link>
                  <p className="mt-5 text-[11px] text-white/70 uppercase tracking-widest">{t('article.cancel_anytime', 'Cancel anytime · Secure checkout')}</p>
                </div>
                </ScrollReveal>
              </div>
            </div>
          )}

          {/* Source attribution — every generated brief traces back to original
              reporting; linking it is basic editorial honesty and lets readers
              verify. Rendered AFTER the paywall block: its membership card
              intentionally overflows upward over the faded teaser, and would
              cover anything placed between the content and the wall. */}
          {article.source_url && (() => {
            let sourceHost = '';
            try { sourceHost = new URL(article.source_url).hostname.replace(/^www\./, ''); } catch { /* keep '' */ }
            return (
            <aside className="mt-12 rounded-2xl border border-foreground/10 bg-card p-6 md:p-7">
              <div className="flex items-center gap-2 text-accent-ink text-[11px] font-bold uppercase tracking-[0.16em] mb-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                {t('article.source_label', 'Source')}
              </div>
              <p className="text-[13px] text-foreground/70 leading-relaxed mb-3">
                {t('article.source_disclosure', 'This briefing draws on the original reporting below:')}
              </p>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-start gap-2 font-serif text-[1.0625rem] leading-snug text-foreground hover:text-accent transition-colors"
              >
                <span className="underline decoration-accent/40 underline-offset-4 group-hover:decoration-accent">
                  {stripMarkdown(article.source_title) || sourceHost || article.source_url}
                </span>
                <svg className="mt-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
              </a>
              <div className="mt-2 text-[12px] text-foreground/70">
                {sourceHost}
                {article.source_published_at && (() => {
                  const d = new Date(article.source_published_at);
                  return Number.isNaN(d.getTime()) ? '' : ` · ${formatReaderDate(d, { day: 'numeric', month: 'short', year: 'numeric' })}`;
                })()}
              </div>
            </aside>
            );
          })()}

          {/* Post-read nudge for non-members, a calm, confident invitation (not a hard wall) */}
          {!isPaywalled && !isMember && articleContent.length > 0 && (
            <ScrollReveal className="block mt-16 rounded-3xl bg-navy text-white border border-accent/20 p-8 md:p-10 text-center">
              <span className="inline-flex items-center gap-2 text-accent font-bold uppercase tracking-[0.16em] text-[11px] mb-4">{t('article.indep_journalism', 'Independent coverage')}</span>
              <p className="font-serif text-white text-2xl md:text-[1.75rem] mb-3">{t('article.enjoyed', 'Enjoyed this story?')}</p>
              <p className="text-white/70 text-[15px] mb-7 max-w-md mx-auto leading-relaxed">
                {t('article.enjoyed_desc', 'BOA-Story is reader-funded and independent. Founding members keep these stories coming, and help decide what we cover next.')}
              </p>
              <a
                href={KO_FI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-accent text-navy font-bold uppercase tracking-[0.06em] text-[12px] px-8 py-4 rounded-full hover:bg-gold-italic transition-all hover:-translate-y-0.5"
              >
                {t('article.become_member', 'Become a Founding Member')}
              </a>
              <p className="mt-4 text-[11px] text-white/70 uppercase tracking-widest">{t('article.from_5_cancel', 'From $5/month · cancel anytime')}</p>
            </ScrollReveal>
          )}
        </article>
      </motion.main>

      {/* More Stories */}
      <aside className="bg-secondary border-t border-primary/8 py-14 md:py-24 px-6 relative z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-serif text-[32px] text-primary">{t('article.more_stories', 'More Stories')}</h2>
            <Link to="/posts" className="text-accent-ink font-semibold text-sm tracking-wider uppercase hover:text-primary transition-colors">
              {t('article.view_all', 'View All →')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayRelated.length > 0
              ? displayRelated.map((a: ArticleListItem) => (
                  <Link
                    key={a.slug}
                    to={`/posts/${a.slug}`}
                    className="group bg-background rounded-xl overflow-hidden border border-primary/10 hover:border-accent/40 transition-colors"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CountryFlag code={a.country_code} title={a.country_name} size={24} />
                        {a.sector_name && (
                          <span className="text-[11px] font-semibold tracking-widest text-accent-ink uppercase">{a.sector_name}</span>
                        )}
                      </div>
                      <h4 className="font-serif text-lg leading-snug mb-2 group-hover:text-accent transition-colors">{stripMarkdown(a.title)}</h4>
                      <p className="text-sm text-primary/70">{a.reading_time_minutes} {t('article.min_read', 'min read')}</p>
                    </div>
                  </Link>
                ))
              : (
                  <div className="col-span-1 md:col-span-3 text-center py-12">
                    <p className="text-primary/70 mb-4">{t('article.archive_note', 'Explore the full archive for more stories from the continent.')}</p>
                    <Link
                      to="/posts"
                      className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:opacity-80 transition-opacity"
                    >
                      {t('article.browse_arrow', 'Browse all stories →')}
                    </Link>
                  </div>
                )
            }
          </div>
        </div>
      </aside>
    </div>
  );
};
