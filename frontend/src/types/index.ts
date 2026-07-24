export interface Country {
    code: string;
    name: string;
    region: string;
    capital: string;
    population: number;
    gdp_usd: number;
    currency: string;
    languages: string[];
    description: string;
    investment_highlights: string[];
    tourism_highlights: string[];
    flag_emoji: string;
    hero_image_url: string;
    image_credit?: string | null;
    image_source_url?: string | null;
    diplomacy_score: number;
    image_strength_score: number;
    fdi_inflow_usd?: number;
    fdi_yoy_growth?: number;
    key_narratives?: string;
    ai_situation_report?: string;
    visa_portal_url?: string;
    business_portal_url?: string;
    tourism_portal_url?: string;
    history_baobab_content?: string;
}

export interface Sector {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export interface Article {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
    content: string;
    summary: string;
    country_code: string;
    sector_id: string;
    tags: string[];
    hero_image_url: string;
    image_credit?: string | null;
    image_source_url?: string | null;
    reading_time_minutes: number;
    view_count: number;
    engagement_score: number;
    published_at: string;
    is_sponsored: boolean;
    // Optional fields populated by the API depending on context / member status
    // The single-article endpoint JOINs country + sector and merges these in.
    country_name?: string;
    flag_emoji?: string;
    sector_name?: string;
    sector_icon?: string;
    author_name?: string;
    paywall?: boolean;
    // Provenance: the original reporting this brief is based on.
    source_url?: string | null;
    source_title?: string | null;
    source_published_at?: string | null;
    // Two-tier content model: 1 = human-reviewed magazine story (personal
    // byline, preferred on the front), 0 = automated briefing coverage.
    curated?: number;
    // Languages of the served blocks ('en' | 'fr' | 'ar' | 'pt'). Titles and
    // standfirsts are overlaid from stored translations when available; bodies
    // stay English until long-form translations are regenerated properly.
    title_language?: string;
    content_language?: string;
    meta_title?: string;
    meta_description?: string;
    ai_sentiment_score?: number;
    ai_sentiment_label?: string;
    ai_investor_brief?: string;
    ai_push_message?: string;
    ai_social_post?: string;
    refinement_count?: number;
    generation_prompt_version?: string;
    ai_headline_variants?: string;
    ai_video_url?: string;
    ai_context?: {
        key_takeaways: string[];
        strategic_implication: string;
        limitations?: string[];
        diligence_questions?: string[];
        claim_ledger?: string[];
    };
}

export interface CalendarEvent {
    id: string;
    title: string;
    slug: string;
    date_start: string;
    date_end?: string;
    location: string;
    country_code: string;
    country_name?: string;
    category: string;
    status: string;
    is_featured: boolean;
    is_vip: boolean;
    description: string;
    registration_url?: string;
    registered_count?: number;
    ai_context_brief?: string;
}

export interface ArticleListItem {
    id: string;
    slug: string;
    title: string;
    summary: string;
    country_code: string;
    country_name: string;
    country_flag: string;
    sector_id: string;
    sector_name: string;
    hero_image_url: string;
    image_credit?: string | null;
    image_source_url?: string | null;
    ai_video_url?: string;
    audio_url?: string;
    audio_duration_seconds?: number;
    reading_time_minutes: number;
    published_at: string;
    engagement_score?: number;
    // 1 = human-reviewed magazine story (personal byline), 0 = briefing coverage.
    curated?: number;
}

export interface Dashboard {
    id: string;
    region: string;
    title: string;
    summary: string;
    key_metrics: {
        articles_24h: number;
        total_views: number;
        trending_countries: string[];
        top_sectors: string[];
    };
    trending_topics: string[];
    featured_articles: string[];
    generated_at: string;
    ai_regional_insight?: string;
}

export interface CountryStats {
    article_count: number;
    risk_rating?: string;
    top_sectors: {
        sector: {
            name: string;
        };
        count: number;
        ai_sentiment_score?: number;
    }[];
}

export interface TrendingCountry {
    code: string;
    name: string;
    flag_emoji: string;
    article_count: number;
}

export interface SectorBreakdown {
    id: string;
    name: string;
    count: number;
    icon: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

export interface SearchResult {
    article: ArticleListItem;
    score: number;
    highlights: string[];
}

export interface PlatformAnalytics {
    market_summary: string;
    sector_trends: { id: string; name: string; trend: 'coverage_up' | 'coverage_down' | 'coverage_flat'; article_count: number; previous_article_count: number; coverage_change: number }[];
    total_articles_7d: number;
    coverage: { countries_7d: number; sectors_7d: number; source_records_7d: number; previous_articles_7d: number; coverage_change_7d: number; total_views_7d: number; audience_response: number; latest_reported_at: string };
    methodology: string;
    updated_at: string;
}

export type IntelligenceLens = 'investor' | 'government' | 'explorer';

export type MissionRole = 'standard' | 'investor' | 'operator' | 'policy';
export type MissionFormat = 'brief' | 'deep' | 'audio';

export interface MissionState {
    role: MissionRole;
    focus: {
        countries: string[]; // ISO codes
        sectors: string[];   // Sector IDs
    };
    format: MissionFormat;
    isOpen: boolean;
}

export type LanguageCode = 'en' | 'fr' | 'de' | 'ar' | 'hi' | 'zh' | 'pt';

export const SUPPORTED_LANGUAGES: { code: LanguageCode; name: string; dir: 'ltr' | 'rtl' }[] = [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'de', name: 'Deutsch', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' },
    { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
    { code: 'zh', name: '中文', dir: 'ltr' },
    { code: 'pt', name: 'Português', dir: 'ltr' },
];
