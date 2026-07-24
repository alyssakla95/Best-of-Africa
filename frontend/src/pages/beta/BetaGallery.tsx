import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { PhotoCredit } from '../../components/PhotoCredit';
import { api } from '../../services/api';
import type { ArticleListItem } from '../../types';
import { sourcedEditorialImage } from '../../lib/editorialImage';
import { stripMarkdown } from '../../lib/utils';

export const BetaGallery = () => {
  const { data } = useQuery({
    queryKey: ['gallery-source-linked-stories'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000,
  });
  const stories: ArticleListItem[] = (data?.data || []).slice(0, 12);

  return (
    <div className="bg-white text-navy">
      <SEO title="Photo Desk | BOA-Story" description="Source-attributed photography attached to BOA-Story reporting." />
      <header className="border-b border-border bg-navy text-white">
        <div className="page-container py-12 sm:py-16 md:py-20">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70"><Camera size={15}/> Photo desk</p>
          <h1 className="max-w-3xl font-serif text-white">The reporting, seen at its source.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">Every photograph shown here is attached to a specific published report and carries a visible credit linking back to the publisher or rights holder. Illustrative and generated imagery is excluded.</p>
        </div>
      </header>

      <main className="page-container py-10 sm:py-14 md:py-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => {
            const image = sourcedEditorialImage(story);
            return (
              <Link key={story.slug} to={`/posts/${story.slug}`} className="group overflow-hidden rounded-xl border border-border bg-white transition-colors hover:border-navy/35">
                {image ? (
                  <figure className="relative aspect-[4/3] overflow-hidden bg-navy">
                    <img src={image} alt={stripMarkdown(story.title)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                    <PhotoCredit credit={story.image_credit} sourceUrl={story.image_source_url} className="absolute bottom-2 left-2 rounded bg-navy/85 px-2 py-1 text-white" />
                  </figure>
                ) : (
                  <div className="flex min-h-32 items-end bg-navy p-5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Source record · {story.country_name || 'Africa'}</div>
                )}
                <div className="p-4 sm:p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{story.country_name || 'Africa'}{story.sector_name ? ` · ${story.sector_name}` : ''}</p>
                  <h2 className="mt-3 font-serif text-xl leading-snug text-navy">{stripMarkdown(story.title)}</h2>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-navy">Open report <ArrowRight size={14}/></span>
                </div>
              </Link>
            );
          })}
        </div>
        <Link to="/posts" className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-navy px-5 text-sm font-semibold sm:w-auto">Browse all reporting <ArrowRight size={16}/></Link>
      </main>
    </div>
  );
};
