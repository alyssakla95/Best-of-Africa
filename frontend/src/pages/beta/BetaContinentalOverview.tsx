import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, ExternalLink, Globe2, Headphones, Landmark, Play, Scale, TrendingUp } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { IntelligenceTrustPanel } from '../../components/intelligence/IntelligenceTrustPanel';
import { DataReadingGuide } from '../../components/PageReadingGuide';
import { useAudio } from '../../context/AudioContext';
import { stripMarkdown } from '../../lib/utils';

const compact = (value: number, digits = 1) => new Intl.NumberFormat('en', {
  notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: digits,
}).format(value);

const formatValue = (value: number, unit: string) => {
  if (unit === 'current US$') return `$${compact(value)}`;
  if (unit === 'current US$ per person') return `$${compact(value)}`;
  if (unit === 'people') return compact(value);
  return `${compact(value)}${unit === '%' ? '%' : ` ${unit}`}`;
};

const period = (start: number, end: number) => start === end ? String(end) : `${start}–${end}`;

export const BetaContinentalOverview: React.FC = () => {
  const { view: requestedView = 'overview' } = useParams<{ view?: string }>();
  const { playTrack } = useAudio();
  const view = ['overview', 'regions', 'sectors'].includes(requestedView) ? requestedView : 'overview';
  const query = useQuery({
    queryKey: ['continental-economic-overview', 'economy-v1'],
    queryFn: api.getContinentalOverview,
    staleTime: 12 * 60 * 60 * 1000,
  });

  if (query.isLoading) return <div className="mx-auto max-w-6xl animate-pulse px-5 py-16 sm:px-6"><div className="h-16 w-2/3 rounded-xl bg-navy/10"/><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl bg-navy/5"/>)}</div><div className="mt-10 h-96 rounded-2xl bg-navy/5"/></div>;

  if (query.isError || !query.data) return <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center px-5 sm:px-6"><p className="text-xs font-bold uppercase tracking-[.2em] text-navy/60">Official dataset request failed</p><h1 className="mt-3 font-serif text-4xl text-navy">The continental economic record could not be loaded.</h1><p className="mt-4 leading-7 text-muted-foreground">Retry the official-data dashboard or continue to individual country dossiers.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={() => query.refetch()} className="rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">Retry dashboard</button><Link to="/countries" className="rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-navy">Country dossiers</Link></div></div>;

  const data = query.data;
  const indicators = Object.fromEntries(data.indicators.map(item => [item.indicator_code, item]));
  const headlineCodes = ['NY.GDP.MKTP.CD', 'SP.POP.TOTL', 'NY.GDP.MKTP.KD.ZG', 'BX.KLT.DINV.CD.WD'];
  const headlineIcons = [Landmark, Globe2, TrendingUp, Activity];
  const narratedBriefings = Array.isArray(data.narrated_briefings) ? data.narrated_briefings : [];

  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO title="Continental Economic Overview | BOA-Story" description="Official continental and regional economic, trade, investment and sector-performance indicators across Africa’s 54 markets."/>

    <header className="overflow-hidden border-b border-white/15 bg-navy text-white">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.55fr)] lg:items-end lg:px-8 lg:py-20">
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[.18em] text-white/65"><span>BOA evidence desk</span><span className="h-1 w-1 rounded-full bg-white/40"/><span>Continental economy</span></div>
          <h1 className="mt-5 max-w-5xl font-serif text-[clamp(2.8rem,7vw,6.4rem)] leading-[.91] tracking-[-.045em]">Africa’s economy in one verifiable record.</h1>
          <p className="mt-7 max-w-3xl text-base leading-7 text-white/75 md:text-xl md:leading-8">Move from continental scale to regional concentration, sector conditions and country evidence. Every figure keeps its unit, period, coverage and limitation visible.</p>
          <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row"><Link to="/intelligence/sectors" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-bold text-navy">Open sector intelligence</Link><Link to="/countries" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/30 px-5 text-sm font-bold text-white">Compare country records</Link></div>
        </motion.div>
        <aside className="border-t border-white/20 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" aria-label="Dataset status">
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-white/55">Current evidence release</p>
          <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 lg:grid-cols-1">
            <div><dt className="text-xs text-white/55">Countries in scope</dt><dd className="mt-1 font-serif text-3xl text-white">{data.countries_in_scope}</dd></div>
            <div><dt className="text-xs text-white/55">Official measures</dt><dd className="mt-1 font-serif text-3xl text-white">{data.indicators.length}</dd></div>
            <div className="col-span-2 lg:col-span-1"><dt className="text-xs text-white/55">Evidence source</dt><dd className="mt-1 text-sm font-semibold leading-5 text-white">{data.source_name}</dd></div>
          </dl>
        </aside>
      </div>
    </header>

    <IntelligenceTrustPanel updatedAt={data.retrieved_at} sourceLabel={data.source_name}/>

    <nav className="sticky top-[4.5rem] z-30 border-b border-navy/15 bg-white/95 backdrop-blur-md lg:top-16" aria-label="Continental dashboard sections">
      <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {[['overview','Continental record'],['regions','Regional comparison'],['sectors','Sector performance']].map(([slug,label]) => <Link key={slug} to={`/dashboards/${slug}`} aria-current={view === slug ? 'page' : undefined} className={`shrink-0 rounded-md px-4 py-2.5 text-sm font-bold transition-colors ${view === slug ? 'bg-navy text-white' : 'text-navy/70 hover:bg-navy/5 hover:text-navy'}`}>{label}</Link>)}
      </div>
    </nav>

    <div className="mx-auto mt-10 w-full max-w-[1400px] px-5 sm:px-6 md:mt-14 lg:px-8">
      <main className="page-stack min-w-0">
        {view === 'overview' && <>
          <section className="page-section">
            <div className="max-w-3xl"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-navy/60">Official continental record</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">How large is the economy, and which way is it moving?</h2><p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">A total adds reported country values together. A median shows the middle country and gives every country equal weight. The cards state which method is used.</p></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {headlineCodes.map((code,index) => { const item=indicators[code]; const Icon=headlineIcons[index]; return <article key={code} className="rounded-2xl border border-border bg-white p-5 md:p-6"><Icon size={18} className="text-navy/65"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.label}</p><p className="mt-2 break-words font-serif text-3xl text-navy">{formatValue(item.value,item.unit)}</p><p className="mt-3 text-xs leading-5 text-muted-foreground">{item.aggregation} · {item.countries_reported} countries · {period(item.period_start,item.period_end)}</p><p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-navy/75"><strong>In plain language:</strong> {item.interpretation}</p></article>; })}
            </div>
          </section>

          <DataReadingGuide subject="the continental overview" />

          <section className="page-section rounded-2xl border border-border bg-white p-5 md:p-8" aria-labelledby="continental-audio-briefings">
            <div className="flex max-w-4xl items-start gap-4">
              <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><Headphones size={20}/></span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-navy/60">Narrated reporting</p>
                <h2 id="continental-audio-briefings" className="mt-2 font-serif text-3xl text-navy md:text-4xl">Listen to the evidence behind the wider picture</h2>
                <p className="mt-3 readable-copy">These are narrated, source-linked editorial briefings. They provide current reporting context and remain separate from the official economic measures above.</p>
              </div>
            </div>
            {narratedBriefings.length > 0 ? (
              <ol className="mt-7 grid gap-3 lg:grid-cols-2">
                {narratedBriefings.map((briefing, index) => (
                  <li key={briefing.id} className="rounded-xl border border-border bg-background p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => playTrack({
                          title: stripMarkdown(briefing.title),
                          subtitle: [briefing.country_name, briefing.sector_name].filter(Boolean).join(' · '),
                          audioUrl: briefing.audio_url,
                          durationSeconds: briefing.audio_duration_seconds || undefined,
                          slug: briefing.slug,
                        }, narratedBriefings.map(item => ({
                          title: stripMarkdown(item.title),
                          subtitle: [item.country_name, item.sector_name].filter(Boolean).join(' · '),
                          audioUrl: item.audio_url,
                          durationSeconds: item.audio_duration_seconds || undefined,
                          slug: item.slug,
                        })))}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                        aria-label={`Play ${stripMarkdown(briefing.title)}`}
                      >
                        <Play size={18} fill="currentColor"/>
                      </button>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">Briefing {index + 1}{briefing.country_name ? ` · ${briefing.country_name}` : ''}</p>
                        <h3 className="mt-1 font-serif text-xl leading-tight text-navy">{stripMarkdown(briefing.title)}</h3>
                        {briefing.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{stripMarkdown(briefing.summary)}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-navy/70">
                          {briefing.audio_duration_seconds && <span>{Math.max(1, Math.round(briefing.audio_duration_seconds / 60))} min audio</span>}
                          <Link to={`/posts/${briefing.slug}`} className="font-semibold underline decoration-navy/25 underline-offset-4">Open source-linked article</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-7 rounded-xl border border-dashed border-navy/20 bg-navy/[.025] p-5">
                <p className="text-sm leading-7 text-navy/75">The economic record is complete above. This API response does not yet contain a narrated-briefing index, so no unrelated regional data has been substituted in its place.</p>
              </div>
            )}
          </section>

          <section className="page-section overflow-hidden rounded-2xl border border-border bg-white" aria-labelledby="continental-analysis-path">
            <div className="border-b border-border px-5 py-6 md:px-8">
              <p className="text-xs font-bold uppercase tracking-[.08em] text-navy/60">Build the continental picture</p>
              <h2 id="continental-analysis-path" className="mt-2 font-serif text-3xl text-navy md:text-4xl">Read the economy as connected evidence, not isolated rankings</h2>
              <p className="mt-4 readable-copy">Economic size, real growth, inflation, trade, investment and population describe different parts of the same landscape. Their relationship is more informative than any one headline figure.</p>
            </div>
            <div className="grid gap-px bg-border lg:grid-cols-2">
              {[
                ['1. Begin with scale', 'GDP and population establish the size of recorded economic activity and the number of people in scope. Neither figure alone describes productivity, distribution, household welfare or market accessibility.'],
                ['2. Add momentum', 'Real GDP growth indicates the direction and pace of inflation-adjusted output. Compare it with its observation period and country coverage before describing momentum as current or continent-wide.'],
                ['3. Examine stability and financing', 'Inflation affects purchasing power and operating costs, while foreign direct investment records a form of external capital flow. High or rising values require country-specific explanation.'],
                ['4. Inspect distribution', 'Regional totals and country rankings show where recorded values are concentrated. Medians and coverage reveal the typical reporting country and how much of Africa the comparison actually represents.'],
              ].map(([title,body]) => <article key={title} className="bg-white p-5 md:p-7"><h3 className="text-lg font-bold text-navy">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p></article>)}
            </div>
            <div className="border-t border-border bg-navy/[.035] px-5 py-5 md:px-8"><p className="text-sm leading-7 text-navy/85"><strong>Practical conclusion:</strong> use this overview to frame questions and identify patterns. Use the regional comparison to test geographic concentration, the sector view to examine operating structure, and country dossiers for decision-level detail.</p></div>
          </section>

          <section className="page-section">
            <div className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Trade, prices and investment</p><h2 className="mt-2 font-serif text-3xl text-navy">The other numbers needed for context</h2></div><span className="text-xs text-muted-foreground">{data.indicators.length} official measures in total</span></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {data.indicators.filter(item => !headlineCodes.includes(item.indicator_code)).map(item => <article key={item.indicator_code} className="rounded-xl border border-border bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{item.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{item.label}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy/60">{item.aggregation}</span></div>
                <p className="mt-5 font-serif text-3xl text-navy">{formatValue(item.value,item.unit)}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.countries_reported} countries · observations {period(item.period_start,item.period_end)}</p>
                <p className="mt-5 text-sm leading-6 text-navy/80">{item.interpretation}</p><p className="mt-4 border-l-2 border-navy/20 pl-3 text-xs leading-5 text-muted-foreground"><strong className="text-navy">Limit:</strong> {item.caveat}</p>
                <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-navy underline decoration-navy/25 underline-offset-4">Official series <ExternalLink size={12}/></a>
              </article>)}
            </div>
          </section>

          <section className="page-section">
            <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Country comparison</p><h2 className="mt-2 font-serif text-3xl text-navy">Which countries record the largest values?</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Each list ranks only the named measure. A country’s position does not mean it is the “best” market, safest investment or strongest overall economy.</p></div>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              {[
                ['Largest economies', data.rankings.largest_economies, 'current US$'],
                ['Fastest real growth', data.rankings.fastest_growth, '%'],
                ['Largest net FDI inflows', data.rankings.largest_fdi_inflows, 'current US$'],
              ].map(([title, rows, unit]) => <article key={title as string} className="rounded-2xl border border-border bg-white p-5 md:p-6"><h3 className="font-serif text-2xl text-navy">{title as string}</h3><ol className="mt-5 space-y-3">{(rows as typeof data.rankings.largest_economies).map((row,index) => <li key={row.country_code} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 text-sm"><span className="text-muted-foreground">{index+1}.</span><div><Link to={`/countries/${row.country_code}`} className="font-semibold text-navy hover:underline">{row.country_name}</Link><p className="text-[10px] text-muted-foreground">{row.region} · {row.year}</p></div><span className="text-right tabular-nums text-navy">{formatValue(row.value,unit as string)}</span></li>)}</ol></article>)}
            </div>
          </section>
        </>}

        {view === 'regions' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Five-region comparison</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">How Africa’s regions differ</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">GDP, population and foreign investment are added across countries. Growth, inflation and investment use the middle country reading. Each card shows how many countries supplied the data.</p></div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {data.regions.map(region => <article key={region.region} className="rounded-2xl border border-border bg-white p-5 md:p-7">
              <div className="flex items-end justify-between gap-4 border-b border-border pb-5"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-navy/60">{region.country_count} countries</p><h3 className="mt-1 font-serif text-3xl text-navy">{region.region} Africa</h3></div><Link to={`/countries?region=${region.region}`} className="text-xs font-semibold text-navy">Open countries <ArrowRight size={12} className="inline"/></Link></div>
              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                {[
                  ['Recorded GDP', region.gdp, 'current US$'], ['Population', region.population, 'people'], ['Median real growth', region.growth, '%'],
                  ['Median inflation', region.inflation, '%'], ['Recorded net FDI', region.fdi, 'current US$'], ['Median fixed investment', region.investment, '% of GDP'],
                ].map(([label,reading,unit]) => { const metric=reading as typeof region.gdp; return <div key={label as string} className="min-w-0 bg-white p-4"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">{label as string}</p><p className="mt-2 break-words font-serif text-xl text-navy">{formatValue(metric.value,unit as string)}</p><p className="mt-1 text-[9px] leading-4 text-muted-foreground">{metric.countries_reported} countries · {period(metric.period_start,metric.period_end)}</p></div>; })}
              </div>
            </article>)}
          </div>
        </section>}

        {view === 'sectors' && <section className="page-section">
          <div className="max-w-3xl"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Official sector series</p><h2 className="mt-2 font-serif text-3xl text-navy md:text-5xl">Sector performance across Africa</h2><p className="mt-4 text-sm leading-7 text-muted-foreground">Eight sector dossiers combine a primary performance proxy with three structural or operating dimensions. Incompatible units remain separate.</p></div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {data.sector_performance.map(sector => <article key={sector.sector_id} className="rounded-2xl border border-border bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{sector.indicator_code}</p><h3 className="mt-1 font-serif text-2xl text-navy">{sector.sector_name}</h3></div><span className="rounded-full border border-border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-navy">{sector.direction}</span></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.2fr]"><div><p className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{sector.headline_label}</p><p className="mt-2 font-serif text-3xl text-navy">{formatValue(sector.headline_value,sector.headline_unit)}</p><p className="mt-2 text-xs text-muted-foreground">{sector.countries_reported} countries · {period(sector.period_start,sector.period_end)}</p></div><div className="grid gap-2">{sector.dimensions.map(item => <div key={item.indicator_code} className="flex items-center justify-between gap-3 rounded-lg bg-navy/[.035] px-3 py-2"><div><p className="text-xs font-semibold text-navy">{item.label}</p><p className="text-[9px] text-muted-foreground">{item.coverage_pct.toFixed(0)}% coverage · {period(item.period_start,item.period_end)}</p></div><span className="text-right text-sm font-semibold text-navy">{formatValue(item.value,item.unit)}</span></div>)}</div></div>
              <Link to={`/sectors/${sector.sector_id}/trends`} className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-semibold text-navy">Open full performance dossier <ArrowRight size={14}/></Link>
            </article>)}
          </div>
        </section>}

        <section className="page-section rounded-2xl border border-border bg-navy p-6 text-white md:p-8"><div className="flex items-start gap-4"><Scale className="mt-1 shrink-0" size={20}/><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Method and comparability</p><p className="mt-3 text-sm leading-7 text-white/75">{view === 'sectors' ? data.sector_methodology : data.methodology}</p><a href={data.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white underline underline-offset-4">Inspect {data.source_name} <ExternalLink size={12}/></a></div></div></section>
      </main>
    </div>
  </div>;
};
