import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, FileSearch, Globe2, TrendingUp } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { DataReadingGuide } from '../../components/PageReadingGuide';
import { api } from '../../services/api';
import { activeReaderLocale, formatReaderDateTime } from '../../i18n/locale';
import { useLanguage } from '../../context/LanguageContext';
import { translatePortugueseInterfaceText } from '../../i18n/pt-PT-1945';
import { readerCountryName } from '../../i18n/pt-country-data';

const number = (value: number) => new Intl.NumberFormat(activeReaderLocale()).format(value);
const compact = (value: number) => new Intl.NumberFormat(activeReaderLocale(), {
  notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: 1,
}).format(value);
const valueWithUnit = (value: number, unit: string) => unit === 'current US$' ? `$${compact(value)}` : `${compact(value)} ${unit}`;
const changeWithUnit = (value: number, unit: string) => {
  const sign = value > 0 ? '+' : '';
  if (unit === 'percentage points') return `${sign}${value.toFixed(1)} pp`;
  if (unit === 'current US$') return `${sign}$${compact(value)}`;
  return `${sign}${compact(value)} ${unit}`;
};
const period = (start: number, end: number) => start === end ? String(end) : `${start}–${end}`;

export const PremiumSectorTrends: React.FC = () => {
  const { language } = useLanguage();
  const text = (value: string) => language === 'pt' ? (translatePortugueseInterfaceText(value) || value) : value;
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['sector-performance-dossier', id, 'market-v3'],
    queryFn: () => api.getSectorTrends(id!),
    enabled: Boolean(id),
  });

  if (query.isLoading) return <div className="mx-auto max-w-6xl animate-pulse px-5 py-16 sm:px-6"><div className="h-14 w-2/3 rounded-xl bg-navy/10"/><div className="mt-12 grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl bg-navy/5"/>)}</div><div className="mt-8 h-96 rounded-2xl bg-navy/5"/></div>;
  if (query.isError || !query.data) return <><SEO title="Sector data unavailable | BOA-Story" description="The sector-performance dossier could not be loaded."/><div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-5 sm:px-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-navy/60">Official dataset request failed</p><h1 className="mt-3 font-serif text-4xl text-navy">The sector-performance dossier could not be loaded.</h1><p className="mt-4 leading-7 text-muted-foreground">Return to Market Intelligence or retry the official-data request.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => query.refetch()} className="rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">Retry dossier</button><Link to="/intelligence/sectors" className="rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-navy">Market Intelligence</Link></div></div></>;

  const { sector, market_performance: performance, methodology, updated_at } = query.data;
  const kpis = [
    { label: text(performance.headline_label), value: valueWithUnit(performance.headline_value, text(performance.headline_unit)), detail: language === 'pt' ? `leitura mediana dos países · ${period(performance.period_start,performance.period_end)}` : `middle country reading · ${period(performance.period_start,performance.period_end)}`, Icon: TrendingUp },
    { label: text('Change in the middle reading'), value: changeWithUnit(performance.comparison_value, text(performance.comparison_unit)), detail: text('versus each country’s previous available value'), Icon: FileSearch },
    { label: text('Countries reading higher'), value: `${performance.improving_markets_pct.toFixed(0)}%`, detail: text('higher does not automatically mean better'), Icon: TrendingUp },
    { label: text('Countries with usable data'), value: number(performance.countries_reported), detail: language === 'pt' ? `${performance.continent_coverage_pct.toFixed(0)}% dos 54 países de África` : `${performance.continent_coverage_pct.toFixed(0)}% of Africa’s 54 countries`, Icon: Globe2 },
  ];

  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO
      title={language === 'pt' ? `Desempenho do mercado — ${text(sector.name)} | BOA-Story` : `${sector.name} market performance | BOA-Story`}
      description={language === 'pt'
        ? `Desempenho oficial com vários indicadores, cobertura nacional, condições estruturais e questões de verificação para ${text(sector.name)} em África.`
        : `Official multi-indicator performance, country breadth, structural conditions and questions for ${sector.name} across Africa.`}
    />
    <header className="border-b border-white/10 bg-navy px-5 py-16 text-white sm:px-6 md:py-24">
      <div className="mx-auto max-w-6xl">
        <Link to="/intelligence/sectors" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft size={15}/> Market Intelligence</Link>
        <p className="mt-12 text-[11px] font-bold uppercase tracking-[.22em] text-white/60">Official sector-performance guide</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[.95] tracking-tight md:text-7xl">{text(sector.name)}</h1>
        <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 md:text-lg">Understand the main measure first, then use three separate measures to see structure and operating conditions. Dates, country coverage and limitations remain visible throughout.</p>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-5 sm:px-6">
      <section className="relative -mt-8 grid overflow-hidden rounded-2xl border border-border bg-white shadow-[0_18px_60px_-30px_rgba(15,31,61,.35)] sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({label,value,detail,Icon},index) => <motion.div key={label} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:index*.07}} className="border-b border-border p-6 last:border-0 sm:border-r lg:border-b-0"><Icon size={18} className="text-navy/70"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="mt-2 break-words font-serif text-3xl text-navy md:text-4xl">{value}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p></motion.div>)}
      </section>

      <div className="pt-10"><DataReadingGuide subject="this sector guide" /></div>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <article className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Main measure</p>
          <h2 className="mt-2 font-serif text-3xl text-navy">{text(performance.indicator_name)}</h2>
          <p className="mt-5 text-sm leading-7 text-navy/80"><strong>What this measures:</strong> {text(performance.scope)}</p>
          <div className="mt-5 rounded-lg bg-navy/[.04] p-4 text-sm leading-6 text-muted-foreground"><strong className="text-navy">What it cannot tell you by itself:</strong> {text(performance.caveat)}</div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground"><span>Half of reporting countries fall between {performance.dispersion_low.toFixed(1)} and {performance.dispersion_high.toFixed(1)} {performance.headline_unit}</span><a href={performance.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy underline decoration-navy/25 underline-offset-4">{performance.source_name}</a></div>
        </article>
        <article className="rounded-2xl border border-border bg-white p-6 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Country comparison</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">These lists show only the main measure. “Highest” does not automatically mean strongest, safest or most attractive.</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div><h3 className="text-sm font-bold text-navy">Highest recorded values</h3><ol className="mt-3 space-y-2 text-sm">{performance.leaders.map((market,index) => <li key={market.country_code} className="grid grid-cols-[1.25rem_1fr_auto] gap-2"><span className="text-muted-foreground">{index+1}.</span><Link to={`/countries/${market.country_code}`} className="text-navy hover:underline">{readerCountryName(market.country_code, market.country_name, language)}</Link><span className="tabular-nums text-muted-foreground">{market.value.toFixed(1)}</span></li>)}</ol></div>
            <div><h3 className="text-sm font-bold text-navy">Lowest recorded values</h3><ol className="mt-3 space-y-2 text-sm">{performance.laggards.map((market,index) => <li key={market.country_code} className="grid grid-cols-[1.25rem_1fr_auto] gap-2"><span className="text-muted-foreground">{index+1}.</span><Link to={`/countries/${market.country_code}`} className="text-navy hover:underline">{readerCountryName(market.country_code, market.country_name, language)}</Link><span className="tabular-nums text-muted-foreground">{market.value.toFixed(1)}</span></li>)}</ol></div>
          </div>
        </article>
      </section>

      <section className="mt-14 border-t border-border pt-10">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">Supporting evidence</p>
        <h2 className="mt-2 max-w-3xl font-serif text-3xl text-navy md:text-4xl">Three other measures to read alongside the main one</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">No single number explains a sector. These measures add information about structure, access, capacity, cost or operating conditions. Their different units must remain separate.</p>
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {performance.dimensions.map(item => <article key={item.indicator_code} className="flex flex-col rounded-2xl border border-border bg-white p-5 md:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-navy/60">{text(item.label)}</p><h3 className="mt-2 text-base font-bold leading-6 text-navy">{text(item.indicator_name)}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy">{text(item.movement)}</span></div>
            <p className="mt-6 font-serif text-4xl leading-none text-navy">{valueWithUnit(item.value,item.unit)}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Middle reading from {item.countries_reported} countries · {period(item.period_start,item.period_end)}</p>
            <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border text-center"><div className="bg-white p-3"><strong className="block text-sm text-navy">{changeWithUnit(item.comparison_value,item.comparison_unit)}</strong><span className="mt-1 block text-[8px] uppercase text-muted-foreground">change</span></div><div className="bg-white p-3"><strong className="block text-sm text-navy">{item.markets_rising_pct.toFixed(0)}%</strong><span className="mt-1 block text-[8px] uppercase text-muted-foreground">countries higher</span></div><div className="bg-white p-3"><strong className="block text-sm text-navy">{item.coverage_pct.toFixed(0)}%</strong><span className="mt-1 block text-[8px] uppercase text-muted-foreground">countries covered</span></div></div>
            <p className="mt-5 text-sm leading-6 text-navy/80"><strong>What this means:</strong> {text(item.interpretation)}</p>
            <p className="mt-4 border-l-2 border-navy/20 pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-navy">What it cannot prove:</strong> {text(item.caveat)}</p>
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-auto pt-5 text-xs font-semibold text-navy underline decoration-navy/25 underline-offset-4">Official series {item.indicator_code}</a>
          </article>)}
        </div>
      </section>

      <section className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-white lg:grid-cols-2">
        <div className="p-6 md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">What the evidence establishes</p><h2 className="mt-2 font-serif text-3xl text-navy">The result in plain language</h2><ul className="mt-6 space-y-4 text-sm leading-6 text-navy/80"><li><strong className="text-navy">Typical reporting country:</strong> the middle value is {performance.headline_value.toFixed(1)} {performance.headline_unit}; its change from the previous available value is {changeWithUnit(performance.comparison_value,performance.comparison_unit)}.</li><li><strong className="text-navy">How countries differ:</strong> half of reporting countries sit between {performance.dispersion_low.toFixed(1)} and {performance.dispersion_high.toFixed(1)} {performance.headline_unit}.</li><li><strong className="text-navy">How widespread the direction is:</strong> {performance.improving_markets_pct.toFixed(0)}% of comparable countries recorded a higher value, using {performance.countries_reported} country series.</li><li><strong className="text-navy">Important caution:</strong> each supporting measure keeps its own unit, date and coverage. A higher reading is not always favourable.</li></ul></div>
        <div className="border-t border-border bg-navy/[.025] p-6 md:p-8 lg:border-l lg:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-navy/60">What to investigate next</p><h2 className="mt-2 font-serif text-3xl text-navy">Questions the numbers cannot answer alone</h2><ol className="mt-6 space-y-4">{performance.diligence_questions.map((question,index) => <li key={question} className="grid grid-cols-[2rem_1fr] gap-3 text-sm leading-6 text-navy/80"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index+1}</span><span>{text(question)}</span></li>)}</ol></div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-navy p-6 text-white md:flex md:items-start md:justify-between md:gap-12 md:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/60">How the figures were prepared</p><h2 className="mt-2 font-serif text-2xl">Method and fair comparison</h2></div><div className="mt-4 max-w-2xl space-y-3 md:mt-0"><p className="text-sm leading-7 text-white/75">{text(methodology)}</p><p className="flex items-center gap-2 text-xs text-white/60"><Eye size={14}/> Official snapshot retrieved {formatReaderDateTime(updated_at, { dateStyle: 'medium', timeStyle: 'short' })}</p></div></section>
    </main>
  </div>;
};
