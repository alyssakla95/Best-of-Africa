import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Env } from '../../src/types';
import { auditHistoricalSectorAssignments } from '../../src/workers/generator';

describe('historical sector assignment audit', () => {
    it('requires evidence review for every historical label, including general', () => {
        const migration = readFileSync('migrations/0062_sector_assignment_audit.sql', 'utf8');
        expect(migration).toContain("sector_assignment_method = 'legacy_pending_review'");
        expect(migration).not.toContain('legacy_general');
        expect(migration).toMatch(/sector_reviewed_at\s*=\s*NULL/);
    });

    it('qualifies strong evidence and corrects a conflicting legacy label without a model call', async () => {
        const updates: unknown[][] = [];
        const rows = [
            {
                id: 'clear-correction',
                title: 'Solar electricity grid expansion reaches rural districts',
                summary: 'Renewable power generation is connected to the national electricity grid.',
                content: 'The energy project includes solar generation, grid capacity and electricity distribution.',
                sector_id: 'finance',
            },
            {
                id: 'clear-confirmation',
                title: 'Cocoa farmers expand agricultural processing',
                summary: 'The farming programme supports cocoa harvests and agribusiness capacity.',
                content: 'Agriculture cooperatives will improve crop yields and farmer access to processing.',
                sector_id: 'agriculture',
            },
        ];
        const db = {
            prepare(sql: string) {
                const statement: Record<string, unknown> = {
                    bind: (...values: unknown[]) => {
                        statement.values = values;
                        return statement;
                    },
                    all: async () => ({ results: /SELECT id, title, summary, content, sector_id/i.test(sql) ? rows : [] }),
                };
                return statement;
            },
            async batch(statements: Array<Record<string, unknown>>) {
                for (const statement of statements) updates.push(statement.values as unknown[]);
                return statements.map(() => ({ success: true }));
            },
        } as unknown as D1Database;

        const result = await auditHistoricalSectorAssignments({ DB: db } as Env, 12);

        expect(result).toEqual({ checked: 2, qualified: 2, corrected: 1, needsReview: 0 });
        expect(updates).toHaveLength(2);
        expect(updates).toContainEqual(expect.arrayContaining(['energy', 'energy', 'clear-correction']));
        expect(updates).toContainEqual(expect.arrayContaining(['agriculture', 'agriculture', 'clear-confirmation']));
    });
});
