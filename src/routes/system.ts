import { Hono } from 'hono';
import type { Env } from '../types';

const router = new Hono<{ Bindings: Env }>();

// ───────────────────────────────────────────────────────────────────────────────
// WebSocket: Real-time live stream (forwards to Durable Object)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/live/stream', async (c) => {
    const id = c.env.LIVE_COUNTER.idFromName('global');
    const stub = c.env.LIVE_COUNTER.get(id);

    // Forward the request to the Durable Object
    // The DO will handle the WebSocket upgrade
    return stub.fetch(c.req.raw);
});

// GET /live/status - Get current live stats without WebSocket
router.get('/live/status', async (c) => {
    const id = c.env.LIVE_COUNTER.idFromName('global');
    const stub = c.env.LIVE_COUNTER.get(id);

    // Fetch current state via HTTP
    const response = await stub.fetch(new Request('https://internal/get'));
    const data = await response.json();

    return c.json(data);
});

// ───────────────────────────────────────────────────────────────────────────────
// POST /contact - Contact form submission
// ───────────────────────────────────────────────────────────────────────────────
router.post('/contact', async (c) => {
    // Per-IP throttle — this endpoint writes unauthenticated input to D1 and
    // feeds the operator inbox; without a limit it's a spam funnel.
    const { throttle } = await import('../lib/ratelimit');
    const limited = await throttle(c, 'contact');
    if (limited) return limited;

    const body = await c.req.json();
    const { name, organization, email, inquiry_type, message } = body;

    if (!name || !email || !message) {
        return c.json({ error: 'validation_error', message: 'Name, email, and message are required' }, 400);
    }

    // Store in database
    const id = crypto.randomUUID();
    await c.env.DB.prepare(`
        INSERT INTO contact_submissions (id, name, organization, email, inquiry_type, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, name, organization || '', email, inquiry_type || 'General', message).run();

    return c.json({ success: true, id, message: 'Thank you for your inquiry. We will respond shortly.' });
});

// ───────────────────────────────────────────────────────────────────────────────
// Audience Stats (for SponsoredPage)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/stats/audience', async (c) => {
    const stats = await c.env.DB.prepare(`
        SELECT 
            COUNT(DISTINCT id) as total_articles,
            SUM(view_count) as total_views,
            COUNT(DISTINCT country_code) as countries_covered
        FROM articles
        WHERE status = 'published'
    `).first();

    return c.json({
        monthly_readers: Math.round(((stats as Record<string, any>)?.total_views || 0) / 12),
        audience_breakdown: [], // Requires real analytics integration
        countries_covered: (stats as Record<string, any>)?.countries_covered || 0,
        total_articles: (stats as Record<string, any>)?.total_articles || 0
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// System Status (for Footer API Status link)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/status', async (c) => {
    const startTime = Date.now();
    let dbStatus = 'ok';

    try {
        await c.env.DB.prepare('SELECT 1').first();
    } catch {
        dbStatus = 'error';
    }

    const responseTime = Date.now() - startTime;

    return c.json({
        status: dbStatus === 'ok' ? 'operational' : 'degraded',
        version: c.env.API_VERSION || '2.4.0',
        services: {
            database: dbStatus,
            api: 'ok',
            search: 'ok',
        },
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
    });
});

// ───────────────────────────────────────────────────────────────────────────────
// Deep Health Check - Comprehensive system diagnostics
// ───────────────────────────────────────────────────────────────────────────────
router.get('/health', async (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: c.env.API_VERSION || '2.4.0',
        environment: c.env.ENVIRONMENT || 'development',
    });
});

interface HealthCheckResult {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTimeMs: number;
    message?: string;
    details?: Record<string, unknown>;
}

router.get('/health/deep', async (c) => {
    const startTime = Date.now();
    const checks: HealthCheckResult[] = [];

    // Check Database
    const dbStart = Date.now();
    try {
        const dbResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM articles').first();
        checks.push({
            name: 'database',
            status: 'healthy',
            responseTimeMs: Date.now() - dbStart,
            details: { articleCount: (dbResult as Record<string, number>)?.count || 0 },
        });
    } catch (error) {
        checks.push({
            name: 'database',
            status: 'unhealthy',
            responseTimeMs: Date.now() - dbStart,
            message: error instanceof Error ? error.message : 'Database connection failed',
        });
    }

    // Check KV Cache
    const cacheStart = Date.now();
    try {
        const testKey = `health:${Date.now()}`;
        await c.env.CACHE.put(testKey, 'ok', { expirationTtl: 60 });
        const value = await c.env.CACHE.get(testKey);
        await c.env.CACHE.delete(testKey);
        checks.push({
            name: 'kv_cache',
            status: value === 'ok' ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - cacheStart,
        });
    } catch (error) {
        checks.push({
            name: 'kv_cache',
            status: 'unhealthy',
            responseTimeMs: Date.now() - cacheStart,
            message: error instanceof Error ? error.message : 'KV cache unavailable',
        });
    }

    // Check Rate Limit KV
    const rateLimitStart = Date.now();
    try {
        await c.env.RATE_LIMIT.put('health:test', '1', { expirationTtl: 60 });
        checks.push({
            name: 'rate_limit',
            status: 'healthy',
            responseTimeMs: Date.now() - rateLimitStart,
        });
    } catch (error) {
        checks.push({
            name: 'rate_limit',
            status: 'unhealthy',
            responseTimeMs: Date.now() - rateLimitStart,
            message: error instanceof Error ? error.message : 'Rate limit KV unavailable',
        });
    }

    // Check Vectorize
    const vectorStart = Date.now();
    try {
        // Try a simple query with a dummy vector
        await c.env.VECTORS.query(new Array(768).fill(0), { topK: 1 });
        checks.push({
            name: 'vectorize',
            status: 'healthy',
            responseTimeMs: Date.now() - vectorStart,
        });
    } catch (error) {
        checks.push({
            name: 'vectorize',
            status: 'degraded',
            responseTimeMs: Date.now() - vectorStart,
            message: error instanceof Error ? error.message : 'Vectorize query failed',
        });
    }

    // Check Service (Circuit Breaker status)
    const aiStart = Date.now();
    try {
        const { getCircuitBreakerStatus } = await import('../lib/circuit-breaker');
        const aiTextGenStatus = await getCircuitBreakerStatus(c.env, 'ai-text-gen');
        const aiEmbeddingsStatus = await getCircuitBreakerStatus(c.env, 'ai-embeddings');
        
        checks.push({
            name: 'ai_service',
            status: aiTextGenStatus.state === 'OPEN' ? 'degraded' : 'healthy',
            responseTimeMs: Date.now() - aiStart,
            details: {
                textGenCircuit: aiTextGenStatus.state,
                embeddingsCircuit: aiEmbeddingsStatus.state,
                textGenFailures: aiTextGenStatus.failures,
            },
        });
    } catch (error) {
        checks.push({
            name: 'ai_service',
            status: 'degraded',
            responseTimeMs: Date.now() - aiStart,
            message: error instanceof Error ? error.message : 'AI status check failed',
        });
    }

    // Check Durable Objects
    const doStart = Date.now();
    try {
        const id = c.env.LIVE_COUNTER.idFromName('health-check');
        const stub = c.env.LIVE_COUNTER.get(id);
        const response = await stub.fetch(new Request('https://internal/get'));
        checks.push({
            name: 'durable_objects',
            status: response.ok ? 'healthy' : 'degraded',
            responseTimeMs: Date.now() - doStart,
        });
    } catch (error) {
        checks.push({
            name: 'durable_objects',
            status: 'unhealthy',
            responseTimeMs: Date.now() - doStart,
            message: error instanceof Error ? error.message : 'Durable Objects unavailable',
        });
    }

    // Calculate overall status
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) overallStatus = 'unhealthy';
    else if (degradedCount > 0) overallStatus = 'degraded';

    const totalResponseTime = Date.now() - startTime;

    // Log health check to analytics
    try {
        c.env.ANALYTICS.writeDataPoint({
            blobs: ['health_check', overallStatus],
            doubles: [totalResponseTime, checks.length, unhealthyCount, degradedCount],
            indexes: ['health_check', overallStatus],
        });
    } catch {
        // Ignore analytics errors
    }

    return c.json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: c.env.API_VERSION || '2.4.0',
        environment: c.env.ENVIRONMENT || 'development',
        response_time_ms: totalResponseTime,
        checks,
    }, overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503);
});

// ───────────────────────────────────────────────────────────────────────────────
// Readiness Probe - For Kubernetes/Docker health checks
// ───────────────────────────────────────────────────────────────────────────────
router.get('/health/ready', async (c) => {
    try {
        // Minimal check - just verify DB is accessible
        await c.env.DB.prepare('SELECT 1').first();
        return c.json({ ready: true }, 200);
    } catch {
        return c.json({ ready: false }, 503);
    }
});

// ───────────────────────────────────────────────────────────────────────────────
// Liveness Probe - For Kubernetes/Docker health checks
// ───────────────────────────────────────────────────────────────────────────────
router.get('/health/live', async (c) => {
    // Simple liveness check - if we can respond, we're alive
    return c.json({ alive: true }, 200);
});

export { router as systemRouter };
