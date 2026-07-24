import { Hono } from 'hono';
import type { Env, Variables } from '../types';
import { getWorldCupTeams, refreshWorldCupTeams } from '../lib/worldcup';

const router = new Hono<{ Bindings: Env; Variables: Variables }>();

// GET /world-cup/teams — African nations still in the World Cup (auto-updated).
router.get('/teams', async (c) => {
  const { teams, updatedAt, nextFixture, fixtures, results } = await getWorldCupTeams(c.env);
  // Short browser/edge cache; the cron refreshes the underlying KV.
  c.header('Cache-Control', 'public, max-age=600');
  return c.json({ teams, updated_at: updatedAt, next_fixture: nextFixture, fixtures, results });
});

// POST /world-cup/refresh — force a re-pull from the live feed (the cron also
// does this every 30 min). Idempotent and safe; returns the fresh snapshot.
router.post('/refresh', async (c) => {
  await refreshWorldCupTeams(c.env);
  const { teams, updatedAt, nextFixture, fixtures, results } = await getWorldCupTeams(c.env);
  return c.json({ teams, updated_at: updatedAt, next_fixture: nextFixture, fixtures, results });
});

export default router;
