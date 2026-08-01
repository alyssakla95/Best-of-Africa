import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WORLD_CUP } from '@/config/worldCup';
import { useWorldCupTeams } from '@/hooks/useWorldCupTeams';
import { useLanguage } from '@/context/LanguageContext';
import { activeReaderLocale } from '@/i18n/locale';

/**
 * TEMPORARY landing feature band celebrating African nations at the World Cup.
 * On-brand (navy + white), CSS-light (no heavy animation, respects reduced-motion
 * via the global media query). Gated by WORLD_CUP.enabled (config/worldCup.ts).
 */
const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  const relative = new Intl.RelativeTimeFormat(activeReaderLocale(), { numeric: 'auto' });
  if (m < 1) return relative.format(0, 'minute');
  if (m < 60) return relative.format(-m, 'minute');
  const h = Math.round(m / 60);
  if (h < 24) return relative.format(-h, 'hour');
  return relative.format(-Math.round(h / 24), 'day');
};

export const WorldCupFeature = () => {
  const { language } = useLanguage();
  const { teams, updatedAt } = useWorldCupTeams();
  if (!WORLD_CUP.enabled || teams.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-navy text-white border-y border-accent/30 py-20 md:py-24 px-6">
      {/* Soft navy glow + subtle grid for a festive, premium feel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,31,61,0.18),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-6 text-accent font-bold uppercase tracking-[0.18em] text-[11px]">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
          <span aria-hidden="true">🏆</span> {WORLD_CUP.label}
        </div>

        <h2 className="font-serif text-white text-[2.5rem] md:text-[4rem] leading-[1.04] tracking-tighter mb-6">
          Africa, <span className="italic text-accent">on the world stage.</span>
        </h2>

        <p className="text-white/75 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          We're following every African story at the tournament, the cities, the fans, and the everyday energy beyond the scoreline.
        </p>

        {/* The African nations competing, bold, country-forward cards */}
        <p className="text-accent/90 text-[11px] font-bold uppercase tracking-[0.2em] mb-5">
          {teams.length} African nation{teams.length !== 1 ? 's' : ''} flying the flag
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-10 max-w-3xl mx-auto">
          {teams.map((t, i) => (
            <motion.div
              key={t.code}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.35 }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-accent/30 bg-white/[0.06] px-3 py-5 hover:border-accent hover:bg-white/[0.12] hover:-translate-y-1 transition-all"
            >
              <span className="text-4xl md:text-5xl leading-none drop-shadow-lg" aria-hidden="true">{t.flag}</span>
              <span className="text-[12px] font-semibold text-white/90 text-center leading-tight">{t.name}</span>
            </motion.div>
          ))}
        </div>

        <Link
          to="/posts"
          className="inline-block bg-accent text-navy font-bold uppercase tracking-[0.06em] text-[11px] px-8 py-4 rounded-full shadow-[0_4px_24px_rgba(15,31,61,0.35)] hover:bg-gold-italic transition-all hover:-translate-y-0.5"
        >
          Follow the coverage →
        </Link>

        {updatedAt && (
          <p className="mt-6 text-[11px] uppercase tracking-widest text-white/40">
            {language === 'pt' ? 'Equipas actualizadas' : 'Teams updated'} {relativeTime(updatedAt)}
          </p>
        )}
      </div>
    </section>
  );
};
