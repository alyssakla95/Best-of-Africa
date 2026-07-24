// ═══════════════════════════════════════════════════════════════════════════════
// OPENAPI ROUTER
// Serves API documentation for the BOA-Story platform
// ═══════════════════════════════════════════════════════════════════════════════

import { Hono } from 'hono';

const router = new Hono();

const openApiSpec = {
    openapi: '3.0.0',
    info: {
        title: 'BOA-Story API',
        version: '1.0.0',
        description: 'Africa business intelligence API for sourced reporting, country records, coverage analytics, search, dashboards and events.',
    },
    servers: [
        { url: '/api/v1', description: 'Production API v1' }
    ],
    paths: {
        '/articles': {
            get: {
                summary: 'List articles with filters',
                parameters: [
                    { name: 'country', in: 'query', schema: { type: 'string' }, description: 'ISO country code (2-letter)' },
                    { name: 'sector', in: 'query', schema: { type: 'string' }, description: 'Sector ID' },
                    { name: 'region', in: 'query', schema: { type: 'string' }, description: 'Region name' },
                    { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
                    { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } }
                ],
                responses: {
                    200: { description: 'Paginated list of articles' }
                }
            }
        },
        '/countries': {
            get: {
                summary: 'List African country intelligence records',
                responses: { 200: { description: 'Country directory grouped by region' } }
            }
        },
        '/search': {
            get: {
                summary: 'Search the BOA intelligence corpus',
                parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Country, sector, company, project or decision query' }],
                responses: { 200: { description: 'Ranked intelligence results and optional synthesis' } }
            }
        },
        '/market-intel/coverage-pulse': {
            get: {
                summary: 'Get the verified seven-day BOA coverage pulse',
                description: 'Reporting activity metrics; not market-performance, return or sovereign-risk indicators.',
                responses: { 200: { description: 'Weekly story volume, country coverage, most-reported sector, regional gap and timestamp' } }
            }
        },
        '/market-intel/performance': {
            get: {
                summary: 'Get multi-indicator African sector-performance dossiers',
                description: 'Eight source-linked WDI sector dossiers combining primary performance, structural and operating indicators, observation periods, medians, change, breadth, country dispersion, interpretation limits and sector-specific diligence questions. Newsroom volume is excluded.',
                responses: { 200: { description: 'Thirty-two official performance signals across eight sectors and the configured 54 African markets' } }
            }
        },
        '/dashboards/continental/overview': {
            get: {
                summary: 'Get the official continental economic overview',
                description: 'Source-linked WDI continental totals, country medians, five-region comparisons, country rankings and multi-indicator sector performance. Editorial activity is excluded.',
                responses: { 200: { description: 'Official economic, trade, FDI, population, regional and sector-performance records' } }
            }
        },
        '/events': {
            get: {
                summary: 'List professional and country events',
                parameters: [
                    { name: 'country', in: 'query', schema: { type: 'string' } },
                    { name: 'type', in: 'query', schema: { type: 'string' } }
                ],
                responses: { 200: { description: 'Current events and calendar records' } }
            }
        },
        '/dashboards': {
            get: {
                summary: 'Get all regional dashboards',
                responses: {
                    200: { description: 'List of current regional dashboards' }
                }
            }
        },
        '/dashboards/{region}': {
            get: {
                summary: 'Get specific regional dashboard',
                parameters: [
                    { name: 'region', in: 'path', required: true, schema: { type: 'string', enum: ['North', 'West', 'East', 'Central', 'Southern', 'Continental'] } }
                ],
                responses: {
                    200: { description: 'Detailed regional dashboard data' }
                }
            }
        },
        '/intel/lens': {
            get: {
                summary: 'Get intelligence analysis for a specific lens',
                parameters: [
                    { name: 'lens', in: 'query', required: true, schema: { type: 'string', enum: ['investor', 'government', 'explorer'] } }
                ],
                responses: {
                    200: { description: 'Lens-specific intelligence briefing' }
                }
            }
        }
    }
};

router.get('/openapi.json', (c) => {
    return c.json(openApiSpec);
});

router.get('/', (c) => {
    return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>BOA-Story API Documentation</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        </head>
        <body>
            <div id="swagger-ui"></div>
            <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
            <script>
                SwaggerUIBundle({
                    url: '/api/v1/docs/openapi.json',
                    dom_id: '#swagger-ui',
                    presets: [SwaggerUIBundle.presets.apis],
                    layout: "BaseLayout"
                })
            </script>
        </body>
        </html>
    `);
});

export { router as openapiRouter };
