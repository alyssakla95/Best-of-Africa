import type { Article, ArticleListItem, CalendarEvent, Country, CountryStats, Dashboard, PaginatedResponse, SearchResult, Sector, SectorBreakdown, TrendingCountry } from '../types';
import { readThroughCache } from '@/lib/persistentQueryCache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';

// Session helper
const getSessionId = () => {
    let id = localStorage.getItem('boa_session');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('boa_session', id);
    }
    return id;
};

// Auth token helpers
const getAuthToken = () => localStorage.getItem('boa_auth_token');
const getAdminToken = () => localStorage.getItem('boa_admin_token');
const getReaderLanguage = () => {
    const language = localStorage.getItem('boa_lang') || 'en';
    return ['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(language) ? language : 'en';
};

// Request helper
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getAuthToken();
    const method = (options.method || 'GET').toUpperCase();
    const sessionScoped = endpoint.startsWith('/bookmarks')
        || endpoint.startsWith('/personalization')
        || endpoint.startsWith('/notifications');
    const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
    };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (method !== 'GET' || sessionScoped) headers['X-Session-ID'] = getSessionId();

    // Add auth token if available — but never clobber an Authorization header
    // the caller set explicitly (triggerAuditScan / triggerAgentEvolution pass
    // the ADMIN key as Bearer; overwriting it with the member JWT 401s those
    // calls for any operator who is also a signed-in member).
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Admin surface authenticates with the admin API key, not the member JWT.
    // Without this header no admin call has ever carried credentials.
    if (endpoint.startsWith('/admin')) {
        const adminToken = getAdminToken();
        if (adminToken) headers['X-Admin-Key'] = adminToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // Notify listeners (e.g. BetaMemberAccess) so they can redirect to the
        // login screen instead of silently swallowing the authentication failure.
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent('boa:auth:unauthorized'));
        }
        throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
}

const readerRequest = <T>(endpoint: string, maxAgeMs?: number) => {
    const accessScope = getAuthToken() ? 'member' : 'public';
    return readThroughCache<T>(`${accessScope}:${endpoint}`, () => request<T>(endpoint), maxAgeMs);
};

export interface Campaign {
    id: string;
    client_id: string;
    name: string;
    description?: string;
    target_countries?: string[];
    target_sectors?: string[];
    target_audience?: string;
    budget_usd?: number;
    start_date?: string;
    end_date?: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    impressions: number;
    clicks: number;
    created_at: string;
}

export interface CampaignAnalytics {
    campaign_id: string;
    impressions: number;
    clicks: number;
    ctr: number;
    configured_budget_usd: number;
    methodology: string;
    status: string;
    start_date: string;
    end_date: string;
}

export interface NarrativeStrategy {
    id: string;
    country_code: string;
    sector_id?: string;
    narrative_theme: string;
    key_messages: string[];
    target_audience: string;
    priority: number;
    tone: string;
    status: string;
    effectiveness_score?: number;
    created_at: string;
    updated_at?: string;
}

export interface NarrativeIndex {
    country_code: string;
    narrative_index: number;
    diplomacy_score: number;
    image_strength: number;
    active_narratives: number;
    aligned_articles: number;
    assessment: string;
    updated_at: string;
}

export type SectorPerformanceDimension = {
    indicator_code: string; indicator_name: string; label: string; value: number; unit: string;
    comparison_value: number; comparison_unit: string; markets_rising_pct: number;
    countries_reported: number; coverage_pct: number; period_start: number; period_end: number;
    movement: 'rising' | 'falling' | 'stable'; interpretation: string; caveat: string;
    source_name: string; source_url: string;
};

export type SectorMarketPerformance = {
    sector_id: string; sector_name: string; indicator_code: string; indicator_name: string;
    headline_label: string; headline_value: number; headline_unit: string;
    comparison_value: number; comparison_unit: string; improving_markets_pct: number;
    positive_markets_pct: number; countries_reported: number; continent_coverage_pct: number;
    period_start: number; period_end: number; dispersion_low: number; dispersion_high: number;
    leaders: { country_code: string; country_name: string; observation_year: number; value: number }[];
    laggards: { country_code: string; country_name: string; observation_year: number; value: number }[];
    direction: 'accelerating' | 'slowing' | 'steady'; scope: string; caveat: string;
    source_name: string; source_url: string; dimensions: SectorPerformanceDimension[];
    diligence_questions: string[];
};

export interface GeneratedReportSummary {
    id: string;
    type: 'country_brief' | 'sector_analysis' | 'weekly_digest' | 'investment_outlook' | string;
    title: string;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface GeneratedReportSection {
    title: string;
    content?: string;
    data?: unknown;
}

export interface GeneratedReport {
    id: string;
    type: GeneratedReportSummary['type'];
    title: string;
    subtitle: string | null;
    sections: GeneratedReportSection[];
    metadata: Record<string, unknown>;
    generated_at: string;
    created_at: string;
}

export const api = {
    // Articles
    getArticles: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams({ ...params, lang: params.lang || getReaderLanguage() });
        const endpoint = `/articles?${searchParams}`;
        return readerRequest<PaginatedResponse<ArticleListItem>>(endpoint, 24 * 60 * 60 * 1000);
    },
    getArticle: (slug: string, lang?: string) =>
        readerRequest<{ article: Article; country: Country; sector: Sector; related: ArticleListItem[] }>(
            `/articles/${slug}${lang && ['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(lang) ? `?lang=${lang}` : ''}`,
            lang && lang !== 'en' ? 5 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000,
        ),
    getFeaturedArticles: () => readerRequest<{ data: ArticleListItem[] }>(`/articles/featured?limit=20&lang=${getReaderLanguage()}`, 24 * 60 * 60 * 1000),
    getWorldCupTeams: () => request<{
        teams: { name: string; flag: string; code: string }[];
        updated_at: string | null;
        next_fixture: {
            utcDate: string;
            stage?: string;
            home: { name: string; code?: string };
            away: { name: string; code?: string };
        } | null;
        fixtures: {
            utcDate: string;
            stage?: string;
            home: { name: string; code?: string };
            away: { name: string; code?: string };
        }[];
        results?: {
            utcDate: string;
            stage?: string;
            home: { name: string; code?: string; score?: number | null };
            away: { name: string; code?: string; score?: number | null };
        }[];
    }>('/world-cup/teams'),
    getLatestArticles: () => readerRequest<{ data: ArticleListItem[] }>(`/articles/latest?limit=20&lang=${getReaderLanguage()}`, 24 * 60 * 60 * 1000),
    getEvents: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams(params);
        return readerRequest<{ success: boolean; data: CalendarEvent[] }>(`/events?${searchParams}`);
    },

    // Countries
    getCountries: () => readerRequest<{ data: Country[]; by_region: Record<string, { countries: Country[]; ai_insight: string }> }>('/countries'),
    getPlatformStats: () => request<{ total_countries: number; total_articles: number; total_views: number; regions: number }>('/countries/stats'),
    getCountry: (code: string) => readerRequest<{ country: Country; stats: CountryStats }>(`/countries/${code}`),

    // Dashboards
    getDashboards: () => request<{ data: Dashboard[] }>('/dashboards'),
    getRegionDashboard: (region: string) => request<{
        dashboard: Dashboard;
        featured_articles: ArticleListItem[];
        trending_countries: TrendingCountry[];
        sector_breakdown: SectorBreakdown[]
    }>(`/dashboards/${region}`),
    getContinentalOverview: () => readerRequest<{
        source_name: string; source_url: string; retrieved_at: string; countries_in_scope: number; methodology: string;
        indicators: { indicator_code: string; label: string; value: number; unit: string; aggregation: 'sum' | 'country median' | 'derived balance'; countries_reported: number; period_start: number; period_end: number; interpretation: string; caveat: string; source_url: string }[];
        regions: { region: string; country_count: number; gdp: { value: number; countries_reported: number; period_start: number; period_end: number }; population: { value: number; countries_reported: number; period_start: number; period_end: number }; growth: { value: number; countries_reported: number; period_start: number; period_end: number }; inflation: { value: number; countries_reported: number; period_start: number; period_end: number }; fdi: { value: number; countries_reported: number; period_start: number; period_end: number }; investment: { value: number; countries_reported: number; period_start: number; period_end: number } }[];
        rankings: { largest_economies: { country_code: string; country_name: string; region: string; year: number; value: number }[]; fastest_growth: { country_code: string; country_name: string; region: string; year: number; value: number }[]; largest_fdi_inflows: { country_code: string; country_name: string; region: string; year: number; value: number }[] };
        sector_performance: SectorMarketPerformance[]; sectors_measured: number; sector_methodology: string;
        narrated_briefings: { id: string; slug: string; title: string; summary: string | null; audio_url: string; audio_duration_seconds: number | null; published_at: string; country_code: string | null; country_name: string | null; sector_name: string | null }[];
    }>('/dashboards/continental/overview?contract=economy-v1'),

    // Search
    search: (query: string) => request<{ results: SearchResult[]; suggestions: string[]; ai_answer?: string }>(`/search?q=${encodeURIComponent(query)}`),
    autocomplete: (query: string) => request<{ suggestions: { text: string; type: string }[] }>(`/search/suggest?q=${encodeURIComponent(query)}`),

    // Intelligence
    getSectors: () => readerRequest<{ data: Sector[] }>('/market-intel/sectors', 24 * 60 * 60 * 1000),
    getSector: (id: string) => readerRequest<{
        sector: Sector;
        by_country: { code: string; name: string; flag_emoji: string; count: number }[];
        by_region: { name: string; count: number; views: number }[];
        recent_articles: ArticleListItem[];
        top_performers: ArticleListItem[];
    }>(`/market-intel/sector/${id}`),
    getCountryOutlook: (code: string) => readerRequest<{
        country: Country;
        outlook: {
            investment_commentary: string;
            methodology: string;
        };
        sector_opportunities: { id: string; name: string; articles: number; avg_engagement: number }[];
        sector_coverage: { id: string; name: string; articles: number; avg_engagement: number }[];
        evidence: {
            published_articles: number;
            sectors_covered: number;
            active_narrative_strategies: number;
            status: string;
            limitations: string[];
            source_records: { record: number; title: string; published_at: string; source_title: string; source_url: string }[];
        };
    }>(`/market-intel/country/${code}/outlook`),
    getCountryRelationships: (code: string) => readerRequest<{
        country_code: string;
        country_name: string;
        relationships: { partner: string; type: string; context: string }[];
        updated_at: string;
    }>(`/countries/${code}/relationships`),
    getNarratives: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams(params);
        return request<{
            data: {
                id: string;
                country_code: string;
                sector_id: string;
                narrative_theme: string;
                key_messages: string[];
                target_audience: string;
                priority: number;
                tone: string;
            }[]
        }>(`/narratives?${searchParams}`);
    },
    getCountryNarrative: (code: string) => request<{
        country: Country;
        narratives: {
            id: string;
            country_code: string;
            sector_id: string;
            narrative_theme: string;
            key_messages: string[];
            target_audience: string;
            priority: number;
            tone: string;
        }[];
        aligned_articles: ArticleListItem[];
        sector_coverage: { id: string; name: string; article_count: number; }[];
    }>(`/narratives/country/${code}`),
    getReports: () => readerRequest<{ data: ArticleListItem[] }>('/market-intel/reports'),
    getGeneratedReports: () => readerRequest<{ data: GeneratedReportSummary[] }>('/market-intel/generated-reports'),
    getGeneratedReport: (id: string) => readerRequest<{ data: GeneratedReport }>(`/market-intel/generated-reports/${id}`),
    getReportsBySector: (sectorId: string) => readerRequest<{ data: ArticleListItem[] }>(`/market-intel/reports/sector/${sectorId}`),
    getReport: (id: string) => readerRequest<{ report: Article; related: ArticleListItem[] }>(`/market-intel/reports/${id}`),
    getAudienceInsights: () => request<{
        demographics: { age_group: string; percentage: number }[];
        regions: { name: string; percentage: number }[];
        interests: { topic: string; score: number }[];
        engagement_trends: { date: string; views: number }[];
    }>('/intel/audience'),

    // Analyst Lens (Real-time Editorial Rewriting)
    reframeArticle: (articleId: string, targetAudience: 'investor' | 'government' | 'explorer') =>
        request<{ content: string; audience: string }>('/intel/reframe', {
            method: 'POST',
            body: JSON.stringify({ articleId, targetAudience })
        }),
    reformatArticle: (articleId: string, format: 'long-form' | 'summary' | 'bullet' | 'brief') =>
        request<{ content: string; format: string }>('/intel/reformat', {
            method: 'POST',
            body: JSON.stringify({ articleId, format })
        }),

    // Unified Intelligence Briefing (3-Lens)
    getUnifiedBriefing: (articleId: string) =>
        request<{
            article_id: string;
            title: string;
            briefing: {
                investor: { summary: string; evidence_conclusion: string; supported_findings: string[]; implications: string[]; limitations: string[]; verification_questions: string[] };
                government: { summary: string; evidence_conclusion: string; supported_findings: string[]; implications: string[]; limitations: string[]; verification_questions: string[] };
                explorer: { summary: string; evidence_conclusion: string; supported_findings: string[]; implications: string[]; limitations: string[]; verification_questions: string[] };
            };
        }>('/intel/synthesize-unified', {
            method: 'POST',
            body: JSON.stringify({ articleId })
        }),

    getPremiumCountryReport: (code: string) => readerRequest<{
        country: Country;
        article_count: number;
        top_sectors: { sector: Sector; count: number }[];
        recent_articles: ArticleListItem[];
        evidence_profile: { published_articles: number; sectors_represented: number; source_records_reviewed: number; latest_reported_at: string };
        methodology: string;
        narrative_gaps: string[];
        recommendations: string[];
    }>(`/intel/country/${code}/report`),
    getSectorTrends: (id: string) => readerRequest<{
        sector: Sector;
        market_performance: SectorMarketPerformance;
        methodology: string;
        updated_at: string;
    }>(`/market-intel/sector/${id}/trends?contract=market-v3`),

    // System & Personalization
    getCuratedFeed: () => request<{ data: (ArticleListItem & { ai_curation?: { relevance_note: string } })[]; personalized: boolean; ai_feed_summary?: string }>('/personalization/feed/ai-curated'),
    getFounderLog: () => request<any[]>('/market-intel/founder-log'),
    askAnalyst: (message: string) => request<{ response: string; sources: string[] }>('/intel/ai-chat', {
        method: 'POST',
        body: JSON.stringify({ message })
    }),

    // Personalization
    getRecommendations: () => request<{ data: ArticleListItem[]; based_on?: { countries: string[]; sectors: string[] } }>('/personalization/recommended'),
    getPreferences: () => request<{
        countries_of_interest: string[];
        sectors_of_interest: string[];
        language_preference: string;
        format_preference: string;
        notification_preferences: { email: boolean; push: boolean; reports: boolean; };
    }>('/personalization/preferences'),
    savePreferences: (prefs: {
        countries_of_interest: string[];
        sectors_of_interest: string[];
        language_preference?: string;
        format_preference?: string;
        notification_preferences?: { email: boolean; push: boolean; reports: boolean; };
    }) => request('/personalization/preferences', {
        method: 'POST',
        body: JSON.stringify(prefs),
    }),

    // Fire-and-forget analytics. keepalive lets the read-time beacon survive
    // page unload / route change; failures are silently ignored — analytics
    // must never affect the reading experience.
    trackEvent: (event: {
        type: 'page_view' | 'article_read' | 'article_share' | 'search' | 'click';
        article_id?: string;
        duration_seconds?: number;
        scroll_depth?: number;
        search_query?: string;
    }) => {
        try {
            fetch(`${API_BASE_URL}/analytics/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() },
                body: JSON.stringify(event),
                keepalive: true,
            }).catch(() => {});
        } catch { /* ignore */ }
    },

    verifyEmail: (email: string) => request<{ ok: true; status: 'pending_otp' }>('/members/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email })
    }),
    verifyOtp: (email: string, code: string) => request<{
        ok: true;
        token: string;
        tier: 'free' | 'premium' | 'enterprise';
        name: string;
        expires_at: string | null;
    }>('/members/verify-otp', {
        method: 'POST',
        // The endpoint reads `otp`, not `code` — the wrong field name made every
        // login through this helper 400 with "Email and OTP required".
        body: JSON.stringify({ email, otp: code })
    }),

    // Analytics
    getSectorPerformance: (lens?: 'investor' | 'government' | 'explorer') => readerRequest<{
        data: SectorMarketPerformance[];
        sectors_measured: number;
        countries_in_scope: number;
        methodology: string;
        retrieved_at: string;
        source_name: string;
        source_url: string;
    }>(`/market-intel/performance?contract=market-v2${lens ? `&lens=${lens}` : ''}`, 12 * 60 * 60 * 1000),

    getLeadingSector: () => request<{
        name: string;
        coverage_change_pct: number;
        trend: string;
        stories_7d: number;
        stories_previous_7d: number;
        coverage_change: number;
        methodology: string;
        updated_at: string;
    }>('/market-intel/leading-sector'),

    getCoveragePulse: () => readerRequest<{
        stories_7d: number;
        countries_7d: number;
        most_reported_sector: { name: string; stories: number };
        top_sector: { name: string; stories: number };
        countries: { country_code: string; country_name: string; this_week: number; last_week: number }[];
        thinnest_region: { region: string; stories: number };
        updated_at: string;
    }>('/market-intel/coverage-pulse', 60 * 60 * 1000),

    getSentimentDivergence: () => request<{
        evidence_scope: string;
        countries: { country_code: string; country_name: string; region: string; coverage_this_week: number; coverage_last_week: number; coverage_change: number; audience_response: number; latest_reported_at: string }[];
        methodology: string;
        updated_at: string;
    }>('/market-intel/sentiment-divergence'),

    getPlatformAnalytics: (lens?: 'investor' | 'government' | 'explorer') => readerRequest<{
        market_summary: string;
        sector_trends: { id: string; name: string; trend: 'coverage_up' | 'coverage_down' | 'coverage_flat'; article_count: number; previous_article_count: number; coverage_change: number }[];
        total_articles_7d: number;
        coverage: { countries_7d: number; sectors_7d: number; source_records_7d: number; previous_articles_7d: number; coverage_change_7d: number; total_views_7d: number; audience_response: number; latest_reported_at: string };
        methodology: string;
        updated_at: string;
    }>(`/dashboards/analytics/summary${lens ? `?lens=${lens}` : ''}`, 24 * 60 * 60 * 1000),

    getStrategicOpportunities: () => readerRequest<{
        data: {
            country_code: string;
            country_name: string;
            sector_id: string;
            sector_name: string;
            title: string;
            summary: string;
            why_it_matters: string;
            evidence_points: string[];
            counter_signals: string[];
            diligence_questions: string[];
            claim_ledger: string[];
            coverage_stories: number;
            latest_reported_at: string | null;
            methodology: string;
        }[]
    }>('/market-intel/opportunities', 24 * 60 * 60 * 1000),

    getSectorVelocity: (sectorId: string) => request<{
        sector_id: string;
        coverage_stories_30d: number;
        coverage_previous_30d: number;
        coverage_change: number;
        countries_covered_30d: number;
        source_records_30d: number;
        reporting_window_days: number;
        methodology: string;
        updated_at: string;
    }>(`/market-intel/sector/${sectorId}/velocity`),

    getPlatformImpact: () => request<{
        total_subscribers: number;
        total_investments_tracked: number;
        sentiment_index: number;
        policy_shifts_tracked: number;
    }>('/dashboards/stats/platform-impact'),

    // Campaigns & Sponsorships
    getCampaigns: (status?: string) => request<{ data: Campaign[] }>(`/campaigns${status ? `?status=${status}` : ''}`),
    getCampaign: (id: string) => request<{ data: Campaign & { articles: any[]; stats: any } }>(`/campaigns/${id}`),
    createCampaign: (data: Partial<Campaign>) => request<{ success: boolean; data: { id: string } }>('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateCampaign: (id: string, data: Partial<Campaign>) => request<{ success: boolean }>(`/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),
    launchCampaign: (id: string) => request<{ success: boolean }>(`/campaigns/${id}/launch`, { method: 'POST' }),
    pauseCampaign: (id: string) => request<{ success: boolean }>(`/campaigns/${id}/pause`, { method: 'POST' }),
    getCampaignAnalytics: (id: string) => request<{ data: CampaignAnalytics }>(`/campaigns/${id}/analytics`),
    getCampaignTimeseries: (id: string, days = 14) => request<{ data: { day: string; impressions: number; clicks: number }[] }>(`/campaigns/${id}/timeseries?days=${days}`),
    trackSponsorImpression: (articleId: string) => request<{ success: boolean }>(`/campaigns/track-impression`, { method: 'POST', body: JSON.stringify({ article_id: articleId }) }),

    // Narratives
    getNarrativeStrategies: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams(params);
        return readerRequest<{ data: NarrativeStrategy[] }>(`/narratives?${searchParams}`);
    },
    getCountryNarratives: (code: string) => readerRequest<{
        country: Country & { narrative_arc: string };
        active_strategies: NarrativeStrategy[];
        aligned_articles: ArticleListItem[];
        sector_coverage: any[];
        ai_gap_analysis: string;
    }>(`/narratives/country/${code}`),
    getNarrativeIndex: (code: string) => readerRequest<NarrativeIndex>(`/narratives/country/${code}/index`),

    // 3D Visualization Data Feed ("The Brain")
    getIntelligence: () => request<{
        countries: { code: string; heat: number; sentiment: number; volume: number; last_activity: string }[];
        sectors: { sector_id: string; count: number; avg_sentiment: number }[];
        global_pulse: { articles_24h: number; rate_per_hour: number; intensity: number };
        sentiment_trend: { date: string; avg_sentiment: number; volume: number }[];
        generated_at: string;
    }>('/analytics/intelligence'),

    // Country Economics
    getCountryEconomics: (code: string) => request<{ code: string; name: string; recorded_gdp_usd: number; recorded_population: number; evidence_fields_present: number; methodology: string }>(`/countries/${code}/economics`),
    getCountryDossier: (code: string) => readerRequest<{
        country: Country;
        dossier: {
            macroeconomics: {
                official_profile?: { indicators: { code: string; name: string; value: number; year: number; unit: string; source_url: string; period_status?: 'historical_observation' | 'estimate_or_projection' }[]; last_updated: string; source_name: string; source_url: string };
                world_bank: { indicators: { code: string; name: string; value: number; year: number; unit: string; source_url: string }[]; last_updated: string; source_name: string; source_url: string };
                imf_current: Record<string, number | string> | null;
                imf_gdp_growth: { historical: { year: number; value: number }[]; projections: { year: number; value: number }[] } | null;
                imf_debt: Record<string, unknown> | null;
            };
            trade: ({ kind: 'reported_totals'; year: number; export_year?: number; import_year?: number; totalExports: number; totalImports: number; balance: number; provider: 'UN Comtrade' | 'World Bank World Development Indicators'; source_name: string; source_url: string; retrieved_at: string; topExportPartners: { partner: string; value: number }[]; topImportPartners: { partner: string; value: number }[] }
                | { kind: 'external_balance'; year: number; current_account_percent_gdp?: number; current_account_usd?: number; period_status: 'historical_observation' | 'estimate_or_projection'; provider: 'IMF World Economic Outlook'; source_name: string; source_url: string; retrieved_at: string });
            sector_evidence: { id: string; name: string; article_count: number; latest_evidence_at: string }[];
            upcoming_events: { id: string; title: string; category: string; date_start: string; location: string; source_url?: string }[];
            recent_source_record: { title: string; slug: string; summary: string; source_url: string; published_at: string; reviewed_at: string | null }[];
            official_resources: { name: string; url: string; source_type: string }[];
            freshness: { provider: string; source_url: string; checked_at: string; observation_period: string; state: 'current_snapshot' | 'last_verified_snapshot' | 'checked_no_series' }[];
        };
        provenance: { sources: { name: string; section: string; url: string | null }[]; generated_at: string; retrieved_at: string; methodology: string };
    }>(`/countries/${code}/dossier`, 7 * 24 * 60 * 60 * 1000),

    // Administrative Intelligence & Moderation
    getAdminArticles: () => request<{ data: ArticleListItem[] }>('/admin/articles'),
    rejectArticle: (id: string, reason: string) => request(`/admin/articles/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    }),
    curateArticle: (id: string, curated: boolean) => request<{ success: boolean; curated: boolean }>(`/admin/articles/${id}/curate`, {
        method: 'POST',
        body: JSON.stringify({ curated })
    }),
    updateArticleWithFeedback: (id: string, content: string, comment: string) => request(`/admin/articles/${id}/edit`, {
        method: 'POST',
        body: JSON.stringify({ content, comment })
    }),
    triggerAuditScan: () => request('/audit/scan', {
        headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    }),
    triggerAgentEvolution: () => request('/self-improve/evolve', {
        headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    }),
    
    getAdminSources: () => request<{ data: any[] }>('/admin/sources'),
    createAdminSource: (data: any) => request<{ id: string }>('/admin/sources', { method: 'POST', body: JSON.stringify(data) }),
    deleteAdminSource: (id: string) => request<{ success: boolean }>(`/admin/sources/${id}`, { method: 'DELETE' }),
    
    getAdminClients: () => request<{ data: any[] }>('/admin/clients'),
    createAdminClient: (data: any) => request<{ id: string; api_key: string }>('/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
    
    getIntelligenceRecommendations: () => request<{ recommendations: string[] }>('/admin/intelligence/recommendations'),
    getAdminInbox: () => request<{
        contact: any[];
        bookings: any[];
        registrations: any[];
        newsletter_subscribers: number;
    }>('/admin/inbox'),

    // Personalization & Bookmarks
    getBookmarks: () => request<{ data: any[] }>('/bookmarks'),
    addBookmark: (articleId: string) => request<{ success: boolean; id: string }>('/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ article_id: articleId })
    }),
    removeBookmark: (bookmarkId: string) => request<{ success: boolean }>(`/bookmarks/${bookmarkId}`, {
        method: 'DELETE'
    }),
    removeBookmarkByArticleId: (articleId: string) => request<{ success: boolean }>(`/bookmarks/article/${articleId}`, {
        method: 'DELETE'
    }),

    // Corporate Services & Summits
    getCorporateEvents: () => request<{ data: any[] }>('/services/events'),
    getEvent: (id: string) => readerRequest<{ event: any }>(`/services/events/${id}`),
    registerForEvent: (id: string, data: any) => request<{ success: boolean; registration_id: string }>(`/services/events/${id}/register`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    submitBookingRequest: (data: any) => request<{ success: boolean; booking_id: string }>('/services/booking', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
};
