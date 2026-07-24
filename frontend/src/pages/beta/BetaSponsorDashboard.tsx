import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Target, Eye, MousePointerClick, DollarSign, TrendingUp, BarChart3, PauseCircle, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { SEO } from '../../components/SEO';
import { api } from '../../services/api';
import { useMember } from '../../context/MemberContext';
import { KO_FI_URL } from '../../constants/beta';

export const BetaSponsorDashboard: React.FC = () => {
  const { isMember } = useMember();
  // Using a mock "active" sponsor ID logic for the UI. Usually this comes from auth context.
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);

  const { data: campaignsRes, isLoading: isLoadingList } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.getCampaigns(),
    staleTime: 5 * 60 * 1000,
  });

  const campaigns = campaignsRes?.data || [];
  const selectedCampaignId = activeCampaignId || (campaigns.length > 0 ? campaigns[0].id : null);

  const { data: analyticsRes, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['campaign-analytics', selectedCampaignId],
    queryFn: () => api.getCampaignAnalytics(selectedCampaignId!),
    enabled: !!selectedCampaignId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: timeseriesRes, isLoading: isLoadingSeries } = useQuery({
    queryKey: ['campaign-timeseries', selectedCampaignId],
    queryFn: () => api.getCampaignTimeseries(selectedCampaignId!, 14),
    enabled: !!selectedCampaignId,
    staleTime: 5 * 60 * 1000,
  });

  const analytics = analyticsRes?.data;
  const activeCampaign = campaigns.find(c => c.id === selectedCampaignId);
  // Real per-day delivery series (empty until impressions/clicks are recorded).
  const timeline = (timeseriesRes?.data || []).map(d => ({
    day: (d.day || '').slice(5),
    impressions: d.impressions,
    clicks: d.clicks,
  }));

  if (!isMember) {
    return (
      <>
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 bg-background">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
            <Target className="w-10 h-10 text-accent" />
          </div>
          <h1 className="font-serif text-4xl text-primary mb-4">Sponsor Dashboard</h1>
          <p className="text-primary/60 max-w-md mb-8">
            Manage your corporate sponsorship campaigns, track ROI, and view real-time engagement analytics. 
            Access is strictly limited to corporate partners.
          </p>
          <a
            href={KO_FI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-navy font-bold px-8 py-4 rounded-xl shadow-lg hover:brightness-110 transition-all"
          >
            Inquire About Sponsorships
          </a>
        </div>
      </>
    );
  }

  if (isLoadingList) {
    return (
      <>
        <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-8 bg-background/10 rounded w-1/3 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-background/5 rounded-xl border border-primary/10" />)}
          </div>
        </div>
      </>
    );
  }

  if (campaigns.length === 0) {
    return (
      <>
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 bg-background">
          <div className="w-16 h-16 bg-background/5 rounded-full flex items-center justify-center mb-6">
            <Target className="w-8 h-8 text-primary/40" />
          </div>
          <h2 className="font-serif text-3xl mb-3">No Active Campaigns</h2>
          <p className="text-primary/60 mb-8 max-w-md">You do not have any active sponsorship campaigns running right now. Contact your account manager to launch one.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Sponsor Analytics | BOA-Story Dashboard"
        description="Track your campaign ROI, impressions, and credibility impact across the platform."
      />
      
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="app-hero relative overflow-hidden border-b border-accent/20 bg-background px-6 pb-20 pt-16 text-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-accent text-xs font-bold uppercase tracking-widest mb-4">
                <Target size={16} />
                Corporate Partner Portal
              </div>
              
              <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-4">
                Campaign Analytics
              </h1>
              <p className="text-foreground/70 text-lg max-w-2xl leading-relaxed">
                Real-time performance tracking and ROI measurement for your sponsored content.
              </p>
            </div>

            {/* Campaign Switcher */}
            <div className="bg-foreground/10 p-1 rounded-xl backdrop-blur-sm border border-foreground/10 self-start md:self-end shrink-0">
              <select 
                value={selectedCampaignId!}
                onChange={(e) => setActiveCampaignId(e.target.value)}
                className="bg-transparent text-foreground border-none text-sm font-bold uppercase tracking-wider px-4 py-3 outline-none cursor-pointer hover:bg-foreground/5 transition-colors rounded-lg appearance-none w-64"
              >
                {campaigns.map(c => (
                  <option key={c.id} value={c.id} className="text-primary bg-background">{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-10">
          
          {/* Status Banner */}
          {activeCampaign && (
            <div className="bg-background rounded-xl p-4 border border-primary/10 shadow-sm flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {activeCampaign.status === 'active' ? (
                  <div className="flex items-center gap-2 text-accent bg-accent/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <Activity size={14} className="animate-pulse" /> Active
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    <PauseCircle size={14} /> {activeCampaign.status}
                  </div>
                )}
                <span className="text-primary/60 text-sm font-medium">{activeCampaign.name}</span>
              </div>
              <div className="text-sm font-medium text-primary">
                Budget: <span className="font-bold">${activeCampaign.budget_usd?.toLocaleString() || '0'}</span>
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-background rounded-2xl p-6 border border-primary/10 shadow-sm flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 text-primary/40 text-xs font-bold uppercase tracking-widest mb-4">
                <Eye size={16} className="text-accent" /> Impressions
              </div>
              <div className="text-4xl font-serif text-primary">
                {isLoadingAnalytics ? '...' : analytics?.impressions.toLocaleString()}
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-background rounded-2xl p-6 border border-primary/10 shadow-sm flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 text-primary/40 text-xs font-bold uppercase tracking-widest mb-4">
                <MousePointerClick size={16} className="text-accent" /> Clicks
              </div>
              <div className="text-4xl font-serif text-primary">
                {isLoadingAnalytics ? '...' : analytics?.clicks.toLocaleString()}
              </div>
              <div className="mt-2 text-sm font-bold text-accent">
                {analytics?.ctr}% CTR
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-background rounded-2xl p-6 border border-primary/10 shadow-sm flex flex-col justify-between h-full">
              <div className="flex items-center gap-2 text-primary/40 text-xs font-bold uppercase tracking-widest mb-4">
                <DollarSign size={16} className="text-accent" /> Budget Spent
              </div>
              <div className="text-4xl font-serif text-primary">
                {isLoadingAnalytics ? '...' : `$${analytics?.budget_spent.toLocaleString()}`}
              </div>
              <div className="mt-2 w-full bg-background/5 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-accent h-full rounded-full" 
                  style={{ width: `${Math.min(((analytics?.budget_spent || 0) / (activeCampaign?.budget_usd || 1)) * 100, 100)}%` }}
                />
              </div>
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-background rounded-2xl p-6 border border-primary/10 shadow-sm flex flex-col justify-between h-full bg-accent/5">
              <div className="flex items-center gap-2 text-primary/40 text-xs font-bold uppercase tracking-widest mb-4">
                <TrendingUp size={16} className="text-accent" /> Estimated ROI
              </div>
              <div className="text-4xl font-serif text-accent font-bold">
                {isLoadingAnalytics ? '...' : `+${analytics?.roi_percentage}%`}
              </div>
              <div className="mt-2 text-[10px] uppercase font-bold text-primary/40">
                Based on avg. conversion value
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart: Growth Trajectory */}
            <div className="lg:col-span-2 bg-background rounded-2xl border border-primary/10 p-6 md:p-8 shadow-sm">
              <h3 className="font-serif text-2xl text-primary mb-6 flex items-center gap-2">
                <BarChart3 className="text-accent" /> Delivery Trajectory
              </h3>
              <div className="h-[300px] w-full">
                {(isLoadingAnalytics || isLoadingSeries) ? (
                  <div className="w-full h-full bg-background/5 animate-pulse rounded-xl" />
                ) : timeline.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center text-primary/40 gap-2">
                    <Activity className="w-8 h-8 text-primary/20" />
                    <p className="text-sm font-medium">No delivery recorded yet</p>
                    <p className="text-xs max-w-xs">Daily impressions and clicks will appear here as this campaign runs.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {/* Same chart language as the dashboard/sector charts:
                        navy 2px line (passes mark contrast), champagne gradient
                        as decoration, recessive solid grid, ink axes, navy-card
                        tooltip. Timeseries arrives day-ascending from the API. */}
                    <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F1F3D" stopOpacity={0.28}/>
                          <stop offset="95%" stopColor="#0F1F3D" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(15,31,61,0.06)" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(15,31,61,0.45)' }} dy={10} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: 'rgba(15,31,61,0.45)' }}
                        dx={-10}
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid rgba(15,31,61,0.35)', backgroundColor: '#0F1F3D', color: '#fff', boxShadow: '0 12px 32px rgba(15,31,61,0.35)', fontSize: 13 }}
                        formatter={(value: any) => [value, 'Impressions']}
                      />
                      <Area type="monotone" dataKey="impressions" stroke="#0F1F3D" strokeWidth={2} fillOpacity={1} fill="url(#colorImpressions)" activeDot={{ r: 5, fill: '#0F1F3D', stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quality Scores */}
            <div className="bg-background rounded-2xl border border-primary/10 p-6 shadow-sm">
              <h3 className="font-serif text-xl text-primary mb-6">Campaign Health</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-primary">Reach Score</span>
                    <span className="text-accent font-bold">{analytics?.reach_score || 0}/100</span>
                  </div>
                  <div className="w-full bg-background/5 rounded-full h-2">
                    <div className="bg-background h-2 rounded-full" style={{ width: `${analytics?.reach_score || 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-primary">ROI Score</span>
                    <span className="text-accent font-bold">{analytics?.roi_score || 0}/100</span>
                  </div>
                  <div className="w-full bg-background/5 rounded-full h-2">
                    <div className="bg-background h-2 rounded-full" style={{ width: `${analytics?.roi_score || 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-primary">Credibility Impact</span>
                    <span className="text-accent font-bold">+{analytics?.credibility_impact || 0}</span>
                  </div>
                  <p className="text-xs text-primary/50 mt-1">
                    Editorial-measured increase in brand credibility based on content alignment.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
};
