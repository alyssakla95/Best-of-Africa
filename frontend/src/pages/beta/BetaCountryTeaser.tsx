import { useState, useMemo } from 'react';
import { Search, Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { } from '../../components/beta';
import { api } from '../../services/api';
import { KO_FI_URL } from '../../constants/beta';
import { useLanguage } from '@/context/LanguageContext';
import { readerCountryName } from '@/i18n/pt-country-data';
import { CountryFlag } from '../../components/CountryFlag';
import type { Country } from '../../types';
import { MEMBER_PREVIEW_MODE } from '../../config/flags';

// ─── Countries API response shape ────────────────────────────────────────────
interface CountryEntry extends Partial<Country> {
  article_count?: number;
}
interface RegionData {
  countries: CountryEntry[];
}
interface CountriesApiResponse {
  by_region: Record<string, RegionData>;
}

// No hardcoded fallback, countries are always fetched from the API.

const REGIONS = ['All', 'North', 'West', 'East', 'Central', 'Southern'] as const;
type Region = typeof REGIONS[number];

// ─── Compact Card (for full grid) ────────────────────────────────────────────
const CountryCard = ({
  country }: {
  country: Partial<Country>;
}) => {
  const { language } = useLanguage();
  const countryName = readerCountryName(country.code, country.name || country.code || '', language);
  const tag = language === 'pt'
    ? 'Dossiê nacional assente em fontes'
    : Array.isArray(country.investment_highlights) && country.investment_highlights.length > 0
    ? country.investment_highlights[0]
    : country.region || '';

  if (!country.code) return null;

  return (
    <motion.div
      layout
      initial={false}
    >
      <Link
        to={`/countries/${country.code.toLowerCase()}`}
        className="group relative bg-white rounded-lg overflow-hidden border border-border flex flex-col text-left transition-colors hover:border-accent/60 p-4 block h-full"
      >
        <div className="flex items-center justify-between mb-3">
          <CountryFlag code={country.code} title={countryName} size={36} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent-ink bg-accent/10 px-2 py-1 rounded-full border border-accent/15">
            {country.region}
          </span>
        </div>
        <h3 className="font-serif text-[17px] font-semibold text-primary group-hover:text-accent transition-colors leading-tight mb-1">
          {countryName}
        </h3>
        {tag && (
          <p className="text-[11px] text-primary/70 font-medium leading-tight line-clamp-1">{tag}</p>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F3D]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
      </Link>
    </motion.div>
  );
};

const CountryCardSkeleton = () => (
  <div className="bg-background rounded-xl border border-primary/8 p-5 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="w-8 h-8 bg-foreground/10 rounded-full" />
      <div className="w-16 h-4 bg-foreground/10 rounded-full" />
    </div>
    <div className="h-4 bg-foreground/10 rounded w-2/3 mb-2" />
    <div className="h-3 bg-background/5 rounded w-1/2" />
  </div>
);

// ─── Main Component ───────────────────────────────────────────
export const BetaCountryTeaser = () => {
  const [activeRegion, setActiveRegion] = useState<Region>('All');
  const [search, setSearch] = useState('');
  const { t, language } = useLanguage();

  const { data, isLoading, isError } = useQuery<CountriesApiResponse>({
    queryKey: ['countries'],
    queryFn: api.getCountries,
    staleTime: 24 * 60 * 60 * 1000 });



  // Flatten API response
  const allCountries: Partial<Country>[] = useMemo(() => {
    if (data?.by_region) {
      return Object.values(data.by_region).flatMap((r: RegionData) => r.countries || []);
    }
    return [];
  }, [data]);

  // Filter by region + search
  const filtered = useMemo(() => {
    let list = allCountries;
    if (activeRegion !== 'All') {
      list = list.filter(c => c.region === activeRegion);
    }
    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        (Array.isArray(c.investment_highlights) && c.investment_highlights.some(h => h.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [allCountries, activeRegion, search]);

  // Count per region for tab badges
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allCountries.length };
    REGIONS.slice(1).forEach(r => {
      counts[r] = allCountries.filter(c => c.region === r).length;
    });
    return counts;
  }, [allCountries]);


  return (
    <div className="selection:bg-accent selection:text-primary">
      

      <div className="max-w-7xl mx-auto px-5 py-12 sm:px-6 md:py-16">

        {/* Header */}
        <header className="app-hero -mx-1 mb-10 max-w-4xl rounded-lg p-6 sm:p-8 md:p-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 text-accent-ink text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Globe size={12} />
            {t('countries.badge', '54 African Nations')}
          </div>
          <h1 className="break-words font-serif text-[clamp(2.25rem,11vw,3.25rem)] leading-[1.08] md:leading-[1.04] mb-5">
            {t('countries.title', 'One Continent. Every Story.')}
          </h1>
          <p className="text-base md:text-lg text-primary/70 max-w-2xl leading-relaxed">
            {MEMBER_PREVIEW_MODE
              ? 'From the Atlantic to the Indian Ocean, open every country hub and move directly into its reporting record.'
              : t('countries.subtitle', 'From the Atlantic to the Indian Ocean, narrative deep-dives for every African nation, coming to Founding Members.')}
          </p>
        </header>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 pointer-events-none" />
          <input
            type="text"
            placeholder={t('countries.search_ph', 'Search countries or sectors...')}
            aria-label={t('countries.search_aria', 'Search countries or sectors')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary/70 transition-colors p-1"
              aria-label={t('countries.clear', 'Clear search')}
            >
              {/* m9 FIX: use lucide X icon instead of literal × string */}
              <X size={14} />
            </button>
          )}
        </div>

        {/* Regional Tabs */}
        {!search && (
          <div className="grid grid-cols-2 gap-2 mb-10 sm:flex sm:flex-wrap sm:justify-center">
            {REGIONS.map(region => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`min-h-11 px-3 py-2 rounded-lg sm:rounded-full text-sm font-semibold transition-all duration-200 ${
                  activeRegion === region
                    ? 'bg-accent text-navy shadow-[0_4px_16px_rgba(15,31,61,0.3)]'
                    : 'bg-background/5 text-primary/70 hover:bg-foreground/10 hover:text-primary border border-primary/8'
                }`}
              >
                {t('countries.region_' + region.toLowerCase(), region)}
                <span className={`ml-1.5 text-[11px] ${activeRegion === region ? 'text-navy' : 'text-primary/70'}`}>
                  {regionCounts[region]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search result count */}
        {search.length >= 2 && (
          <p className="text-center text-primary/40 text-sm mb-8">
            {filtered.length} {filtered.length === 1 ? t('countries.country', 'country') : t('countries.countries', 'countries')} {t('countries.matching', 'matching')} "{search}"
          </p>
        )}

        {/* Country Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-16"
        >
          <AnimatePresence mode="popLayout">
            {isLoading
              ? Array.from({ length: 54 }).map((_, i) => <CountryCardSkeleton key={i} />)
              : isError
                ? (
                  <div className="col-span-full rounded-xl border border-border bg-card px-5 py-10 text-center">
                    <p className="font-serif text-2xl text-navy">{language === 'pt' ? 'Continuar pelo índice continental' : 'Continue through the continental index'}</p>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{language === 'pt' ? 'Não foi possível concluir o pedido do directório. O painel continental de dados e a pesquisa ligada às fontes continuam disponíveis.' : 'The directory request did not complete. The continental evidence dashboard and source-linked search remain open.'}</p>
                    <div className="mt-6 grid gap-3 min-[420px]:grid-cols-2">
                      <Link to="/dashboards/overview" className="rounded-md bg-navy px-4 py-3 text-sm font-semibold text-white">Continental dashboard</Link>
                      <Link to="/search" className="rounded-md border border-border px-4 py-3 text-sm font-semibold text-navy">{language === 'pt' ? 'Pesquisar dados' : 'Search evidence'}</Link>
                    </div>
                  </div>
                )
              : filtered.length > 0
                ? filtered.map(country => (
                    <CountryCard
                      key={country.code}
                      country={country}
                    />
                  ))
                : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-20 text-primary/40"
                  >
                    <Globe size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">{search ? `${t('countries.none_found', 'No countries found for')} “${search}”` : 'No country records matched the selected region.'}</p>
                  </motion.div>
                )
            }
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA */}
        {MEMBER_PREVIEW_MODE ? (
          <div className="rounded-xl border border-accent/25 bg-accent/10 px-5 py-5 text-center">
            <p className="font-serif text-xl text-navy">All 54 country hubs are open in member preview.</p>
            <p className="mt-2 text-sm text-muted-foreground">Choose any country above to inspect its full reporting and intelligence record.</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-primary/70 text-sm mb-5">{t('countries.cta_note', 'Full country story hubs unlock for Founding Members')}</p>
            <a
              href={KO_FI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent text-navy font-semibold font-sans px-10 py-4 rounded-xl shadow-[0_4px_24px_rgba(15,31,61,0.3)] hover:brightness-110 transition-all hover:-translate-y-0.5"
            >
              {t('countries.cta_btn', 'Unlock All 54 Country Hubs, Join as a Founding Member')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
