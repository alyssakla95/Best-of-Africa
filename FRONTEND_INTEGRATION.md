# Best of Africa - Frontend Integration Guide

> Complete API documentation for building the frontend interface

## Base URL

```
Production: https://api.bestofafrica.com
Development: http://localhost:8787
```

## Authentication

### Public Endpoints

No authentication required. All `/api/v1/articles`, `/api/v1/countries`, `/api/v1/dashboards`, `/api/v1/search` endpoints are public.

### Intelligence APIs

Requires API key in header:

```
X-API-Key: your_api_key_here
```

### Admin APIs

Requires JWT token:

```
Authorization: Bearer your_jwt_token
```

### Personalization

Include session ID for personalized content:

```
X-Session-ID: user_session_uuid
```

---

## Data Models

### Country

```typescript
interface Country {
  code: string;           // ISO 3166-1 alpha-2 (e.g., "NG", "KE", "ZA")
  name: string;           // "Nigeria", "Kenya", "South Africa"
  region: string;         // "North" | "West" | "East" | "Central" | "Southern"
  capital: string;
  population: number;
  gdp_usd: number;
  currency: string;
  languages: string[];
  description: string;
  investment_highlights: string[];
  tourism_highlights: string[];
  flag_emoji: string;     // "🇳🇬"
  hero_image_url: string;
  diplomacy_score: number;        // 0-100
  image_strength_score: number;   // 0-100
}
```

### Sector

```typescript
interface Sector {
  id: string;       // "tourism", "energy", "agriculture", etc.
  name: string;     // "Tourism & Hospitality"
  description: string;
  icon: string;     // Emoji: "🏨"
  color: string;    // Hex: "#10B981"
}
```

### Article

```typescript
interface Article {
  id: string;
  slug: string;                 // URL-friendly: "nigeria-tourism-boom-2025"
  title: string;
  subtitle: string;
  content: string;              // Markdown
  summary: string;              // 2-3 sentences
  country_code: string;
  sector_id: string;
  tags: string[];
  hero_image_url: string;
  reading_time_minutes: number;
  view_count: number;
  engagement_score: number;     // 0-100
  published_at: string;         // ISO 8601
  is_sponsored: boolean;
}
```

### ArticleListItem (for lists)

```typescript
interface ArticleListItem {
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
  reading_time_minutes: number;
  published_at: string;
}
```

### Dashboard

```typescript
interface Dashboard {
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
  featured_articles: string[];  // Article IDs
  generated_at: string;
}
```

---

## API Endpoints

### Articles

#### List Articles

```http
GET /api/v1/articles
```

Query Parameters:

| Param | Type | Description |
|-------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| country | string | Filter by country code |
| sector | string | Filter by sector ID |
| region | string | Filter by region |
| status | string | "published" (default) |

Response:

```json
{
  "data": [ArticleListItem],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### Get Single Article

```http
GET /api/v1/articles/:slug
```

Response:

```json
{
  "article": Article,
  "country": Country,
  "sector": Sector,
  "related": [ArticleListItem]
}
```

#### Featured Articles

```http
GET /api/v1/articles/featured
```

Response:

```json
{
  "data": [ArticleListItem]  // Top 6 by engagement
}
```

#### Latest Articles

```http
GET /api/v1/articles/latest
```

Response:

```json
{
  "data": [ArticleListItem]  // Most recent 10
}
```

#### Articles by Country

```http
GET /api/v1/articles/country/:code
```

#### Articles by Sector

```http
GET /api/v1/articles/sector/:id
```

---

### Countries

#### List All Countries

```http
GET /api/v1/countries
```

Response:

```json
{
  "data": [Country],
  "by_region": {
    "North": [Country],
    "West": [Country],
    "East": [Country],
    "Central": [Country],
    "Southern": [Country]
  }
}
```

#### Get Single Country

```http
GET /api/v1/countries/:code
```

Response:

```json
{
  "country": Country,
  "stats": {
    "article_count": 45,
    "total_views": 12500,
    "top_sectors": [{ sector: Sector, count: number }]
  }
}
```

#### Regional Statistics

```http
GET /api/v1/countries/regions/stats
```

Response:

```json
{
  "regions": [
    {
      "name": "West",
      "country_count": 16,
      "article_count": 230,
      "total_views": 45000
    }
  ]
}
```

#### Platform Stats

```http
GET /api/v1/countries/stats
```

Response:

```json
{
  "total_countries": 54,
  "total_articles": 500,
  "total_views": 150000,
  "regions": 5
}
```

---

### Dashboards

#### List All Dashboards

```http
GET /api/v1/dashboards
```

Response:

```json
{
  "data": [Dashboard]  // One per region + Continental
}
```

#### Get Regional Dashboard

```http
GET /api/v1/dashboards/:region
```

Regions: `North`, `West`, `East`, `Central`, `Southern`, `Continental`

Response:

```json
{
  "dashboard": Dashboard,
  "featured_articles": [ArticleListItem],
  "trending_countries": [{ code, name, flag_emoji, article_count }],
  "sector_breakdown": [{ id, name, icon, count }]
}
```

#### Continental Overview

```http
GET /api/v1/dashboards/continental/overview
```

Response:

```json
{
  "overview": {
    "total_articles_30d": 120,
    "countries_covered": 54,
    "regions": 5
  },
  "by_region": [{ name, count }],
  "top_countries": [{ code, name, flag_emoji, articles, views }],
  "top_sectors": [{ id, name, icon, count }],
  "highlights": [ArticleListItem]
}
```

---

### Search

#### Semantic Search

```http
GET /api/v1/search?q=renewable+energy+kenya
```

Query Parameters:

| Param | Type | Description |
|-------|------|-------------|
| q | string | Search query (required) |
| limit | number | Results limit (default: 10) |
| country | string | Filter by country |
| sector | string | Filter by sector |

Response:

```json
{
  "query": "renewable energy kenya",
  "results": [
    {
      "article": ArticleListItem,
      "score": 0.92,
      "highlights": ["...renewable energy projects in Kenya..."]
    }
  ],
  "suggestions": ["renewable energy africa", "kenya solar"]
}
```

#### Similar Articles

```http
GET /api/v1/search/similar/:articleId
```

#### Autocomplete

```http
GET /api/v1/search/autocomplete?q=nig
```

Response:

```json
{
  "suggestions": [
    { "text": "Nigeria", "type": "country" },
    { "text": "Nigerian Tourism", "type": "topic" }
  ]
}
```

---

### Narratives

#### List Narrative Strategies

```http
GET /api/v1/narratives
```

Query Parameters:

| Param | Type | Description |
|-------|------|-------------|
| country | string | Filter by country |
| sector | string | Filter by sector |
| audience | string | "investor", "tourist", "partner", "media", "general" |

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "country_code": "NG",
      "sector_id": "energy",
      "narrative_theme": "Nigeria's Green Energy Revolution",
      "key_messages": ["Leading renewable investment", "Policy reforms"],
      "target_audience": "investor",
      "priority": 1,
      "tone": "authoritative"
    }
  ]
}
```

#### Country Narrative Positioning

```http
GET /api/v1/narratives/country/:code
```

Response:

```json
{
  "country": Country,
  "narratives": [NarrativeStrategy],
  "aligned_articles": [ArticleListItem],
  "sector_coverage": [{ id, name, article_count }]
}
```

---

### Market Intelligence

#### Sector Overview (Public)

```http
GET /api/v1/market-intel/sectors
```

#### Sector Detail (Public)

```http
GET /api/v1/market-intel/sector/:id
```

Response:

```json
{
  "sector": Sector,
  "by_country": [{ code, name, flag_emoji, count }],
  "by_region": [{ name, count, views }],
  "recent_articles": [ArticleListItem],
  "top_performers": [ArticleListItem]
}
```

#### Country Investment Outlook (Public)

```http
GET /api/v1/market-intel/country/:code/outlook
```

Response:

```json
{
  "country": Country,
  "outlook": {
    "investment_readiness": 75,
    "narrative_strength": 60,
    "media_presence": 45,
    "engagement_level": 82
  },
  "sector_opportunities": [{ id, name, articles, avg_engagement }]
}
```

#### Premium Reports (API Key Required)

```http
GET /api/v1/market-intel/reports
GET /api/v1/market-intel/reports/:id
GET /api/v1/market-intel/reports/sector/:id
```

---

### Personalization

#### Save Preferences

```http
POST /api/v1/personalization/preferences
Headers: X-Session-ID: user_session_uuid
```

Body:

```json
{
  "countries_of_interest": ["NG", "KE", "ZA"],
  "sectors_of_interest": ["tourism", "technology"],
  "language_preference": "en",
  "format_preference": "full"  // "full", "summary", "bullet", "brief"
}
```

#### Get Preferences

```http
GET /api/v1/personalization/preferences
Headers: X-Session-ID: user_session_uuid
```

#### Track Behavior

```http
POST /api/v1/personalization/track
Headers: X-Session-ID: user_session_uuid
```

Body:

```json
{
  "event_type": "article_read",
  "article_id": "uuid",
  "duration_seconds": 120,
  "scroll_depth": 0.8
}
```

#### Get Personalized Recommendations

```http
GET /api/v1/personalization/recommended
Headers: X-Session-ID: user_session_uuid
```

Response:

```json
{
  "data": [ArticleListItem],
  "personalized": true,
  "based_on": {
    "countries": ["NG", "KE"],
    "sectors": ["tourism"]
  }
}
```

---

### Analytics

#### Track Event

```http
POST /api/v1/analytics/events
```

Body:

```json
{
  "type": "page_view" | "article_read" | "article_share" | "search" | "click",
  "article_id": "uuid",
  "country_code": "NG",
  "sector_id": "tourism",
  "search_query": "...",
  "duration_seconds": 120,
  "scroll_depth": 0.8,
  "referrer": "https://google.com"
}
```

---

### Intelligence APIs (API Key Required)

#### Country Report

```http
GET /api/v1/intel/country/:code/report
Headers: X-API-Key: your_key
```

Response:

```json
{
  "country": Country,
  "article_count": 45,
  "top_sectors": [{ sector: Sector, count: number }],
  "recent_articles": [ArticleListItem],
  "sentiment_score": 72,
  "investment_readiness_score": 85,
  "tourism_appeal_score": 68,
  "narrative_gaps": ["healthcare", "education"],
  "recommendations": ["Increase tourism content", "..."]]
}
```

#### Sector Trends

```http
GET /api/v1/intel/sector/:id/trends
Headers: X-API-Key: your_key
```

#### Audience Insights

```http
GET /api/v1/intel/audience
Headers: X-API-Key: your_key
```

---

## Frontend Implementation Patterns

### Fetching Articles

```typescript
// React example
const [articles, setArticles] = useState<ArticleListItem[]>([]);

useEffect(() => {
  fetch('/api/v1/articles?limit=20')
    .then(res => res.json())
    .then(data => setArticles(data.data));
}, []);
```

### Session-Based Personalization

```typescript
// Generate or retrieve session ID
const getSessionId = () => {
  let id = localStorage.getItem('boa_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('boa_session', id);
  }
  return id;
};

// Include in requests
fetch('/api/v1/personalization/recommended', {
  headers: { 'X-Session-ID': getSessionId() }
});
```

### Regional Dashboard Display

```typescript
const regions = ['Continental', 'North', 'West', 'East', 'Central', 'Southern'];

// Fetch all dashboards or specific region
const dashboard = await fetch('/api/v1/dashboards/West').then(r => r.json());
```

### Search with Debounce

```typescript
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery.length >= 2) {
    fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(res => res.json())
      .then(data => setResults(data.results));
  }
}, [debouncedQuery]);
```

---

## CORS Configuration

The backend allows requests from:

- `https://bestofafrica.com`
- `http://localhost:3000`
- `http://localhost:5173`

If you need additional origins, update `wrangler.toml`.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "status": 404
}
```

Common codes:

- `not_found` - Resource doesn't exist
- `bad_request` - Invalid parameters
- `unauthorized` - Missing or invalid auth
- `forbidden` - Insufficient permissions
- `rate_limited` - Too many requests

---

## Rate Limits

| Tier | Requests/Hour |
|------|---------------|
| Public | Unlimited |
| Basic API | 100 |
| Premium API | 1000 |
| Enterprise | 10000 |

Rate limit headers:

```
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 1704067200
```
