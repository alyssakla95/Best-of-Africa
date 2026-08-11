import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openapiRouter } from '../../src/routes/openapi';

const read = (path: string) => readFileSync(resolve(path), 'utf8');

describe('specialist marketplace browser contract', () => {
    const app = read('frontend/src/App.tsx');
    const pages = read('frontend/src/pages/SpecialistMarketplacePages.tsx');
    const robots = read('frontend/public/robots.txt');

    it('registers every public, invitation, dashboard, and request route lazily', () => {
        for (const route of [
            '/specialists',
            '/specialists/interest',
            '/specialists/:slug',
            '/specialists/join/:token',
            '/specialists/sign-in',
            '/specialists/dashboard',
            '/specialists/requests',
            '/specialists/requests/new',
            '/specialists/requests/:id',
            '/enterprise/access',
        ]) {
            expect(app).toContain(`path="${route}"`);
        }
        expect(app).toContain("import('./pages/SpecialistMarketplacePages')");
    });

    it('keeps private marketplace surfaces out of search indexing', () => {
        expect(robots).toContain('Disallow: /specialists/join/');
        expect(robots).toContain('Disallow: /specialists/sign-in');
        expect(robots).toContain('Disallow: /specialists/dashboard');
        expect(robots).toContain('Disallow: /specialists/requests/');
        expect(robots).toContain('Disallow: /enterprise/access');
        expect(robots).not.toContain('Disallow: /specialists/interest');
        expect(pages.match(/noIndex/g)?.length).toBeGreaterThanOrEqual(3);
        expect(app).toContain('MarketplaceAccessGate kind="enterprise"');
        expect(app).toContain('MarketplaceAccessGate kind="specialist"');
    });

    it('presents the data and commercial boundaries in the user flow', () => {
        expect(pages).toContain('contains no sensitive information');
        expect(pages).toContain('Screening is not an endorsement');
        expect(pages).toContain('Listing requires approval plus a BOA waiver or an active subscription');
        expect(pages).toContain('Request status timeline');
        expect(pages).toContain('No confirmed opportunities yet');
        expect(pages).toContain('approachableMarketplaceError');
        expect(pages).toContain('temporarily unavailable');
        expect(pages).toContain('Registration is not an application or a promise of admission or work');
        expect(pages).toContain('Selected specialists may be invited to complete our screening process');
        expect(pages).toContain('Founding Specialist Network');
        expect(pages).toContain('Payment never determines verification standing');
        expect(pages).toContain('Senior / Featured Specialist');
    });
});

describe('specialist marketplace OpenAPI contract', () => {
    it('documents public, invite, Enterprise request, and Stripe webhook paths', async () => {
        const response = await openapiRouter.request('https://example.test/openapi.json');
        const spec = await response.json() as { paths: Record<string, unknown> };
        expect(Object.keys(spec.paths)).toEqual(expect.arrayContaining([
            '/specialists',
            '/services/specialist-interest',
            '/specialists/{slug}',
            '/specialists/join',
            '/specialists/requests',
            '/specialists/stripe/webhook',
        ]));
    });
});
