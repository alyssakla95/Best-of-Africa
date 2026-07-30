import { describe, expect, it } from 'vitest';
import {
    COUNTRY_BRIEF_ROTATION_SQL,
    selectNextCountryBriefTarget,
} from '../../src/workers/reporter';
import type { Env } from '../../src/types';

describe('country evidence brief rotation', () => {
    it('selects the country returned by the fair rotation query', async () => {
        let capturedSql = '';
        const statement = {
            first: async () => ({ country_code: 'KE' }),
        };
        const env = {
            DB: {
                prepare: (sql: string) => {
                    capturedSql = sql;
                    return statement;
                },
            },
        } as unknown as Env;

        await expect(selectNextCountryBriefTarget(env)).resolves.toBe('KE');
        expect(capturedSql).toBe(COUNTRY_BRIEF_ROTATION_SQL);
    });

    it('returns no target instead of fabricating a default country', async () => {
        const env = {
            DB: {
                prepare: () => ({ first: async () => null }),
            },
        } as unknown as Env;

        await expect(selectNextCountryBriefTarget(env)).resolves.toBeNull();
    });

    it('prioritizes never-briefed and least-recently briefed countries', () => {
        expect(COUNTRY_BRIEF_ROTATION_SQL).toContain(
            'CASE WHEN latest_country_briefs.last_brief_at IS NULL THEN 0 ELSE 1 END ASC',
        );
        expect(COUNTRY_BRIEF_ROTATION_SQL).toContain(
            'latest_country_briefs.last_brief_at ASC',
        );
        expect(COUNTRY_BRIEF_ROTATION_SQL).toContain("a.status = 'published'");
        expect(COUNTRY_BRIEF_ROTATION_SQL).toContain("datetime('now', '-30 days')");
        expect(COUNTRY_BRIEF_ROTATION_SQL).not.toContain("'-24 hours'");
    });
});
