// ═══════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION MIDDLEWARE
// Zod-based type-safe request validation for Hono
// ═══════════════════════════════════════════════════════════════════════════════

import { z } from 'zod';
import type { Context, MiddlewareHandler } from 'hono';
import type { ApiError } from '../types';

/**
 * Validation target: 
 * - json: Request body (parsed as JSON)
 * - query: URL query parameters
 * - param: URL path parameters
 */
export type ValidationTarget = 'json' | 'query' | 'param';

/**
 * Higher-order middleware for request validation.
 * Automatically returns 400 Bad Request on failure.
 * 
 * @example
 * const schema = z.object({ title: z.string() });
 * app.post('/articles', validate('json', schema), async (c) => {
 *     const data = c.req.valid('json'); // Fully typed!
 *     // ...
 * });
 */
export function validate<T extends z.ZodTypeAny>(
    target: ValidationTarget,
    schema: T
): MiddlewareHandler {
    return async (c: Context, next) => {
        let data: any;

        try {
            if (target === 'json') {
                data = await c.req.json();
            } else if (target === 'query') {
                data = c.req.query();
            } else {
                data = c.req.param();
            }

            const result = await schema.safeParseAsync(data);

            if (!result.success) {
                const errorResponse: ApiError = {
                    error: 'Validation Error',
                    message: 'The provided input is invalid.',
                    status: 400,
                };

                // Add detailed field errors for debugging/client-side display
                const fieldErrors = result.error.flatten().fieldErrors;

                return c.json({
                    ...errorResponse,
                    details: fieldErrors,
                }, 400);
            }

            // Attach validated data back to context for use in route handlers
            // Hono's middleware system will handle the typing of c.req.valid(target)
            c.req.addValidatedData(target, result.data as any);

            await next();

        } catch (error) {
            console.error(`Validation middleware error (${target}):`, error);

            return c.json({
                error: 'Bad Request',
                message: target === 'json' ? 'Invalid JSON payload' : 'Invalid request parameters',
                status: 400,
            }, 400);
        }
    };
}

// ───────────────────────────────────────────────────────────────────────────────
// Reusable Schemas
// ───────────────────────────────────────────────────────────────────────────────

/** Common UUID schema */
export const IdSchema = z.string().uuid('Invalid ID format');

/** Common Pagination schema */
export const PaginationSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).default(20),
});

/** Article Creation Schema */
export const CreateArticleSchema = z.object({
    title: z.string().min(5).max(200),
    content: z.string().min(100),
    country_code: z.string().length(2).optional(),
    sector_id: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    is_sponsored: z.boolean().default(false),
});

/** Search Query Schema */
export const SearchQuerySchema = z.object({
    q: z.string().min(2),
    country: z.string().length(2).optional(),
    sector: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/** Generic Slug/ID Parameter Schema */
export const SlugParamSchema = z.object({
    slug: z.string().min(1),
    id: z.string().min(1).optional(),
});

/** Country Code Parameter Schema */
export const CountryCodeParamSchema = z.object({
    code: z.string().length(2).transform(val => val.toUpperCase()),
});

/** UUID Param Schema */
export const UuidParamSchema = z.object({
    id: z.string().uuid(),
});

/** Detailed Article Query Schema */
export const ArticleQuerySchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).default(20),
    country: z.string().length(2).optional(),
    sector: z.string().optional(),
    region: z.string().optional(),
    sort: z.string().refine(val => (['published_at', 'engagement_score', 'view_count', 'created_at'] as string[]).includes(val), 'Invalid sort field').default('published_at'),
    order: z.string().refine(val => (['asc', 'desc', 'ASC', 'DESC'] as string[]).includes(val), 'Invalid order').default('desc'),
    lens: z.string().optional(),
    urgency: z.string().optional(),
});

/** Booking Request Schema */
export const BookingRequestSchema = z.object({
    service_type: z.string().min(2),
    destination_country: z.string().length(2).optional(),
    dates: z.record(z.string(), z.any()).optional(),
    requirements: z.string().optional(),
    budget_range: z.string().optional(),
    urgency: z.string().refine(val => (['Normal', 'Urgent', 'Low'] as string[]).includes(val), 'Invalid urgency').default('Normal'),
    guest_email: z.string().email().optional(),
    guest_name: z.string().optional(),
    guest_organization: z.string().optional(),
});

/** Event Registration Schema */
export const EventRegistrationSchema = z.object({
    user_email: z.string().email(),
    user_name: z.string().min(2),
    user_organization: z.string().optional(),
    user_title: z.string().optional(),
    ticket_type: z.string().default('Standard'),
    dietary_requirements: z.string().optional(),
    special_requests: z.string().optional(),
});

/** AI Chat Schema */
export const AiChatSchema = z.object({
    message: z.string().min(2).max(1000),
});

/** AI Reframe Schema — `targetAudience` accepted as a legacy alias for `lens` */
export const AiReframeSchema = z.object({
    articleId: z.string().uuid(),
    lens: z.string().refine(val => (['investor', 'government', 'explorer'] as string[]).includes(val), 'Invalid lens').optional(),
    targetAudience: z.string().refine(val => (['investor', 'government', 'explorer'] as string[]).includes(val), 'Invalid lens').optional(),
}).refine(data => data.lens || data.targetAudience, { message: 'lens is required' });

/** AI Reformat Schema */
export const AiReformatSchema = z.object({
    articleId: z.string().uuid(),
    format: z.string(), // Could be more specific if formats are known
});

/** Simple ID/Slug Param Schema */
export const IdOrSlugParamSchema = z.object({
    id: z.string().min(1),
});
