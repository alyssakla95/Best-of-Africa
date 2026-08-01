import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Trophy } from 'lucide-react';
import { WORLD_CUP, type WorldCupTeam } from '@/config/worldCup';
import { useWorldCupTeams } from '@/hooks/useWorldCupTeams';
import { CountryFlag } from '@/components/CountryFlag';
import { activeReaderLocale } from '@/i18n/locale';
import { useLanguage } from '@/context/LanguageContext';

const DISMISS_KEY = 'boa_wc_banner_dismissed_2026';

/** Compact, human kickoff label: "Today 20:00", "Tomorrow 18:00", "Sat 20:00", "14 Jun". */
function formatKickoff(iso: string, language: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const time = d.toLocaleTimeString(activeReaderLocale(), { hour: '2-digit', minute: '2-digit' });
  if (diff <= 0) return language === 'pt' ? 'Em directo' : 'Live';
  const DAY = 86400000;
  if (d.toDateString() === now.toDateString()) return language === 'pt' ? `Hoje ${time}` : `Today ${time}`;
  if (d.toDateString() === new Date(now.getTime() + DAY).toDateString()) return language === 'pt' ? `Amanhã ${time}` : `Tomorrow ${time}`;
  if (diff < 7 * DAY) return `${d.toLocaleDateString(activeReaderLocale(), { weekday: 'short' })} ${time}`;
  return d.toLocaleDateString(activeReaderLocale(), { month: 'short', day: 'numeric' });
}

/**
 * TEMPORARY contextual World Cup ribbon (see config/worldCup.ts).
 * On-brand (navy + gold): a gold sheen sweeps the bar, real flags of the
 * African nations still involved drift in a seamless marquee, and a live dot
 * shows when the roster is fed from the sports feed. Dismissible; renders
 * nothing when the theme is disabled or no teams remain.
 * Remove by setting WORLD_CUP.enabled = false.
 */
export const WorldCupBanner = () => {
  const { language } = useLanguage();
  const [dismissed, setDismissed] = useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1'
  );
  const { teams, updatedAt, nextFixture } = useWorldCupTeams();

  if (!WORLD_CUP.enabled || teams.length === 0 || dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  // Teams already named in the fixture chip add nothing as marquee chips —
  // late in the tournament that left "Morocco · Morocco" floating beside
  // "France v Morocco". Skip them, and only duplicate the list when there
  // are enough chips for the seamless loop to make sense.
  const marqueeTeams = teams.filter(
    t => !nextFixture || (t.code !== nextFixture.home.code && t.code !== nextFixture.away.code)
  );
  const loop = marqueeTeams.length >= 4;
  const chips = loop ? [...marqueeTeams, ...marqueeTeams] : marqueeTeams;

  const Chip = ({ t }: { t: WorldCupTeam }) => (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 pl-1.5 pr-3 py-1 whitespace-nowrap hover:bg-white/[0.12] hover:border-accent/30 transition-colors">
      <CountryFlag code={t.code} size={20} title={t.name} className="!rounded-[3px] ring-white/20" />
      <span className="text-[12px] font-medium text-white/90">{t.name}</span>
    </span>
  );

  return (
    <div
      role="region"
      aria-label={WORLD_CUP.label}
      className="relative overflow-hidden bg-navy text-white border-y border-accent/40"
    >
      {/* Gold sheen sweep + faint radial glow behind the badge */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-1/3 top-0 h-full w-1/3 wc-sheen bg-gradient-to-r from-transparent via-accent/15 to-transparent skew-x-[-12deg]" />
        <div className="absolute -left-10 -top-8 h-24 w-40 rounded-full bg-accent/10 blur-2xl" />
      </div>

      <Link
        to="/world-cup"
        aria-label="African nations at the FIFA World Cup — view fixtures and standings"
        className="group relative z-10 flex items-center gap-3 sm:gap-4 max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 pr-10 sm:pr-12 py-2 hover:bg-white/[0.04] transition-colors"
      >
        {/* Title cluster */}
        <div className="shrink-0 flex items-center gap-2.5">
          <span className="grid place-items-center w-7 h-7 rounded-full bg-accent/15 border border-accent/40 text-accent shadow-[0_0_12px_-2px_rgba(15,31,61,0.6)]">
            <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          {/* Wordmark yields to the fixture on the smallest screens; the trophy
              badge carries the theme there. */}
          <span className="hidden sm:block leading-tight">
            <span className="block text-accent font-bold uppercase tracking-[0.16em] text-[11px]">
              {WORLD_CUP.label}
            </span>
            <span className="hidden md:block text-white/45 text-[9.5px] font-semibold uppercase tracking-[0.14em]">
              Africa still standing
            </span>
          </span>
        </div>

        {/* Live status dot */}
        {updatedAt && (
          <span className="hidden md:inline-flex shrink-0 items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-accent/90">
            <span className="relative flex h-1.5 w-1.5">
              <span className="wc-pulse absolute inline-flex h-full w-full rounded-full bg-accent" />
            </span>
            Live
          </span>
        )}

        <span className="hidden sm:block h-4 w-px bg-white/15 shrink-0" />

        {/* Next fixture — the headline info when the feed provides one */}
        {nextFixture && (
          <div className="shrink-0 flex items-center gap-2 rounded-full bg-accent/10 border border-accent/25 pl-2.5 pr-2.5 py-1">
            <span className="hidden sm:inline text-accent text-[9px] font-bold uppercase tracking-[0.18em]">Next</span>
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-white whitespace-nowrap">
              {nextFixture.home.code && <CountryFlag code={nextFixture.home.code} size={16} title={nextFixture.home.name} className="!rounded-[2px] ring-white/20" />}
              {nextFixture.home.name}
              <span className="text-white/40 font-normal">v</span>
              {nextFixture.away.code && <CountryFlag code={nextFixture.away.code} size={16} title={nextFixture.away.name} className="!rounded-[2px] ring-white/20" />}
              {nextFixture.away.name}
            </span>
            <span className="text-accent text-[11px] font-bold tabular-nums whitespace-nowrap border-l border-accent/25 pl-2">
              {formatKickoff(nextFixture.utcDate, language)}
            </span>
          </div>
        )}

        {/* Flag marquee — duplicated once for a seamless loop, fades at the edges.
            Yields to the fixture chip on small screens when one is present. */}
        {chips.length > 0 && (
          <div className={`wc-marquee-group relative flex-1 min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)] ${nextFixture ? 'hidden lg:block' : 'block'}`}>
            <div className={`${loop ? 'wc-marquee' : ''} flex w-max items-center gap-2.5`}>
              {chips.map((t, i) => (
                <Chip key={`${t.code}-${i}`} t={t} />
              ))}
            </div>
          </div>
        )}
      </Link>

      {/* Dismiss sits outside the link so closing the ribbon never navigates. */}
      <button
        onClick={dismiss}
        aria-label="Dismiss World Cup banner"
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 shrink-0 rounded-full p-1 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
