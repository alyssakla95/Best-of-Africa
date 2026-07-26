// ═══════════════════════════════════════════════════════════════════════════════
// BOA-Story - TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────
// Cloudflare Bindings
// ───────────────────────────────────────────────────────────────────────────────
export interface Env {
    // Database
    DB: D1Database;

    // Cache & Rate Limiting
    CACHE: KVNamespace;
    RATE_LIMIT: KVNamespace;

    // Storage
    // R2 is preferred; MEDIA_KV is the portable fallback for Cloudflare
    // accounts where R2 has not been enabled.
    MEDIA?: R2Bucket;
    MEDIA_KV?: KVNamespace;

    // & Vectors
    AI: Ai;
    VECTORS: VectorizeIndex;

    // Queues
    CONTENT_QUEUE: Queue;
    TRANSLATION_QUEUE: Queue;
    OPTIMIZATION_QUEUE: Queue;

    // Analytics
    ANALYTICS: AnalyticsEngineDataset;

    // Durable Objects
    LIVE_COUNTER: DurableObjectNamespace;

    // Environment Variables
    ENVIRONMENT: string;
    API_VERSION: string;
    JWT_SECRET: string;
    NEWS_API_KEY: string;
    ADMIN_API_KEY: string;

    // Transactional email (see src/lib/email.ts for provider order).
    // EMAIL is the Cloudflare Email Sending binding (wrangler.toml send_email);
    // it only delivers once a domain is onboarded to the account.
    EMAIL?: {
        send: (message: {
            to: string;
            from: { email: string; name?: string };
            subject: string;
            html: string;
            text?: string;
        }) => Promise<unknown>;
    };
    RESEND_API_KEY?: string;
    EMAIL_FROM?: string;
    EMAIL_FROM_NAME?: string;

    // Public origin of the reader-facing site (sitemap/RSS/podcast URLs).
    PUBLIC_SITE_URL?: string;
    // Public origin of this worker (media/audio URLs, email unsubscribe links).
    PUBLIC_API_URL?: string;

    // Optional Provider keys (set via `wrangler secret put`)
    // ZeroClaw can also use user-configured keys stored in D1 (ai_providers table)
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
    GOOGLE_AI_API_KEY?: string;
    OPENROUTER_API_KEY?: string;
    MOONSHOT_API_KEY?: string;
    // Moonshot OAuth credentials (from platform.moonshot.cn → OAuth Apps)
    MOONSHOT_CLIENT_ID?: string;
    MOONSHOT_CLIENT_SECRET?: string;
    // Override Moonshot token endpoint if needed (defaults to api.moonshot.cn/oauth/token)
    MOONSHOT_TOKEN_URL?: string;
    // Google OAuth credentials (from Google Cloud Console → APIs & Services → Credentials)
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;

    // Ko-fi webhook verification token (set via `wrangler secret put KOFI_TOKEN`)
    KOFI_TOKEN?: string;

    // ElevenLabs TTS API Key
    ELEVENLABS_API_KEY?: string;
    // ElevenLabs voice ID — defaults to Rachel (21m00Tcm4TlvDq8ikWAM) if unset
    ELEVENLABS_VOICE_ID?: string;

    // Comma-separated extra CORS origins beyond the hardcoded base set.
    // Set in wrangler.toml [vars] or via .dev.vars for local frontend dev.
    ADDITIONAL_ORIGINS?: string;

    // Secret for /dev/* endpoints — set in production via wrangler secret put DEV_SECRET
    DEV_SECRET?: string;
}

// Context variables for Hono middleware
export interface Variables {
    userId: string;
    clientId: string;
    clientTier: string;
    rateLimit: number;
    requestId: string;
    logger: import('../lib/logger').Logger;
}

// ───────────────────────────────────────────────────────────────────────────────
// Domain Models
// ───────────────────────────────────────────────────────────────────────────────

export interface Country {
    code: string;
    name: string;
    region: 'North' | 'West' | 'East' | 'Central' | 'Southern';
    capital: string | null;
    population: number | null;
    gdp_usd: number | null;
    currency: string | null;
    languages: string[] | null;
    description: string | null;
    investment_highlights: string[] | null;
    tourism_highlights: string[] | null;
    flag_emoji: string | null;
    hero_image_url: string | null;
    image_credit?: string | null;
    image_source_url?: string | null;
    visa_portal_url: string | null;
    business_portal_url: string | null;
    tourism_portal_url: string | null;
    history_baobab_content: string | null;
    diplomacy_score: number | null;
    image_strength_score: number | null;
    fdi_inflow_usd: number | null;
    fdi_yoy_growth: number | null;
    created_at: string;
    updated_at: string;
}

export interface Sector {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    created_at: string;
}

export interface Article {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    content: string;
    summary: string | null;
    country_code: string | null;
    sector_id: string | null;
    tags: string[] | null;
    meta_title: string | null;
    meta_description: string | null;
    hero_image_url: string | null;
    image_credit?: string | null;
    image_source_url?: string | null;
    reading_time_minutes: number | null;
    source_url: string | null;
    source_title: string | null;
    source_published_at: string | null;
    generation_model: string | null;
    generation_prompt_version: string | null;
    embedding_id: string | null;
    status: 'draft' | 'published' | 'archived';
    is_sponsored: boolean;
    sponsor_id: string | null;
    view_count: number;
    share_count: number;
    avg_read_time_seconds: number;
    engagement_score: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ArticleListItem {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    summary: string | null;
    country_code: string | null;
    country_name?: string;
    sector_id: string | null;
    sector_name?: string;
    hero_image_url: string | null;
    reading_time_minutes: number | null;
    published_at: string | null;
    engagement_score: number;
}

/**
 * Minimal article representation for cards (related, featured)
 * ~50% smaller payload than ArticleListItem
 */
export interface ArticleCardDTO {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    hero_image_url: string | null;
    reading_time_minutes: number | null;
}

export interface Source {
    id: string;
    name: string;
    type: 'rss' | 'newsapi' | 'custom';
    url: string;
    country_code: string | null;
    sector_id: string | null;
    is_active: boolean;
    last_fetched_at: string | null;
    fetch_interval_minutes: number;
    created_at: string;
}

export interface IngestedItem {
    id: string;
    source_id: string;
    external_id: string | null;
    title: string;
    content: string | null;
    url: string | null;
    published_at: string | null;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    article_id: string | null;
    rejection_reason: string | null;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    organization: string | null;
    type: 'government' | 'investor' | 'partner' | 'media' | 'member' | null;
    tier: 'basic' | 'premium' | 'enterprise';
    rate_limit_per_hour: number;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

export interface Campaign {
    id: string;
    client_id: string;
    name: string;
    description: string | null;
    target_countries: string[] | null;
    target_sectors: string[] | null;
    budget_usd: number | null;
    start_date: string | null;
    end_date: string | null;
    status: 'draft' | 'active' | 'paused' | 'completed';
    impressions: number;
    clicks: number;
    created_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// API Request/Response Types
// ───────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

export interface ApiError {
    error: string;
    message: string;
    status: number;
}

export interface ArticleFilters {
    country?: string;
    sector?: string;
    region?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface AnalyticsEvent {
    type: 'page_view' | 'briefing_open' | 'article_read' | 'article_share' | 'audio_start' | 'audio_complete' | 'search' | 'click';
    article_id?: string;
    resource_id?: string;
    path?: string;
    country_code?: string;
    sector_id?: string;
    search_query?: string;
    duration_seconds?: number;
    scroll_depth?: number;
}

// ───────────────────────────────────────────────────────────────────────────────
// Queue Message Types
// ───────────────────────────────────────────────────────────────────────────────

export interface ContentGenerationMessage {
    type: 'generate_article';
    ingested_item_id: string;
    source_id: string;
    priority: 'high' | 'normal' | 'low';
}

export interface OptimizationMessage {
    type: 'optimize_headline' | 'fill_narrative_gap';
    article_id?: string;
    country_code?: string;
    sector_id?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Intelligence API Types (Paid Tier)
// ───────────────────────────────────────────────────────────────────────────────

export interface CountryReport {
    country: Country;
    article_count: number;
    top_sectors: { sector: Sector; count: number }[];
    recent_articles: ArticleListItem[];
    evidence_profile: {
        published_articles: number;
        sectors_represented: number;
        source_records_reviewed: number;
        latest_reported_at: string;
    };
    methodology: string;
    narrative_gaps: string[];
    recommendations: string[];
}

export interface AudienceInsights {
    total_views: number;
    unique_visitors: number;
    avg_session_duration: number;
    top_countries_by_interest: { country_code: string; views: number }[];
    top_sectors_by_interest: { sector_id: string; views: number }[];
    peak_hours: { hour: number; views: number }[];
    device_breakdown: { device: string; percentage: number }[];
}

// ───────────────────────────────────────────────────────────────────────────────
// Vision-Aligned Models (Narrative Diplomacy & Intelligence)
// ───────────────────────────────────────────────────────────────────────────────

export type TargetAudience = 'investor' | 'tourist' | 'partner' | 'media' | 'general';
export type NarrativeTone = 'authoritative' | 'inspiring' | 'analytical' | 'promotional';
export type ContentFormat = 'long-form' | 'brief' | 'analysis' | 'bulletin' | 'summary';

export interface NarrativeStrategy {
    id: string;
    country_code: string | null;
    sector_id: string | null;
    narrative_theme: string;
    key_messages: string[] | null;
    target_audience: TargetAudience;
    priority: number;
    tone: NarrativeTone;
    status: 'active' | 'draft' | 'archived';
    effectiveness_score: number;
    created_at: string;
    updated_at: string;
}

export interface Dashboard {
    id: string;
    region: 'North' | 'West' | 'East' | 'Central' | 'Southern' | 'Continental';
    dashboard_type: 'regional' | 'sector' | 'thematic';
    title: string;
    summary: string | null;
    key_metrics: {
        articles_24h: number;
        trending_countries: string[];
        top_sectors: string[];
        total_views: number;
    } | null;
    trending_topics: string[] | null;
    featured_articles: string[] | null;
    sentiment_overview: {
        positive: number;
        neutral: number;
        negative: number;
    } | null;
    generated_at: string;
    expires_at: string | null;
    is_current: boolean;
}

export interface MarketIntelligence {
    id: string;
    report_type: 'sector_analysis' | 'country_outlook' | 'investment_brief' | 'risk_assessment';
    country_code: string | null;
    sector_id: string | null;
    region: string | null;
    title: string;
    executive_summary: string | null;
    content: string;
    key_findings: string[] | null;
    opportunities: string[] | null;
    risks: string[] | null;
    data_sources: string[] | null;
    confidence_score: number;
    generated_at: string;
    valid_until: string | null;
    view_count: number;
    is_premium: boolean;
}

export interface UserPreference {
    id: string;
    session_id: string | null;
    countries_of_interest: string[] | null;
    sectors_of_interest: string[] | null;
    regions_of_interest: string[] | null;
    language_preference: string;
    format_preference: ContentFormat;
    reading_level: 'professional' | 'general' | 'expert';
    articles_read: string[] | null;
    search_history: string[] | null;
    engagement_patterns: {
        avg_time_spent: number;
        avg_scroll_depth: number;
        shares: number;
    } | null;
    last_seen_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContentRefinement {
    id: string;
    article_id: string;
    refinement_type: 'headline' | 'format' | 'language' | 'structure' | 'tone';
    before_value: string | null;
    after_value: string | null;
    trigger_reason: 'low_engagement' | 'user_preference' | 'ab_test' | 'narrative_gap';
    model_used: string | null;
    prompt_version: string | null;
    impact_score: number;
    was_successful: boolean | null;
    created_at: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Enhanced Queue Messages
// ───────────────────────────────────────────────────────────────────────────────

export interface DashboardGenerationMessage {
    type: 'generate_dashboard';
    region: string;
}

export interface IntelligenceGenerationMessage {
    type: 'generate_intel_report';
    report_type: MarketIntelligence['report_type'];
    country_code?: string;
    sector_id?: string;
    region?: string;
}

export interface ContentRefinementMessage {
    type: 'refine_content';
    article_id: string;
    refinement_type: ContentRefinement['refinement_type'];
    trigger_reason: ContentRefinement['trigger_reason'];
}

// ───────────────────────────────────────────────────────────────────────────────
// Corporate Services Models (Booking & Events)
// ───────────────────────────────────────────────────────────────────────────────

export interface BookingRequest {
    id: string;
    user_id: string | null;
    guest_email: string | null;
    guest_name: string | null;
    guest_organization: string | null;
    service_type: 'Hotel' | 'Flight' | 'Concierge' | 'Visa' | 'Security';
    destination_country: string | null;
    dates_json: string | null;
    requirements: string | null;
    budget_range: 'Standard' | 'Premium' | 'Luxury';
    urgency: 'Normal' | 'Urgent' | 'Critical';
    status: 'New' | 'Processing' | 'Confirmed' | 'Closed' | 'Cancelled';
    assigned_to: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Event {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    event_type: 'Summit' | 'Forum' | 'Conference' | 'Roundtable' | 'Webinar';
    date: string;
    end_date: string | null;
    location: string | null;
    country_code: string | null;
    venue_name: string | null;
    capacity: number | null;
    registration_deadline: string | null;
    is_exclusive: boolean;
    is_virtual: boolean;
    virtual_link: string | null;
    hero_image_url: string | null;
    agenda_json: string | null;
    speakers_json: string | null;
    sponsors_json: string | null;
    status: 'Upcoming' | 'Open' | 'Sold Out' | 'Completed' | 'Cancelled';
    created_at: string;
    updated_at: string;
}

export interface EventRegistration {
    id: string;
    event_id: string;
    user_id: string | null;
    user_email: string;
    user_name: string | null;
    user_organization: string | null;
    user_title: string | null;
    ticket_type: 'Standard' | 'VIP' | 'Executive' | 'Media' | 'Speaker';
    dietary_requirements: string | null;
    special_requests: string | null;
    status: 'Pending' | 'Confirmed' | 'Waitlist' | 'Cancelled' | 'Attended';
    payment_status: 'Unpaid' | 'Paid' | 'Refunded' | 'Complimentary';
    confirmation_code: string | null;
    registered_at: string;
    confirmed_at: string | null;
    checked_in_at: string | null;
}


