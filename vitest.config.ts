import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, 'frontend/src'),
        },
    },
    test: {
        // No workers pool: every test here uses mocks (tests/mocks/env), and
        // @cloudflare/vitest-pool-workers only supports vitest 2.0–3.2 while
        // vitest 4 is installed — with the pool configured, `npm test` ran
        // ZERO tests and errored. Plain node covers the whole suite.
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'frontend/src/**/*.test.tsx'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.test.ts',
            ],
        },
    },
});
