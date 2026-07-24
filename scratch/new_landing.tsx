import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  BetaNav,
  GoldButton,
  AnimatedHeadline,
  SectionLabel,
  CardReveal,
  GoldDivider,
  StatCounter,
  MembershipTiersGrid
} from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { FALLBACK_ARTICLES, KO_FI_URL } from '../../constants/beta';
import type { ArticleListItem } from '../../types';

const stripMarkdown = (text: string): string => {
  if (!text) return text;
  let t = text.trim();
  t = t.replace(/^\*{1,2}\s*/g, '').replace(/\s*\*{1,2}$/g, '');
  if (t.startsWith('"') && t.endsWith('"') && t.length > 2) t = t.slice(1, -1);
  return t.trim();
};

const SUBHEADLINES = ['Business.', 'Culture.', 'Capital.', 'Strategy.', 'Stories.'];

function RotatingSubheadline() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % SUBHEADLINES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="h-8 flex items-center justify-center mb-4 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={SUBHEADLINES[index]}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-accent font-serif text-xl font-semibold tracking-wide"
        >
          {SUBHEADLINES[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Is this finished?',
    a: 'No. The platform is currently in prototype and pre-launch stage. I am building this iteratively in public. Your early support makes the full launch possible.',
  },
  {
    q: 'Can I cancel?',
    a: "Yes, you can cancel at any time from your Ko-fi dashboard — no lock-in periods.",
  },
  {
    q: 'Why now?',
    a: "Because the continent deserves better stories than headlines about crisis and chaos. The real day-to-day energy deserves a platform built for it, and it needs independent backing to stay authentic.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-primary/8 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        aria-expanded={open}
      >
        <span className="font-medium text-primary/90 group-hover:text-primary transition-colors text-base">{q}</span>
        {open
          ? <ChevronUp size={16} className="text-accent shrink-0" />
          : <ChevronDown size={16} className="text-primary/40 shrink-0 group-hover:text-primary/70 transition-colors" />
        }
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-primary/60 text-sm leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const BetaLanding = () => {
  const [heroScrolled, setHeroScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setHeroScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: api.getPlatformStats,
    staleTime: 10 * 60 * 1000,
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-articles'],
    queryFn: api.getFeaturedArticles,
    staleTime: 5 * 60 * 1000,
  });

  const previewArticles: ArticleListItem[] = featuredData?.data?.slice(0, 3) || FALLBACK_ARTICLES.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-primary font-sans selection:bg-accent selection:text-primary overflow-x-hidden">
      <SEO 
        title="BOA-Story" 
        description="A digital home for real, thoughtful stories about African lives, cities, and ideas."
      />
      <BetaNav />

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-32 overflow-hidden border-b border-white/5 bg-primary text-primary-foreground">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={prefersReducedMotion ? { opacity: 0.15, scale: 1 } : { opacity: 0.15, scale: 1, x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: prefersReducedMotion ? 1 : 8, repeat: prefersReducedMotion ? 0 : Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent rounded-full blur-[120px]"
          />
        </div>

        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.svg
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.04, scale: 1 }}
            transition={{ duration: 4, ease: "easeOut" }}
            viewBox="0 0 400 500"
            className="w-[420px] h-[520px] fill-accent"
            aria-hidden="true"
          >
            <path d="M200 20 C160 20 130 40 110 70 C90 100 85 130 80 160 C75 190 60 210 50 240 C40 270 38 300 45 330 C52 360 70 385 90 405 C110 425 135 440 160 450 C175 455 185 460 200 462 C215 460 225 455 240 450 C265 440 290 425 310 405 C330 385 348 360 355 330 C362 300 360 270 350 240 C340 210 325 190 320 160 C315 130 310 100 290 70 C270 40 240 20 200 20Z" />
          </motion.svg>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
          <SectionLabel text="Early Access" />
          
          <AnimatedHeadline 
            text="Africa without the filter." 
            className="font-serif text-[clamp(3.5rem,8vw,6rem)] leading-[1.05] tracking-tight mb-6"
          />

          <RotatingSubheadline />

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-white/80 text-[clamp(1.125rem,2vw,1.5rem)] max-w-2xl mx-auto leading-relaxed mb-12"
          >
            A digital home for real, thoughtful stories about African lives, cities, and ideas — beyond charity ads and disaster headlines.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <GoldButton variant="primary" className="w-full sm:w-auto text-lg py-4 px-8 shadow-2xl">
                Become a Founding Member
              </GoldButton>
            </a>
          </motion.div>
        </div>
      </section>

      {/* 2. PROOF BAR */}
      <section className="bg-secondary py-16 border-b border-primary/8 relative z-20">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          {stats ? (
            <p className="text-xl font-serif text-primary/80">
              Supported by early believers from <span className="text-accent font-bold">{stats.total_countries || 54}</span> countries across <span className="text-accent font-bold">{stats.regions || 5}</span> regions.
            </p>
          ) : (
            <div className="animate-pulse h-6 w-64 bg-primary/8 rounded mx-auto" />
          )}
        </div>
      </section>

      {/* 3. CONTENT PREVIEW */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <SectionLabel text="Original Reporting" />
          <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight text-primary mb-4">Stories from the ground</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {previewArticles.length > 0 ? (
            previewArticles.map((article, index) => {
              const delays = [0, 0.2, 0.4];
              return (
                <CardReveal key={article.slug} delay={delays[index]}>
                  <div className="group block bg-white rounded-xl border border-primary/8 overflow-hidden h-full relative">
                    <div className="p-8 h-full flex flex-col justify-between blur-[2px] opacity-60 pointer-events-none transition-all duration-300">
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <span className="text-4xl">{article.country_flag || '🌍'}</span>
                            {article.country_name && (
                              <p className="text-[10px] text-primary/40 font-medium mt-1">{article.country_name}</p>
                            )}
                          </div>
                          <span className="text-xs font-semibold tracking-wider text-accent uppercase bg-accent/10 px-3 py-1 rounded-full border border-accent/20">{article.sector_name}</span>
                        </div>
                        <h3 className="font-serif text-[1.75rem] leading-snug mb-4 text-primary">{stripMarkdown(article.title)}</h3>
                        <p className="text-primary/60 text-[0.9375rem] leading-relaxed line-clamp-3">{stripMarkdown(article.summary)}</p>
                      </div>
                    </div>
                    {/* OVERLAY */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                      <div className="bg-primary text-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-white/10 flex flex-col items-center">
                        <Lock className="text-accent mb-4" size={32} />
                        <h4 className="font-serif text-xl mb-2">Founding Members Only</h4>
                        <p className="text-sm text-white/60 mb-6">Support the project on Ko-fi to unlock the full narrative feed.</p>
                        <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
                          <GoldButton variant="primary" className="w-full text-sm py-3 px-6 shadow-md">
                            Unlock Access
                          </GoldButton>
                        </a>
                      </div>
                    </div>
                  </div>
                </CardReveal>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-primary/40 border border-primary/8 rounded-2xl bg-white">
              <div className="animate-pulse">Curating stories&hellip;</div>
            </div>
          )}
        </div>
      </section>

      {/* 4. TIERS */}
      <section className="py-24 bg-secondary border-y border-primary/8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight mb-4 text-primary">Fund the platform</h2>
            <p className="text-primary/70 text-lg max-w-2xl mx-auto">
              This is a student-built, narrative correction project. It only exists through the direct support of readers who want better stories.
            </p>
          </div>
          <MembershipTiersGrid />
        </div>
      </section>

      {/* 5. PLATFORM PREVIEW */}
      <section className="py-32 px-6 container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <SectionLabel text="Sneak Peek" />
          <h2 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-tight text-primary">This is what we're building</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-secondary p-8 rounded-2xl border border-primary/10">
             <div className="aspect-video bg-primary/5 rounded-lg mb-6 overflow-hidden">
                <img src="/absolute/path/to/media__1779645167015.png" alt="Platform Dashboard" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
             </div>
             <h3 className="font-serif text-2xl mb-2 text-primary">Intelligence Dashboard</h3>
             <p className="text-primary/60 text-sm">A premium data display, tracking narrative sentiment and strategic opportunities.</p>
          </div>
          <div className="bg-secondary p-8 rounded-2xl border border-primary/10">
             <div className="aspect-video bg-primary/5 rounded-lg mb-6 overflow-hidden">
                <img src="/absolute/path/to/media__1779645317145.png" alt="Article Interface" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
             </div>
             <h3 className="font-serif text-2xl mb-2 text-primary">Guardian-style Editorial</h3>
             <p className="text-primary/60 text-sm">A clean, distraction-free reading experience for long-form narrative reporting.</p>
          </div>
        </div>
      </section>

      {/* 6. MISSION BLOCK */}
      <section className="py-32 px-6 bg-primary text-white text-center">
        <div className="container mx-auto max-w-4xl">
          <CardReveal>
            <span className="text-6xl mb-8 block opacity-80">🌍</span>
            <h2 className="font-serif text-[2.5rem] md:text-[4rem] leading-tight mb-8">We're building Africa's story. Properly.</h2>
            <p className="text-white/70 text-xl font-serif italic mx-auto leading-relaxed mb-12">
              The continent deserves better than headlines about crisis and chaos. The real day-to-day energy — the businesses being built, the cultures thriving — deserves a platform built for it.
            </p>
          </CardReveal>
        </div>
      </section>

      {/* 7. TRANSPARENCY SECTION */}
      <section className="py-24 px-6 container mx-auto max-w-5xl text-center">
        <h3 className="font-sans font-medium text-primary/40 uppercase tracking-widest text-sm mb-12">Where your money goes</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <CardReveal delay={0}>
            <div className="text-3xl mb-4">🌐</div>
            <div className="text-sm font-semibold mb-2 text-primary">Domain & Hosting</div>
            <div className="text-xs text-primary/40">Keeping the platform live</div>
          </CardReveal>
          <CardReveal delay={0.1}>
            <div className="text-3xl mb-4">🛠️</div>
            <div className="text-sm font-semibold mb-2 text-primary">Platform Tools</div>
            <div className="text-xs text-primary/40">Building without VC funding</div>
          </CardReveal>
          <CardReveal delay={0.2}>
            <div className="text-3xl mb-4">✍️</div>
            <div className="text-sm font-semibold mb-2 text-primary">Research Time</div>
            <div className="text-xs text-primary/40">Uncovering real stories</div>
          </CardReveal>
          <CardReveal delay={0.3}>
            <div className="text-3xl mb-4">☕</div>
            <div className="text-sm font-semibold mb-2 text-primary">Founder Fuel</div>
            <div className="text-xs text-primary/40">Supporting an independent creator</div>
          </CardReveal>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="py-24 px-6 border-t border-primary/8 bg-secondary">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl text-primary mb-10 text-center">Frequently Asked Questions</h2>
          <div className="bg-white rounded-2xl border border-primary/8 px-6 md:px-8">
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* 9. FOOTER CTA */}
      <section className="py-32 px-6 border-t border-primary/8 text-center bg-background">
        <div className="max-w-3xl mx-auto">
           <h2 className="font-serif text-4xl md:text-5xl mb-8 text-primary">Join before the official launch.</h2>
           <p className="text-primary/60 mb-10 text-lg">
             Your support at this quiet, early stage is what turns an idea into reality.
           </p>
           <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer">
             <GoldButton variant="primary" className="text-lg py-4 px-10 shadow-lg">
               Support on Ko-fi
             </GoldButton>
           </a>
        </div>
      </section>

      {/* Footer — stays dark for brand anchor */}
      <footer className="py-16 bg-primary border-t border-white/5 text-primary-foreground">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div className="max-w-xs">
              <span className="font-serif text-xl font-bold">BOA-<span className="text-accent">Story</span></span>
              <p className="text-white/40 text-sm mt-3 leading-relaxed">
                A digital home for real, thoughtful stories about African lives, cities, and ideas — beyond charity ads and disaster headlines.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div>
                <ul className="space-y-3">
                  <li><Link to="/stories" className="text-white/40 hover:text-white transition-colors">Stories</Link></li>
                  <li><Link to="/about" className="text-white/40 hover:text-white transition-colors">About</Link></li>
                </ul>
              </div>
              <div>
                <ul className="space-y-3">
                  <li>
                    <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-light transition-colors font-medium">Support on Ko-fi</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/25">
            <span>© {new Date().getFullYear()} BOA-Story. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
