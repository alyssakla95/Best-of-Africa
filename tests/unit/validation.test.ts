// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION UNIT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
    IdSchema,
    PaginationSchema,
    CreateArticleSchema,
    SearchQuerySchema,
    CountryCodeParamSchema,
    UuidParamSchema,
    ArticleQuerySchema,
    BookingRequestSchema,
    EventRegistrationSchema,
    AiChatSchema,
    AiReframeSchema,
} from '../../src/lib/validation';

describe('Validation Schemas', () => {
    describe('IdSchema', () => {
        it('should validate a valid UUID', () => {
            const validUuid = '550e8400-e29b-41d4-a716-446655440000';
            expect(() => IdSchema.parse(validUuid)).not.toThrow();
        });

        it('should reject invalid UUID format', () => {
            const invalidUuid = 'not-a-uuid';
            expect(() => IdSchema.parse(invalidUuid)).toThrow();
        });

        it('should reject empty string', () => {
            expect(() => IdSchema.parse('')).toThrow();
        });
    });

    describe('PaginationSchema', () => {
        it('should parse valid pagination params', () => {
            const result = PaginationSchema.parse({ page: '2', limit: '50' });
            expect(result.page).toBe(2);
            expect(result.limit).toBe(50);
        });

        it('should use default values', () => {
            const result = PaginationSchema.parse({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        it('should reject non-numeric values', () => {
            expect(() => PaginationSchema.parse({ page: 'abc' })).toThrow();
        });
    });

    describe('CreateArticleSchema', () => {
        it('should validate valid article creation', () => {
            const validArticle = {
                title: 'Test Article Title',
                content: 'This is the article content that is definitely longer than 100 characters. '.repeat(3),
                country_code: 'NG',
                sector_id: '550e8400-e29b-41d4-a716-446655440000',
            };
            expect(() => CreateArticleSchema.parse(validArticle)).not.toThrow();
        });

        it('should reject title that is too short', () => {
            const invalidArticle = {
                title: 'Hi',
                content: 'This is a very long content that should pass the minimum length requirement. '.repeat(3),
            };
            expect(() => CreateArticleSchema.parse(invalidArticle)).toThrow();
        });

        it('should reject title that is too long', () => {
            const invalidArticle = {
                title: 'A'.repeat(201),
                content: 'This is a very long content that should pass the minimum length requirement. '.repeat(3),
            };
            expect(() => CreateArticleSchema.parse(invalidArticle)).toThrow();
        });

        it('should reject content that is too short', () => {
            const invalidArticle = {
                title: 'Valid Title',
                content: 'Too short',
            };
            expect(() => CreateArticleSchema.parse(invalidArticle)).toThrow();
        });

        it('should accept optional fields', () => {
            const minimalArticle = {
                title: 'Valid Title',
                content: 'This is the article content that is definitely longer than 100 characters. '.repeat(3),
            };
            const result = CreateArticleSchema.parse(minimalArticle);
            expect(result.is_sponsored).toBe(false);
        });

        it('should validate country_code length', () => {
            const article = {
                title: 'Valid Title',
                content: 'This is the article content that is definitely longer than 100 characters. '.repeat(3),
                country_code: 'NGA', // Too long
            };
            expect(() => CreateArticleSchema.parse(article)).toThrow();
        });
    });

    describe('SearchQuerySchema', () => {
        it('should validate search query', () => {
            const validSearch = { q: 'africa investment' };
            expect(() => SearchQuerySchema.parse(validSearch)).not.toThrow();
        });

        it('should reject query that is too short', () => {
            const invalidSearch = { q: 'a' };
            expect(() => SearchQuerySchema.parse(invalidSearch)).toThrow();
        });

        it('should accept optional filters', () => {
            const search = {
                q: 'nigeria',
                country: 'NG',
                sector: '550e8400-e29b-41d4-a716-446655440000',
                page: '1',
            };
            const result = SearchQuerySchema.parse(search);
            expect(result.page).toBe(1);
        });

        it('should reject invalid country code', () => {
            const search = { q: 'test', country: 'NGA' };
            expect(() => SearchQuerySchema.parse(search)).toThrow();
        });
    });

    describe('CountryCodeParamSchema', () => {
        it('should validate and transform country code', () => {
            const result = CountryCodeParamSchema.parse({ code: 'ng' });
            expect(result.code).toBe('NG');
        });

        it('should reject invalid country code length', () => {
            expect(() => CountryCodeParamSchema.parse({ code: 'NGA' })).toThrow();
            expect(() => CountryCodeParamSchema.parse({ code: 'N' })).toThrow();
        });
    });

    describe('UuidParamSchema', () => {
        it('should validate UUID parameter', () => {
            const valid = { id: '550e8400-e29b-41d4-a716-446655440000' };
            expect(() => UuidParamSchema.parse(valid)).not.toThrow();
        });

        it('should reject invalid UUID', () => {
            const invalid = { id: 'not-a-uuid' };
            expect(() => UuidParamSchema.parse(invalid)).toThrow();
        });
    });

    describe('ArticleQuerySchema', () => {
        it('should use default values', () => {
            const result = ArticleQuerySchema.parse({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
            expect(result.sort).toBe('published_at');
            expect(result.order).toBe('desc');
        });

        it('should accept valid sort fields', () => {
            const validSorts = ['published_at', 'engagement_score', 'view_count', 'created_at'];
            for (const sort of validSorts) {
                expect(() => ArticleQuerySchema.parse({ sort })).not.toThrow();
            }
        });

        it('should reject invalid sort field', () => {
            expect(() => ArticleQuerySchema.parse({ sort: 'invalid_field' })).toThrow();
        });

        it('should accept valid order values', () => {
            expect(() => ArticleQuerySchema.parse({ order: 'asc' })).not.toThrow();
            expect(() => ArticleQuerySchema.parse({ order: 'ASC' })).not.toThrow();
            expect(() => ArticleQuerySchema.parse({ order: 'desc' })).not.toThrow();
            expect(() => ArticleQuerySchema.parse({ order: 'DESC' })).not.toThrow();
        });

        it('should reject invalid order value', () => {
            expect(() => ArticleQuerySchema.parse({ order: 'invalid' })).toThrow();
        });
    });

    describe('BookingRequestSchema', () => {
        it('should validate booking request', () => {
            const validBooking = {
                service_type: 'Hotel',
                destination_country: 'KE',
                guest_email: 'test@example.com',
            };
            expect(() => BookingRequestSchema.parse(validBooking)).not.toThrow();
        });

        it('should use default urgency', () => {
            const booking = { service_type: 'Flight' };
            const result = BookingRequestSchema.parse(booking);
            expect(result.urgency).toBe('Normal');
        });

        it('should validate urgency values', () => {
            const validUrgencies = ['Normal', 'Urgent', 'Low'];
            for (const urgency of validUrgencies) {
                expect(() => 
                    BookingRequestSchema.parse({ service_type: 'Test', urgency })
                ).not.toThrow();
            }
        });

        it('should reject invalid urgency', () => {
            expect(() => 
                BookingRequestSchema.parse({ service_type: 'Test', urgency: 'Invalid' })
            ).toThrow();
        });

        it('should validate email format when provided', () => {
            const booking = {
                service_type: 'Concierge',
                guest_email: 'invalid-email',
            };
            expect(() => BookingRequestSchema.parse(booking)).toThrow();
        });
    });

    describe('EventRegistrationSchema', () => {
        it('should validate registration', () => {
            const valid = {
                user_email: 'attendee@example.com',
                user_name: 'John Doe',
            };
            expect(() => EventRegistrationSchema.parse(valid)).not.toThrow();
        });

        it('should require email', () => {
            const invalid = { user_name: 'John Doe' };
            expect(() => EventRegistrationSchema.parse(invalid)).toThrow();
        });

        it('should require name', () => {
            const invalid = { user_email: 'test@example.com' };
            expect(() => EventRegistrationSchema.parse(invalid)).toThrow();
        });

        it('should validate email format', () => {
            const invalid = {
                user_email: 'not-an-email',
                user_name: 'John',
            };
            expect(() => EventRegistrationSchema.parse(invalid)).toThrow();
        });

        it('should use default ticket type', () => {
            const valid = {
                user_email: 'test@example.com',
                user_name: 'John',
            };
            const result = EventRegistrationSchema.parse(valid);
            expect(result.ticket_type).toBe('Standard');
        });
    });

    describe('AiChatSchema', () => {
        it('should validate chat message', () => {
            const valid = { message: 'Hello AI' };
            expect(() => AiChatSchema.parse(valid)).not.toThrow();
        });

        it('should reject message that is too short', () => {
            const invalid = { message: 'H' };
            expect(() => AiChatSchema.parse(invalid)).toThrow();
        });

        it('should reject message that is too long', () => {
            const invalid = { message: 'A'.repeat(1001) };
            expect(() => AiChatSchema.parse(invalid)).toThrow();
        });
    });

    describe('AiReframeSchema', () => {
        it('should validate reframe request', () => {
            const valid = {
                articleId: '550e8400-e29b-41d4-a716-446655440000',
                lens: 'investor',
            };
            expect(() => AiReframeSchema.parse(valid)).not.toThrow();
        });

        it('should accept all valid lens values', () => {
            const validLenses = ['investor', 'government', 'explorer'];
            for (const lens of validLenses) {
                expect(() => 
                    AiReframeSchema.parse({ articleId: '550e8400-e29b-41d4-a716-446655440000', lens })
                ).not.toThrow();
            }
        });

        it('should reject invalid lens', () => {
            const invalid = {
                articleId: '550e8400-e29b-41d4-a716-446655440000',
                lens: 'invalid',
            };
            expect(() => AiReframeSchema.parse(invalid)).toThrow();
        });

        it('should reject invalid UUID', () => {
            const invalid = {
                articleId: 'not-a-uuid',
                lens: 'investor',
            };
            expect(() => AiReframeSchema.parse(invalid)).toThrow();
        });
    });
});
