import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowUpRight, BarChart3, BookOpenCheck, Building2,
  CalendarDays, CheckCircle2, CircleHelp, Globe2, Landmark, Scale,
  ShieldCheck, Target, TrendingUp,
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { stripMarkdown } from '@/lib/utils';
import { activeReaderLocale, formatReaderDate } from '../../i18n/locale';
import { useLanguage } from '../../context/LanguageContext';
import { readerCountryName } from '../../i18n/pt-country-data';

type Indicator = {
  code: string;
  name: string;
  value: number;
  year: number;
  unit: string;
  source_url: string;
  period_status?: 'historical_observation' | 'estimate_or_projection';
};

const indicatorGuidance: Record<string, { meaning: string; use: string; caution: string }> = {
  'NY.GDP.MKTP.CD': {
    meaning: 'The recorded value of goods and services produced in the economy.',
    use: 'Use it to understand market scale, then compare it with population and growth rather than reading it alone.',
    caution: 'A large economy does not automatically mean high household purchasing power or easy market entry.',
  },
  'NY.GDP.MKTP.KD.ZG': {
    meaning: 'The annual change in inflation-adjusted economic output.',
    use: 'Use it to identify acceleration or contraction and investigate which sectors are driving the change.',
    caution: 'One year can be affected by base effects, commodity cycles or weather; inspect several years before concluding.',
  },
  'FP.CPI.TOTL.ZG': {
    meaning: 'The annual change in consumer prices.',
    use: 'Use it when assessing household demand, operating costs, pricing power and monetary-policy pressure.',
    caution: 'A national rate can conceal large differences between food, housing, energy and regions.',
  },
  'BX.KLT.DINV.WD.GD.ZS': {
    meaning: 'Net foreign direct investment inflows as a share of the economy.',
    use: 'Use it as evidence of recorded cross-border capital flows, then verify the projects and sectors behind the number.',
    caution: 'A single large transaction can move the ratio sharply; it is not a stand-alone measure of investment quality.',
  },
  'SP.POP.TOTL': {
    meaning: 'The provider estimate of the resident population.',
    use: 'Use it to size the potential market alongside income, urbanisation, age structure and access conditions.',
    caution: 'Population is not the same as addressable demand or purchasing power.',
  },
  'NE.TRD.GNFS.ZS': {
    meaning: 'Exports plus imports of goods and services as a share of GDP.',
    use: 'Use it to understand how exposed the economy is to regional and global trade.',
    caution: 'High trade intensity can signal integration and also exposure to external shocks.',
  },
};

const indicatorGuidancePt: Record<string, { meaning: string; use: string; caution: string }> = {
  'NY.GDP.MKTP.CD': {
    meaning: 'O valor registado dos bens e serviços produzidos na economia.',
    use: 'Utilize-o para compreender a dimensão do mercado e compare-o depois com a população e o crescimento, em vez de o interpretar isoladamente.',
    caution: 'Uma economia de grande dimensão não significa automaticamente elevado poder de compra das famílias nem facilidade de entrada no mercado.',
  },
  'NY.GDP.MKTP.KD.ZG': {
    meaning: 'A variação anual da produção económica corrigida da inflação.',
    use: 'Utilize-a para identificar aceleração ou contracção e apurar que sectores explicam a mudança.',
    caution: 'Um único ano pode ser afectado por efeitos de base, ciclos das matérias-primas ou condições meteorológicas; examine vários anos antes de concluir.',
  },
  'FP.CPI.TOTL.ZG': {
    meaning: 'A variação anual dos preços no consumidor.',
    use: 'Utilize-a ao avaliar a procura das famílias, custos operacionais, poder de fixação de preços e pressão sobre a política monetária.',
    caution: 'Uma taxa nacional pode ocultar diferenças importantes entre alimentação, habitação, energia e regiões.',
  },
  'BX.KLT.DINV.WD.GD.ZS': {
    meaning: 'As entradas líquidas de investimento directo estrangeiro em proporção da economia.',
    use: 'Utilize-as como prova dos fluxos de capital transfronteiriços registados e verifique depois os projectos e sectores subjacentes.',
    caution: 'Uma única operação de grande dimensão pode alterar fortemente o rácio; não constitui, por si só, uma medida da qualidade do investimento.',
  },
  'SP.POP.TOTL': {
    meaning: 'A estimativa da população residente publicada pela entidade de origem.',
    use: 'Utilize-a para dimensionar o mercado potencial em conjunto com rendimento, urbanização, estrutura etária e condições de acesso.',
    caution: 'População não equivale a procura acessível nem a poder de compra.',
  },
  'NE.TRD.GNFS.ZS': {
    meaning: 'As exportações e importações de bens e serviços em proporção do PIB.',
    use: 'Utilize-as para compreender a exposição da economia ao comércio regional e mundial.',
    caution: 'Uma elevada intensidade comercial pode indicar integração, mas também exposição a choques externos.',
  },
};

function formatValue(value: number, unit: string) {
  if (unit === 'USD') {
    return new Intl.NumberFormat(activeReaderLocale(), { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value);
  }
  if (unit === '%' || unit.toLowerCase().includes('percent')) {
    return `${value.toLocaleString(activeReaderLocale(), { maximumFractionDigits: 2 })}%`;
  }
  return value.toLocaleString(activeReaderLocale(), { notation: Math.abs(value) >= 1_000_000 ? 'compact' : 'standard', maximumFractionDigits: 2 });
}

function guidanceFor(indicator: Indicator, language: string) {
  if (language === 'pt') return indicatorGuidancePt[indicator.code] || {
    meaning: `${indicator.name}, conforme publicado pela entidade oficial identificada.`,
    use: 'Utilize esta observação com o período indicado e compare-a com indicadores relacionados antes de tomar uma decisão.',
    caution: 'As definições, os períodos de referência e a cobertura nacional podem diferir. Consulte o registo da entidade de origem antes de comparar.',
  };
  return indicatorGuidance[indicator.code] || {
    meaning: `${indicator.name} as reported by the named official provider.`,
    use: 'Use this observation with its stated period and compare it with related indicators before making a decision.',
    caution: 'Definitions, reporting periods and country coverage can differ. Inspect the provider record before comparison.',
  };
}

export const BetaNarrativeToolkit: React.FC = () => {
  const { language } = useLanguage();
  const { code } = useParams<{ code: string }>();
  const upperCode = code?.toUpperCase();

  const countryQuery = useQuery({
    queryKey: ['country', upperCode],
    queryFn: () => api.getCountry(upperCode!),
    enabled: !!upperCode,
    staleTime: 24 * 60 * 60 * 1000,
  });

  const dossierQuery = useQuery({
    queryKey: ['country-dossier', upperCode],
    queryFn: () => api.getCountryDossier(upperCode!),
    enabled: !!upperCode,
    staleTime: 24 * 60 * 60 * 1000,
  });

  if (!upperCode) return <Navigate to="/countries" replace />;

  const country = dossierQuery.data?.country || countryQuery.data?.country;
  const dossier = dossierQuery.data?.dossier;
  const provenance = dossierQuery.data?.provenance;
  const profile = dossier?.macroeconomics.official_profile || dossier?.macroeconomics.world_bank;
  const indicators = (profile?.indicators || []) as Indicator[];
  const countryName = readerCountryName(upperCode, country?.name || upperCode, language);
  const isLoading = countryQuery.isLoading || dossierQuery.isLoading;

  return (
    <div className="min-h-screen bg-white text-navy">
      <SEO
        title={language === 'pt' ? `Instrumentos de dados de mercado — ${countryName} | BOA-Story` : `${countryName} Market Evidence Toolkit | BOA-Story`}
        description={language === 'pt'
          ? `Dados económicos, comerciais e sectoriais ligados às fontes para compreender e comunicar a posição de mercado de ${countryName}.`
          : `Source-linked economic, trade and sector evidence for understanding and communicating ${countryName}'s market position.`}
      />

      <header className="bg-navy px-4 py-12 text-white sm:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <Link to={`/countries/${upperCode}`} className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition-colors hover:text-white">
            <ArrowLeft size={16} /> Back to {countryName} country hub
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Country market evidence toolkit</p>
              <h1 className="mt-4 max-w-4xl font-serif text-4xl leading-tight text-white sm:text-5xl md:text-6xl">
                {language === 'pt' ? `Compreender e comunicar a posição de mercado de ${countryName}` : <>Understand and communicate {countryName}&apos;s market position</>}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-7 text-white/80 md:text-lg md:leading-8">
                {language === 'pt'
                  ? 'Um registo preparado para apoiar decisões, assente em observações económicas oficiais, dados comerciais, profundidade da investigação sectorial e prioridades de verificação. Não classifica um país com base em manchetes nem trata o volume de cobertura como desempenho do mercado.'
                  : 'A decision-ready record of official economic observations, trade evidence, sector research depth and verification priorities. It does not score a country from headlines or treat reporting volume as market performance.'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Evidence status</p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {isLoading
                  ? 'Loading verified records'
                  : language === 'pt' ? `${indicators.length} indicadores oficiais` : `${indicators.length} official indicators`}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/70">
                {provenance?.retrieved_at
                  ? language === 'pt'
                    ? `Fontes consultadas em ${formatReaderDate(provenance.retrieved_at, { dateStyle: 'long' })}.`
                    : `Sources checked ${formatReaderDate(provenance.retrieved_at, { dateStyle: 'long' })}.`
                  : 'The source record is being assembled from official providers.'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="Toolkit sections" className="sticky top-[var(--header-height,0px)] z-30 border-b border-navy/15 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {[
            ['overview', 'How to use'],
            ['indicators', 'Economic indicators'],
            ['trade', 'Trade position'],
            ['sectors', 'Sector evidence'],
            ['action', 'Decision framework'],
            ['sources', 'Sources'],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white">
              {label}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 md:space-y-24 md:py-20">
        <section id="overview" className="scroll-mt-40 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy/55">Start here</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">What this toolkit can—and cannot—tell you</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [BookOpenCheck, 'Observed evidence', 'Values are presented with their provider, reporting period and retrieval date. Older observations are never made to look current.'],
              [TrendingUp, 'Market interpretation', 'Each indicator explains what it measures, how it supports a decision and what could make a quick conclusion unreliable.'],
              [Scale, 'No synthetic country score', 'There is no opaque “image strength” or “diplomacy” score. Evidence quality and missing diligence are shown directly.'],
              [ShieldCheck, 'Verification before advocacy', 'Use the communication framework only after checking the linked source, current policy position and sector-specific conditions.'],
            ].map(([Icon, title, copy]) => {
              const ItemIcon = Icon as typeof BookOpenCheck;
              return (
                <article key={String(title)} className="rounded-2xl border border-navy/15 bg-white p-6">
                  <ItemIcon size={22} aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-bold">{String(title)}</h3>
                  <p className="mt-2 text-sm leading-6 text-navy/70">{String(copy)}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="indicators" className="scroll-mt-40">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy/55">Official economic record</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Read the indicators with context</h2>
            <p className="mt-4 text-base leading-7 text-navy/70">
              A value is evidence, not a verdict. Use the explanation and caution under each observation before comparing countries or presenting a market case.
            </p>
          </div>

          {isLoading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-navy/5" />)}
            </div>
          ) : indicators.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {indicators.map(indicator => {
                const guidance = guidanceFor(indicator, language);
                return (
                  <article key={indicator.code} className="rounded-2xl border border-navy/15 bg-white p-6 md:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-navy/50">{indicator.name}</p>
                        <p className="mt-3 font-serif text-3xl">{formatValue(indicator.value, indicator.unit)}</p>
                        <p className="mt-1 text-sm text-navy/60">
                          {indicator.period_status === 'estimate_or_projection' ? 'Provider projection' : 'Recorded observation'} · {indicator.year}
                        </p>
                      </div>
                      <a href={indicator.source_url || profile?.source_url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold hover:underline">
                        Source <ArrowUpRight size={14} />
                      </a>
                    </div>
                    <dl className="mt-6 space-y-4 border-t border-navy/10 pt-5 text-sm leading-6">
                      <div><dt className="font-bold">What it measures</dt><dd className="mt-1 text-navy/70">{guidance.meaning}</dd></div>
                      <div><dt className="font-bold">How to use it</dt><dd className="mt-1 text-navy/70">{guidance.use}</dd></div>
                      <div><dt className="font-bold">Do not overclaim</dt><dd className="mt-1 text-navy/70">{guidance.caution}</dd></div>
                    </dl>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-navy/15 p-6">
              <p className="font-bold">Official-source refresh in progress</p>
              <p className="mt-2 text-sm leading-6 text-navy/70">The country record remains accessible while the platform retrieves the first verified provider snapshot. No placeholder value is substituted.</p>
            </div>
          )}
        </section>

        <section id="trade" className="scroll-mt-40 rounded-3xl bg-navy p-6 text-white sm:p-8 md:p-12">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">External position</p>
              <h2 className="mt-3 font-serif text-3xl text-white md:text-4xl">Trade and cross-border exposure</h2>
              <p className="mt-4 leading-7 text-white/75">Read the reporting year and provider first. The recorded balance describes the covered period; it does not predict the next one.</p>
            </div>
            {dossier?.trade && <a href={dossier.trade.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-white hover:underline">Inspect provider record <ArrowUpRight size={15} /></a>}
          </div>
          {dossier?.trade ? (
            dossier.trade.kind === 'reported_totals' ? (
              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-white/20 sm:grid-cols-3">
                {[
                  ['Exports', dossier.trade.totalExports, dossier.trade.export_year || dossier.trade.year],
                  ['Imports', dossier.trade.totalImports, dossier.trade.import_year || dossier.trade.year],
                  ['Recorded difference', dossier.trade.balance, dossier.trade.year],
                ].map(([label, value, year]) => (
                  <div key={String(label)} className="bg-navy p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/60">{String(label)}</p>
                    <p className="mt-3 break-words font-serif text-2xl text-white">{formatValue(Number(value), 'USD')}</p>
                    <p className="mt-2 text-sm text-white/65">Observation {String(year)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-8 grid gap-px overflow-hidden rounded-2xl bg-white/20 sm:grid-cols-2">
                {dossier.trade.current_account_percent_gdp !== undefined && <div className="bg-navy p-5"><p className="text-xs font-bold uppercase tracking-widest text-white/60">Current-account balance</p><p className="mt-3 font-serif text-2xl text-white">{formatValue(dossier.trade.current_account_percent_gdp, '%')}</p><p className="mt-2 text-sm text-white/65">{dossier.trade.period_status === 'estimate_or_projection' ? 'Projection' : 'Observation'} {dossier.trade.year}</p></div>}
                {dossier.trade.current_account_usd !== undefined && <div className="bg-navy p-5"><p className="text-xs font-bold uppercase tracking-widest text-white/60">Current-account value</p><p className="mt-3 font-serif text-2xl text-white">{formatValue(dossier.trade.current_account_usd, 'USD')}</p><p className="mt-2 text-sm text-white/65">{dossier.trade.period_status === 'estimate_or_projection' ? 'Projection' : 'Observation'} {dossier.trade.year}</p></div>}
              </div>
            )
          ) : <p className="mt-8 rounded-xl border border-white/20 p-5 text-white/75">The verified external-sector record is being refreshed; the platform does not manufacture a zero or estimate.</p>}
        </section>

        <section id="sectors" className="scroll-mt-40">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy/55">Sector research map</p>
              <h2 className="mt-3 font-serif text-3xl md:text-4xl">Where the evidence base is deepest</h2>
              <p className="mt-4 leading-7 text-navy/70">
                These counts measure source-linked BOA research records for {countryName}; they do not measure sector growth or investment returns. Open Market Intelligence for performance indicators and cross-country comparisons.
              </p>
              <Link to="/intelligence" className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-bold text-white">Open Market Intelligence <ArrowUpRight size={15} /></Link>
            </div>
            <div className="overflow-hidden rounded-2xl border border-navy/15">
              {(dossier?.sector_evidence || []).length > 0 ? (
                <ol className="divide-y divide-navy/10">
                  {dossier!.sector_evidence.map((sector, index) => (
                    <li key={sector.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 p-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center">
                      <span className="font-serif text-2xl text-navy/35">{String(index + 1).padStart(2, '0')}</span>
                      <div><p className="font-bold">{sector.name}</p><p className="mt-1 text-sm text-navy/60">Latest evidence {sector.latest_evidence_at ? formatReaderDate(sector.latest_evidence_at, { dateStyle: 'medium' }) : 'under review'}</p></div>
                      <p className="col-start-2 text-sm font-semibold sm:col-start-auto">{sector.article_count} source-linked {sector.article_count === 1 ? 'record' : 'records'}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="p-6"><p className="font-bold">Sector evidence collection is active</p><p className="mt-2 text-sm leading-6 text-navy/70">Use the official macroeconomic and trade evidence above while country-sector records pass source review.</p></div>
              )}
            </div>
          </div>
        </section>

        <section id="action" className="scroll-mt-40">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy/55">Evidence-to-action framework</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Build a defensible market narrative</h2>
            <p className="mt-4 leading-7 text-navy/70">This sequence helps a policy, investment or communications team turn verified evidence into an understandable position without overstating what the data proves.</p>
          </div>
          <ol className="mt-8 grid gap-4 lg:grid-cols-2">
            {[
              [Target, 'Define the decision', 'Name the audience, sector, time horizon and decision the evidence must support. A broad “country opportunity” claim is too vague to verify.'],
              [BarChart3, 'State the observation', 'Quote the exact indicator, value, provider and reporting period. Keep an observation separate from your interpretation.'],
              [Building2, 'Connect the mechanism', 'Explain how policy, infrastructure, demand, costs, trade access or financing could link the observation to the sector in question.'],
              [CircleHelp, 'Test the counter-case', 'Identify what could reverse the conclusion: outdated data, currency effects, concentration, regulatory change, execution constraints or a one-off transaction.'],
              [CheckCircle2, 'Set verification gates', 'List the primary documents and local checks required before a public claim, allocation decision or partnership commitment.'],
              [Globe2, 'Communicate proportionately', 'Lead with what is supported, label projections, disclose limitations and provide direct source links so another reader can reproduce the reasoning.'],
            ].map(([Icon, title, copy], index) => {
              const StepIcon = Icon as typeof Target;
              return (
                <li key={String(title)} className="rounded-2xl border border-navy/15 p-6 md:p-7">
                  <div className="flex items-center justify-between"><StepIcon size={22} /><span className="text-sm font-bold text-navy/40">{index + 1}</span></div>
                  <h3 className="mt-5 text-xl font-bold">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-6 text-navy/70">{String(copy)}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="sources" className="scroll-mt-40 border-t border-navy/15 pt-12">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-navy/55">Audit trail</p>
              <h2 className="mt-3 font-serif text-3xl">Sources and freshness</h2>
              <p className="mt-4 text-sm leading-6 text-navy/70">{provenance?.methodology || 'Official observations retain the period and unit supplied by their provider. Retrieval dates are recorded separately.'}</p>
            </div>
            <div className="space-y-3">
              {(dossier?.freshness || []).map(source => (
                <a key={`${source.provider}-${source.source_url}`} href={source.source_url} target="_blank" rel="noreferrer" className="grid gap-2 rounded-2xl border border-navy/15 p-5 transition-colors hover:bg-navy hover:text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div><p className="font-bold">{language === 'pt' ? source.provider.replace('external-sector record', 'registo do sector externo') : source.provider}</p><p className="mt-1 text-sm opacity-70">{language === 'pt' ? 'Período de observação' : 'Observation period'}: {language === 'pt' ? source.observation_period.replace('historical observations and separately labelled projections', 'observações históricas e projecções identificadas separadamente').replace('external-sector record', 'registo do sector externo') : source.observation_period}</p></div>
                  <p className="text-sm font-semibold">{language === 'pt' ? 'Consultado em' : 'Checked'} {formatReaderDate(source.checked_at, { dateStyle: 'medium' })} <ArrowUpRight className="ml-1 inline" size={14} /></p>
                </a>
              ))}
              {(dossier?.official_resources || []).map(resource => (
                <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="grid gap-2 rounded-2xl border border-navy/15 p-5 transition-colors hover:bg-navy hover:text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div><p className="font-bold">{resource.name}</p><p className="mt-1 text-sm opacity-70">{language === 'pt' ? resource.source_type.replace('Business portal', 'Portal empresarial').replace('official portal', 'portal oficial') : resource.source_type}</p></div>
                  <span className="text-sm font-semibold">{language === 'pt' ? 'Abrir recurso oficial' : 'Open official resource'} <ArrowUpRight className="ml-1 inline" size={14} /></span>
                </a>
              ))}
              {!dossier && !isLoading && <div className="rounded-2xl border border-navy/15 p-5"><p className="font-bold">Verified source assembly continues</p><p className="mt-2 text-sm leading-6 text-navy/70">Return shortly for provider links and freshness records. The platform will retain the last verified snapshot after the first successful retrieval.</p></div>}
            </div>
          </div>
        </section>

        {(dossier?.upcoming_events || []).length > 0 && (
          <section className="rounded-3xl border border-navy/15 p-6 md:p-8">
            <div className="flex items-center gap-3"><CalendarDays size={22} /><h2 className="font-serif text-2xl">Upcoming verification touchpoints</h2></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {dossier!.upcoming_events.slice(0, 6).map(event => (
                <article key={event.id} className="rounded-xl bg-navy/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-navy/55">{event.category} · {formatReaderDate(event.date_start, { dateStyle: 'medium' })}</p>
                  <h3 className="mt-2 font-bold">{stripMarkdown(event.title)}</h3>
                  <p className="mt-2 text-sm text-navy/65">{event.location}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-4 border-t border-navy/15 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><Landmark size={20} /><p className="text-sm font-semibold">Evidence first. Interpretation second. Verification before action.</p></div>
          <Link to={`/countries/${upperCode}`} className="inline-flex items-center gap-2 text-sm font-bold hover:underline">Return to {countryName} hub <ArrowUpRight size={15} /></Link>
        </div>
      </main>
    </div>
  );
};
