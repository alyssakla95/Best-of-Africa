import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { MagnifyingGlassIcon, UpdateIcon, ArrowRightIcon, GridIcon, GlobeIcon, FileTextIcon } from '@radix-ui/react-icons';

import { cn } from "@/lib/utils";

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ text: string, type: string, code?: string, id?: string }[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Toggle on Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        }
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Fetch Suggestions
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const res = await api.autocomplete(query);
                setResults(res.suggestions || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = useCallback((item: { text: string; type: string; code?: string; id?: string }) => {
        setOpen(false);
        setQuery('');

        if (item.type === 'country' && item.code) {
            navigate(`/countries/${item.code}`);
        } else if (item.type === 'sector' && item.id) {
            navigate(`/sectors/${item.id}/trends`);
        } else if (item.type === 'article') {
            // Suggest doesn't return slug currently, forcing a search
            navigate(`/search?q=${encodeURIComponent(item.text)}`);
        } else {
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
    }, [navigate, query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results.length > 0) {
                handleSelect(results[selectedIndex]);
            } else if (query) {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(query)}`);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="p-0 overflow-hidden max-w-2xl border-none shadow-2xl bg-background/95 backdrop-blur-xl text-foreground">
                <div className="flex items-center border-b border-border px-4 py-2">
                    <MagnifyingGlassIcon className="mr-2 h-5 w-5 shrink-0 opacity-50" />
                    <Input
                        className="flex h-12 w-full rouned-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus-visible:ring-0 shadow-none text-foreground"
                        placeholder="Search stories, countries, topics..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {loading && <UpdateIcon className="h-4 w-4 animate-spin opacity-50" />}
                    {!loading && <div className="hidden sm:flex items-center gap-1 opacity-50 text-xs ml-2 border border-border px-1.5 py-0.5 rounded bg-muted">
                        <span className="text-[10px] font-bold">ESC</span>
                    </div>}
                </div>

                {/* Results List */}
                <div className="max-h-[500px] overflow-y-auto p-2">
                    {results.length === 0 && query.length === 0 && (
                        <div className="py-8 px-4">
                            <div className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-background opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-background"></span>
                                </span>
                                Latest Updates
                            </div>
                            <div
                                onClick={() => { setOpen(false); navigate('/admin'); }}
                                className="relative flex cursor-default select-none items-center rounded-md px-4 py-3 text-sm outline-none transition-colors text-foreground hover:bg-muted/50"
                            >
                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
                                    <div className="h-4 w-4 bg-background/20 rounded-full" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold">Open Analyst Console</div>
                                    <div className="text-xs opacity-50">Story Updates</div>
                                </div>
                                <ArrowRightIcon className="ml-auto h-4 w-4 opacity-50" />
                            </div>
                            <div className="grid gap-2 mt-4">
                                {[
                                    { label: "New stories published", type: "UPDATE", time: "Just now" },
                                    { label: "Regional briefing updated", type: "EVENT", time: "Recently" },
                                    { label: "Strategic briefing ready", type: "RISK", time: "Today" },
                                ].map((signal, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-muted/40 cursor-default transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border",
                                                    signal.type === 'OPPORTUNITY' ? 'bg-accent/10 text-accent border-accent/20' :
                                                        signal.type === 'RISK' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                        'bg-background/10 text-primary border-primary/20')}>
                                                {signal.type}
                                            </div>
                                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{signal.label}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-mono">{signal.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.length === 0 && query.length > 0 && !loading && (
                        <div className="py-14 text-center text-sm text-muted-foreground">
                            No results found. Press Enter to search.
                        </div>
                    )}

                    {results.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => handleSelect(item)}
                            className={cn(
                                "relative flex cursor-default select-none items-center rounded-md px-4 py-3 text-sm outline-none transition-colors",
                                index === selectedIndex ? "bg-background/10 text-primary" : "text-foreground hover:bg-muted/50"
                            )}
                        >
                            <div className={cn("mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background", index === selectedIndex && "border-accent/50 bg-accent/10 text-accent")}>
                                {item.type === 'country' && <GlobeIcon className="h-4 w-4" />}
                                {item.type === 'sector' && <GridIcon className="h-4 w-4" />}
                                {item.type === 'article' && <FileTextIcon className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold">{item.text}</div>
                                {item.type === 'country' && <div className="text-xs opacity-50">Country Stories</div>}
                                {item.type === 'sector' && <div className="text-xs opacity-50">Market Sector</div>}
                            </div>
                            {index === selectedIndex && (
                                <ArrowRightIcon className="ml-auto h-4 w-4 opacity-50" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-border bg-muted/50 px-4 py-2 text-[10px] text-muted-foreground flex justify-between font-medium">
                    <span>Pro Mode Active</span>
                    <div className="flex gap-2">
                        <span>Select <kbd className="font-sans">↓↑</kbd></span>
                        <span>Open <kbd className="font-sans">↵</kbd></span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
