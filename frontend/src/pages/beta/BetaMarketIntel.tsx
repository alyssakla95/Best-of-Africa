// ─────────────────────────────────────────────────────────────────────────────
// SUPPORTER FEED
// A transparent, editorial look at what we're building, for Ko-fi backers.
// Route: /intel
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock, ArrowRight, BookOpen, MapPin, Coffee, PenLine, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { stripMarkdown } from '@/lib/utils';
import { KO_FI_URL } from '../../constants/beta';

// Dynamic content fetched via API

// ─── Coverage breakdown using real article data ───────────────────────────────

function CoverageBlock({ isMember }: { isMember: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 10 * 60 * 1000,
    enabled: isMember });

  const articles = data?.data ?? [];

  // Tally countries and sectors from real article data
  const countryCounts: Record<string, number> = {};
  const sectorCounts: Record<string, { id: string; count: number; name: string }> = {};
  articles.forEach((a: any) => {
    if (a.country_name) countryCounts[a.country_name] = (countryCounts[a.country_name] || 0) + 1;
    if (a.sector_name) {
      if (!sectorCounts[a.sector_name]) {
        sectorCounts[a.sector_name] = { id: a.sector_id, count: 0, name: a.sector_name };
      }
      sectorCounts[a.sector_name].count += 1;
    }
  });

  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const topSectors = Object.values(sectorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (!isMember) {
    return (
      <div className="bg-background rounded-2xl border border-primary/8 p-10 flex flex-col items-center justify-center text-center">
        <div className="bg-accent/10 p-4 rounded-full mb-5">
          <Lock size={24} className="text-accent" />
        </div>
        <p className="font-serif text-xl font-semibold text-primary mb-2">Coverage Breakdown</p>
        <p className="text-sm text-primary/50 mb-6 max-w-sm">
          Backers see exactly which countries and topics are getting research attention, updated as new stories are added.
        </p>
        <a
          href={KO_FI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-accent text-navy font-semibold px-6 py-3 rounded-xl text-sm hover:brightness-110 transition-all"
        >
          Support on Ko-fi
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background rounded-2xl border border-primary/8 p-8 animate-pulse space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-4 bg-background/8 rounded w-full" />)}
      </div>
    );
  }

  if (topCountries.length === 0) {
    return (
      <div className="bg-background rounded-2xl border border-primary/8 p-10 text-center text-primary/40 text-sm">
        Coverage data is loading as stories are published.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {/* Countries */}
      <div className="bg-background rounded-xl border border-primary/8 p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin size={16} className="text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary/40">Countries in focus</span>
        </div>
        <ul className="space-y-3">
          {topCountries.map(([country, count]) => (
            <li key={country} className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">{country}</span>
              <span className="text-[11px] text-primary/40 bg-background/5 px-2 py-0.5 rounded-full">
                {count} {count === 1 ? 'story' : 'stories'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Topics */}
      <div className="bg-background rounded-xl border border-primary/8 p-6">
        <div className="flex items-center gap-2 mb-5">
          <PenLine size={16} className="text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary/40">Topics being covered</span>
        </div>
        <ul className="space-y-3">
          {topSectors.map((sector) => (
            <li key={sector.name} className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary capitalize flex items-center gap-2">
                {sector.name}
                <Link to={`/sectors/${sector.id}/trends`} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded uppercase tracking-wider font-bold hover:bg-accent hover:text-navy transition-colors">
                  View Trends
                </Link>
              </span>
              <span className="text-[11px] text-primary/40 bg-background/5 px-2 py-0.5 rounded-full">
                {sector.count} {sector.count === 1 ? 'story' : 'stories'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const BetaMarketIntel = () => {
  const { isMember } = useMember();

  // Live funding progress from system_config (Ko-fi webhook keeps it current).
  const { data: sysConfig } = useSystemConfig();
  const fundGoal = Number(sysConfig?.['funding_goal']) || 800;
  const fundRaised = Number(sysConfig?.['funding_raised']) || 304;
  const fundCoffees = Number(sysConfig?.['funding_coffees']) || 62;
  const fundPct = Math.min(100, Math.round((fundRaised / fundGoal) * 100));

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: api.getPlatformStats,
    staleTime: 10 * 60 * 1000 });

  const { data: founderLog, isLoading: isLogLoading } = useQuery({
    queryKey: ['founder-log'],
    queryFn: api.getFounderLog,
    staleTime: 5 * 60 * 1000 });

  return (
    <div className="pb-24">
      <SEO
        title="Supporter Feed | BOA-Story"
        description="A behind-the-scenes look at what we're building, for Ko-fi backers."
      />
      

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="app-hero bg-background px-6 pb-16 pt-8 text-foreground">
        <div className="page-container">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Heart size={12} />
            Supporter Feed
          </div>
          <h1 className="font-serif text-[40px] md:text-[56px] leading-tight mb-4">
            Behind the<br />building.
          </h1>
          <p className="text-foreground/50 text-lg max-w-xl leading-relaxed">
            An honest, behind-the-scenes look at what's being researched, what's being published, and where the project is headed. For the people making it possible.
          </p>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-ink-blue">Open to all · No login required</p>
        </div>
      </div>

      <div className="page-container content-split py-12 md:py-16">

        {/* ── Project Stats ──────────────────────────────────────────────── */}
        {stats && (
          <section className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: stats.total_articles?.toLocaleString() ?? '-', label: 'Stories published' },
                { value: stats.total_countries ?? '-', label: 'Countries covered' },
                { value: stats.regions ?? '-', label: 'African regions' },
                { value: stats.total_views ? `${(stats.total_views / 1000).toFixed(1)}k` : '-', label: 'Total reads' },
              ].map(({ value, label }) => (
                <div key={label} className="group bg-white rounded-xl border border-border border-t-[3px] border-t-accent/70 shadow-[0_1px_6px_rgba(0,0,0,0.08)] p-5 text-center hover:shadow-[0_10px_30px_-10px_rgba(15,31,61,0.2)] hover:-translate-y-0.5 transition-all duration-300">
                  <p className="font-serif text-[2rem] font-bold text-accent leading-none mb-1">{value}</p>
                  <p className="text-[11px] text-ink-blue uppercase tracking-widest font-medium">{label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Editorial Updates ─────────────────────────────────────────── */}
        <section className="section-frame">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen size={18} className="text-accent" />
            <h2 className="font-serif text-2xl text-primary">What I'm working on</h2>
          </div>

          <div className="space-y-4">
            {isLogLoading ? (
              <div className="bg-background rounded-xl border border-primary/8 p-6 animate-pulse space-y-3">
                <div className="h-4 bg-background/8 rounded w-1/4 mb-4" />
                <div className="h-6 bg-background/8 rounded w-3/4 mb-2" />
                <div className="h-4 bg-background/8 rounded w-full" />
                <div className="h-4 bg-background/8 rounded w-5/6" />
              </div>
            ) : founderLog ? (
              founderLog.map((update: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-background rounded-xl border border-primary/8 p-6 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                      {update.tag}
                    </span>
                    <span className="text-[11px] text-primary/30">{update.date}</span>
                  </div>
                  <h3 className="font-serif text-lg text-primary mb-2 leading-snug">{stripMarkdown(update.title)}</h3>
                  <p className="text-sm text-primary/60 leading-relaxed">{stripMarkdown(update.body)}</p>
                </motion.div>
              ))
            ) : (
              <div className="text-sm text-primary/50 text-center py-6">
                No updates available right now.
              </div>
            )}
          </div>
        </section>

        {/* ── Coverage Breakdown (members only) ────────────────────────── */}
        <section className="section-frame">
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={18} className="text-accent" />
            <h2 className="font-serif text-2xl text-primary">Where we're reporting</h2>
            {!isMember && (
              <span className="text-[11px] text-primary/40 font-medium">backers only</span>
            )}
          </div>
          <CoverageBlock isMember={isMember} />
        </section>

        {/* ── Ko-fi Progress ────────────────────────────────────────────── */}
        <section className="section-frame">
          <div className="flex items-center gap-2 mb-5">
            <Coffee size={18} className="text-accent" />
            <h2 className="font-serif text-xl text-primary">Ko-fi goal progress</h2>
          </div>
          <div className="mb-3 flex justify-between items-end">
            <span className="font-serif text-3xl font-bold text-primary">{fundPct}%</span>
            <span className="text-sm text-primary/40">of ${fundGoal.toLocaleString()} goal</span>
          </div>
          <div className="w-full h-2.5 bg-background/8 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${fundPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className="h-full bg-accent rounded-full"
            />
          </div>
          <p className="text-sm text-primary/50 mb-6 leading-relaxed">
            {fundCoffees} coffees received so far. Each one goes directly toward keeping the platform live and the reporting going. This is what independent, community-backed journalism looks like.
          </p>
          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-navy font-semibold px-6 py-3 rounded-xl text-sm hover:brightness-110 transition-all"
          >
            Buy me a coffee <ArrowRight size={14} />
          </a>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        <section className="section-frame text-center lg:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-4">Read the work</p>
          <h3 className="font-serif text-3xl mb-3">See the stories behind all of this.</h3>
          <p className="text-foreground/50 mb-8 max-w-md mx-auto">
            Every editorial decision above has a story attached to it. Read them here.
          </p>
          <Link
            to="/posts"
            className="inline-flex items-center gap-2 bg-accent text-navy font-semibold px-8 py-4 rounded-xl hover:brightness-110 transition-all hover:-translate-y-0.5"
          >
            Browse all stories <ArrowRight size={15} />
          </Link>
        </section>

      </div>

      
    </div>
  );
};
