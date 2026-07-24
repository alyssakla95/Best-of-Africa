// ═══════════════════════════════════════════════════════════════════════════════
// STRUCTURED LOGGING UTILITY
// JSON-based logging for observability and debugging
// ═══════════════════════════════════════════════════════════════════════════════

import type { Env } from '../types';

// ───────────────────────────────────────────────────────────────────────────────
// Log Levels
// ───────────────────────────────────────────────────────────────────────────────
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
};

// ───────────────────────────────────────────────────────────────────────────────
// Log Entry Structure
// ───────────────────────────────────────────────────────────────────────────────
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    event: string;
    message?: string;
    requestId?: string;
    route?: string;
    userId?: string;
    clientId?: string;
    durationMs?: number;
    metadata?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Logger Configuration
// ───────────────────────────────────────────────────────────────────────────────
interface LoggerConfig {
    minLevel: LogLevel;
    environment: string;
    enableAnalytics: boolean;
    defaultMetadata?: Record<string, unknown>;
}

// ───────────────────────────────────────────────────────────────────────────────
// Structured Logger Class
// ───────────────────────────────────────────────────────────────────────────────
export class Logger {
    private config: LoggerConfig;
    private env?: Env;
    private requestContext?: {
        requestId: string;
        route: string;
        userId?: string;
        clientId?: string;
    };

    constructor(
        config: Partial<LoggerConfig> = {},
        env?: Env,
        requestContext?: Logger['requestContext']
    ) {
        this.config = {
            minLevel: (config.minLevel || 'info') as LogLevel,
            environment: (config.environment || env?.ENVIRONMENT || 'development'),
            enableAnalytics: true,
            ...config,
        };
        this.env = env;
        this.requestContext = requestContext;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Core Logging Method
    // ───────────────────────────────────────────────────────────────────────────
    private log(level: LogLevel, event: string, message?: string, metadata?: Record<string, unknown>): void {
        if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.minLevel]) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            event,
            message,
            ...this.requestContext,
            ...this.config.defaultMetadata,
            metadata,
        };

        // Output structured JSON log
        const logOutput = JSON.stringify(entry);

        switch (level) {
            case 'debug':
                console.debug(logOutput);
                break;
            case 'info':
                console.log(logOutput);
                break;
            case 'warn':
                console.warn(logOutput);
                break;
            case 'error':
            case 'fatal':
                console.error(logOutput);
                break;
        }

        // Send to Analytics Engine in production
        if (this.config.enableAnalytics && this.env?.ANALYTICS && level !== 'debug') {
            this.sendToAnalytics(entry);
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Send to Cloudflare Analytics Engine
    // ───────────────────────────────────────────────────────────────────────────
    private sendToAnalytics(entry: LogEntry): void {
        try {
            this.env!.ANALYTICS.writeDataPoint({
                blobs: [
                    entry.level,
                    entry.event,
                    entry.message || '',
                    entry.requestId || '',
                    entry.route || '',
                ],
                doubles: [
                    entry.durationMs || 0,
                    LOG_LEVEL_PRIORITY[entry.level],
                ],
                indexes: [entry.level, entry.event],
            });
        } catch (err) {
            // Fail silently - don't let logging errors break the app
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                event: 'analytics_log_failed',
                message: err instanceof Error ? err.message : 'Unknown error',
            }));
        }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Public Logging Methods
    // ───────────────────────────────────────────────────────────────────────────
    debug(event: string, message?: string, metadata?: Record<string, unknown>): void {
        this.log('debug', event, message, metadata);
    }

    info(event: string, message?: string, metadata?: Record<string, unknown>): void {
        this.log('info', event, message, metadata);
    }

    warn(event: string, message?: string, metadata?: Record<string, unknown>): void {
        this.log('warn', event, message, metadata);
    }

    error(event: string, error: Error, metadata?: Record<string, unknown>): void {
        this.log('error', event, error.message, {
            ...metadata,
            error: {
                name: error.name,
                message: error.message,
                stack: this.config.environment === 'development' ? error.stack : undefined,
            },
        });
    }

    fatal(event: string, error: Error, metadata?: Record<string, unknown>): void {
        this.log('fatal', event, error.message, {
            ...metadata,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
        });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Performance Tracking
    // ───────────────────────────────────────────────────────────────────────────
    trackPerformance<T>(
        event: string,
        operation: () => Promise<T>,
        metadata?: Record<string, unknown>
    ): Promise<T> {
        const start = Date.now();
        return operation()
            .then((result) => {
                this.info(event, 'Operation completed', {
                    ...metadata,
                    durationMs: Date.now() - start,
                    success: true,
                });
                return result;
            })
            .catch((error) => {
                this.error(event, error instanceof Error ? error : new Error(String(error)), {
                    ...metadata,
                    durationMs: Date.now() - start,
                    success: false,
                });
                throw error;
            });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // Create child logger with additional context
    // ───────────────────────────────────────────────────────────────────────────
    child(additionalContext: Record<string, unknown>): Logger {
        return new Logger(
            {
                ...this.config,
                defaultMetadata: {
                    ...this.config.defaultMetadata,
                    ...additionalContext,
                },
            },
            this.env,
            this.requestContext
        );
    }
}

// ───────────────────────────────────────────────────────────────────────────────
// Global Logger Instance (for non-request contexts)
// ───────────────────────────────────────────────────────────────────────────────
let globalLogger: Logger | null = null;

export function getGlobalLogger(env?: Env): Logger {
    if (!globalLogger) {
        globalLogger = new Logger({}, env);
    }
    return globalLogger;
}

// ───────────────────────────────────────────────────────────────────────────────
// Hono Middleware for Request Logging
// ───────────────────────────────────────────────────────────────────────────────
import type { MiddlewareHandler } from 'hono';

export function requestLogger(): MiddlewareHandler {
    return async (c, next) => {
        const start = Date.now();
        const requestId = c.get('requestId') || crypto.randomUUID();
        const route = `${c.req.method} ${c.req.path}`;

        // Create request-scoped logger
        const logger = new Logger(
            { environment: c.env.ENVIRONMENT },
            c.env,
            {
                requestId,
                route,
                userId: c.get('userId'),
                clientId: c.get('clientId'),
            }
        );

        // Attach logger to context for route handlers
        c.set('logger', logger);

        logger.info('request_started', 'Incoming request', {
            method: c.req.method,
            path: c.req.path,
            userAgent: c.req.header('User-Agent'),
            ip: c.req.header('CF-Connecting-IP'),
        });

        try {
            await next();

            const duration = Date.now() - start;
            const status = c.res.status;

            if (status >= 500) {
                logger.error('request_error', new Error(`HTTP ${status}`), { status, durationMs: duration });
            } else if (status >= 400) {
                logger.warn('request_warning', `Client error ${status}`, { status, durationMs: duration });
            } else {
                logger.info('request_completed', 'Request successful', { status, durationMs: duration });
            }

            // Add performance header
            c.header('X-Response-Time', `${duration}ms`);

        } catch (error) {
            const duration = Date.now() - start;
            logger.error(
                'request_failed',
                error instanceof Error ? error : new Error(String(error)),
                { durationMs: duration }
            );
            throw error;
        }
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Specialized Loggers for Common Events
// ───────────────────────────────────────────────────────────────────────────────

export const logger = {
    // Operations
    aiRequest: (env: Env, model: string, promptLength: number, durationMs: number, success: boolean) => {
        const log = getGlobalLogger(env);
        const event = success ? 'ai_request_success' : 'ai_request_failed';
        log.info(event, 'AI model request', { model, promptLength, durationMs, success });
    },

    // Database Operations
    dbQuery: (env: Env, operation: string, table: string, durationMs: number, rowsAffected?: number) => {
        getGlobalLogger(env).debug('db_query', 'Database operation', {
            operation,
            table,
            durationMs,
            rowsAffected,
        });
    },

    // Cache Operations
    cacheOperation: (env: Env, operation: 'get' | 'set' | 'delete', key: string, hit?: boolean) => {
        getGlobalLogger(env).debug('cache_operation', 'Cache operation', {
            operation,
            key,
            hit,
        });
    },

    // Security Events
    securityEvent: (env: Env, event: string, details: Record<string, unknown>) => {
        getGlobalLogger(env).warn('security_event', event, details);
    },

    // Business Events
    businessEvent: (env: Env, event: string, details: Record<string, unknown>) => {
        getGlobalLogger(env).info('business_event', event, details);
    },
};
