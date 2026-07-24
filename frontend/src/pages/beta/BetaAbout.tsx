import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useLanguage } from '@/context/LanguageContext';

export const BetaAbout = () => {
  const { t } = useLanguage();
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: api.getPlatformStats,
    staleTime: 10 * 60 * 1000 });

  return (
    <div className="selection:bg-accent selection:text-primary bg-background text-foreground min-h-screen">
      <SEO 
        title="About | BOA-Story" 
        description="A digital home for real, thoughtful stories about African lives, cities, and ideas, beyond charity ads and disaster headlines."
      />
      
      {/* 1. HERO, full navy band (spec §3.7) */}
      <section className="app-hero border-b border-border bg-card px-5 py-12 sm:px-6 sm:py-14 md:py-20">
        <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-[1fr_280px] md:items-end">
          <div>
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">About BOA-Story</p>
            <h1 className="max-w-3xl break-words font-serif text-foreground text-[clamp(2.35rem,11vw,4.5rem)] leading-[1.02] md:leading-[0.96] tracking-tight">
              {t('landing.mission_title', "We're building Africa's story.")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/65">
              Independent reporting on African lives, cities, businesses and ideas—grounded in context, not stereotypes.
            </p>
          </div>
          <img src="/images/v2_about_hero.webp" alt="African entrepreneur overlooking a city" className="hidden aspect-[4/3] w-full rounded-xl object-cover md:block" />
        </div>
      </section>

      {/* 1b. Live platform stats strip, proof, not aspiration */}
      {stats && (
        <section className="border-b border-border bg-background">
          <div className="max-w-5xl mx-auto grid grid-cols-2 gap-x-5 gap-y-8 px-4 py-8 sm:px-6 md:grid-cols-4 md:gap-8">
            {[
              { value: stats.total_articles.toLocaleString(), label: t('about.stat_published', 'Stories Published') },
              { value: stats.total_countries, label: t('about.stat_countries', 'Countries in Directory') },
              { value: stats.regions, label: t('about.stat_regions', 'African Regions') },
              { value: stats.total_views > 1000 ? `${(stats.total_views / 1000).toFixed(1)}k` : stats.total_views, label: t('about.stat_reads', 'Total Reads') },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-serif text-[2rem] font-semibold text-foreground leading-none mb-2">{value}</p>
                <p className="text-[11px] text-foreground/50 uppercase tracking-widest font-bold">{label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="max-w-4xl mx-auto px-5 sm:px-6">
        
        {/* 2. THE FOUNDER & MISSION */}
        <section className="py-14 md:py-20 border-b border-foreground/10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1 }}
            className="prose prose-lg max-w-none prose-p:text-[1.125rem] prose-p:md:text-[1.25rem] prose-p:leading-[1.75] prose-p:text-foreground/75"
          >
            <p className="mb-12">
              {t('about.founder1', "I'm a student and independent writer trying to close the gap between the Africa you see in headlines and the Africa I hear about from friends, founders, and family. Here I'm building BOA-Story, a small, self-funded project to surface grounded stories about African cities, creators, and everyday opportunity.")}
            </p>
            <p className="text-foreground/70">
              {t('about.founder2a', "We're building this because the continent deserves better stories than headlines about crisis and chaos. The real day-to-day energy, the businesses being built, the cultures thriving, the cities changing, deserves a platform built for it. Your support at this quiet, early stage is what turns")} <span className="text-accent italic">"{t('about.founder2_q1', 'someone should build this')}"</span> {t('about.founder2_mid', 'into')} <span className="text-accent italic">"{t('about.founder2_q2', "we're actually building it.")}"</span>
            </p>
          </motion.div>
        </section>

        {/* 3. WHAT WE'RE BUILDING */}
        <section className="py-14 md:py-20 border-b border-foreground/10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
            className="font-serif text-[2.25rem] sm:text-[3rem] mb-10 text-foreground leading-none"
          >
            {t('about.what_title', 'What this actually is')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card p-8 rounded-xl border border-foreground/10">
              <span className="text-xs block mb-6 font-bold tracking-widest text-accent">01</span>
              <h3 className="font-serif text-[2rem] mb-4 text-foreground">{t('about.real_title', 'Real Stories')}</h3>
              <p className="text-foreground/60 text-[1.125rem] leading-[1.8]">
                {t('about.real_desc', 'A living digital platform built to surface real, grounded stories about African lives, cities, creators, and everyday opportunity.')}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card p-8 rounded-xl border border-foreground/10">
              <span className="text-xs block mb-6 font-bold tracking-widest text-accent">02</span>
              <h3 className="font-serif text-[2rem] mb-4 text-foreground">{t('about.narr_title', 'Narrative Correction')}</h3>
              <p className="text-foreground/60 text-[1.125rem] leading-[1.8]">
                {t('about.narr_desc', 'Explicitly positioned against the dominant media framing of Africa as a place of crisis, charity, and disaster. Not a news outlet, not a charity, and not a personal blog.')}
              </p>
            </motion.div>
          </div>
        </section>

        {/* 4. WHY NOW */}
        <section className="py-14 md:py-20 border-b border-foreground/10">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="font-serif text-[2.25rem] sm:text-[3rem] mb-8 text-foreground leading-none"
          >
            {t('about.why_title', 'Why Ko-fi?')}
          </motion.h2>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="prose max-w-4xl prose-p:text-[1.25rem] prose-p:leading-[1.8] text-foreground/70 font-light">
            <p className="mb-8">
              {t('about.why1', 'The platform is currently in prototype and pre-launch stage. I chose Ko-fi because this is an independent, community-backed project.')}
            </p>
            <p>
              {t('about.why2', "This isn't backed by venture capital or a media conglomerate. The Ko-fi page is the primary mechanism for converting early believers into financial backers who make the full launch possible.")}
            </p>
          </motion.div>
        </section>

        {/* 6. CTA */}
        <section className="py-14 md:py-20 text-left relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-none tracking-tight mb-8 text-foreground">
              {t('about.cta_title_1', 'Help me launch')} {t('about.cta_title_2', 'BOA-Story.')}
            </h2>
            <a 
              href="https://ko-fi.com/maillescortes"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent text-navy font-bold px-7 py-3 rounded-md hover:bg-gold-italic transition-colors text-sm"
            >
              {t('about.cta_btn', 'Buy me a coffee on Ko-fi')}
            </a>
          </motion.div>
        </section>

      </main>

      
    </div>
  );
};
