import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Calendar, BookOpen, ArrowRight, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { CountryFlag } from '../../components/CountryFlag';
import { api } from '../../services/api';
import { stripMarkdown } from '@/lib/utils';
import { useMember } from '../../context/MemberContext';
import { useAudio } from '../../context/AudioContext';
import type { ArticleListItem } from '../../types';
import { FALLBACK_ARTICLES } from '../../constants/beta';

const FeedSkeleton = () => (
    <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-background rounded-xl border border-primary/8 p-6 animate-pulse">
                <div className="flex gap-4">
                    <div className="w-1 bg-background/10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="h-3 bg-background/8 rounded w-1/4" />
                        <div className="h-5 bg-background/10 rounded w-3/4" />
                        <div className="h-4 bg-background/5 rounded w-full" />
                        <div className="h-4 bg-background/5 rounded w-5/6" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const ArticleRow: React.FC<{ article: ArticleListItem; index: number; isHighlighted?: boolean }> = ({ article, index, isHighlighted }) => {
    const { playTrack } = useAudio();
    
    return (
    <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.06 }}
    >
        <Link
            to={`/posts/${article.slug}`}
            className={`group flex gap-5 rounded-2xl border p-6 transition-all hover:shadow-md ${
                isHighlighted
                    ? 'bg-background text-foreground border-primary/20 hover:bg-background/90'
                    : 'bg-background border-primary/8 hover:border-accent/30'
            }`}
        >
            {/* Index marker */}
            <div aria-hidden="true" className={`flex flex-col items-center pt-1 shrink-0 ${isHighlighted ? 'text-accent-ink' : 'text-primary/70'}`}>
                <span className="text-xs font-mono font-bold">{String(index + 1).padStart(2, '0')}</span>
                <div className={`mt-2 w-px flex-1 ${isHighlighted ? 'bg-accent/30' : 'bg-background/10'}`} />
            </div>

            <div className="flex-1 min-w-0">
                {(article.country_name || article.sector_name) && (
                    <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-2 ${isHighlighted ? 'text-accent-ink' : 'text-primary/70'}`}>
                        {article.country_name && (
                            <span className="flex items-center gap-1.5">
                                <CountryFlag code={article.country_code} title={article.country_name} size={16} /> {article.country_name}
                            </span>
                        )}
                        {article.country_name && article.sector_name && <span>·</span>}
                        {article.sector_name && <span>{article.sector_name}</span>}
                    </div>
                )}
                <h3 className={`font-serif text-xl font-bold mb-2 leading-snug ${isHighlighted ? 'text-foreground' : 'text-primary group-hover:text-accent'} transition-colors`}>
                    {stripMarkdown(article.title)}
                </h3>
                {article.summary && (
                    <p className={`text-sm leading-relaxed line-clamp-2 ${isHighlighted ? 'text-foreground/70' : 'text-primary/70'}`}>
                        {stripMarkdown(article.summary)}
                    </p>
                )}
                {article.published_at && (
                    <div className={`flex items-center gap-1 mt-3 text-xs ${isHighlighted ? 'text-accent-ink' : 'text-primary/70'}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                )}
            </div>

            <div className={`self-center shrink-0 flex flex-col items-end gap-3 ${isHighlighted ? 'text-accent' : 'text-primary/20 group-hover:text-accent'} transition-colors`}>
                <ArrowRight className="w-5 h-5" />
                {article.audio_url && (
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            playTrack({
                                title: article.title,
                                subtitle: article.sector_name || '',
                                audioUrl: article.audio_url!,
                                imageUrl: article.hero_image_url,
                                durationSeconds: article.audio_duration_seconds,
                                slug: article.slug
                            });
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${isHighlighted ? 'bg-accent text-primary hover:bg-background' : 'bg-accent/10 text-accent hover:bg-accent hover:text-foreground'} transition-colors shadow-sm`}
                        title="Listen to this story"
                    >
                        <Headphones size={14} />
                    </button>
                )}
            </div>
        </Link>
    </motion.div>
    );
};

export const BetaFeed: React.FC = () => {
    const { isMember } = useMember();

    const { data: featuredData, isLoading: isLoadingFeatured } = useQuery({
        queryKey: ['feed-featured'],
        queryFn: api.getFeaturedArticles,
        staleTime: 5 * 60 * 1000,
    });

    const { data: curatedData, isLoading: isLoadingCurated } = useQuery({
        queryKey: ['feed-curated'],
        queryFn: api.getCuratedFeed,
        enabled: isMember,
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    const { data: latestData, isLoading: isLoadingLatest } = useQuery({
        queryKey: ['feed-latest'],
        queryFn: api.getLatestArticles,
        staleTime: 5 * 60 * 1000,
    });

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    const featured: ArticleListItem[] = featuredData?.data?.slice(0, 1) || FALLBACK_ARTICLES.slice(0, 1);
    const featuredSlug = featured[0]?.slug;
    
    const latestArticles = latestData?.data || FALLBACK_ARTICLES.slice(1);
    const rest: ArticleListItem[] = latestArticles.filter(a => a.slug !== featuredSlug);
    
    const curated: ArticleListItem[] = curatedData?.data || [];
    const editorialSummary: string = (curatedData as any)?.ai_feed_summary || '';

    return (
        <div className="min-h-screen bg-background pb-24">
            <SEO
                title="Daily Briefing | BOA-Story"
                description="Your curated daily Africa intelligence briefing, the continent's most important stories, every morning."
            />

            {/* Masthead — newspaper treatment: centered nameplate between a
                thick-thin double rule, with a dateline row inside the rules. */}
            <div className="app-hero bg-background px-4 pb-10 pt-14 text-foreground sm:px-6 md:pb-14 md:pt-20">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="font-serif text-[2.5rem] sm:text-5xl md:text-6xl font-black leading-[1.05] tracking-tight mb-5">
                        The Africa Intelligence Brief
                    </h1>
                    <div className="border-t-[3px] border-b border-foreground/80 py-2 mb-1">
                        <div className="flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/70">
                            <span className="flex items-center gap-1.5 text-accent-ink"><Zap className="w-3 h-3" /> Daily Briefing</span>
                            <span className="text-foreground/25">·</span>
                            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {today}</span>
                            <span className="hidden sm:inline text-foreground/25">·</span>
                            <span className="hidden sm:inline">54 Nations</span>
                        </div>
                    </div>
                    <div className="border-b border-foreground/20 mb-6" />
                    <p className="text-foreground/70 text-lg max-w-xl mx-auto">
                        The continent's most important business stories, curated each morning for decision-makers.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* Editorial Curated section (members only) */}
                {isMember && (
                    <section className="mt-10 mb-12">
                        <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest text-accent-ink">
                            <Sparkles className="w-4 h-4" />
                            Curated for You
                        </div>

                        {editorialSummary && (
                            <div className="p-5 bg-accent/5 border border-accent/20 rounded-2xl mb-6 text-sm text-primary/70 italic leading-relaxed">
                                {stripMarkdown(editorialSummary)}
                            </div>
                        )}

                        {isLoadingCurated ? (
                            <FeedSkeleton />
                        ) : curated.length > 0 ? (
                            <div className="space-y-4">
                                {curated.map((a, i) => (
                                    <ArticleRow key={a.slug || i} article={a} index={i} isHighlighted={i === 0} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 px-6 bg-background rounded-xl border border-primary/8 text-center text-primary/50 text-sm">
                                <Sparkles className="w-8 h-8 text-accent/40 mx-auto mb-3" />
                                <Link to="/settings" className="text-accent-ink font-semibold hover:underline">
                                    Set your country and sector preferences
                                </Link>
                                {' '}to unlock a personalised briefing.
                            </div>
                        )}

                        <div className="my-12 flex items-center gap-4">
                            <div className="flex-1 h-px bg-background/10" />
                            <span className="text-xs font-bold uppercase tracking-widest text-primary/30 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Latest Dispatches
                            </span>
                            <div className="flex-1 h-px bg-background/10" />
                        </div>
                    </section>
                )}

                {/* Featured top story */}
                {!isLoadingFeatured && featured.length > 0 && !isMember && (
                    <section className="mt-10 mb-6">
                        <div className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-4 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-accent" /> Top Story
                        </div>
                        <ArticleRow article={featured[0]} index={0} isHighlighted />
                    </section>
                )}

                {/* Main feed */}
                <section className={isMember ? '' : 'mt-0'}>
                    {!isMember && (
                        <div className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-4 mt-10 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> Latest Dispatches
                        </div>
                    )}

                    {isLoadingLatest ? (
                        <FeedSkeleton />
                    ) : (
                        <div className="space-y-4">
                            {(isMember ? latestArticles : rest).map((a: ArticleListItem, i: number) => (
                                <ArticleRow key={a.slug || i} article={a} index={i} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Upgrade CTA for non-members */}
                {!isMember && (
                    <div className="mt-14 p-8 bg-background text-foreground rounded-2xl text-center">
                        <Sparkles className="w-10 h-10 text-accent mx-auto mb-4" />
                        <h3 className="font-serif text-2xl font-bold mb-3 text-foreground">Proprietary Briefing</h3>
                        <p className="text-foreground/70 mb-8 max-w-xl mx-auto leading-relaxed">
                            Founding Members receive an editor-curated briefing tailored to their exact markets and sectors, every single day.
                        </p>
                        <Link to="/membership" className="inline-block bg-accent text-primary font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all">
                            Become a Founding Member
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};
