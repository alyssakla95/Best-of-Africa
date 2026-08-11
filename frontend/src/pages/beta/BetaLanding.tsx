import { ArrowRight, Headphones, Map, Newspaper, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { CountryFlag } from '../../components/CountryFlag';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES, KO_FI_URL } from '../../constants/beta';
import type { ArticleListItem } from '../../types';
import { heroThumb, stripMarkdown } from '@/lib/utils';
import { hideFailedEditorialImage, sourcedEditorialImage } from '../../lib/editorialImage';
import { PhotoCredit } from '../../components/PhotoCredit';

const StoryMeta = ({ article }: { article: ArticleListItem }) => (
  <div className="flex items-center gap-3 text-xs text-white/75">
    {article.country_code && (
      <CountryFlag code={article.country_code} title={article.country_name} size={22} />
    )}
    <span>{article.country_name}</span>
    {article.sector_name && <><span aria-hidden="true">·</span><span>{article.sector_name}</span></>}
  </div>
);

export const BetaLanding = () => {
  const { data } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000,
  });
  const liveStories = data?.data?.slice(0, 4) || [];
  const stories: ArticleListItem[] = liveStories.length > 0 ? liveStories : FALLBACK_ARTICLES.slice(0, 4);
  const lead = stories[0];
  const secondary = stories.slice(1, 4);
  const leadImage = lead ? sourcedEditorialImage(lead) : null;

  return (
    <div className="selection:bg-accent selection:text-navy">
      <SEO
        title="BOA-Story"
        description="Independent reporting and intelligence from across Africa."
      />

      <section className="border-b border-white/10 bg-navy text-white">
        <div className="page-container grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-[0.12em] mb-5">
              Independent reporting across Africa
            </p>
            <h1 dir="auto" className="font-serif text-white text-[clamp(3rem,6vw,5.5rem)] leading-[0.98] tracking-tight max-w-3xl mb-6">
              Know what is shaping Africa today.
            </h1>
            <p className="text-white/75 text-lg md:text-xl leading-relaxed max-w-2xl mb-8">
              Start with the daily Briefing, then follow source-attributed stories, countries and research across the continent.
            </p>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link to="/feed" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-navy transition-colors hover:bg-accent/90">
                Open the Briefing <ArrowRight size={16} />
              </Link>
              <Link to="/posts" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Browse Stories
              </Link>
            </div>
            <div className="mt-8 border-t border-white/15 pt-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">Professional pathways</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
                <Link to="/enterprise" className="inline-flex items-center gap-1.5 font-semibold text-white/80 hover:text-accent">
                  Enterprise <ArrowRight size={14} />
                </Link>
                <Link to="/specialists" className="inline-flex items-center gap-1.5 font-semibold text-white/80 hover:text-accent">
                  Specialists <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {lead && (
            <Link to={`/posts/${lead.slug}`} className="group relative block min-h-[22rem] overflow-hidden rounded-xl border border-white/15 bg-navy-mid md:min-h-[430px]" aria-label={`Read story: ${stripMarkdown(lead.title)}`}>
              {leadImage && <img src={heroThumb(leadImage)} alt={stripMarkdown(lead.title)} onError={(event) => hideFailedEditorialImage(event.currentTarget)} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-transparent" />
              {leadImage && <PhotoCredit credit={lead.image_credit} sourceUrl={lead.image_source_url} className="absolute right-3 top-3 z-10 rounded bg-navy/80 px-2 py-1 text-white" />}
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Current reporting</p>
                <StoryMeta article={lead} />
                <h2 className="font-serif text-white text-3xl md:text-4xl leading-tight mt-4 group-hover:text-accent transition-colors">
                  {stripMarkdown(lead.title)}
                </h2>
                <p className="text-white/75 mt-3 line-clamp-2 leading-relaxed">
                  {stripMarkdown(lead.summary)}
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="page-container grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-center md:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy/55">Go beyond the headline</p>
            <h2 className="mt-3 font-serif text-3xl text-navy md:text-4xl">Follow the story into country context and research.</h2>
            <p className="mt-4 text-base leading-8 text-navy/70">
              Move from current reporting to country records and official market evidence without leaving the reader journey.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:min-w-[22rem]">
            <Link to="/countries" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">
              Explore Countries <ArrowRight size={16} />
            </Link>
            <Link to="/intelligence" className="inline-flex min-h-12 items-center justify-center rounded-md border border-navy px-5 py-3 text-sm font-semibold text-navy">
              Open Research
            </Link>
          </div>
        </div>
      </section>

      <section className="page-container py-14 md:py-20">
        <div className="flex items-end justify-between gap-6 mb-8 border-b border-border pb-5">
          <div>
            <p className="text-accent-ink text-xs font-semibold uppercase tracking-[0.1em] mb-2">Latest reporting</p>
            <h2 className="font-serif text-3xl md:text-4xl text-navy">Stories worth your time</h2>
          </div>
          <Link to="/posts" className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-accent-ink">
            All stories <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden">
          {secondary.map((article) => (
            <Link key={article.slug} to={`/posts/${article.slug}`} className="group bg-card p-5 md:p-6 min-w-0">
              {sourcedEditorialImage(article) ? <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-navy mb-5">
                <img src={heroThumb(sourcedEditorialImage(article)!)} alt={stripMarkdown(article.title)} loading="lazy" onError={(event) => hideFailedEditorialImage(event.currentTarget)} className="w-full h-full object-cover" />
                <PhotoCredit credit={article.image_credit} sourceUrl={article.image_source_url} className="absolute bottom-2 left-2 rounded bg-navy/80 px-2 py-1 text-white" />
              </div> : <div className="mb-5 h-1 w-14 bg-navy" aria-hidden="true" />}
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-3">
                {article.country_code && <CountryFlag code={article.country_code} title={article.country_name} size={20} />}
                <span>{article.country_name}</span>
                {article.sector_name && <><span>·</span><span>{article.sector_name}</span></>}
              </div>
              <h3 className="font-serif text-xl md:text-2xl leading-snug text-navy group-hover:text-accent-ink transition-colors">
                {stripMarkdown(article.title)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 line-clamp-3">
                {stripMarkdown(article.summary)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="page-container py-14 md:py-16">
          <div className="max-w-2xl mb-10">
            <p className="text-accent-ink text-xs font-semibold uppercase tracking-[0.1em] mb-3">The intelligence platform</p>
            <h2 className="font-serif text-3xl md:text-4xl text-navy mb-4">From signal to continental context.</h2>
            <p className="text-muted-foreground leading-relaxed">Move from live reporting to country intelligence and continent-wide evidence without switching products.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 border border-border rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { Icon: Headphones, title: 'Briefing', copy: 'A concise view of the developments shaping Africa now.', to: '/feed' },
              { Icon: Newspaper, title: 'Stories', copy: 'Source-attributed reporting with the context behind the headline.', to: '/posts' },
              { Icon: Map, title: 'Countries', copy: 'Coverage, sectors and context for all 54 nations.', to: '/countries' },
              { Icon: TrendingUp, title: 'Research', copy: 'Comparable sector measures and official market evidence.', to: '/intelligence' },
            ].map(({ Icon, title, copy, to }) => (
              <Link key={title} to={to} className="group p-6 bg-card hover:bg-secondary/60 transition-colors">
                <Icon size={20} className="text-accent-ink mb-5" />
                <h3 className="text-base font-semibold text-navy mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{copy}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy group-hover:text-accent-ink">Explore <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-14 md:py-20">
        <div className="bg-navy text-white rounded-xl px-6 py-10 md:px-10 md:py-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <p className="text-accent text-xs font-semibold uppercase tracking-[0.1em] mb-3">Independent by design</p>
            <h2 className="font-serif text-white text-3xl md:text-4xl mb-3">Support reporting built for the long view.</h2>
            <p className="text-white/70 leading-relaxed">Membership funds the reporting, infrastructure and research behind BOA-Story.</p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to="/membership" className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-navy-mid transition-colors">View membership</Link>
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">Support once</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BetaLanding;
