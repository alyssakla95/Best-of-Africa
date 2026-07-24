import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, CalendarClock, ArrowRight } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { CountryFlag } from '../../components/CountryFlag';
import { useWorldCupTeams } from '../../hooks/useWorldCupTeams';
import { WORLD_CUP, type WorldCupFixture, type WorldCupResult } from '../../config/worldCup';

// Full, human kickoff label for the page (locale-aware): "Sat, 14 Jun · 20:00".
function formatFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

// Compact relative label used on the spotlight card.
function relativeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff <= 0) return 'Kicking off';
  const DAY = 86400000;
  if (d.toDateString() === now.toDateString()) return `Today · ${time}`;
  if (d.toDateString() === new Date(now.getTime() + DAY).toDateString()) return `Tomorrow · ${time}`;
  return formatFull(iso);
}

const Side = ({ side, size = 22 }: { side: { name: string; code?: string }; size?: number }) => (
  <span className="inline-flex items-center gap-2 min-w-0">
    {side.code
      ? <CountryFlag code={side.code} size={size} title={side.name} className="!rounded-[3px]" />
      : <span className="grid place-items-center rounded-[3px] bg-foreground/10 text-foreground/40 text-[9px] font-bold" style={{ width: size, height: Math.round(size * 3 / 4) }}>?</span>}
    <span className="truncate">{side.name}</span>
  </span>
);

export const BetaWorldCup: React.FC = () => {
  const { teams, updatedAt, nextFixture, fixtures, results } = useWorldCupTeams();

  // Fixtures beyond the spotlight one. Compare by kickoff+teams, not object
  // identity — next_fixture and fixtures[0] are distinct objects after JSON
  // parsing, so a reference filter would render the spotlight match twice.
  const fixtureKey = (f: WorldCupFixture) => `${f.utcDate}|${f.home.name}|${f.away.name}`;
  const rest: WorldCupFixture[] = nextFixture
    ? fixtures.filter(f => fixtureKey(f) !== fixtureKey(nextFixture)).slice(0, 12)
    : fixtures.slice(0, 12);
  const runOver = teams.length === 0;

  return (
    <div className="bg-background text-foreground min-h-screen pb-24">
      <SEO
        title="Africa at the World Cup | BOA-Story"
        description="Archive page for African participation at the FIFA World Cup 2026."
      />

      {/* Hero */}
      <div className="app-hero border-b border-border bg-card px-4 py-14 sm:px-6 md:py-20">
        <motion.div className="hidden">
          <img
            src="/images/v2_events.webp"
            alt="African supporters celebrating"
            className="hero-photo w-full h-[120%] object-cover object-center absolute top-[-10%]"
          />
          <div className="absolute inset-0 z-10 hero-scrim" />
        </motion.div>

        <div className="max-w-6xl mx-auto w-full text-foreground">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
            <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
              <Trophy size={14} />
              {WORLD_CUP.label}
              {updatedAt && (
                <span className="inline-flex items-center gap-1.5 pl-3 ml-1 border-l border-accent/30">
                  <span className="wc-pulse inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  Live
                </span>
              )}
            </div>
            <h1 className="max-w-3xl text-foreground text-[2.75rem] md:text-[4.5rem] font-serif leading-[0.96] tracking-tight mb-6">
              Africa at the World Cup
            </h1>
            <p className="text-lg text-foreground/65 max-w-2xl leading-relaxed">
              {runOver
                ? results.length > 0
                  ? "The African run at this World Cup has ended. Verified results retained by the sports feed are listed below."
                  : "The tournament has ended. This page no longer presents seeded teams or fixtures as live information."
                : `The continent's ${teams.length} ${teams.length === 1 ? 'nation' : 'nations'} still standing at the tournament — who they are, and the road ahead.`}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Next fixture spotlight */}
        {nextFixture && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="mt-10 md:mt-14 rounded-xl border border-accent/30 bg-card overflow-hidden"
          >
            <div className="px-6 sm:px-10 py-8 sm:py-10">
              <div className="flex items-center justify-between gap-4 mb-6">
                <span className="inline-flex items-center gap-2 text-accent text-[11px] font-bold uppercase tracking-[0.18em]">
                  <CalendarClock size={14} /> Next fixture
                </span>
                {nextFixture.stage && (
                  <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/70">{nextFixture.stage}</span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-4 sm:gap-8">
                <div className="flex-1 flex sm:justify-end items-center gap-3 text-2xl sm:text-3xl font-serif text-foreground min-w-0">
                  <Side side={nextFixture.home} size={40} />
                </div>
                <span className="shrink-0 text-center text-accent font-serif italic text-xl px-2">v</span>
                <div className="flex-1 flex items-center gap-3 text-2xl sm:text-3xl font-serif text-foreground min-w-0">
                  <Side side={nextFixture.away} size={40} />
                </div>
              </div>
              <div className="mt-6 text-center text-foreground/60 font-semibold tracking-wide">
                {relativeLabel(nextFixture.utcDate)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Upcoming fixtures schedule */}
        {rest.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">Upcoming fixtures</h2>
            <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden divide-y divide-foreground/10">
              {rest.map((f, i) => (
                <div key={`${f.utcDate}-${i}`} className="flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-foreground/[0.02] transition-colors">
                  <div className="w-28 sm:w-40 shrink-0 text-[12px] sm:text-[13px] font-semibold text-foreground/70 tabular-nums">
                    {formatFull(f.utcDate)}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-3 text-[15px] font-medium text-foreground">
                    <div className="flex-1 flex sm:justify-end min-w-0"><Side side={f.home} /></div>
                    <span className="shrink-0 text-foreground/30 text-xs">v</span>
                    <div className="flex-1 min-w-0"><Side side={f.away} /></div>
                  </div>
                  {f.stage && (
                    <div className="hidden md:block w-32 shrink-0 text-right text-[11px] font-bold uppercase tracking-widest text-foreground/70">{f.stage}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent results with scores */}
        {results.length > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">Latest results</h2>
            <div className="rounded-xl border border-foreground/10 bg-card overflow-hidden divide-y divide-foreground/10">
              {results.map((r: WorldCupResult, i: number) => (
                <div key={`${r.utcDate}-${i}`} className="flex items-center gap-4 px-5 sm:px-7 py-4">
                  <div className="w-28 sm:w-40 shrink-0 text-[12px] sm:text-[13px] font-semibold text-foreground/70 tabular-nums">
                    {formatFull(r.utcDate)}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-3 text-[15px] font-medium text-foreground">
                    <div className="flex-1 flex sm:justify-end min-w-0"><Side side={r.home} /></div>
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-primary text-white font-serif tabular-nums text-[15px]">
                      {r.home.score ?? '–'}<span className="text-white/40 px-1">:</span>{r.away.score ?? '–'}
                    </span>
                    <div className="flex-1 min-w-0"><Side side={r.away} /></div>
                  </div>
                  {r.stage && (
                    <div className="hidden md:block w-32 shrink-0 text-right text-[11px] font-bold uppercase tracking-widest text-foreground/70">{r.stage}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nations still standing */}
        {teams.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-6">
            Still standing <span className="text-foreground/70 text-lg">· {teams.length}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {teams.map((t) => (
              <Link
                key={t.code}
                to={`/countries/${t.code}`}
                className="group flex items-center gap-3 rounded-2xl border border-foreground/10 bg-card px-5 py-4 hover:-translate-y-0.5 hover:border-accent/40 transition-all"
              >
                <CountryFlag code={t.code} size={32} title={t.name} className="!rounded-[4px]" />
                <span className="font-serif text-foreground group-hover:text-accent transition-colors truncate">{t.name}</span>
                <ArrowRight className="ml-auto w-4 h-4 text-foreground/20 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </section>
        )}

        {/* Provenance / disclaimer */}
        <p className="mt-12 text-center text-[12px] text-foreground/70 max-w-2xl mx-auto leading-relaxed">
          Fixtures and standings update automatically from a live sports feed.
          {updatedAt && <> Last updated {new Date(updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}.</>}
        </p>
      </div>
    </div>
  );
};
