// ─────────────────────────────────────────────────────────────────────────────
// BETA COUNTRY HUB
// Per-country story hub for Founding Members.
// Route: /countries/:code
// ─────────────────────────────────────────────────────────────────────────────


import { useParams, Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, Lock, Globe, FileText, TrendingUp, BarChart2, ExternalLink } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { } from '../../components/beta';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { useLanguage } from '@/context/LanguageContext';
import { portugueseCountryDescription, readerCountryName } from '@/i18n/pt-country-data';
import { useSetBreadcrumb } from '@/context/BreadcrumbContext';
import { KO_FI_URL } from '../../constants/beta';
import { CountryFlag } from '../../components/CountryFlag';
import { ScrollReveal } from '../../components/beta/ScrollReveal';
import { stripMarkdown, heroThumb } from '@/lib/utils';
import type { ArticleListItem } from '../../types';
import { EditorialContent } from '../../components/EditorialContent';
import { hideFailedEditorialImage, sourcedEditorialImage } from '../../lib/editorialImage';
import { PhotoCredit } from '../../components/PhotoCredit';
import { activeReaderLocale, formatReaderDate, formatReaderDateTime } from '../../i18n/locale';
import { translatePortugueseInterfaceText } from '../../i18n/pt-PT-1945';
import { ContextualKnowledgeFeed } from '../KnowledgeNetworkPages';

// ─── Utilities ───────────────────────────────────────────────────────────────

const formatEvidenceValue = (value: number, unit: string) => {
  if (unit === 'USD') return new Intl.NumberFormat(activeReaderLocale(), { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value);
  if (unit === 'USD per person') return new Intl.NumberFormat(activeReaderLocale(), { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat(activeReaderLocale(), { maximumFractionDigits: 2 }).format(value);
};

// ─── Sub-components ──────────────────────────────────────────────────────────

// Deterministic local fallback so broken/missing article heroes show a real
// editorial photo (not a flickering random pick or the branded "B" box).
const ArticleCard = ({ article }: { article: ArticleListItem }) => {
  const { t } = useLanguage();
  const image = sourcedEditorialImage(article);
  return (
  <Link
    to={`/posts/${article.slug}`}
    className="group block bg-card rounded-2xl border border-foreground/10 overflow-hidden hover:border-foreground/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 hover:-translate-y-1"
  >
    <div className="min-h-28 sm:aspect-[16/9] overflow-hidden bg-navy relative">
      {image ? <img src={heroThumb(image)} alt={stripMarkdown(article.title)} loading="lazy" onError={(event) => hideFailedEditorialImage(event.currentTarget)} className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-500" /> : <div className="flex min-h-28 items-end p-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Source-linked country reporting</div>}
      <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
      {image && <PhotoCredit credit={article.image_credit} sourceUrl={article.image_source_url} className="absolute bottom-2 left-3 rounded bg-navy/80 px-2 py-1 text-white" />}
    </div>
    <div className="p-4 sm:p-6">
      {article.sector_name && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent-ink mb-3 block">
          {article.sector_name}
        </span>
      )}
      <h3 className="font-serif text-[18px] font-semibold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
        {stripMarkdown(article.title)}
      </h3>
      {article.summary && (
        <p className="text-[14px] text-foreground/60 mt-3 line-clamp-2 leading-relaxed">{stripMarkdown(article.summary)}</p>
      )}
      <p className="text-[11px] text-foreground/60 mt-4">{article.reading_time_minutes} {t('article.min_read', 'min read')}</p>
    </div>
  </Link>
  );
};

const SkeletonCard = () => (
  <div className="bg-card rounded-2xl border border-foreground/10 overflow-hidden animate-pulse">
    <div className="aspect-[16/9] bg-foreground/5" />
    <div className="p-6 space-y-3">
      <div className="h-3 bg-foreground/5 rounded w-1/4" />
      <div className="h-5 bg-foreground/10 rounded w-3/4" />
      <div className="h-3 bg-foreground/5 rounded w-full" />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const BetaCountryHub = () => {
  const { scrollY } = useScroll();
  const heroOffset = useTransform(scrollY, [0, 800], [0, 250]);
  const { code } = useParams<{ code: string }>();
  const { isMember } = useMember();
  const { t, language } = useLanguage();
  const localText = (value: string) => language === 'pt' ? (translatePortugueseInterfaceText(value) || value) : value;
  const upperCode = (code || '').toUpperCase();

  const [countryQuery, outlookQuery, narrativeQuery, articlesQuery, dossierQuery] = useQueries({
    queries: [
      {
        queryKey: ['country', upperCode],
        queryFn: () => api.getCountry(upperCode),
        staleTime: 24 * 60 * 60 * 1000,
        enabled: !!upperCode },
      {
        queryKey: ['country-outlook', upperCode],
        queryFn: () => api.getCountryOutlook(upperCode),
        staleTime: 60 * 60 * 1000,
        enabled: !!upperCode && isMember },
      {
        queryKey: ['country-narrative', upperCode],
        queryFn: () => api.getCountryNarrative(upperCode),
        staleTime: 60 * 60 * 1000,
        enabled: !!upperCode && isMember },
      {
        queryKey: ['country-articles', upperCode],
        queryFn: () => api.getArticles({ country: upperCode, limit: '9' }),
        staleTime: 5 * 60 * 1000,
        enabled: !!upperCode },
      {
        queryKey: ['country-dossier', upperCode],
        queryFn: () => api.getCountryDossier(upperCode),
        staleTime: 24 * 60 * 60 * 1000,
        enabled: !!upperCode },
    ] });

  const country = countryQuery.data?.country;
  const stats = countryQuery.data?.stats;
  const outlook = outlookQuery.data?.outlook;
  const evidence = outlookQuery.data?.evidence;
  const sectorOpportunities = outlookQuery.data?.sector_opportunities ?? [];
  const narratives = narrativeQuery.data?.narratives ?? [];
  const sectorCoverage = narrativeQuery.data?.sector_coverage ?? [];
  const articles: ArticleListItem[] = (articlesQuery.data?.data ?? []) as ArticleListItem[];
  const dossier = dossierQuery.data?.dossier;
  const provenance = dossierQuery.data?.provenance;
  const officialProfile = dossier?.macroeconomics.official_profile || dossier?.macroeconomics.world_bank;

  const isLoading = countryQuery.isLoading;

  // Show the country name in the breadcrumb instead of the raw code.
  useSetBreadcrumb(country?.name ?? null);

  if (!isLoading && !country && countryQuery.isFetched) {
    return (
      <div className="flex flex-col">
        
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 md:py-32">
          <Globe size={48} className="text-primary/20 mb-6" />
          <h1 className="font-serif text-3xl text-primary mb-3">{t('hub.not_found', 'Country not found')}</h1>
          <p className="text-primary/50 mb-8">{t('hub.not_found_desc', "We couldn't find coverage data for")} "{upperCode}".</p>
          <Link to="/countries" className="text-accent font-semibold hover:opacity-80 transition-opacity flex items-center gap-2">
            <ArrowLeft size={14} /> {t('hub.back_all', 'Back to all countries')}
          </Link>
        </div>
        
      </div>
    );
  }

  const countryName = readerCountryName(upperCode, country?.name ?? upperCode, language);
  const region = country?.region ?? '';
  const investmentHighlights: string[] = language === 'pt'
    ? ['Registo nacional assente em fontes oficiais e cobertura editorial atribuída']
    : Array.isArray(country?.investment_highlights)
    ? country!.investment_highlights
    : [];

  return (
    <div className="pb-24 bg-background text-foreground">
      <SEO
        title={`${countryName} | BOA-Story`}
        description={language === 'pt'
          ? `Histórias seleccionadas, dados oficiais e análise independente sobre ${countryName}.`
          : `Curated stories and independent insights for ${countryName}.`}
      />
      

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="app-hero relative border-b border-border bg-card px-4 py-12 sm:px-6 md:py-16">
        <motion.div 
          className="hidden"
          style={{ y: heroOffset }}
        >
          <img
            src="/images/v2_country_hero.webp"
            alt="Country Landscape"
            className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
          />
          <div className="absolute inset-0 z-10 hero-scrim" />
        </motion.div>

        <div className="page-container">
          <Link
            to="/countries"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-navy text-sm transition-colors mb-8 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            {t('hub.all_54', 'All 54 Countries')}
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
            {isLoading ? (
              <div className="w-24 h-24 bg-foreground/10 rounded-3xl animate-pulse" />
            ) : (
              <CountryFlag code={upperCode} title={countryName} size={64} className="!rounded-lg border border-border" />
            )}
            <div className="flex-1 pb-2">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-12 bg-foreground/10 rounded w-64 animate-pulse" />
                  <div className="h-6 bg-foreground/10 rounded w-48 animate-pulse" />
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-ink">
                      {region ? (region.toLowerCase().endsWith('africa') ? region : `${region} Africa`) : 'Africa'}
                    </span>
                    {stats?.article_count != null && (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {stats.article_count} {stats.article_count === 1 ? t('hub.story', 'story') : t('hub.stories', 'stories')}
                      </span>
                    )}
                  </div>
                  <h1 className="font-serif text-navy text-[2.75rem] md:text-[4.5rem] leading-[1] tracking-tight mb-4">{countryName}</h1>
                  {country?.description && (
                    <p className="text-muted-foreground max-w-2xl leading-relaxed text-base md:text-lg">{stripMarkdown(language === 'pt' ? portugueseCountryDescription(upperCode, country.description) : country.description)}</p>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* Investment Highlights */}
          {investmentHighlights.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}
              className="flex flex-wrap gap-x-5 gap-y-2 mt-8"
            >
              {investmentHighlights.map(h => (
                <span key={h} className="text-xs text-muted-foreground">
                  {h}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="page-container page-stack py-12 md:py-16">

        {/* ── Sentiment Scores (members only) ────────────────────────────── */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className={`${!isMember ? 'hidden' : ''} page-section section-frame relative overflow-hidden`}
        >
          <div className="flex items-center gap-4 mb-10">
            <BarChart2 size={24} className="text-accent" />
            <h2 className="font-serif text-[2rem] text-foreground leading-none">Evidence quality</h2>
          </div>

          {!isMember ? (
            <div className="rounded-xl border border-border bg-background p-6 text-sm leading-relaxed text-muted-foreground">
              Sign in to inspect source coverage, review status, methodology and known evidence limitations. BOA does not display fabricated preview scores.
            </div>
          ) : outlookQuery.isLoading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-foreground/10 rounded w-40" />
                    <div className="h-4 bg-foreground/10 rounded w-12" />
                  </div>
                  <div className="h-2 bg-foreground/5 rounded-full" />
                </div>
              ))}
            </div>
          ) : evidence && outlook ? (
            <div>
              <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                <div className="bg-background p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Published evidence</p><p className="mt-2 font-serif text-3xl text-navy">{evidence.published_articles}</p></div>
                <div className="bg-background p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sectors evidenced</p><p className="mt-2 font-serif text-3xl text-navy">{evidence.sectors_covered}</p></div>
                <div className="bg-background p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Evidence status</p><p className="mt-2 font-serif text-2xl capitalize text-navy">{evidence.status}</p></div>
              </div>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{localText(outlook.methodology)}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">{evidence.limitations.map(item => <li key={item} className="flex gap-3"><span className="text-accent-ink">•</span>{item}</li>)}</ul>
              {outlook.investment_commentary && (
                <div className="mt-10 border-t border-border pt-8">
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">Member evidence dossier</p>
                      <h3 className="mt-2 font-serif text-2xl text-navy">Country reporting brief</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{evidence.source_records.length} source records reviewed</p>
                  </div>
                  <EditorialContent content={outlook.investment_commentary} className="prose-sm max-w-none text-foreground/80" />
                  {evidence.source_records.length > 0 && (
                    <details className="mt-8 rounded-xl border border-border bg-background p-5">
                      <summary className="cursor-pointer text-sm font-semibold text-navy">Inspect source window</summary>
                      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-muted-foreground marker:font-bold marker:text-accent-ink">
                        {evidence.source_records.map(source => (
                          <li key={`${source.record}-${source.title}`} className="flex gap-3">
                            <span className="font-semibold text-accent-ink">[{source.record}]</span>
                            <span>{source.source_url ? <a href={source.source_url} target="_blank" rel="noreferrer" className="hover:text-navy hover:underline">{stripMarkdown(source.title)}</a> : stripMarkdown(source.title)}{source.published_at ? ` · ${formatReaderDate(source.published_at, { dateStyle: 'medium' })}` : ''}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-foreground/40 text-lg">
              The country evidence request did not complete. The published stories, sector coverage and official country record on this page remain the current source layer.
            </div>
          )}
        </motion.section>

        {/* ── Sector Opportunities (members only) ───────────────────────────── */}
        {isMember && (sectorOpportunities.length > 0 || sectorCoverage.length > 0) && (
          <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-10">
              <TrendingUp size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">{t('hub.sector_activity', 'Sector Activity')}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {(sectorOpportunities.length > 0 ? sectorOpportunities : sectorCoverage.map(s => ({
                id: s.id,
                name: s.name,
                articles: s.article_count,
                avg_engagement: 0 }))).map((sector, i) => (
                <motion.div
                  key={sector.id}
                  initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                  className="bg-card rounded-2xl border border-foreground/10 p-6 hover:border-accent/40 transition-colors shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-foreground text-[1.25rem]">{sector.name}</span>
                    <span className="text-[11px] text-accent font-bold tracking-widest bg-accent/10 border border-accent/20 px-3 py-1 rounded-full uppercase">
                      {sector.articles} {sector.articles === 1 ? t('hub.story', 'story') : t('hub.stories', 'stories')}
                    </span>
                  </div>
                  {sector.avg_engagement > 0 && (
                    <p className="text-sm text-foreground/40">
                      {t('hub.avg_engagement', 'Avg. engagement:')} {sector.avg_engagement.toFixed(1)}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Key Narratives (members only) ─────────────────────────────────── */}
        {isMember && narratives.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-4 mb-10">
              <Globe size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">{t('hub.key_narratives', 'Key Narratives')}</h2>
            </div>
            <div className="space-y-6">
              {narratives.slice(0, 4).map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }} className="bg-card rounded-2xl border border-foreground/10 p-8 shadow-xl">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h3 className="font-serif text-[1.75rem] text-foreground leading-snug">{n.narrative_theme}</h3>
                    <span className={`shrink-0 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                      n.priority <= 2 ? 'text-accent bg-accent/10 border-accent/30' : 'text-foreground/50 bg-foreground/5 border-foreground/10'
                    }`}>
                      {n.tone}
                    </span>
                  </div>
                  {n.key_messages.length > 0 && (
                    <ul className="space-y-3">
                      {n.key_messages.slice(0, 3).map((msg, i) => (
                        <li key={i} className="text-[1.125rem] text-foreground/70 flex items-start gap-4 font-light">
                          <span className="text-accent shrink-0 mt-1">→</span>
                          {msg}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Situation Report (if available) ─────────────────────────────── */}
        {isMember && country?.ai_situation_report && (
          <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="bg-card rounded-3xl p-12 text-foreground relative overflow-hidden border border-accent/20 shadow-[0_0_40px_rgba(15,31,61,0.05)]">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Globe size={120} />
              </div>
              <div className="inline-block text-[11px] font-bold tracking-widest text-accent uppercase bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full mb-8">
                {t('hub.situation_report', 'Situation Report')}
              </div>
              <EditorialContent content={country.ai_situation_report} className="relative max-w-4xl text-[15px] leading-7 text-foreground/80 md:text-base" />
            </div>
          </motion.section>
        )}

        {/* ── Portal Links ───────────────────────────────────────────────────── */}
        {isMember && (dossierQuery.isLoading || (dossier && officialProfile)) && (
          <section>
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">Official country evidence</p>
                <h2 className="mt-2 font-serif text-3xl text-navy">Economic and trade record</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">Every value keeps the period published by its provider. The retrieval date records when BOA checked the source; it never makes an older observation look new.</p>
              </div>
              {provenance?.retrieved_at && <p className="shrink-0 text-xs font-semibold text-navy">Sources checked {formatReaderDateTime(provenance.retrieved_at, { dateStyle: 'medium', timeStyle: 'short' })}</p>}
            </div>
            {dossierQuery.isLoading ? <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-xl border border-border bg-card" />)}</div> : dossier && officialProfile && <div className="mt-8 space-y-8">
              <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                {officialProfile.indicators.slice(0, 12).map(indicator => <a href={indicator.source_url || officialProfile.source_url} target="_blank" rel="noreferrer" key={indicator.code} className="group min-w-0 bg-card p-5 transition-colors hover:bg-muted/60"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{indicator.name}</p><p className="mt-3 break-words font-serif text-2xl text-navy">{formatEvidenceValue(indicator.value, indicator.unit)}</p><p className="mt-1 text-xs text-muted-foreground">{indicator.unit} · {'period_status' in indicator && indicator.period_status === 'estimate_or_projection' ? 'projection' : 'observation'} {indicator.year}</p><p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-accent-ink group-hover:underline">{officialProfile.source_name} ↗</p></a>)}
              </div>
              <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] font-bold uppercase tracking-widest text-accent-ink">{dossier.trade.provider} · {'totalExports' in dossier.trade ? 'official trade record' : 'official external-sector outlook'}</p><a href={dossier.trade.source_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-navy hover:underline">Inspect provider record ↗</a></div>
                {'totalExports' in dossier.trade ? <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                  <div className="min-w-0 bg-card p-4"><p className="text-xs text-muted-foreground">Exports · {dossier.trade.export_year || dossier.trade.year}</p><p className="mt-2 break-words font-serif text-xl text-navy sm:text-2xl">{formatEvidenceValue(dossier.trade.totalExports, 'USD')}</p></div>
                  <div className="min-w-0 bg-card p-4"><p className="text-xs text-muted-foreground">Imports · {dossier.trade.import_year || dossier.trade.year}</p><p className="mt-2 break-words font-serif text-xl text-navy sm:text-2xl">{formatEvidenceValue(dossier.trade.totalImports, 'USD')}</p></div>
                  <div className="min-w-0 bg-card p-4"><p className="text-xs text-muted-foreground">Recorded difference</p><p className="mt-2 break-words font-serif text-xl text-navy sm:text-2xl">{formatEvidenceValue(dossier.trade.balance, 'USD')}</p></div>
                </div> : <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
                  {dossier.trade.current_account_percent_gdp !== undefined && <div className="min-w-0 bg-card p-4"><p className="text-xs text-muted-foreground">Current-account balance · {dossier.trade.year} {dossier.trade.period_status === 'estimate_or_projection' ? 'projection' : 'observation'}</p><p className="mt-2 break-words font-serif text-xl text-navy sm:text-2xl">{dossier.trade.current_account_percent_gdp.toLocaleString(activeReaderLocale(), { maximumFractionDigits: 2 })}% of GDP</p></div>}
                  {dossier.trade.current_account_usd !== undefined && <div className="min-w-0 bg-card p-4"><p className="text-xs text-muted-foreground">Current-account balance · {dossier.trade.year} {dossier.trade.period_status === 'estimate_or_projection' ? 'projection' : 'observation'}</p><p className="mt-2 break-words font-serif text-xl text-navy sm:text-2xl">{formatEvidenceValue(dossier.trade.current_account_usd, 'USD')}</p></div>}
                </div>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{dossier.freshness.map(source => <a key={`${source.provider}-${source.source_url}`} href={source.source_url} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-navy/30"><p className="text-xs font-bold text-navy">{source.provider}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{language === 'pt' ? 'Período de observação' : 'Observation period'}: {language === 'pt' ? source.observation_period.replace('historical observations and separately labelled projections', 'observações históricas e projecções identificadas separadamente').replace('external-sector record', 'registo do sector externo') : source.observation_period}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{language === 'pt' ? 'Consultado em' : 'Checked'} {formatReaderDate(source.checked_at, { dateStyle: 'medium' })}</p></a>)}</div>
              {provenance && <div className="border-l-2 border-navy pl-5 text-sm leading-relaxed text-muted-foreground"><p>{localText(provenance.methodology)}</p><p className="mt-2 text-xs">{language === 'pt' ? 'Fontes' : 'Sources'}: {provenance.sources.map(source => source.name.replace('external-sector record', language === 'pt' ? 'registo do sector externo' : 'external-sector record').replace('BOA source-linked reporting', language === 'pt' ? 'cobertura da BOA ligada às fontes' : 'BOA source-linked reporting')).join(' · ')}</p></div>}
            </div>}
          </section>
        )}

        {dossier?.official_resources?.length ? (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <ExternalLink size={18} className="text-accent" />
              <h2 className="font-serif text-2xl text-primary">{t('hub.official_resources', 'Official Resources')}</h2>
            </div>
            <p className="mb-4 max-w-3xl text-sm leading-6 text-muted-foreground">{language === 'pt' ? 'Perfis de dados primários e portais cuja proveniência foi registada. As ligações antigas sem verificação editorial não são apresentadas.' : 'Primary-data profiles and portals with recorded provenance. Legacy links without editorial verification are not shown.'}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dossier.official_resources.map(resource => (
                <a key={`${resource.name}-${resource.url}`} href={resource.url} target="_blank" rel="noopener noreferrer"
                  className="min-w-0 rounded-xl border border-border bg-card p-4 text-sm font-medium text-primary transition-colors hover:border-navy/30">
                  <span className="flex items-start gap-2"><ExternalLink size={13} className="mt-1 shrink-0 text-accent" /><span>{localText(resource.name)}</span></span>
                  <span className="mt-2 block text-xs font-normal text-muted-foreground">{language === 'pt' ? 'Fonte primária verificada' : resource.source_type}</span>
                </a>
              ))}
              {isMember && (
                <Link to={`/countries/${upperCode}/narratives`}
                  className="inline-flex items-center gap-2 bg-background/5 border border-primary/10 hover:border-accent/40 hover:bg-background px-4 py-2.5 rounded-xl text-sm font-bold text-primary transition-colors">
                  <ExternalLink size={13} className="text-accent" /> {t('hub.narrative_toolkit', 'Narrative Diplomacy Toolkit (Gov)')}
                </Link>
              )}
            </div>
          </section>
        ) : null}

        {/* ── Stories from this country ──────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <FileText size={24} className="text-accent" />
              <h2 className="font-serif text-[2rem] text-foreground">{t('hub.stories_from', 'Stories from')} {countryName}</h2>
            </div>
            {articles.length > 0 && (
              <Link
                to={`/posts?country=${upperCode}`}
                className="text-[13px] text-accent font-bold uppercase tracking-widest hover:text-foreground transition-colors"
              >
                {t('hub.view_all', 'View all →')}
              </Link>
            )}
          </div>

          {articlesQuery.isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : articles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, i) => {
                const isLocked = !isMember && i >= 2;
                return isLocked ? (
                  <div key={article.id} className="relative rounded-2xl overflow-hidden border border-foreground/5">
                    <div className="blur-md pointer-events-none opacity-40">
                      <ArticleCard article={article} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 rounded-2xl z-10">
                      <ScrollReveal className="flex flex-col items-center" intensity={0.6}>
                        <Lock size={24} className="text-accent mb-3" />
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground text-center px-4">
                          {t('landing.members_only', 'Reader Members Only')}
                        </p>
                      </ScrollReveal>
                    </div>
                  </div>
                ) : (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                    <ArticleCard article={article} />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-foreground/10 p-16 text-center shadow-xl">
              <Globe size={48} className="text-foreground/20 mx-auto mb-6" />
              <p className="text-foreground/60 font-serif text-[1.5rem]">{t('hub.no_stories_pre', 'No stories published for')} {countryName}{t('hub.no_stories_post', ' yet.')}</p>
              <p className="text-foreground/30 text-lg mt-2">{t('hub.monitoring', 'We are monitoring this market continuously.')}</p>
            </div>
          )}
        </motion.section>

        <ContextualKnowledgeFeed country={countryName} />

        {/* ── Member CTA (non-members) ───────────────────────────────────────── */}
        {!isMember && (
          <ScrollReveal className="block text-center py-8" intensity={0.9}>
            <p className="text-primary/40 text-sm mb-5">
              {t('hub.unlock_pre', 'Unlock the full')} {countryName}{t('hub.unlock_post', ' hub, scores, narratives, sector trends, and more.')}
            </p>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent text-navy font-semibold px-10 py-4 rounded-xl shadow-[0_4px_24px_rgba(15,31,61,0.3)] hover:brightness-110 transition-all hover:-translate-y-0.5"
            >
              {t('article.become_member', 'Become a Reader Member')}
            </a>
          </ScrollReveal>
        )}

      </div>

      
    </div>
  );
};
