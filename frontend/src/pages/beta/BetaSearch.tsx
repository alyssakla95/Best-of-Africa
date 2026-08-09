import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, SparklesIcon, GlobeIcon, FileTextIcon, LayersIcon, ArrowRightIcon, XIcon } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { EditorialContent } from '../../components/EditorialContent';
import { stripMarkdown } from '@/lib/utils';
import type { Country, SearchResult } from '@/types';

const FILTER_TABS = [
    { id: 'all', label: 'All Results', icon: LayersIcon },
    { id: 'articles', label: 'Articles', icon: FileTextIcon },
    { id: 'countries', label: 'Countries', icon: GlobeIcon },
];

interface SearchSuggestion {
    type: 'article';
    label: string;
    slug: string;
}

interface SearchDisplayResult {
    type: 'article' | 'country';
    to: string;
    title: string;
    summary: string;
    countryName?: string;
    sectorName?: string;
    relevanceNote?: string;
}

const articleDisplayResult = (result: SearchResult): SearchDisplayResult => ({
    type: 'article',
    to: `/posts/${result.article.slug}`,
    title: result.article.title,
    summary: result.article.summary,
    countryName: result.article.country_name,
    sectorName: result.article.sector_name,
});

const countryDisplayResult = (country: Country): SearchDisplayResult => ({
    type: 'country',
    to: `/countries/${country.code}`,
    title: country.name,
    summary: country.description,
    countryName: country.region,
    sectorName: country.capital ? `Capital: ${country.capital}` : undefined,
});

export const BetaSearch: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
    const [debouncedQ, setDebouncedQ] = useState(searchParams.get('q') || '');
    const [activeFilter, setActiveFilter] = useState('all');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Debounce search input → URL param update
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedQ(inputValue.trim());
            if (inputValue.trim()) {
                setSearchParams({ q: inputValue.trim() }, { replace: true });
            } else {
                setSearchParams({}, { replace: true });
            }
        }, 350);
        return () => clearTimeout(t);
    }, [inputValue, setSearchParams]);

    // Live autocomplete suggestions
    useEffect(() => {
        if (inputValue.length < 2) return;
        const t = setTimeout(async () => {
            try {
                const res = await api.search(inputValue);
                const items: SearchSuggestion[] = (res.results || []).slice(0, 3).map(result => ({
                    type: 'article',
                    label: stripMarkdown(result.article.title),
                    slug: result.article.slug,
                }));
                setSuggestions(items);
            } catch { setSuggestions([]); }
        }, 200);
        return () => clearTimeout(t);
    }, [inputValue]);

    // Main search query
    const { data, isLoading, isError } = useQuery({
        queryKey: ['search', debouncedQ],
        queryFn: async () => {
            const [searchResponse, countriesResponse] = await Promise.all([
                api.search(debouncedQ),
                api.getCountries(),
            ]);
            const normalized = debouncedQ.toLocaleLowerCase();
            const countries = countriesResponse.data
                .filter(country => `${country.name} ${country.region} ${country.capital} ${country.description}`.toLocaleLowerCase().includes(normalized))
                .slice(0, 12)
                .map(countryDisplayResult);
            return {
                editorialAnswer: searchResponse.editorial_answer || null,
                results: [...countries, ...searchResponse.results.map(articleDisplayResult)],
            };
        },
        enabled: debouncedQ.length >= 2,
        staleTime: 2 * 60 * 1000,
    });

    const results = data?.results || [];
    const analystAnswer = data?.editorialAnswer || null;

    const filtered = activeFilter === 'countries'
        ? results.filter(result => result.type === 'country')
        : activeFilter === 'articles'
        ? results.filter(result => result.type === 'article')
        : results;

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 selection:bg-accent/20">
            <SEO
                title="Search | BOA-Story"
                description="Search thousands of African business intelligence briefings, country profiles, and sector analysis."
            />

            {/* Search Header, navy band (spec §3.1) */}
            <div className="app-hero border-b border-border bg-card px-5 py-12 text-foreground sm:px-6 sm:py-14 md:py-20">
                <div className="max-w-4xl mx-auto relative z-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-6 flex items-center gap-2">
                            <SparklesIcon size={14} /> Intelligence Search
                        </p>
                        <h1 className="break-words font-serif text-foreground text-[clamp(2.35rem,11vw,4rem)] leading-[1.02] md:leading-[0.96] tracking-tight mb-8">
                            What are you researching?
                        </h1>
                        {/* Search Input, dark navy field with gold border */}
                        <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setShowSuggestions(false); }}>
                            <div className="flex min-w-0 items-center gap-3 overflow-hidden bg-background border border-border rounded-xl px-4 md:px-6 py-4 focus-within:border-accent transition-colors group">
                                <SearchIcon className="w-5 h-5 text-foreground/40 group-focus-within:text-accent shrink-0 transition-colors" />
                                <input
                                    ref={inputRef}
                                    id="search-input"
                                    aria-label="Search countries, sectors or companies"
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => {
                                        const nextValue = e.target.value;
                                        setInputValue(nextValue);
                                        setShowSuggestions(true);
                                        if (nextValue.length < 2) setSuggestions([]);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder="Search countries, sectors or companies"
                                    className="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-foreground/40 text-base md:text-lg outline-none"
                                    autoComplete="off"
                                />
                                {inputValue && (
                                    <button onClick={() => { setInputValue(''); setDebouncedQ(''); setSearchParams({}); setSuggestions([]); inputRef.current?.focus(); }} className="text-foreground/40 hover:text-foreground transition-colors p-2">
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Autocomplete Dropdown */}
                            <AnimatePresence>
                                {showSuggestions && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-[calc(100%+16px)] left-0 right-0 bg-card rounded-2xl border border-foreground/10 shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
                                    >
                                        {suggestions.map((s, i) => (
                                            <Link
                                                key={i}
                                                to={`/posts/${s.slug}`}
                                                className="group flex items-center gap-3 border-b border-foreground/5 px-4 py-4 transition-colors last:border-0 hover:bg-foreground/5 sm:gap-4 sm:px-8 sm:py-5"
                                                onClick={() => setShowSuggestions(false)}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                                                    <FileTextIcon className="w-4 h-4 text-accent" />
                                                </div>
                                                <span className="text-[1.125rem] font-light text-foreground group-hover:text-accent transition-colors truncate">{s.label}</span>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-5 py-14 sm:px-6 sm:py-16">

                {/* Empty State */}
                {!debouncedQ && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-14 md:py-24 text-foreground/40 overflow-hidden">
                        <div className="w-24 h-24 rounded-full bg-card border border-foreground/5 mx-auto mb-8 flex items-center justify-center">
                            <SearchIcon className="w-10 h-10 text-foreground/20" />
                        </div>
                        <p className="text-xl md:text-[1.5rem] font-serif text-foreground mb-3">Search the intelligence graph</p>
                        <p className="mb-8 text-sm leading-relaxed text-muted-foreground">Start with a country, sector, company, project or decision question.</p>
                        <div className="grid gap-3 text-left sm:grid-cols-2">
                            {[
                                'Compare Ghana and Rwanda for manufacturing investment',
                                'Solar projects in East Africa',
                                'Nigerian companies operating in Kenya',
                                'Lithium, railways and export corridors',
                            ].map(query => (
                                <button key={query} type="button" onClick={() => { setInputValue(query); setShowSuggestions(false); }} className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-navy hover:border-accent hover:bg-accent/5">
                                    {query}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Loading */}
                {isLoading && (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-foreground/5" />
                        ))}
                    </div>
                )}

                {/* Quick Answer Card */}
                {analystAnswer && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative mb-10 overflow-hidden rounded-xl border border-accent/20 bg-card p-5 text-foreground sm:p-8 md:mb-12 md:p-10">
                        <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/30">
                                <SparklesIcon className="text-accent w-6 h-6" />
                            </div>
                            <h3 className="font-serif text-[1.65rem] text-foreground sm:text-[2rem]">Research answer</h3>
                        </div>
                        <EditorialContent content={analystAnswer} className="relative z-10 text-foreground/80" />
                    </motion.div>
                )}

                {/* Filter Tabs */}
                {results.length > 0 && !isLoading && (
                    <div className="mobile-scroll-strip -mx-4 mb-8 gap-2 border-b border-foreground/10 px-4 pb-5 sm:mx-0 sm:flex-wrap sm:px-0 md:mb-10 md:gap-3">
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveFilter(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                                    activeFilter === tab.id
                                        ? 'bg-accent text-primary shadow-[0_0_20px_rgba(15,31,61,0.3)]'
                                        : 'bg-card text-foreground/50 hover:text-foreground border border-foreground/5 hover:border-foreground/20'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                        <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-foreground/30">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* Results */}
                {!isLoading && debouncedQ && (
                    <div className="space-y-6">
                        {filtered.length === 0 && !isError ? (
                            <div className="py-14 md:py-24 text-center text-foreground/40">
                                <p className="text-[1.5rem] font-serif text-foreground mb-2">No results for "{debouncedQ}"</p>
                                <p className="text-[1.125rem] font-light">Try different keywords or a broader search term</p>
                            </div>
                        ) : (
                            filtered.map((result, i) => {
                                return (
                                    <motion.div
                                        key={`${result.type}:${result.to}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            to={result.to}
                                        className="group block rounded-xl border border-foreground/10 bg-card p-5 transition-all hover:border-accent/40 hover:bg-foreground/5 sm:rounded-2xl sm:p-8"
                                        >
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1 min-w-0">
                                                    {(result.countryName || result.sectorName) && (
                                                        <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase tracking-widest text-accent">
                                                            {result.countryName && <span>{result.countryName}</span>}
                                                            {result.countryName && result.sectorName && <span className="text-foreground/30">•</span>}
                                                            {result.sectorName && <span>{result.sectorName}</span>}
                                                        </div>
                                                    )}
                                                    <h3 className="font-serif text-[1.75rem] leading-snug text-foreground mb-4 group-hover:text-accent transition-colors">
                                                        {stripMarkdown(result.title)}
                                                    </h3>
                                                    {result.summary && (
                                                        <p className="text-[1.125rem] font-light text-foreground/50 line-clamp-2 leading-[1.8]">
                                                            {stripMarkdown(result.summary)}
                                                        </p>
                                                    )}
                                                    {result.relevanceNote && (
                                                        <div className="mt-6 flex items-center gap-3 bg-background/50 p-4 rounded-xl border border-accent/20">
                                                            <SparklesIcon className="text-accent w-4 h-4 shrink-0" />
                                                            <p className="text-[13px] text-foreground/80 font-light italic">
                                                                {stripMarkdown(result.relevanceNote)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2 hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 transition-all group-hover:border-accent group-hover:bg-accent sm:flex">
                                                    <ArrowRightIcon className="w-5 h-5 text-foreground/50 group-hover:text-primary transition-colors" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                )}

                {isError && (
                    <div className="rounded-xl border border-border bg-card px-5 py-12 text-center md:py-16">
                        <p className="font-serif text-2xl text-navy">Continue through the evidence index</p>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">This search request did not complete. Country records and the latest source-linked reporting remain available directly.</p>
                        <div className="mt-6 flex flex-col justify-center gap-3 min-[420px]:flex-row">
                            <Link to="/countries" className="rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white">Browse countries</Link>
                            <Link to="/posts" className="rounded-md border border-border bg-white px-5 py-3 text-sm font-semibold text-navy">Latest reporting</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
