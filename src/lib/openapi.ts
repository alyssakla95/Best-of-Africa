// ═══════════════════════════════════════════════════════════════════════════════
// OPENAPI SPECIFICATION
// Auto-generated API documentation for BOA-Story Platform
// ═══════════════════════════════════════════════════════════════════════════════

export const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'BOA-Story API',
        version: '1.0.0',
        description: 'Strategic intelligence and media platform for African markets. Provides access to articles, country profiles, sector analysis, and AI-powered insights.',
        contact: {
            name: 'BOA-Story Support',
            url: 'https://best-of-africa.pages.dev/contact',
        },
        license: {
            name: 'Proprietary',
        },
    },
    servers: [
        {
            url: 'https://best-of-africa-backend.cortesmailles01.workers.dev',
            description: 'Production',
        },
        {
            url: 'http://localhost:8787',
            description: 'Local Development',
        },
    ],
    tags: [
        { name: 'Articles', description: 'News and analysis content' },
        { name: 'Countries', description: 'Country profiles and data' },
        { name: 'Sectors', description: 'Industry sector information' },
        { name: 'Search', description: 'Semantic and keyword search' },
        { name: 'Intelligence', description: 'AI-powered insights and trends' },
        { name: 'Personalization', description: 'User preferences and recommendations' },
        { name: 'Services', description: 'Booking and consulting services' },
        { name: 'Reports', description: 'Generated intelligence reports' },
        { name: 'Webhooks', description: 'Event notification system' },
    ],
    paths: {
        // ─── Articles ────────────────────────────────────────────────────────────
        '/articles': {
            get: {
                tags: ['Articles'],
                summary: 'List articles',
                description: 'Retrieve paginated list of published articles with optional filters',
                parameters: [
                    { name: 'country', in: 'query', schema: { type: 'string' }, description: 'ISO country code filter' },
                    { name: 'sector', in: 'query', schema: { type: 'string' }, description: 'Sector ID filter' },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                    { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
                    { name: 'lang', in: 'query', schema: { type: 'string', enum: ['en', 'fr', 'ar', 'pt'] } },
                ],
                responses: {
                    200: {
                        description: 'List of articles',
                        content: { 'application/json': { schema: { $ref: '#/components/schemas/ArticleList' } } },
                    },
                },
            },
        },
        '/articles/{slug}': {
            get: {
                tags: ['Articles'],
                summary: 'Get article by slug',
                parameters: [
                    { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'lang', in: 'query', schema: { type: 'string', enum: ['en', 'fr', 'ar', 'pt'] } },
                ],
                responses: {
                    200: { description: 'Article details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Article' } } } },
                    404: { description: 'Article not found' },
                },
            },
        },
        '/articles/{id}/audio': {
            get: {
                tags: ['Articles'],
                summary: 'Get article audio narration',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Audio file', content: { 'audio/wav': {} } },
                    404: { description: 'Audio not available' },
                },
            },
        },

        // ─── Countries ───────────────────────────────────────────────────────────
        '/countries': {
            get: {
                tags: ['Countries'],
                summary: 'List all countries',
                parameters: [{ name: 'region', in: 'query', schema: { type: 'string' } }],
                responses: { 200: { description: 'List of countries' } },
            },
        },
        '/countries/{code}': {
            get: {
                tags: ['Countries'],
                summary: 'Get country profile',
                parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Country profile with economic data' } },
            },
        },
        '/countries/{code}/economics': {
            get: {
                tags: ['Countries'],
                summary: 'Get country economic indicators',
                description: 'Returns GDP, FDI, population, and other World Bank indicators',
                parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Economic indicators' } },
            },
        },

        // ─── Search ──────────────────────────────────────────────────────────────
        '/search': {
            get: {
                tags: ['Search'],
                summary: 'Semantic search',
                description: 'AI-powered semantic search across all content',
                parameters: [
                    { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
                ],
                responses: { 200: { description: 'Search results with relevance scores' } },
            },
        },

        // ─── Intelligence ────────────────────────────────────────────────────────
        '/intelligence/trends': {
            get: {
                tags: ['Intelligence'],
                summary: 'Get trending topics',
                description: 'Returns countries and sectors with increasing coverage velocity',
                responses: { 200: { description: 'Trending signals' } },
            },
        },
        '/intelligence/coverage': {
            get: {
                tags: ['Intelligence'],
                summary: 'Get coverage heatmap',
                description: 'Returns content gap analysis by country and sector',
                responses: { 200: { description: 'Coverage matrix' } },
            },
        },
        '/intelligence/sentiment/{country}': {
            get: {
                tags: ['Intelligence'],
                summary: 'Get sentiment analysis for country',
                parameters: [{ name: 'country', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Sentiment breakdown' } },
            },
        },

        // ─── Reports ─────────────────────────────────────────────────────────────
        '/reports/country/{code}': {
            get: {
                tags: ['Reports'],
                summary: 'Generate country brief',
                parameters: [
                    { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'html', 'pdf'] } },
                ],
                responses: { 200: { description: 'Country intelligence report' } },
            },
        },
        '/reports/sector/{id}': {
            get: {
                tags: ['Reports'],
                summary: 'Generate sector analysis',
                parameters: [
                    { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                    { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'html', 'pdf'] } },
                ],
                responses: { 200: { description: 'Sector intelligence report' } },
            },
        },

        // ─── Webhooks ────────────────────────────────────────────────────────────
        '/webhooks': {
            get: {
                tags: ['Webhooks'],
                summary: 'List registered webhooks',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'List of webhooks' } },
            },
            post: {
                tags: ['Webhooks'],
                summary: 'Register a webhook',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/WebhookCreate' },
                        },
                    },
                },
                responses: { 201: { description: 'Webhook created' } },
            },
        },
        '/webhooks/{id}': {
            delete: {
                tags: ['Webhooks'],
                summary: 'Delete a webhook',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 204: { description: 'Webhook deleted' } },
            },
        },

        // ─── Export ──────────────────────────────────────────────────────────────
        '/export/articles': {
            get: {
                tags: ['Reports'],
                summary: 'Export articles as CSV',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'country', in: 'query', schema: { type: 'string' } },
                    { name: 'sector', in: 'query', schema: { type: 'string' } },
                    { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
                    { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
                ],
                responses: { 200: { description: 'CSV file', content: { 'text/csv': {} } } },
            },
        },
    },
    components: {
        schemas: {
            Article: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    slug: { type: 'string' },
                    title: { type: 'string' },
                    subtitle: { type: 'string', nullable: true },
                    summary: { type: 'string' },
                    content: { type: 'string' },
                    country_code: { type: 'string', nullable: true },
                    sector_id: { type: 'string', nullable: true },
                    tags: { type: 'array', items: { type: 'string' } },
                    sentiment_score: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
                    audio_url: { type: 'string', nullable: true },
                    published_at: { type: 'string', format: 'date-time' },
                    reading_time_minutes: { type: 'integer' },
                },
            },
            ArticleList: {
                type: 'object',
                properties: {
                    articles: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                },
            },
            WebhookCreate: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                    url: { type: 'string', format: 'uri' },
                    events: { type: 'array', items: { type: 'string', enum: ['article.published', 'article.updated', 'trend.detected'] } },
                    secret: { type: 'string', description: 'Optional secret for HMAC signature verification' },
                },
            },
        },
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
            apiKey: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-Key',
            },
        },
    },
};

// ───────────────────────────────────────────────────────────────────────────────
// Serve OpenAPI Spec and Swagger UI
// ───────────────────────────────────────────────────────────────────────────────
export function getOpenApiJson(): Response {
    return new Response(JSON.stringify(openApiSpec, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
}

export function getSwaggerUI(): Response {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>BOA-Story API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body { margin: 0; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #d4af37; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '/api/docs/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: "StandaloneLayout"
        });
    </script>
</body>
</html>
    `;
    return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
    });
}
