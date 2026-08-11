import type { Article, ArticleListItem, CalendarEvent, Country, CountryStats, Dashboard, PaginatedResponse, SearchResult, Sector, SectorBreakdown, TrendingCountry } from '../types';
import { readThroughCache } from '@/lib/persistentQueryCache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api/v1';
const ARTICLE_CONTENT_REVISION = 'pt1945-v4';

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

const withReaderLanguage = (endpoint: string) => {
    const [path, query = ''] = endpoint.split('?', 2);
    const params = new URLSearchParams(query);
    if (!params.has('lang')) params.set('lang', getReaderLanguage());
    if (!params.has('content_rev')) params.set('content_rev', ARTICLE_CONTENT_REVISION);
    return `${path}?${params.toString()}`;
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
    const localizedEndpoint = withReaderLanguage(endpoint);
    return readThroughCache<T>(`${accessScope}:${localizedEndpoint}`, () => request<T>(localizedEndpoint), maxAgeMs);
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

export interface AdminSource {
    id: string;
    name: string;
    type: 'rss' | 'api' | 'scraper' | 'manual';
    url: string;
    country_code: string | null;
    sector_id: string | null;
    is_active: number | boolean;
    last_fetched_at: string | null;
    fetch_interval_minutes: number;
    created_at: string;
}

export interface CreateAdminSourceInput {
    name: string;
    type: AdminSource['type'];
    url: string;
    country_code?: string;
    sector_id?: string;
    is_active?: boolean;
    fetch_interval_minutes: number;
}

export interface AdminClient {
    id: string;
    name: string;
    email: string;
    organization: string | null;
    type: 'government' | 'investor' | 'partner' | 'media' | 'other';
    tier: 'basic' | 'premium' | 'enterprise';
    is_active: number | boolean;
    created_at: string;
}

export interface CreateAdminClientInput {
    name: string;
    email: string;
    organization?: string;
    type: AdminClient['type'];
    tier: AdminClient['tier'];
    rate_limit_per_hour: number;
}

export interface AdminContactSubmission {
    id: string;
    name: string;
    organization: string | null;
    email: string;
    inquiry_type: string;
    message: string;
    created_at: string;
}

export interface AdminBookingRequest {
    id: string;
    guest_name: string;
    guest_email: string;
    guest_organization: string | null;
    service_type: string;
    requirements: string;
    budget_range: string | null;
    urgency: string | null;
    status: string;
    created_at: string;
}

export interface AdminEventRegistration {
    id: string;
    event_id: string;
    event_title: string | null;
    user_email: string;
    user_name: string;
    user_organization: string | null;
    ticket_type: string;
    status: string;
    confirmation_code: string;
    registered_at: string;
}

export type PilotRequestStatus = 'new' | 'reviewing' | 'qualified' | 'pilot_proposed' | 'closed';

export interface PilotRequestInput {
    contact_name: string;
    work_email: string;
    organization: string;
    role_title: string;
    organization_type: 'corporate' | 'exporter' | 'adviser' | 'investor' | 'public-sector' | 'nonprofit' | 'other';
    target_sector: string;
    candidate_countries: string[];
    decision_question: string;
    decision_deadline?: string;
    current_research_process: string;
    success_measure: string;
    no_sensitive_data_confirmed: true;
}

export interface AdminPilotRequest extends Omit<PilotRequestInput, 'no_sensitive_data_confirmed'> {
    id: string;
    status: PilotRequestStatus;
    qualification_notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface AudienceMetrics {
    period: '30d';
    updated_at: string;
    audience: {
        monthly_active_readers: number;
        weekly_active_readers: number;
        returning_readers_30d: number;
        returning_reader_rate_pct: number;
        page_views_30d: number;
    };
    habits: {
        briefing_opens_30d: number;
        article_reads_30d: number;
        high_progress_reads_30d: number;
        high_progress_rate_pct: number;
        audio_starts_30d: number;
        audio_completions_30d: number;
        audio_completion_rate_pct: number;
        saves_30d: number;
        saving_readers_30d: number;
    };
    distribution: {
        active_newsletter_subscribers: number;
        newsletter_subscribers_added_30d: number;
        email_open_rate_pct: number | null;
        email_open_rate_note: string;
    };
    daily: Array<{
        date: string;
        active_readers: number;
        briefing_opens: number;
        article_reads: number;
        audio_completions: number;
    }>;
    definitions: Record<string, string>;
}

export interface SpecialistProfile {
    id: string;
    slug: string;
    display_name: string;
    organization: string | null;
    headline: string;
    biography: string;
    countries: string[];
    sectors: string[];
    service_categories: string[];
    languages: string[];
    credential_summary: string;
    credential_links: string[];
    indicative_pricing: string | null;
    availability: string | null;
    verification_level: SpecialistVerificationLevel;
    verification_summary: string | null;
    founding_cohort: boolean;
    listed_at: string;
}

export interface SpecialistApplicationInput {
    token: string;
    password: string;
    contact_name: string;
    entity_type: 'individual' | 'organization';
    organization?: string;
    role_title?: string;
    headline: string;
    biography: string;
    countries: string[];
    sectors: string[];
    service_categories: string[];
    languages: string[];
    credential_summary: string;
    credential_links: string[];
    indicative_pricing?: string;
    availability?: string;
    conflicts_declaration: string;
    no_sensitive_data_confirmed: true;
}

export interface SpecialistInterestInput {
    contact_name: string;
    work_email: string;
    entity_type: 'individual' | 'organization';
    organization?: string;
    role_title?: string;
    countries: string[];
    sectors: string[];
    service_categories: string[];
    languages: string[];
    interest_summary: string;
    no_sensitive_data_confirmed: true;
}

export interface SpecialistRequestInput {
    title: string;
    decision_question: string;
    countries: string[];
    sector: string;
    required_expertise: string[];
    preferred_languages: string[];
    decision_deadline?: string;
    context_summary?: string;
    no_sensitive_data_confirmed: true;
}

export type ClientTier = 'free' | 'basic' | 'premium' | 'enterprise' | 'specialist';
export type ClientType = 'specialist' | 'enterprise' | 'government' | 'investor' | 'partner' | 'media' | 'other' | string;
export type MarketplaceAccessStatus = 'enabled' | 'suspended' | 'revoked' | 'not_granted';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    organization: string | null;
    tier: ClientTier;
    type: ClientType;
    marketplace_access_status: MarketplaceAccessStatus;
}

export interface PasswordLoginResponse {
    token: string;
    tier: ClientTier;
    access_level: string;
    expires_at: string;
    client: { id: string; name: string; organization: string | null };
}

export interface AuthMeResponse {
    authenticated: true;
    client: AuthUser;
}

export type SpecialistApplicationStatus = 'submitted' | 'screening' | 'needs_information' | 'approved' | 'rejected';
export type SpecialistSubscriptionStatus = 'checkout_open' | 'active' | 'past_due' | 'incomplete' | 'canceled' | 'unpaid' | 'paused';
export type SpecialistMatchStatus = 'suggested' | 'invited' | 'declined' | 'proposal_submitted';
export type SpecialistRequestStatus = 'submitted' | 'matching' | 'proposals_ready' | 'closed';
export type SpecialistProposalStatus = 'submitted' | 'accepted' | 'declined' | 'withdrawn';
export type SpecialistVerificationLevel = 'boa_specialist' | 'verified' | 'senior_featured';

export interface SpecialistApplication {
    id: string;
    contact_name: string;
    work_email: string;
    organization: string | null;
    role_title: string | null;
    headline: string;
    biography: string;
    countries: string[];
    sectors: string[];
    service_categories: string[];
    languages: string[];
    credential_summary: string;
    credential_links: string[];
    indicative_pricing: string | null;
    availability: string | null;
    status: SpecialistApplicationStatus;
    screened_at: string | null;
    updated_at: string;
}

export interface SpecialistSubscription {
    status: SpecialistSubscriptionStatus;
    current_period_end: string | null;
    cancel_at_period_end: number | boolean;
    updated_at: string;
}

export interface SpecialistMatch {
    id: string;
    request_id: string;
    status: SpecialistMatchStatus;
    title: string;
    decision_question: string;
    countries: string | string[];
    sector: string;
    required_expertise: string | string[];
    preferred_languages: string | string[];
    decision_deadline: string | null;
    context_summary: string | null;
    match_score: number;
    match_reasons: string | string[];
    created_at: string;
    updated_at: string;
}

export interface SpecialistDashboard {
    application: SpecialistApplication;
    profile: SpecialistProfile | null;
    listing_access: {
        fee_waived: boolean;
        fee_waived_until: string | null;
    } | null;
    subscription: SpecialistSubscription | null;
    matches: SpecialistMatch[];
}

export interface SpecialistRequestSummary {
    id: string;
    title: string;
    sector: string;
    countries: string | string[];
    decision_deadline: string | null;
    status: SpecialistRequestStatus;
    created_at: string;
    updated_at: string;
}

export interface SpecialistRequest extends SpecialistRequestSummary {
    requester_client_id: string;
    decision_question: string;
    countries: string[];
    required_expertise: string[];
    preferred_languages: string[];
    context_summary: string | null;
}

export interface SpecialistProposal {
    id: string;
    scope_summary: string;
    assumptions: string | null;
    timeline: string;
    indicative_fee: string;
    status: SpecialistProposalStatus;
    created_at: string;
    display_name: string;
    organization: string | null;
    slug: string;
}

export interface AdminSpecialistApplication extends SpecialistApplication {
    work_email: string;
    conflicts_declaration: string;
    screening_notes?: string | null;
    subscription_status?: SpecialistSubscriptionStatus | null;
    profile_id?: string | null;
    slug?: string | null;
    verification_level?: SpecialistVerificationLevel | null;
    verification_summary?: string | null;
    founding_cohort?: number | boolean | null;
    listing_fee_waived?: number | boolean | null;
    listing_fee_waived_until?: string | null;
}

export interface AdminDemandSignal {
    dimension: 'country' | 'sector' | 'language' | 'service';
    value: string;
    request_count: number;
}

export interface AdminSpecialistInvite {
    id: string;
    email: string;
    status: 'issued' | 'redeemed' | 'revoked' | 'expired';
    expires_at: string;
    redeemed_at: string | null;
    application_id: string | null;
    created_at: string;
}

export interface AdminSpecialistInterest extends Omit<
    SpecialistInterestInput,
    'no_sensitive_data_confirmed' | 'countries' | 'sectors' | 'service_categories' | 'languages'
> {
    id: string;
    countries: string | string[];
    sectors: string | string[];
    service_categories: string | string[];
    languages: string | string[];
    status: 'new' | 'reviewing' | 'invited' | 'closed';
    invite_id: string | null;
    qualification_notes: string | null;
    retention_until: string;
    created_at: string;
    updated_at: string;
}

export interface AdminEnterpriseAccess {
    client_id: string;
    status: MarketplaceAccessStatus;
    name: string;
    email: string;
    organization: string | null;
    granted_at: string;
    updated_at: string;
}

export interface AdminMarketplaceRequest extends SpecialistRequest {
    requester_name: string;
    requester_organization: string | null;
}

export interface AdminSpecialistMatch {
    id: string;
    request_id: string;
    specialist_client_id: string;
    status: SpecialistMatchStatus;
    match_score: number;
    match_reasons: string | string[];
    request_title: string;
    display_name: string;
    organization: string | null;
}

export interface RankedSpecialistMatch {
    clientId: string;
    score: number;
    reasons: string[];
}

export type SavedBookmark = ArticleListItem & {
    id: string;
    article_id: string;
};

export interface ReaderNotification {
    id: string;
    title: string;
    message: string;
    article_slug?: string;
    created_at: string;
    is_read: boolean;
}

export interface ReportingLedgerEntry {
    date: string;
    tag: string;
    title: string;
    body: string;
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
        const searchParams = new URLSearchParams({ ...params, lang: params.lang || getReaderLanguage(), content_rev: ARTICLE_CONTENT_REVISION });
        const endpoint = `/articles?${searchParams}`;
        return readerRequest<PaginatedResponse<ArticleListItem>>(endpoint, 5 * 60 * 1000);
    },
    getArticle: (slug: string, lang?: string) => {
        const searchParams = new URLSearchParams({ content_rev: ARTICLE_CONTENT_REVISION });
        if (lang && ['fr', 'ar', 'pt', 'de', 'hi', 'zh'].includes(lang)) searchParams.set('lang', lang);
        return readerRequest<{ article: Article; country: Country; sector: Sector; related: ArticleListItem[] }>(
            `/articles/${slug}?${searchParams}`,
            5 * 60 * 1000,
        );
    },
    getFeaturedArticles: () => readerRequest<{ data: ArticleListItem[] }>(`/articles/featured?limit=20&lang=${getReaderLanguage()}&content_rev=${ARTICLE_CONTENT_REVISION}`, 5 * 60 * 1000),
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
    getLatestArticles: () => readerRequest<{ data: ArticleListItem[] }>(`/articles/latest?limit=20&lang=${getReaderLanguage()}`, 5 * 60 * 1000),
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
        official_data_refresh: { state: 'current' | 'refreshing' | 'upstream_unavailable'; last_attempted_at: string | null; last_successful_at: string };
        indicators: { indicator_code: string; label: string; value: number; unit: string; aggregation: 'sum' | 'country median' | 'derived balance'; countries_reported: number; period_start: number; period_end: number; interpretation: string; caveat: string; source_url: string; category: 'Scale and demand' | 'Prices and labour' | 'Finance and external resilience' | 'Trade and production' | 'Infrastructure and digital access' | 'Human development'; underlying_source: string; underlying_source_url: string }[];
        regions: { region: string; country_count: number; gdp: { value: number; countries_reported: number; period_start: number; period_end: number }; population: { value: number; countries_reported: number; period_start: number; period_end: number }; growth: { value: number; countries_reported: number; period_start: number; period_end: number }; inflation: { value: number; countries_reported: number; period_start: number; period_end: number }; fdi: { value: number; countries_reported: number; period_start: number; period_end: number }; investment: { value: number; countries_reported: number; period_start: number; period_end: number } }[];
        rankings: { largest_economies: { country_code: string; country_name: string; region: string; year: number; value: number }[]; fastest_growth: { country_code: string; country_name: string; region: string; year: number; value: number }[]; largest_fdi_inflows: { country_code: string; country_name: string; region: string; year: number; value: number }[] };
        sector_performance: SectorMarketPerformance[]; sectors_measured: number; sector_methodology: string;
        narrated_briefings: { id: string; slug: string; title: string; summary: string | null; audio_url: string; audio_duration_seconds: number | null; published_at: string; country_code: string | null; country_name: string | null; sector_name: string | null }[];
        briefing_scope: {
            window_days: number; countries_considered: number; sectors_considered: number; countries_with_records: number; sectors_with_records: number; updated_at: string; methodology: string;
            countries: { country_code: string; country_name: string; region: string; records_30d: number; latest_record_at: string | null }[];
            sectors: { sector_id: string; sector_name: string; records_30d: number; countries_30d: number; latest_record_at: string | null }[];
        };
        source_network: {
            active_direct_sources: number; productive_direct_sources_30d: number; active_primary_or_global_sources: number; productive_primary_or_global_sources_30d: number;
            official_country_lanes: number; official_country_lanes_productive_30d: number; countries_with_official_lanes: number; latest_productive_at: string; methodology: string;
        };
    }>(`/dashboards/continental/overview?contract=economy-v1&lang=${getReaderLanguage()}`, 0),

    // Search
    search: (query: string) => readerRequest<{ results: SearchResult[]; suggestions: string[]; editorial_answer?: string }>(`/search?q=${encodeURIComponent(query)}`),
    autocomplete: (query: string) => readerRequest<{ suggestions: { text: string; type: string }[] }>(`/search/suggest?q=${encodeURIComponent(query)}`),

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
    }>(`/market-intel/country/${code}/outlook?lang=${getReaderLanguage()}`),
    getCountryRelationships: (code: string) => readerRequest<{
        country_code: string;
        country_name: string;
        relationships: { partner: string; type: string; context: string }[];
        updated_at: string;
    }>(`/countries/${code}/relationships`),
    getNarratives: (params: Record<string, string> = {}) => {
        const searchParams = new URLSearchParams(params);
        return readerRequest<{
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
    getCountryNarrative: (code: string) => readerRequest<{
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
    // The archive changes throughout the day. Do not let the general 30-day
    // reader cache hide newly generated country evidence briefs.
    getGeneratedReports: () => readerRequest<{ data: GeneratedReportSummary[] }>('/market-intel/generated-reports', 5 * 60 * 1000),
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

    getSectorTrends: (id: string) => readerRequest<{
        sector: Sector;
        market_performance: SectorMarketPerformance;
        methodology: string;
        updated_at: string;
    }>(`/market-intel/sector/${id}/trends?contract=market-v3`),

    // System & Personalization
    getCuratedFeed: () => request<{ data: (ArticleListItem & { curation?: { relevance_note: string } })[]; personalized: boolean; feed_summary?: string }>('/personalization/feed/curated'),
    getFounderLog: () => request<ReportingLedgerEntry[]>(`/market-intel/founder-log?lang=${getReaderLanguage()}`),
    askAnalyst: (message: string) => request<{ response: string; sources: string[] }>('/intel/analyst', {
        method: 'POST',
        body: JSON.stringify({ message })
    }),

    // Personalization
    getRecommendations: () => request<{ data: ArticleListItem[]; based_on?: { countries: string[]; sectors: string[] } }>('/personalization/recommended'),
    getPreferences: () => request<{
        preferences: {
            countries_of_interest: string[];
            sectors_of_interest: string[];
            regions_of_interest: string[];
            language_preference: string;
            format_preference: string;
            reading_level: string;
            notification_preferences: { email: boolean; push: boolean; reports: boolean; };
        };
        preference_basis?: string;
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
    getNotifications: () => request<{ data: ReaderNotification[] }>('/notifications'),
    markNotificationsRead: (ids?: string[]) => request<{ success: true; marked: number | 'all' }>('/notifications/read', {
        method: 'POST',
        body: JSON.stringify(ids?.length ? { ids } : {}),
    }),

    // Fire-and-forget analytics. keepalive lets the read-time beacon survive
    // page unload / route change; failures are silently ignored — analytics
    // must never affect the reading experience.
    trackEvent: (event: {
        type: 'page_view' | 'briefing_open' | 'article_read' | 'article_share' | 'audio_start' | 'audio_complete' | 'search' | 'click';
        article_id?: string;
        resource_id?: string;
        path?: string;
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
    getAudienceMetrics: () => request<AudienceMetrics>('/analytics/audience', {
        headers: { 'X-Admin-Key': getAdminToken() || '' },
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
    passwordLogin: (email: string, password: string) => request<PasswordLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ client_id: email, secret: password }),
    }),
    getCurrentUser: () => request<AuthMeResponse>('/auth/me'),

    // Analytics
    getSectorPerformance: (lens?: 'investor' | 'government' | 'explorer') => readerRequest<{
        data: SectorMarketPerformance[];
        sectors_measured: number;
        countries_in_scope: number;
        methodology: string;
        retrieved_at: string;
        source_name: string;
        source_url: string;
        official_data_refresh: { state: 'current' | 'refreshing' | 'upstream_unavailable'; last_attempted_at: string | null; last_successful_at: string | null };
    }>(`/market-intel/performance?contract=market-v2${lens ? `&lens=${lens}` : ''}`, 0),

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
        sectors: { sector_id: string; sector_name: string; records_30d: number; countries_30d: number; latest_record_at: string | null }[];
        concentration: {
            uncovered_countries_7d: number;
            leading_country_7d: { country_code: string; country_name: string; records_7d: number; share_pct: number };
            leading_source_share_pct: number;
            top_four_source_share_pct: number;
        };
        source_coverage: {
            publishers_30d: number;
            records_30d: number;
            primary_or_global_records_30d: number;
            primary_or_global_share_pct: number;
            leading_sources: { source_name: string; quality_tier: number; records_30d: number; countries_30d: number; latest_record_at: string | null }[];
            methodology: string;
        };
        source_network: {
            active_direct_sources: number; productive_direct_sources_30d: number; active_primary_or_global_sources: number; productive_primary_or_global_sources_30d: number;
            official_country_lanes: number; official_country_lanes_productive_30d: number; countries_with_official_lanes: number; latest_productive_at: string; methodology: string;
        };
        countries_considered: number;
        sectors_considered: number;
        thinnest_region: { region: string; stories: number };
        updated_at: string;
    }>('/market-intel/coverage-pulse', 0),

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
    getCampaign: (id: string) => request<{ data: Campaign & { articles: ArticleListItem[]; stats: Record<string, number | string | null> } }>(`/campaigns/${id}`),
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
        sector_coverage: { id: string; name: string; article_count: number }[];
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
                official_profile?: { indicators: { code: string; name: string; value: number; year: number; unit: string; source_url: string; category?: 'Scale and demand' | 'Prices and labour' | 'Finance and external resilience' | 'Trade and production' | 'Infrastructure and digital access' | 'Human development'; decision_use?: string; underlying_source?: string; underlying_source_url?: string; history?: { year: number; value: number }[]; previous_value?: number; absolute_change?: number; percentage_change?: number; period_status?: 'historical_observation' | 'estimate_or_projection' }[]; last_updated: string; source_name: string; source_url: string };
                world_bank: { indicators: { code: string; name: string; value: number; year: number; unit: string; source_url: string; category?: 'Scale and demand' | 'Prices and labour' | 'Finance and external resilience' | 'Trade and production' | 'Infrastructure and digital access' | 'Human development'; decision_use?: string; underlying_source?: string; underlying_source_url?: string; history?: { year: number; value: number }[]; previous_value?: number; absolute_change?: number; percentage_change?: number; period_status?: 'historical_observation' | 'estimate_or_projection' }[]; last_updated: string; source_name: string; source_url: string };
                imf_current: Record<string, number | string> | null;
                imf_gdp_growth: { historical: { year: number; value: number }[]; projections: { year: number; value: number }[] } | null;
                imf_debt: Record<string, unknown> | null;
            };
            trade: ({ kind: 'reported_totals'; year: number; export_year?: number; import_year?: number; totalExports: number; totalImports: number; balance: number; provider: 'UN Comtrade' | 'World Bank World Development Indicators'; source_name: string; source_url: string; retrieved_at: string; topExportPartners: { partner: string; value: number }[]; topImportPartners: { partner: string; value: number }[] }
                | { kind: 'external_balance'; year: number; current_account_percent_gdp?: number; current_account_usd?: number; period_status: 'historical_observation' | 'estimate_or_projection'; provider: 'IMF World Economic Outlook'; source_name: string; source_url: string; retrieved_at: string });
            sector_evidence: { id: string; name: string; article_count: number; latest_evidence_at: string }[];
            upcoming_events: { id: string; title: string; category: string; date_start: string; location: string; source_url?: string }[];
            recent_source_record: { title: string; slug: string; summary: string; source_url: string; source_name: string; source_quality_tier: number | null; sector_id: string | null; sector_name: string | null; published_at: string; reviewed_at: string | null }[];
            official_resources: { name: string; url: string; source_type: 'official country dataset' | 'verified official portal'; verified_at?: string; verification_source_url?: string }[];
            freshness: { provider: string; source_url: string; checked_at: string; observation_period: string; state: 'current_snapshot' | 'last_verified_snapshot' | 'checked_no_series' }[];
        };
        provenance: { sources: { name: string; section: string; url: string | null }[]; generated_at: string; retrieved_at: string; methodology: string };
    }>(`/countries/${code}/dossier?lang=${getReaderLanguage()}`, 0),

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
    triggerAuditScan: () => request<{ success: true; scanned: number; tasks_created: number }>('/audit/scan', {
        headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    }),
    triggerAgentEvolution: () => request('/self-improve/evolve', {
        headers: { 'Authorization': `Bearer ${getAdminToken()}` }
    }),
    
    getAdminSources: () => request<{ data: AdminSource[] }>('/admin/sources'),
    createAdminSource: (data: CreateAdminSourceInput) => request<{ id: string }>('/admin/sources', { method: 'POST', body: JSON.stringify(data) }),
    deleteAdminSource: (id: string) => request<{ success: boolean }>(`/admin/sources/${id}`, { method: 'DELETE' }),
    
    getAdminClients: () => request<{ data: AdminClient[] }>('/admin/clients'),
    createAdminClient: (data: CreateAdminClientInput) => request<{ id: string; api_key: string }>('/admin/clients', { method: 'POST', body: JSON.stringify(data) }),
    
    getIntelligenceRecommendations: () => request<{ recommendations: string[] }>('/admin/intelligence/recommendations'),
    getAdminInbox: () => request<{
        pilots: AdminPilotRequest[];
        contact: AdminContactSubmission[];
        bookings: AdminBookingRequest[];
        registrations: AdminEventRegistration[];
        newsletter_subscribers: number;
    }>('/admin/inbox'),
    updatePilotRequest: (id: string, data: { status: PilotRequestStatus; qualification_notes?: string }) =>
        request<{ success: true; id: string; status: PilotRequestStatus }>(`/admin/pilot-requests/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    // Personalization & Bookmarks
    getBookmarks: () => request<{ data: SavedBookmark[] }>('/bookmarks'),
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
    submitPilotRequest: (data: PilotRequestInput) => request<{
        success: true;
        id: string;
        status: PilotRequestStatus;
        message: string;
    }>('/services/pilot-requests', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    getCorporateEvents: () => request<{ data: CalendarEvent[] }>('/services/events'),
    getEvent: (id: string) => readerRequest<{ event: CalendarEvent }>(`/services/events/${id}`),
    registerForEvent: (id: string, data: {
        user_email: string;
        user_name: string;
        user_organization?: string;
        ticket_type: string;
    }) => request<{
        success: true;
        data: {
            registration_id: string;
            confirmation_code: string;
            event_title: string;
            event_date: string;
            status: string;
            message: string;
        };
    }>(`/services/events/${id}/register`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    submitBookingRequest: (data: {
        guest_name: string;
        guest_email: string;
        guest_organization?: string;
        service_type: string;
        requirements: string;
        destination_country?: string;
        budget_range?: string;
        urgency?: string;
    }) => request<{
        success: true;
        id: string;
        message: string;
        preliminary_brief: string | null;
    }>('/services/booking', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // Specialist Marketplace
    submitSpecialistInterest: (data: SpecialistInterestInput) =>
        request<{ success: true; status: 'registered'; message: string }>('/services/specialist-interest', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getSpecialists: (filters: Record<string, string> = {}) =>
        request<{ data: SpecialistProfile[] }>(`/specialists?${new URLSearchParams(filters)}`),
    getSpecialist: (slug: string) =>
        request<{ data: SpecialistProfile }>(`/specialists/${encodeURIComponent(slug)}`),
    redeemSpecialistInvite: (data: SpecialistApplicationInput) =>
        request<{ success: true; application_id: string; token: string }>('/specialists/join', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getSpecialistDashboard: () => request<SpecialistDashboard>('/specialists/dashboard'),
    updateSpecialistProfile: (data: Omit<
        SpecialistProfile,
        'id' | 'slug' | 'listed_at' | 'verification_level' | 'verification_summary' | 'founding_cohort'
    >) =>
        request<{ success: true }>('/specialists/dashboard/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    startSpecialistCheckout: () => request<{ url: string }>('/specialists/billing/checkout', { method: 'POST' }),
    openSpecialistPortal: () => request<{ url: string }>('/specialists/billing/portal', { method: 'POST' }),
    createSpecialistRequest: (data: SpecialistRequestInput) =>
        request<{ id: string; status: string }>('/specialists/requests', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    getSpecialistRequests: () => request<{ data: SpecialistRequestSummary[] }>('/specialists/requests'),
    getSpecialistRequest: (id: string) =>
        request<{ request: SpecialistRequest; proposals: SpecialistProposal[] }>(`/specialists/requests/${id}`),
    submitSpecialistProposal: (matchId: string, data: {
        scope_summary: string; assumptions?: string; timeline: string; indicative_fee: string;
    }) => request<{ id: string; status: string }>(`/specialists/matches/${matchId}/proposals`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateSpecialistProposal: (id: string, status: 'accepted' | 'declined' | 'withdrawn') =>
        request<{ success: true }>(`/specialists/proposals/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),
    getAdminSpecialists: () => request<{
        interest: AdminSpecialistInterest[];
        applications: AdminSpecialistApplication[];
        invites: AdminSpecialistInvite[];
        enterprise_access: AdminEnterpriseAccess[];
        requests: AdminMarketplaceRequest[];
        matches: AdminSpecialistMatch[];
        demand_signals: AdminDemandSignal[];
    }>('/admin/specialists'),
    issueSpecialistInvite: (email: string, expiresInDays = 7, interestId?: string) =>
        request<{ id: string; invitation_url: string; emailed: boolean }>('/admin/specialists/invites', {
            method: 'POST',
            body: JSON.stringify({ email, expires_in_days: expiresInDays, interest_id: interestId }),
        }),
    reviewSpecialistInterest: (
        id: string,
        status: 'reviewing' | 'closed',
        qualificationNotes?: string,
    ) => request<{ success: true; id: string; status: string }>(`/admin/specialists/interest/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, qualification_notes: qualificationNotes }),
    }),
    revokeSpecialistInvite: (id: string) =>
        request<{ success: true }>(`/admin/specialists/invites/${id}`, { method: 'DELETE' }),
    reviewSpecialistApplication: (
        id: string,
        status: 'screening' | 'needs_information' | 'approved' | 'rejected',
        privateNotes?: string,
    ) => request<{ success: true; status: string; approval_url: string | null }>(
        `/admin/specialists/applications/${id}`,
        { method: 'PATCH', body: JSON.stringify({ status, private_notes: privateNotes }) },
    ),
    updateSpecialistStanding: (
        profileId: string,
        data: {
            verification_level: SpecialistVerificationLevel;
            verification_summary?: string | null;
            founding_cohort: boolean;
            listing_fee_waived: boolean;
            listing_fee_waived_until?: string | null;
        },
    ) => request<{
        success: true;
        verification_level: SpecialistVerificationLevel;
        founding_cohort: boolean;
        listing_fee_waived: boolean;
    }>(`/admin/specialists/profiles/${profileId}/standing`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    grantMarketplaceAccess: (clientId: string, status: 'enabled' | 'suspended' | 'revoked') =>
        request<{ success: true; status: string }>(`/admin/specialists/enterprise-access/${clientId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),
    rankSpecialistMatches: (requestId: string) =>
        request<{ matches: RankedSpecialistMatch[] }>(`/admin/specialists/requests/${requestId}/match`, {
            method: 'POST',
        }),
    confirmSpecialistMatch: (matchId: string, confirmed: boolean) =>
        request<{ success: true; status: string }>(`/admin/specialists/matches/${matchId}`, {
            method: 'PATCH',
            body: JSON.stringify({ confirmed }),
        }),
};
