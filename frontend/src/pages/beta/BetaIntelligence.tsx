import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, BarChart3, ExternalLink, Globe2, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { IntelligenceTrustPanel } from '../../components/intelligence/IntelligenceTrustPanel';
import { DecisionWorkspace } from '../../components/intelligence/DecisionWorkspace';
import { DataReadingGuide } from '../../components/PageReadingGuide';
import { useLanguage } from '../../context/LanguageContext';
import { translatePortugueseInterfaceText } from '../../i18n/pt-PT-1945';
import { readerCountryName } from '../../i18n/pt-country-data';

const activeLocale = () => typeof document === 'undefined' ? 'en' : document.documentElement.lang || 'en';
const compact = (value: number) => new Intl.NumberFormat(activeLocale(), { notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
const valueWithUnit = (value: number, unit: string) => unit === 'current US$' ? `US$ ${compact(value)}` : `${compact(value)} ${unit}`;
const changeWithUnit = (value: number, unit: string) => {
  const sign = value > 0 ? '+' : '';
  if (unit === 'percentage points') return `${sign}${value.toFixed(1)} pp`;
  if (unit === 'current US$') return `${sign}US$ ${compact(value)}`;
  return `${sign}${compact(value)} ${unit}`;
};
const period = (start: number, end: number) => start === end ? String(end) : `${start}–${end}`;

export const BetaIntelligence = () => {
  const { language } = useLanguage();
  const text = (value: string) => language === 'pt' ? (translatePortugueseInterfaceText(value) || value) : value;
  const countryName = (code: string, name: string) => readerCountryName(code, name, language);
  const { view: requestedView = 'overview' } = useParams<{ view?: string }>();
  const view = ['overview', 'sectors', 'workspace', 'methodology'].includes(requestedView) ? requestedView : 'overview';
  const query = useQuery({
    queryKey: ['sector-market-performance', 'market-v2'],
    queryFn: () => api.getSectorPerformance('investor'),
    staleTime: 0,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
  const coverageQuery = useQuery({
    queryKey: ['market-briefing-coverage', 'all-markets-v1'],
    queryFn: api.getCoveragePulse,
    staleTime: 0,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const performance = query.data;
  const signalCount = performance?.data.reduce((total, sector) => total + 1 + sector.dimensions.length, 0) || 0;
  const coverageValues = performance?.data.flatMap(sector => [sector.continent_coverage_pct, ...sector.dimensions.map(item => item.coverage_pct)]) || [];
  const averageCoverage = coverageValues.length ? coverageValues.reduce((sum, value) => sum + value, 0) / coverageValues.length : 0;
  const sectorPattern = (sector: NonNullable<typeof performance>['data'][number]) => {
    if (sector.continent_coverage_pct < 60) return text('Limited-coverage signal');
    if (sector.comparison_value > 0.25 && sector.improving_markets_pct >= 60) return text('Broad upward movement');
    if (sector.comparison_value < -0.25 && sector.improving_markets_pct <= 40) return text('Broad downward movement');
    return text('Mixed country movement');
  };

  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO title="African Market Intelligence | BOA-Story" description="Official multi-indicator African sector performance, country breadth, structural conditions and decision diligence."/>

    <header className="overflow-hidden border-b border-white/15 bg-navy text-white">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.55fr)] lg:items-end lg:px-8 lg:py-20">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[.18em] text-white/65"><span>BOA evidence desk</span><span className="h-1 w-1 rounded-full bg-white/40"/><span>Market performance</span></div>
          <h1 className="mt-5 max-w-5xl font-serif text-[clamp(2.8rem,7vw,6.4rem)] leading-[.91] tracking-[-.045em]">African markets, measured sector by sector.</h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-white/75 md:text-xl md:leading-8">Read official measures of output, access, infrastructure, investment and operating conditions—without unsupported composite scores or newsroom-volume proxies.</p>
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row"><Link to="/dashboards/overview" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-navy">Open continental economy</Link><Link to="/countries" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/30 px-5 text-sm font-bold text-white">Compare country records</Link></div>
        </motion.div>
        <aside className="border-t border-white/20 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-label="Dataset status">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/55">Current evidence release</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-1">
            <div><dt className="text-xs text-white/55">Sector dossiers</dt><dd className="mt-1 font-serif text-3xl text-white">{performance?.sectors_measured ?? '—'}</dd></div>
            <div><dt className="text-xs text-white/55">Countries in scope</dt><dd className="mt-1 font-serif text-3xl text-white">{performance?.countries_in_scope ?? '—'}</dd></div>
            <div className="col-span-2 lg:col-span-1"><dt className="text-xs text-white/55">Evidence source</dt><dd className="mt-1 text-sm font-semibold leading-5 text-white">{performance?.source_name || 'World Bank World Development Indicators'}</dd></div>
          </dl>
        </aside>
      </div>
    </header>

    <IntelligenceTrustPanel updatedAt={performance?.retrieved_at} sourceLabel={performance?.source_name || 'World Bank World Development Indicators'} refreshStatus={performance?.official_data_refresh}/>

    <nav className="sticky top-[4.5rem] z-30 border-b border-navy/15 bg-white/95 backdrop-blur-md lg:top-16" aria-label="Market intelligence sections">
      <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {[['overview','Performance matrix'],['sectors','Sector dossiers'],['workspace','Decision workspace'],['methodology','Methodology']].map(([slug,label]) => <Link key={slug} to={`/intelligence/${slug}`} aria-current={view === slug ? 'page' : undefined} className={`shrink-0 rounded-md px-4 py-2.5 text-sm font-bold transition-colors ${view === slug ? 'bg-navy text-white' : 'text-navy/70 hover:bg-navy/5 hover:text-navy'}`}>{label}</Link>)}
        <Link to="/intelligence/reports" className="shrink-0 rounded-md px-4 py-2.5 text-sm font-bold text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy">Briefing reports</Link>
      </div>
    </nav>

    <div className="mx-auto mt-10 w-full max-w-[1400px] px-5 sm:px-6 md:mt-14 lg:px-8">
      <main className="page-stack min-w-0">
        {query.isLoading && <section className="grid animate-pulse gap-4 sm:grid-cols-2"><div className="h-44 rounded-2xl bg-navy/5"/><div className="h-44 rounded-2xl bg-navy/5"/><div className="h-96 rounded-2xl bg-navy/5 sm:col-span-2"/></section>}
        {query.isError && <section className="rounded-2xl border border-border bg-white p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-navy/60">Official dataset request failed</p><h2 className="mt-2 font-serif text-3xl text-navy">The sector-performance record could not be loaded.</h2><button onClick={() => query.refetch()} className="mt-6 rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">Retry official data</button></section>}

        {performance && view === 'overview' && <>
          <section className="page-section">
            <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Cross-sector comparison</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">Compare sectors without hiding what the numbers mean</h2><p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">Each sector uses the measure that fits it. Read the measure’s name and unit before comparing movement or country coverage. BOA does not blend unrelated measures into one score.</p></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [BarChart3,'Sectors measured',performance.sectors_measured,'sector dossiers'],
                [Activity,'Official signals',signalCount,'primary and supporting series'],
                [Globe2,'Countries in scope',performance.countries_in_scope,'African markets'],
                [Scale,'Average data coverage',`${averageCoverage.toFixed(0)}%`,'average share of 54 countries represented'],
              ].map(([Icon,label,value,detail]) => { const MetricIcon=Icon as typeof Activity; return <article key={label as string} className="rounded-2xl border border-border bg-white p-5 md:p-6"><MetricIcon size={18} className="text-navy/65"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{label as string}</p><p className="mt-2 font-serif text-3xl text-navy">{value as string | number}</p><p className="mt-2 text-xs text-muted-foreground">{detail as string}</p></article>; })}
            </div>
          </section>

          <DataReadingGuide subject="the market-intelligence dashboard" />

          {coverageQuery.data && <section className="page-section overflow-hidden rounded-2xl border border-border bg-white" aria-labelledby="all-market-scope">
            <div className="grid gap-6 border-b border-border px-5 py-6 md:grid-cols-[1fr_auto] md:items-end md:px-8">
              <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Live briefing scope</p><h2 id="all-market-scope" className="mt-2 font-serif text-3xl text-navy md:text-4xl">Every African country and every economic sector is checked</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">The evidence ledger refreshes every minute. Countries or sectors with zero current records remain visible as evidence gaps; they are never omitted or filled with assumptions.</p></div>
              <dl className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-navy p-4 text-white"><dt className="text-[9px] uppercase tracking-[.12em] text-white/60">Countries checked</dt><dd className="mt-1 font-serif text-3xl">{coverageQuery.data.countries_considered}</dd></div><div className="rounded-xl bg-navy p-4 text-white"><dt className="text-[9px] uppercase tracking-[.12em] text-white/60">Sectors checked</dt><dd className="mt-1 font-serif text-3xl">{coverageQuery.data.sectors_considered}</dd></div></dl>
            </div>
            <div className="grid gap-8 px-5 py-6 md:px-8 lg:grid-cols-[1.2fr_.8fr]">
              <div><h3 className="font-serif text-xl text-navy">Complete 54-country ledger</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Current week compared with the preceding seven days. Zero is a real coverage result.</p><details className="mt-4 rounded-xl border border-border"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy">Open all country readings</summary><div className="grid gap-2 border-t border-border p-3 sm:grid-cols-2 xl:grid-cols-3">{coverageQuery.data.countries.map(country => <Link key={country.country_code} to={`/countries/${country.country_code}`} className="flex items-center justify-between gap-3 rounded-lg bg-navy/[.035] px-3 py-2 text-xs"><span className="font-semibold text-navy">{countryName(country.country_code, country.country_name)}</span><span className="tabular-nums text-muted-foreground">{country.this_week} / {country.last_week}</span></Link>)}</div></details></div>
              <div><h3 className="font-serif text-xl text-navy">Full sector ledger</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Published evidence across the rolling 30-day window.</p><div className="mt-4 space-y-2">{coverageQuery.data.sectors.map(sector => <Link key={sector.sector_id} to={`/sectors/${sector.sector_id}/trends`} className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-border p-3"><span className="text-sm font-semibold text-navy">{text(sector.sector_name)}</span><span className="text-right text-xs tabular-nums text-muted-foreground">{sector.records_30d} records<br/>{sector.countries_30d} countries</span></Link>)}</div></div>
            </div>
            <div className="border-t border-border bg-navy/[.025] px-5 py-7 md:px-8">
              <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
                <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Source breadth</p><h3 className="mt-2 font-serif text-2xl text-navy">Who supplies the rolling evidence window</h3><p className="mt-3 text-xs leading-5 text-muted-foreground">Publisher breadth and source quality are shown separately from story volume. A broad source list reduces concentration risk but does not replace checking the linked evidence.</p><dl className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white p-4 ring-1 ring-border"><dt className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">Publishers · 30 days</dt><dd className="mt-2 font-serif text-3xl text-navy">{coverageQuery.data.source_coverage.publishers_30d}</dd></div><div className="rounded-xl bg-white p-4 ring-1 ring-border"><dt className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">Primary/global share</dt><dd className="mt-2 font-serif text-3xl text-navy">{coverageQuery.data.source_coverage.primary_or_global_share_pct.toFixed(1)}%</dd></div></dl></div>
                <div><h4 className="text-xs font-bold uppercase tracking-[.12em] text-navy">Leading attributed sources</h4><div className="mt-3 grid gap-2 sm:grid-cols-2">{coverageQuery.data.source_coverage.leading_sources.map(source => <div key={`${source.source_name}-${source.quality_tier}`} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-border bg-white p-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-navy" title={source.source_name}>{source.source_name}</p><p className="mt-1 text-[9px] uppercase tracking-[.08em] text-muted-foreground">{source.quality_tier === 4 ? 'Primary or global' : source.quality_tier === 3 ? 'Established specialist' : source.quality_tier === 2 ? 'Verified national' : 'Other attributed source'}</p></div><div className="text-right text-[10px] tabular-nums text-muted-foreground"><strong className="block text-sm text-navy">{source.records_30d}</strong>{source.countries_30d} countries</div></div>)}</div><p className="mt-4 text-[10px] leading-4 text-muted-foreground">{coverageQuery.data.source_coverage.methodology}</p></div>
              </div>
            </div>
            <p className="border-t border-border px-5 py-4 text-xs text-muted-foreground md:px-8">Ledger updated {new Intl.DateTimeFormat(activeLocale(), { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(coverageQuery.data.updated_at))}.</p>
          </section>}

          <section className="page-section rounded-2xl border border-border bg-white p-5 md:p-8" aria-labelledby="market-analysis-path">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[.08em] text-navy/60">From indicator to informed judgment</p>
              <h2 id="market-analysis-path" className="mt-2 font-serif text-3xl text-navy md:text-4xl">A fuller way to understand sector performance</h2>
              <p className="mt-4 readable-copy">Performance is not one number. A useful reading connects the sector’s recorded level, its direction of change, how widely that direction appears across countries, and the conditions that may support or constrain it.</p>
            </div>
            <ol className="mt-7 grid gap-4 md:grid-cols-2">
              {[
                ['Establish the level', 'Read the latest median and its unit. This describes the middle reporting country, not the continent’s combined market size and not every country.'],
                ['Test the direction', 'Compare the median change with the share of countries moving higher. A positive median with narrow country breadth may reflect a concentrated rather than widespread shift.'],
                ['Examine operating conditions', 'Read access, infrastructure, cost, capacity and investment measures alongside the headline. They can explain important constraints without proving causation.'],
                ['Check decision relevance', 'Move from the continental pattern to country dossiers, local regulation, competition, demand, currency exposure and implementation conditions before making a market decision.'],
              ].map(([title,body],index) => <li key={title} className="grid grid-cols-[2.25rem_1fr] gap-3 rounded-xl bg-navy/[.035] p-4 md:p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index+1}</span><div><h3 className="text-base font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div></li>)}
            </ol>
          </section>

          <section className="page-section overflow-hidden rounded-2xl border border-border bg-white">
            <div className="border-b border-border px-5 py-6 md:px-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Eight-sector comparison</p><h2 className="mt-2 font-serif text-3xl text-navy">What the latest available country data shows</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">The large value is the middle country reading. “Higher” only describes direction; whether it is favourable depends on what the indicator measures.</p></div>
            <div className="divide-y divide-border">
              {performance.data.map(sector => <article key={sector.sector_id} className="grid gap-5 px-5 py-6 md:px-8 lg:grid-cols-[1.2fr_.8fr_1fr_auto] lg:items-center">
                <div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{sector.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{text(sector.sector_name)}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{text(sector.indicator_name)} · {period(sector.period_start,sector.period_end)}</p></div>
                <div><p className="text-[9px] uppercase tracking-[.1em] text-muted-foreground">Middle country reading · {text(sector.headline_label)}</p><p className="mt-1 font-serif text-2xl text-navy">{valueWithUnit(sector.headline_value,text(sector.headline_unit))}</p><p className="mt-1 text-xs text-muted-foreground">{changeWithUnit(sector.comparison_value,text(sector.comparison_unit))} versus the previous available reading</p></div>
                <div className="grid grid-cols-2 gap-3"><div><strong className="block text-lg text-navy">{sector.improving_markets_pct.toFixed(0)}%</strong><span className="text-[9px] uppercase tracking-[.08em] text-muted-foreground">countries reading higher</span></div><div><strong className="block text-lg text-navy">{sector.continent_coverage_pct.toFixed(0)}%</strong><span className="text-[9px] uppercase tracking-[.08em] text-muted-foreground">of 54 countries covered</span></div></div>
                <Link to={`/sectors/${sector.sector_id}/trends`} className="inline-flex items-center gap-2 text-xs font-semibold text-navy">Full dossier <ArrowRight size={14}/></Link>
              </article>)}
            </div>
          </section>

          <section className="page-section overflow-hidden rounded-2xl border border-border bg-white" aria-labelledby="sector-decision-matrix">
            <div className="border-b border-border px-5 py-6 md:px-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Decision matrix</p><h2 id="sector-decision-matrix" className="mt-2 font-serif text-3xl text-navy md:text-4xl">Where the headline is broad, narrow or incomplete</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">This matrix puts movement, country breadth, dispersion and coverage beside one another. It helps identify which patterns deserve country-level investigation; it does not rank investment attractiveness.</p></div>
            <div className="grid gap-3 p-4 md:hidden">{performance.data.map(sector => <article key={sector.sector_id} className="rounded-xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-xl text-navy">{text(sector.sector_name)}</h3><p className="mt-1 text-[10px] text-muted-foreground">{text(sector.indicator_name)}</p></div><span className="rounded-full bg-navy/[.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-navy">{sectorPattern(sector)}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-muted-foreground">Median reading</dt><dd className="mt-1 font-semibold text-navy">{valueWithUnit(sector.headline_value,text(sector.headline_unit))}</dd></div><div><dt className="text-muted-foreground">Median change</dt><dd className="mt-1 font-semibold text-navy">{changeWithUnit(sector.comparison_value,text(sector.comparison_unit))}</dd></div><div><dt className="text-muted-foreground">Countries moving higher</dt><dd className="mt-1 font-semibold text-navy">{sector.improving_markets_pct.toFixed(0)}%</dd></div><div><dt className="text-muted-foreground">Country coverage</dt><dd className="mt-1 font-semibold text-navy">{sector.countries_reported}/54</dd></div></dl><p className="mt-4 text-xs leading-5 text-muted-foreground"><strong className="text-navy">Observed range:</strong> middle half {sector.dispersion_low.toFixed(1)}–{sector.dispersion_high.toFixed(1)} {text(sector.headline_unit)}.</p><Link to={`/sectors/${sector.sector_id}/trends`} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-navy">Investigate countries and evidence <ArrowRight size={13}/></Link></article>)}</div>
            <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1100px] border-collapse text-left text-sm"><thead className="bg-navy text-white"><tr>{['Sector and measure','Median reading','Change','Breadth','Coverage','Middle 50%','Highest recorded markets','Evidence pattern'].map(label => <th key={label} className="px-4 py-3 text-[10px] uppercase tracking-[.1em]">{text(label)}</th>)}</tr></thead><tbody className="divide-y divide-border">{performance.data.map(sector => <tr key={sector.sector_id} className="align-top"><th className="px-4 py-4"><Link to={`/sectors/${sector.sector_id}/trends`} className="font-semibold text-navy hover:underline">{text(sector.sector_name)}</Link><span className="mt-1 block max-w-[14rem] text-[10px] font-normal leading-4 text-muted-foreground">{text(sector.indicator_name)}</span></th><td className="px-4 py-4 tabular-nums text-navy">{valueWithUnit(sector.headline_value,text(sector.headline_unit))}</td><td className="px-4 py-4 tabular-nums">{changeWithUnit(sector.comparison_value,text(sector.comparison_unit))}</td><td className="px-4 py-4 tabular-nums">{sector.improving_markets_pct.toFixed(0)}% higher</td><td className="px-4 py-4 tabular-nums">{sector.countries_reported}/54</td><td className="px-4 py-4 tabular-nums">{sector.dispersion_low.toFixed(1)}–{sector.dispersion_high.toFixed(1)}</td><td className="px-4 py-4 text-xs leading-5 text-muted-foreground">{sector.leaders.slice(0,3).map(market => countryName(market.country_code, market.country_name)).join(' · ')}</td><td className="px-4 py-4"><span className="rounded-full bg-navy/[.06] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-navy">{sectorPattern(sector)}</span></td></tr>)}</tbody></table></div>
            <div className="border-t border-border bg-navy/[.025] px-5 py-5 text-sm leading-7 text-navy/80 md:px-8"><strong>How to use it:</strong> start with evidence pattern and coverage, inspect the highest and lowest recorded countries, then open the sector dossier to test supporting conditions and unanswered diligence questions.</div>
          </section>
        </>}

        {performance && view === 'sectors' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Detailed sector guides</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">Understand each sector one measure at a time</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Start with the main measure, then use the three supporting measures to see structure and operating conditions. The questions at the end show what still requires investigation.</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {performance.data.map(sector => <article key={sector.sector_id} className="flex flex-col rounded-2xl border border-border bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 border-b border-border pb-4"><div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{sector.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{text(sector.sector_name)}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy">{text(sector.direction)}</span></div>
              <div className="py-5"><p className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{text(sector.headline_label)}</p><p className="mt-2 font-serif text-4xl text-navy">{valueWithUnit(sector.headline_value,text(sector.headline_unit))}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Middle reading across {sector.countries_reported} countries · {period(sector.period_start,sector.period_end)} · half of the countries fall between {sector.dispersion_low.toFixed(1)} and {sector.dispersion_high.toFixed(1)}</p><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-navy/[.035] p-4 text-xs"><div><span className="block text-muted-foreground">Countries moving higher</span><strong className="mt-1 block text-lg text-navy">{sector.improving_markets_pct.toFixed(0)}%</strong></div><div><span className="block text-muted-foreground">Countries with a positive reading</span><strong className="mt-1 block text-lg text-navy">{sector.positive_markets_pct.toFixed(0)}%</strong></div></div><p className="mt-4 text-sm leading-6 text-navy/80"><strong>What this measures:</strong> {text(sector.scope)}</p><p className="mt-3 text-sm leading-6 text-muted-foreground"><strong className="text-navy">What it cannot establish:</strong> {text(sector.caveat)}</p></div>
              <div className="grid gap-3">{sector.dimensions.map(item => <div key={item.indicator_code} className="rounded-xl border border-border bg-navy/[.025] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-navy">{text(item.label)}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{item.indicator_code} · {period(item.period_start,item.period_end)}</p></div><span className="text-right text-sm font-semibold text-navy">{valueWithUnit(item.value,text(item.unit))}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-muted-foreground"><span>{changeWithUnit(item.comparison_value,text(item.comparison_unit))} median change</span><span>{item.markets_rising_pct.toFixed(0)}% rising</span><span>{item.coverage_pct.toFixed(0)}% coverage</span></div><p className="mt-3 text-xs leading-5 text-navy/75">{text(item.interpretation)}</p><p className="mt-2 text-[10px] leading-4 text-muted-foreground"><strong className="text-navy">Limit:</strong> {text(item.caveat)}</p></div>)}</div>
              <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2"><div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-navy/60">Highest recorded countries</p><ol className="mt-3 space-y-2">{sector.leaders.map((market,index) => <li key={market.country_code} className="flex justify-between gap-3 text-xs"><Link to={`/countries/${market.country_code}`} className="font-semibold text-navy">{index+1}. {countryName(market.country_code, market.country_name)}</Link><span className="tabular-nums text-muted-foreground">{valueWithUnit(market.value,text(sector.headline_unit))} · {market.observation_year}</span></li>)}</ol></div><div><p className="text-[9px] font-bold uppercase tracking-[.12em] text-navy/60">Lowest recorded countries</p><ol className="mt-3 space-y-2">{sector.laggards.map((market,index) => <li key={market.country_code} className="flex justify-between gap-3 text-xs"><Link to={`/countries/${market.country_code}`} className="font-semibold text-navy">{index+1}. {countryName(market.country_code, market.country_name)}</Link><span className="tabular-nums text-muted-foreground">{valueWithUnit(market.value,text(sector.headline_unit))} · {market.observation_year}</span></li>)}</ol></div></div>
              <div className="mt-5 border-t border-border pt-4"><p className="text-[9px] font-bold uppercase tracking-[.12em] text-navy/60">Questions to check next</p><ol className="mt-3 space-y-2">{sector.diligence_questions.map((question,index) => <li key={question} className="grid grid-cols-[1.25rem_1fr] gap-2 text-xs leading-5 text-muted-foreground"><span>{index+1}.</span><span>{text(question)}</span></li>)}</ol></div>
              <Link to={`/sectors/${sector.sector_id}/trends`} className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-navy">Open complete performance dossier <ArrowRight size={14}/></Link>
            </article>)}
          </div>
        </section>}

        {performance && view === 'methodology' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Evidence discipline</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">How to read the market record</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">The dashboard is designed to preserve differences between growth, scale, access, concentration, cost and capacity rather than collapsing them into an unsupported score.</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              ['Primary performance','Each sector has one named output, spending, credit, adoption or external-demand proxy. Its scope and limitation are visible beside the value.'],
              ['Supporting dimensions','Three additional indicators test market structure or operating conditions. Their own units, years and country coverage remain intact.'],
              ['Country comparison','Headline values are country medians. Country leaders, laggards, middle-half dispersion and breadth show how much continental summaries conceal.'],
              ['No automatic verdict','Higher is not always better: rising lending rates, grid losses or concentration can be adverse or contextual. No field is converted into a return forecast or investment recommendation.'],
            ].map(([title,body],index) => <article key={title} className="rounded-2xl border border-border bg-white p-6"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index+1}</span><h3 className="mt-5 font-serif text-2xl text-navy">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></article>)}
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-border bg-white p-6 md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Practical research protocol</p><h3 className="mt-2 font-serif text-3xl text-navy">From continental signal to an evidence-ready decision</h3><ol className="mt-6 space-y-5">{[
              ['Define the decision','Specify country, customer, product, time horizon, capital at risk and the decision that the evidence must support.'],
              ['Build the comparison set','Choose plausible countries and compare the same indicator, unit, observation period and coverage before interpreting differences.'],
              ['Test market structure','Add demand, competition, prices, regulation, infrastructure, labour, logistics, financing and currency evidence.'],
              ['Verify implementation','Confirm licensing, ownership restrictions, tax, repatriation, procurement, land, data, standards and local-partner requirements.'],
              ['Stress-test the case','Model adverse exchange-rate, inflation, demand, delay, financing-cost and policy scenarios before committing resources.'],
            ].map(([title,body],index) => <li key={title} className="grid grid-cols-[2rem_1fr] gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{index+1}</span><div><h4 className="text-sm font-bold text-navy">{title}</h4><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div></li>)}</ol></article>
            <article className="rounded-2xl border border-border bg-white p-6 md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Core definitions</p><h3 className="mt-2 font-serif text-3xl text-navy">What the comparison terms mean</h3><dl className="mt-6 divide-y divide-border">{[
              ['Median','The middle country reading after values are ordered. It limits the influence of very large economies but is not a continental total.'],
              ['Median change','The middle country-level change versus each market’s preceding available observation. Observation intervals may differ.'],
              ['Breadth','The share of reporting countries moving higher. It shows how widely a direction appears, not how economically large those countries are.'],
              ['Coverage','Reporting countries divided by all 54 African countries. Missing countries reduce confidence and remain visible.'],
              ['Middle 50%','The range between the lower and upper quartiles. A wide range signals substantial cross-country dispersion.'],
              ['Leader or laggard','A position on one named measure, not an overall judgment of quality, opportunity, risk or investability.'],
            ].map(([term,definition]) => <div key={term} className="grid gap-2 py-4 sm:grid-cols-[8rem_1fr]"><dt className="text-sm font-bold text-navy">{term}</dt><dd className="text-sm leading-6 text-muted-foreground">{definition}</dd></div>)}</dl></article>
          </div>
          <div className="mt-6 rounded-2xl bg-navy p-6 text-white md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Published methodology</p><p className="mt-4 text-sm leading-7 text-white/75">{performance.methodology}</p><a href={performance.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-4">Inspect {performance.source_name} <ExternalLink size={12}/></a></div>
        </section>}

        {view === 'workspace' && <DecisionWorkspace context="market" />}
      </main>
    </div>
  </div>;
};
