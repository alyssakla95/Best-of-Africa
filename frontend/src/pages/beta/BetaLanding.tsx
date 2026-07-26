import { ArrowRight, Headphones, Map, Newspaper, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { CountryFlag } from '../../components/CountryFlag';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES, KO_FI_URL } from '../../constants/beta';
import type { ArticleListItem } from '../../types';
import { heroThumb, stripMarkdown } from '@/lib/utils';
import { sourcedEditorialImage } from '../../lib/editorialImage';
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

      <section className="bg-navy text-white border-b border-white/10">
        <div className="page-container py-14 md:py-20 grid lg:grid-cols-[1.05fr_.95fr] gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-accent text-xs font-semibold uppercase tracking-[0.12em] mb-5">
              Africa business intelligence
            </p>
            <h1 className="font-serif text-white text-[clamp(3rem,6vw,5.5rem)] leading-[0.98] tracking-tight max-w-3xl mb-6">
              Intelligence for decisions across Africa.
            </h1>
            <p className="text-white/75 text-lg md:text-xl leading-relaxed max-w-2xl mb-8">
              Structured country intelligence, market coverage and decision-ready briefings for investors, companies, governments and institutions operating across the continent.
            </p>
            <div className="grid gap-3 sm:flex sm:flex-wrap">
              <Link to="/enterprise" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-navy transition-colors hover:bg-white/90">
                Explore the market-entry pilot <ArrowRight size={16} />
              </Link>
              <Link to="/intelligence" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
                Enter Intelligence
              </Link>
            </div>
          </div>

          {lead && (
            <Link to={`/posts/${lead.slug}`} className="group relative min-h-[22rem] md:min-h-[430px] overflow-hidden rounded-xl border border-white/15 bg-navy-mid block">
              {leadImage && <img src={heroThumb(leadImage)} alt={stripMarkdown(lead.title)} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />}
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-transparent" />
              {leadImage && <PhotoCredit credit={lead.image_credit} sourceUrl={lead.image_source_url} className="absolute right-3 top-3 z-10 rounded bg-navy/80 px-2 py-1 text-white" />}
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
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

      <section className="border-b border-border bg-card">
        <div className="page-container py-6">
          <p className="mb-5 max-w-4xl font-serif text-xl text-navy">For Canadian organizations deciding which African market deserves deeper entry diligence—and which risks must be resolved first.</p>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Built for consequential decisions</p>
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-navy">
            {['Corporate strategy', 'Growth teams', 'Export leaders', 'Trade advisers', 'Market-entry counsel', 'Investment committees'].map(label => <span key={label}>{label}</span>)}
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
                <img src={heroThumb(sourcedEditorialImage(article)!)} alt={stripMarkdown(article.title)} loading="lazy" className="w-full h-full object-cover" />
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
              { Icon: Newspaper, title: 'Reporting', copy: 'Original stories and concise daily briefings.', to: '/posts' },
              { Icon: Map, title: 'Country hubs', copy: 'Coverage, sectors and context for all 54 nations.', to: '/countries' },
              { Icon: TrendingUp, title: 'Intelligence', copy: 'Real coverage momentum and market signals.', to: '/intelligence' },
              { Icon: Headphones, title: 'Listen', copy: 'Clear, consistent audio briefings for listening on the move.', to: '/posts' },
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
