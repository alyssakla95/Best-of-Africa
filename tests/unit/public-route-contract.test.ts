import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('public route production acceptance inventory', () => {
    const inventory = JSON.parse(readFileSync(resolve('scripts/public-route-inventory.json'), 'utf8')) as string[];
    const app = readFileSync(resolve('frontend/src/App.tsx'), 'utf8');

    it('keeps every reader-facing route represented in the browser audit', () => {
        const routePatterns = [...app.matchAll(/<Route\s+path="([^"]+)"/g)]
            .map(match => match[1])
            .filter(path => !['/admin', '/sponsor/dashboard', '*'].includes(path));
        const represented = (pattern: string) => inventory.some(route => {
            const expected = pattern
                .replace(/:[^/]+/g, '[^/]+');
            return new RegExp(`^${expected}$`).test(route);
        });
        expect(routePatterns.filter(pattern => !represented(pattern))).toEqual([]);
    });

    it('contains no duplicate, query-only or trailing-slash audit entries', () => {
        expect(new Set(inventory).size).toBe(inventory.length);
        expect(inventory.filter(route => route !== '/' && (route.endsWith('/') || route.includes('?')))).toEqual([]);
    });
});
