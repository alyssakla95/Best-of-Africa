import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, Target, FileText, ArrowLeft, Activity, Globe, MessageSquare } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { stripMarkdown } from '@/lib/utils';
import { KO_FI_URL } from '../../constants/beta';

export const BetaNarrativeToolkit: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { isMember } = useMember();

  const { data: indexData, isLoading: isLoadingIndex } = useQuery({
    queryKey: ['narrative-index', code],
    queryFn: () => api.getNarrativeIndex(code!),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });

  const { data: countryData, isLoading: isLoadingCountry } = useQuery({
    queryKey: ['country-narratives', code],
    queryFn: () => api.getCountryNarratives(code!),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });

  if (!code) return <Navigate to="/countries" replace />;

  if (!isMember) {
    return (
      <>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-background">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-4xl text-primary mb-4">Narrative Diplomacy Toolkit</h1>
          <p className="text-primary/60 max-w-md mb-8">
            Access editorial alignment scores, active narrative strategies, and human-driven gap analyses.
            This toolkit is strictly limited to authenticated state and institutional partners.
          </p>
          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-navy font-bold px-8 py-4 rounded-xl shadow-lg hover:brightness-110 transition-all"
          >
            Inquire About Access
          </a>
        </div>
      </>
    );
  }

  const isLoading = isLoadingIndex || isLoadingCountry;
  const cData = countryData?.country;

  return (
    <>
      <SEO 
        title={`Narrative Toolkit: ${cData?.name || code} | BOA-Story`}
        description="Algorithmic diplomacy and narrative alignment tracking."
      />
      
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="app-hero relative overflow-hidden border-b border-accent/20 bg-background px-6 pb-20 pt-16 text-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <Link to={`/countries/${code}`} className="inline-flex items-center gap-2 text-foreground/50 hover:text-accent text-sm font-bold uppercase tracking-widest mb-8 transition-colors">
              <ArrowLeft size={16} /> Back to Hub
            </Link>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 text-accent text-xs font-bold uppercase tracking-widest mb-4">
                  <Shield size={16} />
                  State Partner Portal
                </div>
                
                <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4 flex items-center gap-4">
                  {cData ? `${cData.name} Narrative Index` : 'Loading Toolkit...'}
                </h1>
                <p className="text-foreground/70 text-lg max-w-2xl leading-relaxed">
                  Real-time algorithmic measurement of how {cData?.name || 'this nation'} is positioned across global coverage, measuring diplomatic alignment and image strength.
                </p>
              </div>

              {indexData && (
                <div className="bg-foreground/10 p-6 rounded-2xl backdrop-blur-sm border border-foreground/10 text-center shrink-0 min-w-[200px]">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-accent mb-2">Overall Alignment Score</div>
                  <div className="text-6xl font-serif font-bold text-foreground mb-1">{indexData.narrative_index}</div>
                  <div className="text-xs font-medium text-foreground/60">/ 100 possible</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-10">
          
          {isLoading ? (
            <div className="animate-pulse space-y-8">
              <div className="h-32 bg-background/5 rounded-2xl" />
              <div className="h-64 bg-background/5 rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-background rounded-2xl p-6 border border-primary/10 shadow-sm">
                  <div className="flex items-center gap-2 text-primary/40 text-xs font-bold uppercase tracking-widest mb-4">
                    <Globe size={16} className="text-accent" /> Diplomacy Score
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-serif text-primary">{indexData?.diplomacy_score}</div>
                    <div className="text-sm font-bold text-primary/40 mb-1">/ 100</div>
                  </div>
                  <div className="mt-4 w-full bg-background/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: `${indexData?.diplomacy_score || 0}%` }} />
                  </div>
                </div>

                <div className="bg-background rounded-2xl p-6 border border-primary/10 shadow-sm">
                  <div className="flex items-center gap-2 text-primary/40 text-xs font-bold uppercase tracking-widest mb-4">
                    <Activity size={16} className="text-accent" /> Image Strength
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-serif text-primary">{indexData?.image_strength}</div>
                    <div className="text-sm font-bold text-primary/40 mb-1">/ 100</div>
                  </div>
                  <div className="mt-4 w-full bg-background/5 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-background h-full rounded-full" style={{ width: `${indexData?.image_strength || 0}%` }} />
                  </div>
                </div>

                <div className="bg-background rounded-2xl p-6 border border-primary/10 shadow-sm flex flex-col justify-center text-center">
                  <div className="text-sm font-bold text-primary mb-2">Algorithmic Assessment</div>
                  <p className="text-primary/70 italic text-sm">"{indexData?.assessment}"</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Narrative Arc */}
                  <div className="bg-background rounded-2xl border border-primary/10 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full pointer-events-none" />
                    <h3 className="font-serif text-2xl text-primary mb-6 flex items-center gap-2">
                      <MessageSquare className="text-accent" /> The Story So Far
                    </h3>
                    <div className="prose prose-sm md:prose-base prose-p:text-primary/70 max-w-none">
                      <p>{stripMarkdown(countryData?.country.narrative_arc)}</p>
                    </div>
                  </div>

                  {/* Active Strategies */}
                  <div className="bg-background rounded-2xl border border-primary/10 p-6 shadow-sm">
                    <h3 className="font-serif text-2xl text-primary mb-6 flex items-center gap-2">
                      <Target className="text-accent" /> Active Narrative Strategies
                    </h3>
                    
                    {countryData?.active_strategies && countryData.active_strategies.length > 0 ? (
                      <div className="space-y-4">
                        {countryData.active_strategies.map(strategy => (
                          <div key={strategy.id} className="border border-primary/8 rounded-xl p-5 hover:border-accent/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-serif text-lg font-bold text-primary">{strategy.narrative_theme}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-accent/10 text-accent px-2 py-1 rounded">
                                {strategy.status}
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs font-medium text-primary/50 mb-4">
                              <span>Priority: {strategy.priority}</span>
                              <span>Target: {strategy.target_audience}</span>
                              <span>Tone: {strategy.tone}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="text-xs font-bold uppercase tracking-widest text-primary/40">Key Messages</div>
                              <ul className="list-disc pl-5 space-y-1 text-sm text-primary/70">
                                {strategy.key_messages.map((msg, i) => (
                                  <li key={i}>{msg}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-primary/40 bg-background/5 rounded-xl">
                        No active narrative strategies defined for this region.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-8">
                  {/* Aligned Articles */}
                  <div className="bg-background rounded-2xl border border-primary/10 p-6 shadow-sm">
                    <h3 className="font-serif text-xl text-primary mb-6 flex items-center gap-2">
                      <FileText className="text-accent" /> Highly Aligned Coverage
                    </h3>
                    <div className="space-y-4">
                      {countryData?.aligned_articles && countryData.aligned_articles.length > 0 ? (
                        countryData.aligned_articles.map((article: any) => (
                          <Link key={article.id} to={`/posts/${article.slug}`} className="block group">
                            <div className="text-xs font-bold text-accent mb-1 truncate">{article.narrative_theme || 'Organic Alignment'}</div>
                            <h4 className="font-serif text-primary group-hover:text-accent transition-colors leading-snug line-clamp-2">
                              {stripMarkdown(article.title)}
                            </h4>
                          </Link>
                        ))
                      ) : (
                        <p className="text-sm text-primary/50">No heavily aligned articles found yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          
        </div>
      </div>
    </>
  );
};
