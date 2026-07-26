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
                description: 'Source-linked WDI continental totals, country medians, five-region comparisons, country rankings and multi-indicator sector performance. A separate narrated_briefings collection supplies recent source-linked audio reporting without mixing editorial activity into the economic measures.',
                responses: { 200: { description: 'Official economic, trade, FDI, population, regional and sector-performance records plus a separate narrated briefing collection' } }
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
        '/services/pilot-requests': {
            post: {
                summary: 'Submit a structured market-entry pilot application',
                description: 'Records a bounded decision scope, research baseline and success measure for human operator review. Confidential or sensitive information is prohibited.',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['contact_name', 'work_email', 'organization', 'role_title', 'organization_type', 'target_sector', 'candidate_countries', 'decision_question', 'current_research_process', 'success_measure', 'no_sensitive_data_confirmed'],
                                properties: {
                                    contact_name: { type: 'string', minLength: 2, maxLength: 100 },
                                    work_email: { type: 'string', format: 'email' },
                                    organization: { type: 'string', minLength: 2, maxLength: 150 },
                                    role_title: { type: 'string', minLength: 2, maxLength: 120 },
                                    organization_type: { type: 'string', enum: ['corporate', 'exporter', 'adviser', 'investor', 'public-sector', 'nonprofit', 'other'] },
                                    target_sector: { type: 'string', minLength: 2, maxLength: 120 },
                                    candidate_countries: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
                                    decision_question: { type: 'string', minLength: 20, maxLength: 2000 },
                                    decision_deadline: { type: 'string', format: 'date' },
                                    current_research_process: { type: 'string', minLength: 20, maxLength: 2000 },
                                    success_measure: { type: 'string', minLength: 20, maxLength: 1000 },
                                    no_sensitive_data_confirmed: { type: 'boolean', enum: [true] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: 'Application recorded with a reference ID and new status' },
                    400: { description: 'Input failed validation or the information boundary was not confirmed' },
                    429: { description: 'Submission rate limit exceeded' },
                },
            },
        },
        '/analytics/events': {
            post: {
                summary: 'Record a bounded first-party reader event',
                description: 'Accepts page, briefing, reading, sharing, audio, search and click events from a valid reader session. The service adds the connecting IP address and a one-way user-agent fingerprint; events are retained for no more than 90 days.',
                responses: {
                    200: { description: 'Event accepted for recording' },
                    400: { description: 'Invalid event or reader session' },
                    429: { description: 'Event rate limit exceeded' },
                },
            },
        },
        '/analytics/audience': {
            get: {
                summary: 'Get observed reader habit and retention metrics',
                description: 'Administrator-only 30-day audience evidence with explicit definitions and zero-safe empty states. No estimated traffic, conversion, revenue or subscriber outcomes are returned.',
                responses: {
                    200: { description: 'Recorded active-reader, return, briefing, reading, audio, bookmark and newsletter metrics' },
                    401: { description: 'Administrator authentication required' },
                },
            },
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
