import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, ExternalLink, FileText, Landmark, Scale, TrendingUp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { formatReaderDateTime } from '../../i18n/locale';
import { translatePortugueseInterfaceText } from '../../i18n/pt-PT-1945';
import { api } from '../../services/api';

type DecisionWorkspaceProps = { context: 'continental' | 'market' };

const activeLocale = () => typeof document === 'undefined' ? 'en' : document.documentElement.lang || 'en';
const compact = (value: number, digits = 1) => new Intl.NumberFormat(activeLocale(), {
  notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard', maximumFractionDigits: digits,
}).format(value);
const evidenceValue = (value: number, unit: string) => {
  if (/^(?:USD|current US\$)$/i.test(unit)) return `US$ ${compact(value)}`;
  if (/USD per person|current US\$ per person/i.test(unit)) return `US$ ${compact(value)}`;
  if (unit === 'people') return compact(value, 0);
  return `${compact(value)}${unit === '%' ? '%' : ` ${unit}`}`;
};
const qualityLabel = (tier: number | null) => tier === 4 ? 'Primary or globally authoritative' : tier === 3 ? 'Established specialist' : tier === 2 ? 'Verified national reporting' : 'Source-linked record';
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const observationChange = (indicator: { unit: string; absolute_change?: number; percentage_change?: number }) => {
  if (typeof indicator.absolute_change !== 'number') return null;
  const sign = indicator.absolute_change > 0 ? '+' : '';
  if (indicator.unit.includes('%')) return `${sign}${compact(indicator.absolute_change)} percentage points`;
  if (typeof indicator.percentage_change === 'number') return `${sign}${compact(indicator.percentage_change)}% ${translatePortugueseInterfaceText('from the preceding observation') && activeLocale().startsWith('pt') ? translatePortugueseInterfaceText('from the preceding observation') : 'from the preceding observation'}`;
  return null;
};

export function DecisionWorkspace({ context }: DecisionWorkspaceProps) {
  const { language } = useLanguage();
  const text = (value: string) => language === 'pt' ? (translatePortugueseInterfaceText(value) || value) : value;
  const [params, setParams] = useSearchParams();
  const countriesQuery = useQuery({ queryKey: ['decision-countries'], queryFn: api.getCountries, staleTime: 60 * 60 * 1000 });
  const performanceQuery = useQuery({ queryKey: ['decision-sector-performance'], queryFn: () => api.getSectorPerformance('investor'), staleTime: 0, refetchOnWindowFocus: true });
  const countries = useMemo(() => countriesQuery.data?.data || [], [countriesQuery.data?.data]);
  const selectedCountry = params.get('country') || '';
  const selectedSector = params.get('sector') || 'agriculture';

  useEffect(() => {
    if (!selectedCountry && countries.length) {
      const first = [...countries].sort((a, b) => a.name.localeCompare(b.name))[0];
      setParams(current => {
        const next = new URLSearchParams(current);
        next.set('country', first.code);
        if (!next.get('sector')) next.set('sector', 'agriculture');
        return next;
      }, { replace: true });
    }
  }, [countries, selectedCountry, setParams]);

  const dossierQuery = useQuery({
    queryKey: ['decision-country-dossier', selectedCountry, language],
    queryFn: () => api.getCountryDossier(selectedCountry),
    enabled: Boolean(selectedCountry),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const dossier = dossierQuery.data;
  const performance = performanceQuery.data;
  const sector = performance?.data.find(item => item.sector_id === selectedSector) || performance?.data[0];
  const countrySector = dossier?.dossier.sector_evidence.find(item => item.id === selectedSector);
  const allRecords = dossier?.dossier.recent_source_record || [];
  const sectorRecords = allRecords.filter(record => record.sector_id === selectedSector);
  const displayedRecords = sectorRecords.length ? sectorRecords : allRecords;
  const officialEvidence = dossier?.dossier.freshness || [];
  const sourceCount = new Set([
    ...displayedRecords.map(record => record.source_name),
    ...officialEvidence.map(record => record.provider),
  ]).size;
  const ledgerCount = displayedRecords.length + officialEvidence.length;
  const officialProfile = dossier?.dossier.macroeconomics.official_profile || dossier?.dossier.macroeconomics.world_bank;
  const macroIndicators = officialProfile?.indicators || [];
  const indicatorCategories = ['Scale and demand', 'Prices and labour', 'Finance and external resilience', 'Trade and production', 'Infrastructure and digital access', 'Human development'] as const;
  const groupedMacroIndicators = indicatorCategories.map(category => ({
    category,
    indicators: macroIndicators.filter(indicator => (indicator.category || 'Scale and demand') === category),
  })).filter(group => group.indicators.length > 0);
  const imf = dossier?.dossier.macroeconomics.imf_current || {};
  const trade = dossier?.dossier.trade;

  const decisionRows = (() => {
    if (!dossier || !sector) return [];
    const country = dossier.country;
    return [
      ['Economic and demand scale', 'Observed', `${macroIndicators.length} official macroeconomic observations; population and GDP retain their reported periods.`, 'Test addressable customers, purchasing power, informality and subnational concentration.'],
      ['Growth and fiscal outlook', 'Observed + labelled projection', 'Historical observations are separated from IMF estimate or projection fields.', 'Stress-test revenue and costs against growth, inflation, debt, fiscal and currency scenarios.'],
      ['Sector operating conditions', 'Observed continental benchmark', `${sector.indicator_name} plus ${sector.dimensions.length} supporting indicators across reporting African markets.`, `Verify the selected measure directly for ${country.name} and compare it with peers using the official series.`],
      ['Trade and logistics', 'Observed external-sector record', trade?.kind === 'reported_totals' ? `${trade.provider} exports, imports and balance for the stated periods.` : 'IMF external-balance evidence for the stated period.', 'Add commodity, corridor, port, border, freight, insurance and delivery-time evidence for the proposed route.'],
      ['Competition and pricing', 'Source-led verification', `${displayedRecords.length} recent country${sectorRecords.length ? '-sector' : ''} records plus ${officialEvidence.length} official provider records from ${sourceCount} distinct attributed sources.`, 'Identify current competitors, substitutes, price points, margins, procurement channels and customer switching costs from primary filings and fieldwork.'],
      ['Regulation and market entry', 'Official verification route', `${dossier.dossier.official_resources.length} official portals are linked for registration, investment, visa or tourism checks.`, 'Confirm the current legal instrument, licence, ownership, tax, repatriation, standards, data and local-partner requirements with the responsible authority.'],
    ];
  })();

  const updateSelection = (key: 'country' | 'sector', value: string) => setParams(current => {
    const next = new URLSearchParams(current);
    next.set(key, value);
    return next;
  }, { replace: true });

  const save = (filename: string, body: string, type: string) => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const downloadLedger = () => {
    if (!dossier) return;
    const headers = ['record_type','published_or_checked_at','observation_period','country','sector','title','source_name','source_quality','source_url','article_url'];
    const officialRows = officialEvidence.map(record => ['official_provider',record.checked_at,record.observation_period,dossier.country.name,'',`${record.provider} country evidence snapshot`,record.provider,'Official provider',record.source_url,'']);
    const articleRows = displayedRecords.map(record => ['published_source_record',record.published_at,'',dossier.country.name,record.sector_name || '',record.title,record.source_name,qualityLabel(record.source_quality_tier),record.source_url,`${location.origin}/posts/${record.slug}`]);
    const rows = [...officialRows, ...articleRows];
    save(`boa-evidence-ledger-${dossier.country.code}-${selectedSector}.csv`, [headers,...rows].map(row => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8');
  };
  const downloadSnapshot = () => {
    if (!dossier || !sector) return;
    save(`boa-decision-snapshot-${dossier.country.code}-${sector.sector_id}.json`, JSON.stringify({ exported_at: new Date().toISOString(), country: dossier.country, official_country_evidence: dossier.dossier, sector_benchmark: sector, decision_register: decisionRows, provenance: dossier.provenance }, null, 2), 'application/json');
  };

  if (countriesQuery.isLoading || performanceQuery.isLoading || (selectedCountry && dossierQuery.isLoading)) {
    return <section className="page-section animate-pulse"><div className="h-20 rounded-2xl bg-navy/5"/><div className="mt-5 grid gap-4 md:grid-cols-3"><div className="h-48 rounded-2xl bg-navy/5"/><div className="h-48 rounded-2xl bg-navy/5"/><div className="h-48 rounded-2xl bg-navy/5"/></div></section>;
  }
  if (!dossier || !sector) {
    return <section className="page-section rounded-2xl border border-border bg-white p-6"><h2 className="font-serif text-3xl text-navy">The decision workspace could not load its verified records.</h2><button type="button" onClick={() => { void dossierQuery.refetch(); void performanceQuery.refetch(); }} className="mt-5 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white">Retry evidence workspace</button></section>;
  }

  const country = dossier.country;
  const tradeSource = trade?.source_name || 'Official external-sector source';
  const freshness = dossier.dossier.freshness;
  const currentYear = new Date().getFullYear();
  const scenarioRows = [
    ['Real GDP growth',imf.gdpGrowth,'%'],['Inflation',imf.inflation,'%'],['Government debt',imf.debtToGDP,'% of GDP'],['Current account',imf.currentAccountBalance,'% of GDP'],['Fiscal balance',imf.netLendingToGDP,'% of GDP'],['GDP per person',imf.gdpPerCapita,'USD per person'],
  ].filter(([,value]) => typeof value === 'number');

  return <section className="page-section space-y-8" aria-labelledby={`${context}-decision-workspace`}>
    <header className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="border-b border-border bg-navy px-5 py-7 text-white md:px-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Country and sector decision workspace</p><h2 id={`${context}-decision-workspace`} className="mt-2 max-w-4xl font-serif text-3xl md:text-5xl">Build a traceable market case from official observations</h2><p className="mt-4 max-w-4xl text-sm leading-7 text-white/75 md:text-base">Select a country and sector to connect macroeconomics, labelled projections, trade, operating benchmarks, official entry portals and source-linked records. Every section states what the evidence supports and what still requires primary verification.</p></div>
      <div className="grid gap-4 p-5 md:grid-cols-2 md:p-8">
        <label className="text-xs font-bold uppercase tracking-[.1em] text-navy">Country<select value={selectedCountry} onChange={event => updateSelection('country',event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base font-semibold normal-case tracking-normal text-navy">{[...countries].sort((a,b) => a.name.localeCompare(b.name)).map(item => <option key={item.code} value={item.code}>{item.name} · {text(item.region)}</option>)}</select></label>
        <label className="text-xs font-bold uppercase tracking-[.1em] text-navy">Sector<select value={sector.sector_id} onChange={event => updateSelection('sector',event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 text-base font-semibold normal-case tracking-normal text-navy">{performance?.data.map(item => <option key={item.sector_id} value={item.sector_id}>{text(item.sector_name)}</option>)}</select></label>
      </div>
    </header>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        [Landmark,'Country',country.name,`${text(country.region)} Africa · ${country.capital || country.name}`],
        [Scale,'Currency',country.currency || 'National currency recorded',`Official country code ${country.code}`],
        [TrendingUp,'Sector evidence',countrySector?.article_count ?? 0,`${text(sector.sector_name)} source-linked records`],
        [FileText,'Attributed sources',sourceCount,`${ledgerCount} records in this exportable ledger`],
      ].map(([Icon,label,value,detail]) => { const ItemIcon=Icon as typeof Landmark; return <article key={label as string} className="rounded-2xl border border-border bg-white p-5"><ItemIcon size={18} className="text-navy/60"/><p className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label as string}</p><p className="mt-2 font-serif text-3xl text-navy">{value as string | number}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{detail as string}</p></article>; })}
    </div>

    <section className="overflow-hidden rounded-2xl border border-border bg-white"><div className="border-b border-border px-5 py-6 md:px-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Decision readiness register</p><h3 className="mt-2 font-serif text-3xl text-navy">What is evidenced now, and what must be verified next</h3></div><div className="grid gap-3 p-4 md:hidden">{decisionRows.map(([area,status,evidence,next]) => <article key={area} className="rounded-xl border border-border p-4"><h4 className="font-bold text-navy">{area}</h4><p className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-navy/55">{status}</p><p className="mt-3 text-sm leading-6 text-navy/80">{evidence}</p><p className="mt-3 text-sm leading-6 text-muted-foreground"><strong className="text-navy">Next verification:</strong> {next}</p></article>)}</div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[960px] border-collapse text-left text-sm"><thead className="bg-navy text-white"><tr>{['Decision area','Evidence state','Current record','Next verification'].map(label => <th key={label} className="px-5 py-3 text-[10px] uppercase tracking-[.1em]">{label}</th>)}</tr></thead><tbody className="divide-y divide-border">{decisionRows.map(([area,status,evidence,next]) => <tr key={area} className="align-top"><th className="px-5 py-4 font-semibold text-navy">{area}</th><td className="px-5 py-4 text-xs font-semibold text-navy/70">{status}</td><td className="max-w-sm px-5 py-4 leading-6 text-navy/80">{evidence}</td><td className="max-w-sm px-5 py-4 leading-6 text-muted-foreground">{next}</td></tr>)}</tbody></table></div></section>

    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-border bg-white p-5 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Macroeconomic record</p><h3 className="mt-2 font-serif text-3xl text-navy">{macroIndicators.length} observed country indicators</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Official observations are organised by the decision question they help answer. Every measure retains its year, unit, series code, preceding change, observation history and direct provider link.</p></div><a href={officialProfile!.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-navy underline underline-offset-4">Inspect complete provider record <ExternalLink size={12} className="inline"/></a></div>
        <div className="mt-7 space-y-8">{groupedMacroIndicators.map(group => <section key={group.category}><div className="flex items-center justify-between gap-3 border-b border-border pb-3"><h4 className="text-sm font-bold text-navy">{text(group.category)}</h4><span className="text-[10px] font-semibold text-muted-foreground">{group.indicators.length} measures</span></div><div className="mt-3 grid items-start gap-3 sm:grid-cols-2">{group.indicators.map(indicator => {
          const change = observationChange(indicator);
          const history = indicator.history || [];
          return <article key={indicator.code} className="min-w-0 rounded-xl border border-border p-4"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">{indicator.code} · {text('latest observation')} {indicator.year}</p><h5 className="mt-2 text-sm font-bold text-navy">{text(indicator.name)}</h5><p className="mt-3 break-words font-serif text-2xl text-navy">{evidenceValue(indicator.value,indicator.unit)}</p>{change && <p className="mt-2 text-[10px] font-bold uppercase tracking-[.08em] text-navy/60">{change}</p>}{indicator.decision_use && <p className="mt-3 text-xs leading-5 text-navy/70">{text(indicator.decision_use)}</p>}{history.length > 1 && <details className="mt-4 rounded-lg bg-navy/[.035]"><summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-navy">{language === 'pt' ? `Examinar o histórico de observações de ${history.length} anos` : `Inspect ${history.length}-year observation history`}</summary><ol className="max-h-60 divide-y divide-border overflow-y-auto border-t border-border px-3">{[...history].reverse().map((point,index) => <li key={point.year} className="grid grid-cols-[3rem_1fr] gap-3 py-2 text-xs"><span className={index === 0 ? 'font-bold text-navy' : 'text-muted-foreground'}>{point.year}</span><span className="break-words text-right tabular-nums text-navy">{evidenceValue(point.value,indicator.unit)}</span></li>)}</ol></details>}<div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] font-semibold uppercase tracking-[.08em] text-navy/55">{indicator.period_status === 'estimate_or_projection' ? 'Estimate or projection' : 'Historical observation'}</span><a href={indicator.underlying_source_url || indicator.source_url} target="_blank" rel="noopener noreferrer" title={indicator.underlying_source || officialProfile!.source_name} className="text-[10px] font-semibold text-navy underline underline-offset-4">{text('Underlying source')} <ExternalLink size={10} className="inline"/></a></div></article>;
        })}</div></section>)}</div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">IMF scenario anchors</p><h3 className="mt-2 font-serif text-3xl text-navy">Current dated outlook inputs</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">These are provider estimates or projections where their year is {currentYear} or later. They are scenario inputs, not BOA forecasts.</p>{scenarioRows.length > 0 ? <dl className="mt-6 divide-y divide-border">{scenarioRows.map(([label,value,unit]) => <div key={label as string} className="flex items-end justify-between gap-4 py-4"><dt><span className="text-sm font-semibold text-navy">{label as string}</span><span className="mt-1 block text-[10px] text-muted-foreground">{Number(imf.year) || currentYear} · estimate or projection</span></dt><dd className="text-right font-serif text-2xl text-navy">{evidenceValue(Number(value),unit as string)}</dd></div>)}</dl> : <div className="mt-6 rounded-xl border border-border bg-navy/[.025] p-5"><p className="text-sm font-semibold text-navy">The provider snapshot contains no numeric forward estimate for this country.</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Use the dated historical observations in the macroeconomic record and inspect the provider status below before constructing a scenario. No projection has been inferred.</p></div>}</section>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-border bg-white p-5 md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Trade and external position</p><h3 className="mt-2 font-serif text-3xl text-navy">Recorded cross-border evidence</h3>{trade?.kind === 'reported_totals' ? <><div className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">{[['Exports',trade.totalExports],['Imports',trade.totalImports],['Balance',trade.balance]].map(([label,value]) => <div key={label as string} className="min-w-0 bg-white p-3 md:p-4"><p className="text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">{label as string}</p><p className="mt-2 break-words font-serif text-lg text-navy md:text-2xl">US$ {compact(Number(value))}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">{tradeSource} · exports {trade.export_year || trade.year} · imports {trade.import_year || trade.year}. Totals do not establish sector demand, margins or route economics.</p>{(trade.topExportPartners.length > 0 || trade.topImportPartners.length > 0) && <div className="mt-5 grid gap-5 sm:grid-cols-2"><div><h4 className="text-xs font-bold uppercase tracking-[.1em] text-navy">Top recorded export partners</h4><ol className="mt-3 space-y-2">{trade.topExportPartners.slice(0,5).map((partner,index) => <li key={partner.partner} className="flex justify-between gap-3 text-xs"><span>{index+1}. {partner.partner}</span><span className="tabular-nums text-muted-foreground">US$ {compact(partner.value)}</span></li>)}</ol></div><div><h4 className="text-xs font-bold uppercase tracking-[.1em] text-navy">Top recorded import partners</h4><ol className="mt-3 space-y-2">{trade.topImportPartners.slice(0,5).map((partner,index) => <li key={partner.partner} className="flex justify-between gap-3 text-xs"><span>{index+1}. {partner.partner}</span><span className="tabular-nums text-muted-foreground">US$ {compact(partner.value)}</span></li>)}</ol></div></div>}</> : <div className="mt-6 rounded-xl bg-navy/[.035] p-5"><p className="text-xs font-bold uppercase tracking-[.1em] text-navy/60">External balance · {trade?.year}</p><p className="mt-3 font-serif text-3xl text-navy">{typeof trade?.current_account_percent_gdp === 'number' ? `${trade.current_account_percent_gdp}% of GDP` : `US$ ${compact(Number(trade?.current_account_usd || 0))}`}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">IMF external-balance evidence, explicitly labelled {trade?.period_status}.</p></div>}<a href={trade?.source_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-navy underline underline-offset-4">Inspect external-sector source <ExternalLink size={12}/></a></section>

      <section className="rounded-2xl border border-border bg-white p-5 md:p-8"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Sector benchmark</p><h3 className="mt-2 font-serif text-3xl text-navy">{text(sector.sector_name)}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text(sector.scope)}</p><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-navy p-4 text-white"><span className="text-[9px] uppercase tracking-[.1em] text-white/60">Median country reading</span><strong className="mt-2 block font-serif text-2xl">{evidenceValue(sector.headline_value,text(sector.headline_unit))}</strong></div><div className="rounded-xl bg-navy p-4 text-white"><span className="text-[9px] uppercase tracking-[.1em] text-white/60">Country coverage</span><strong className="mt-2 block font-serif text-2xl">{sector.countries_reported}/54</strong></div></div><div className="mt-5 space-y-3">{sector.dimensions.map(dimension => <article key={dimension.indicator_code} className="rounded-xl border border-border p-4"><div className="flex justify-between gap-3"><div><h4 className="text-sm font-bold text-navy">{text(dimension.label)}</h4><p className="mt-1 text-[9px] text-muted-foreground">{dimension.indicator_code} · {dimension.period_start}–{dimension.period_end}</p></div><strong className="text-right text-sm text-navy">{evidenceValue(dimension.value,text(dimension.unit))}</strong></div><p className="mt-3 text-xs leading-5 text-navy/75">{text(dimension.interpretation)}</p><p className="mt-2 text-[10px] leading-4 text-muted-foreground"><strong className="text-navy">Limit:</strong> {text(dimension.caveat)}</p></article>)}</div><p className="mt-5 text-xs leading-5 text-muted-foreground"><strong className="text-navy">Country evidence:</strong> {countrySector?.article_count ?? 0} source-linked {text(sector.sector_name)} records are indexed for {country.name}; coverage is not market performance.</p></section>
    </div>

    <section className="overflow-hidden rounded-2xl border border-border bg-white"><div className="grid gap-5 border-b border-border px-5 py-6 md:grid-cols-[1fr_auto] md:items-end md:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Official market-entry verification</p><h3 className="mt-2 font-serif text-3xl text-navy">Go to the responsible authority before committing capital</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">The linked portals establish where current registration, investment, visa and sector requirements must be checked. They do not replace legal, tax or technical advice.</p></div><Link to={`/countries/${country.code}`} className="text-xs font-semibold text-navy underline underline-offset-4">Open full country dossier</Link></div><div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">{dossier.dossier.official_resources.map(resource => <a key={resource.name} href={resource.url} target="_blank" rel="noopener noreferrer" className="bg-white p-5"><span className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">{resource.source_type}</span><strong className="mt-2 block text-sm text-navy">{resource.name}</strong><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-navy">Open authority <ExternalLink size={12}/></span></a>)}</div><div className="grid gap-4 bg-navy/[.025] p-5 md:grid-cols-2 md:p-8">{[
      ['Corporate establishment','Legal form, ownership restrictions, beneficial ownership, registration sequence and statutory filings.'],['Tax and repatriation','Corporate and indirect tax, withholding, customs, transfer pricing, incentives, exchange controls and profit repatriation.'],['Sector permissions','Operating licence, technical standards, product registration, data rules, environmental approval and regulator reporting.'],['Implementation conditions','Land, utilities, labour, immigration, procurement, local content, logistics, insurance and dispute resolution.'],
    ].map(([title,body]) => <article key={title}><h4 className="text-sm font-bold text-navy">{title}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div></section>

    <section className="overflow-hidden rounded-2xl border border-border bg-white"><div className="grid gap-5 border-b border-border px-5 py-6 md:grid-cols-[1fr_auto] md:items-end md:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Downloadable source ledger</p><h3 className="mt-2 font-serif text-3xl text-navy">Inspect the records behind the workspace</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">The ledger combines {officialEvidence.length} dated official-provider snapshots with {sectorRecords.length ? `${sectorRecords.length} sector-specific records` : `${allRecords.length} recent country records`}. Reporting coverage is supporting context, not a substitute for official market data.</p></div><div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={downloadLedger} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-navy px-4 text-xs font-bold text-navy"><Download size={14}/>Evidence CSV</button><button type="button" onClick={downloadSnapshot} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy px-4 text-xs font-bold text-white"><Download size={14}/>Full snapshot JSON</button></div></div><div className="divide-y divide-border">{officialEvidence.map(record => <article key={`${record.provider}-${record.observation_period}`} className="grid gap-3 bg-navy/[.018] px-5 py-5 md:grid-cols-[8rem_1fr_auto] md:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[.08em] text-navy/60">Official provider</p><p className="mt-1 text-[10px] text-muted-foreground">{formatReaderDateTime(record.checked_at,{dateStyle:'medium'})}</p></div><div><h4 className="text-sm font-semibold leading-6 text-navy">{record.provider} country evidence snapshot</h4><p className="mt-1 text-xs text-muted-foreground">Observation period: {record.observation_period} · {text(record.state.replace(/_/g,' '))}</p></div><a href={record.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-navy underline underline-offset-4">Primary link <ExternalLink size={12} className="inline"/></a></article>)}{displayedRecords.slice(0,12).map(record => <article key={`${record.slug}-${record.published_at}`} className="grid gap-3 px-5 py-5 md:grid-cols-[8rem_1fr_auto] md:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[.08em] text-navy/60">{qualityLabel(record.source_quality_tier)}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Intl.DateTimeFormat(activeLocale(),{dateStyle:'medium'}).format(new Date(record.published_at))}</p></div><div><Link to={`/posts/${record.slug}`} className="text-sm font-semibold leading-6 text-navy hover:underline">{record.title}</Link><p className="mt-1 text-xs text-muted-foreground">{record.source_name} · {text(record.sector_name || 'Country-wide evidence')}</p></div><a href={record.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-navy underline underline-offset-4">Primary link <ExternalLink size={12} className="inline"/></a></article>)}</div></section>

    <section className="rounded-2xl bg-navy p-6 text-white md:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_1fr]"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/60">Evidence freshness</p><h3 className="mt-2 font-serif text-3xl">Provider-by-provider status</h3><p className="mt-3 text-sm leading-7 text-white/70">Retrieval time and observation period are separate. A recent check does not turn an older annual observation into current-year data.</p></div><div className="space-y-3">{freshness.map(item => <div key={item.provider} className="rounded-xl border border-white/15 p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{item.provider}</strong><span className="text-[9px] font-bold uppercase tracking-[.08em] text-white/55">{text(item.state.replace(/_/g,' '))}</span></div><p className="mt-2 text-xs text-white/70">Observation: {item.observation_period}</p><p className="mt-1 text-[10px] text-white/50">Checked {formatReaderDateTime(item.checked_at,{dateStyle:'medium',timeStyle:'short'})}</p></div>)}</div></div></section>
  </section>;
}
