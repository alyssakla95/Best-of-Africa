import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { EditorialContent } from '../../components/EditorialContent';
import { api, type GeneratedReportSection } from '../../services/api';
import { formatReaderDate } from '../../i18n/locale';
import { useLanguage } from '../../context/LanguageContext';
import { translatePortugueseInterfaceText } from '../../i18n/pt-PT-1945';
import { trackJourneyCompletion } from '../../lib/navigationTelemetry';

const reportTypeLabel = (type: string, language: string) => language === 'pt' ? ({
  country_brief: 'Síntese nacional',
  sector_analysis: 'Análise sectorial',
  weekly_digest: 'Resumo semanal',
  investment_outlook: 'Perspectivas de investimento',
}[type] || 'Relatório de síntese') : ({
  country_brief: 'Country brief',
  sector_analysis: 'Sector analysis',
  weekly_digest: 'Weekly digest',
  investment_outlook: 'Investment outlook',
}[type] || 'Briefing report');

const formatDate = (value: string) => {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');
  return Number.isNaN(date.getTime()) ? value : formatReaderDate(date, { day: 'numeric', month: 'long', year: 'numeric' });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const formatCell = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.map(formatCell).join(', ');
  if (isRecord(value)) return Object.entries(value).map(([key, item]) => `${key}: ${formatCell(item)}`).join('; ');
  return String(value);
};

const SectionData = ({ data }: { data: unknown }) => {
  if (Array.isArray(data) && data.length && data.every(isRecord)) {
    const keys = [...new Set(data.flatMap(item => Object.keys(item)))];
    return <div className="mt-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
        <thead>
          <tr>{keys.map(key => <th key={key} className="border-b border-border bg-navy px-4 py-3 text-[11px] font-bold uppercase tracking-[.08em] text-white">{key.replace(/_/g, ' ')}</th>)}</tr>
        </thead>
        <tbody>
          {data.map((item) => <tr key={JSON.stringify(item)} className="odd:bg-navy/[.03]">
            {keys.map(key => <td key={key} data-label={key.replace(/_/g, ' ')} className="border-b border-border px-4 py-3 align-top leading-6 text-navy/85 last:border-b-0">{formatCell(item[key])}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>;
  }
  if (isRecord(data)) {
    return <dl className="mt-6 grid gap-3 sm:grid-cols-2">
      {Object.entries(data).map(([key, value]) => <div key={key} className="rounded-lg bg-navy/[.035] p-4">
        <dt className="text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
        <dd className="mt-1 text-sm font-semibold leading-6 text-navy">{formatCell(value)}</dd>
      </div>)}
    </dl>;
  }
  if (data === null || data === undefined) return null;
  return <p className="mt-6 text-sm leading-7 text-navy/85">{formatCell(data)}</p>;
};

const ReportSectionCard = ({ section, index }: { section: GeneratedReportSection; index: number }) =>
  <section className="page-section rounded-2xl border border-border bg-white p-5 md:p-8" aria-labelledby={`report-section-${index}`}>
    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-navy/60">Section {index + 1}</p>
    <h2 id={`report-section-${index}`} className="mt-2 font-serif text-2xl text-navy md:text-3xl">{section.title}</h2>
    {section.content && <EditorialContent content={section.content} variant="brief" className="mt-5" />}
    {section.data !== undefined && section.data !== null && <SectionData data={section.data} />}
  </section>;

export const BetaReport = () => {
  const { language } = useLanguage();
  const { id } = useParams<{ id?: string }>();
  const reportTitle = (title: string) => {
    if (language !== 'pt') return title;
    const country = title.match(/^(.*?) Country Brief$/);
    if (country) return `Síntese nacional — ${translatePortugueseInterfaceText(country[1]) || country[1]}`;
    const sector = title.match(/^(.*?) Sector Analysis$/);
    if (sector) return `Análise sectorial — ${translatePortugueseInterfaceText(sector[1]) || sector[1]}`;
    return translatePortugueseInterfaceText(title) || title;
  };

  const listQuery = useQuery({
    queryKey: ['generated-reports'],
    queryFn: () => api.getGeneratedReports(),
    staleTime: 30 * 60 * 1000,
    enabled: !id,
  });

  const reportQuery = useQuery({
    queryKey: ['generated-report', id],
    queryFn: () => api.getGeneratedReport(id as string),
    staleTime: 30 * 60 * 1000,
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (id && reportQuery.data?.data) trackJourneyCompletion('markets', 'structured_report_open', `/intelligence/reports/${id}`);
  }, [id, reportQuery.data?.data]);

  // ── Index: every stored brief as a structured entry ────────────────────────
  if (!id) {
    const reports = listQuery.data?.data || [];
    return <div className="min-h-screen bg-background pb-24 text-foreground">
      <SEO title="Briefing Reports | BOA-Story" description="Structured country briefs and sector analyses from the BOA evidence desk." />
      <header className="border-b border-white/15 bg-navy text-white">
        <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-6 md:py-16 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[.18em] text-white/65"><span>BOA evidence desk</span><span className="h-1 w-1 rounded-full bg-white/40"/><span>Briefing reports</span></div>
          <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.4rem,6vw,4.8rem)] leading-[.95] tracking-[-.04em]">Country briefs and sector analyses, structured for reading.</h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/75 md:text-lg">Every report is stored and served as structured sections — narrative, tables and definitions rendered natively, never as raw generated markup.</p>
        </div>
      </header>

      <div className="mx-auto mt-10 w-full max-w-[1400px] px-5 sm:px-6 md:mt-14 lg:px-8">
        <main className="page-stack min-w-0">
          {listQuery.isLoading && <section className="grid animate-pulse gap-4 md:grid-cols-2"><div className="h-40 rounded-2xl bg-navy/5"/><div className="h-40 rounded-2xl bg-navy/5"/></section>}
          {listQuery.isError && <section className="rounded-2xl border border-border bg-white p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-navy/60">{language === 'pt' ? 'Falha no pedido dos relatórios' : 'Report request failed'}</p><h2 className="mt-2 font-serif text-3xl text-navy">{language === 'pt' ? 'Não foi possível carregar o arquivo de sínteses.' : 'The briefing archive could not be loaded.'}</h2><button onClick={() => listQuery.refetch()} className="mt-6 rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">{language === 'pt' ? 'Tentar novamente' : 'Retry'}</button></section>}
          {!listQuery.isLoading && !listQuery.isError && !reports.length && <section className="rounded-2xl border border-border bg-white p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-navy/60">Archive building</p><h2 className="mt-2 font-serif text-3xl text-navy">The first scheduled briefs have not been stored yet.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Country briefs and sector analyses are produced by the daily reporting worker and appear here once stored.</p></section>}
          {!!reports.length && <section className="grid gap-4 md:grid-cols-2">
            {reports.map(report => <Link key={report.id} to={`/intelligence/reports/${report.id}`} className="group flex flex-col rounded-2xl border border-border bg-white p-5 transition-colors hover:border-navy/40 md:p-6">
              <div className="flex items-center gap-3"><FileText size={16} className="text-navy/65"/><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{reportTypeLabel(report.type, language)}</p></div>
              <h2 className="mt-3 font-serif text-2xl leading-tight text-navy">{reportTitle(report.title)}</h2>
              <p className="mt-2 text-xs text-muted-foreground">Prepared {formatDate(report.created_at)}</p>
              <span className="mt-5 inline-flex items-center gap-2 border-t border-border pt-4 text-xs font-semibold text-navy">Open structured report <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5"/></span>
            </Link>)}
          </section>}
        </main>
      </div>
    </div>;
  }

  // ── Detail: one report as a native application page ────────────────────────
  const report = reportQuery.data?.data;
  return <div className="min-h-screen bg-background pb-24 text-foreground">
    <SEO title={report ? `${reportTitle(report.title)} | BOA-Story` : 'Briefing Report | BOA-Story'} description={report?.subtitle || 'Structured briefing report from the BOA evidence desk.'} />
    <header className="border-b border-white/15 bg-navy text-white">
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-6 md:py-14 lg:px-8">
        <Link to="/intelligence/reports" className="inline-flex items-center gap-2 text-xs font-semibold text-white/75 hover:text-white"><ArrowLeft size={14}/> All briefing reports</Link>
        {report && <>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[.18em] text-white/65"><span>{reportTypeLabel(report.type, language)}</span><span className="h-1 w-1 rounded-full bg-white/40"/><span>{language === 'pt' ? 'Preparado em' : 'Prepared'} {formatDate(report.generated_at || report.created_at)}</span></div>
          <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.2rem,5.5vw,4.2rem)] leading-[.95] tracking-[-.04em]">{reportTitle(report.title)}</h1>
          {report.subtitle && <p className="mt-6 max-w-3xl text-base leading-7 text-white/75 md:text-lg">{report.subtitle}</p>}
        </>}
      </div>
    </header>

    <div className="mx-auto mt-10 w-full max-w-[1400px] px-5 sm:px-6 md:mt-14 lg:px-8">
      <main className="page-stack min-w-0">
        {reportQuery.isLoading && <section className="grid animate-pulse gap-4"><div className="h-56 rounded-2xl bg-navy/5"/><div className="h-56 rounded-2xl bg-navy/5"/></section>}
        {reportQuery.isError && <section className="rounded-2xl border border-border bg-white p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-navy/60">Report unavailable</p><h2 className="mt-2 font-serif text-3xl text-navy">This briefing could not be loaded.</h2><button onClick={() => reportQuery.refetch()} className="mt-6 rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">Retry</button></section>}
        {report && !report.sections.length && <section className="rounded-2xl border border-border bg-white p-8"><p className="text-xs font-bold uppercase tracking-[.16em] text-navy/60">Legacy record</p><h2 className="mt-2 font-serif text-3xl text-navy">This report predates structured storage.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">Reports generated before the structured-report rebuild stored no readable sections. New scheduled runs store full narrative and data sections.</p></section>}
        {report?.sections.map((section, index) => <ReportSectionCard key={`${section.title}-${index}`} section={section} index={index}/>)}
      </main>
    </div>
  </div>;
};
