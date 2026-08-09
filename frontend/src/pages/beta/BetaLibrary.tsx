import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ArticleCard } from '../../components/ArticleCard';
import { BookmarkIcon, MagnifyingGlassIcon, PlusIcon, Cross2Icon, DownloadIcon } from '@radix-ui/react-icons';
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../context/LanguageContext';
import { SEO } from '../../components/SEO';

export const BetaLibrary: React.FC = () => {
    const { language, t } = useLanguage();
    const queryClient = useQueryClient();
    const [query, setQuery] = useState('');
    const [watchInput, setWatchInput] = useState('');
    const [watchlist, setWatchlist] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('boa_decision_watchlist') || '[]'); } catch { return []; }
    });

    const { data, isLoading } = useQuery({
        queryKey: ['bookmarks'],
        queryFn: () => api.getBookmarks()
    });

    const removeBookmarkMutation = useMutation({
        mutationFn: (bookmarkId: string) => api.removeBookmark(bookmarkId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
            toast.success("Bookmark removed");
        }
    });

    const bookmarks = useMemo(() => data?.data || [], [data?.data]);
    const visibleBookmarks = useMemo(() => bookmarks.filter(bookmark =>
        !query || `${bookmark.title || ''} ${bookmark.summary || ''} ${bookmark.country_name || ''} ${bookmark.sector_name || ''}`.toLowerCase().includes(query.toLowerCase())
    ), [bookmarks, query]);

    const saveWatchlist = (next: string[]) => {
        setWatchlist(next);
        localStorage.setItem('boa_decision_watchlist', JSON.stringify(next));
    };
    const addWatch = (event: React.FormEvent) => {
        event.preventDefault();
        const value = watchInput.trim();
        if (!value || watchlist.some(item => item.toLowerCase() === value.toLowerCase())) return;
        saveWatchlist([...watchlist, value]);
        setWatchInput('');
    };
    const exportWorkspace = () => {
        const payload = JSON.stringify({ exported_at: new Date().toISOString(), watchlist, saved_research: bookmarks }, null, 2);
        const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = `boa-decision-workspace-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <SEO
                title="Decision Workspace"
                description="Organise evidence, monitor priority markets and carry research into the next decision."
            />
            <div className="app-hero border-b border-border/50 bg-gradient-to-b from-primary/10 to-transparent pb-8 pt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <BookmarkIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl md:text-5xl font-serif font-black tracking-tight text-foreground">
                            Decision Workspace
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mb-8">
                        Organise evidence, monitor priority markets and carry research into the next decision.
                    </p>

                    <div className="relative max-w-xl">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label={language === 'pt' ? 'Pesquisar itens guardados' : 'Search saved items'}
                            type="search"
                            placeholder="Search saved items..."
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            className="h-12 w-full rounded-full border-border bg-white text-ink placeholder:text-ink-mute pl-10 pr-4 text-sm shadow-sm focus-visible:ring-accent"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
                <section className="mb-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-[1.25fr_0.75fr]">
                    <div className="bg-card p-6 md:p-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">Monitor</p>
                                <h2 className="mt-2 font-serif text-2xl text-navy">Priority watchlist</h2>
                                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Track countries, sectors, companies, projects, regulations or corridors important to your mandate.</p>
                            </div>
                            <button onClick={exportWorkspace} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border px-4 py-2 text-xs font-semibold text-navy hover:border-accent">
                                <DownloadIcon /> Export workspace
                            </button>
                        </div>
                        <form onSubmit={addWatch} className="mt-6 flex gap-2">
                            <Input aria-label={language === 'pt' ? 'Assunto a acompanhar' : 'Subject to monitor'} value={watchInput} onChange={event => setWatchInput(event.target.value)} placeholder="e.g. Kenya tax reform, African data centres" className="bg-white" />
                            <button className="inline-flex items-center gap-2 rounded-md bg-navy px-4 text-xs font-semibold text-white hover:bg-navy/90"><PlusIcon /> Add</button>
                        </form>
                        <div className="mt-4 flex min-h-10 flex-wrap gap-2">
                            {watchlist.map(item => <span key={item} className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-3 py-2 text-xs font-medium text-navy">{item}<button onClick={() => saveWatchlist(watchlist.filter(value => value !== item))} aria-label={`${language === 'pt' ? 'Remover' : t('library.remove', 'Remove')} ${item}`}><Cross2Icon /></button></span>)}
                            {!watchlist.length && <span className="text-sm text-muted-foreground">No monitored subjects yet.</span>}
                        </div>
                    </div>
                    <div className="bg-navy p-6 text-white md:p-8">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">Decision flow</p>
                        <div className="mt-5 grid gap-3 text-sm">
                            {[
                                ['Search evidence', '/search'], ['Compare markets', '/dashboards/overview'], ['Review country records', '/countries'], ['Track scheduled events', '/events'], ['Configure briefings', '/settings'],
                            ].map(([label, to], index) => <Link key={to} to={to} className="flex items-center justify-between border-b border-white/10 pb-3 text-white/75 hover:text-white"><span><b className="mr-3 text-accent">0{index + 1}</b>{label}</span><span>→</span></Link>)}
                        </div>
                    </div>
                </section>

                <div className="mb-6 flex items-end justify-between border-b border-border pb-4">
                    <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">Evidence file</p><h2 className="mt-1 font-serif text-2xl text-navy">Saved research</h2></div>
                    <span className="text-xs text-muted-foreground">{visibleBookmarks.length} item{visibleBookmarks.length === 1 ? '' : 's'}</span>
                </div>
                {isLoading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-[400px] rounded-xl bg-white border border-border animate-pulse" />
                        ))}
                    </div>
                ) : visibleBookmarks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
                        <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center mb-6">
                            <BookmarkIcon className="w-9 h-9 text-accent" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">{bookmarks.length ? 'No saved research matches' : 'Your evidence file is empty'}</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            {bookmarks.length ? 'Try a broader search term.' : 'Save decision-relevant reporting, briefings and reports here, then export the workspace for your team.'}
                        </p>
                        <Link 
                            to="/feed" 
                            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-bold text-navy shadow transition-colors hover:bg-gold-italic"
                        >
                            Explore Africa Briefing
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {visibleBookmarks.map(bookmark => (
                            <div key={bookmark.id} className="relative group">
                                <ArticleCard article={{
                                    ...bookmark,
                                    id: bookmark.article_id,
                                    // ensure properties expected by ArticleCard are there
                                    reading_time_minutes: bookmark.reading_time_minutes || 5,
                                    engagement_score: bookmark.engagement_score || 50,
                                }} />
                                <button
                                    onClick={() => removeBookmarkMutation.mutate(bookmark.id)}
                                    className="absolute top-3 right-3 p-2 bg-navy/70 backdrop-blur text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white"
                                    title="Remove from saved"
                                >
                                    <BookmarkIcon className="w-4 h-4 fill-current" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
