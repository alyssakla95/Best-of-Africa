import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { WORLD_CUP, type WorldCupTeam, type WorldCupFixture, type WorldCupResult } from '../config/worldCup';

/**
 * Returns the African nations still in the World Cup, the next fixture, and
 * recent results involving them when the temporary live feature is enabled.
 * Failed requests return no claims; stale seed data is never presented as live.
 */
export function useWorldCupTeams(): { teams: WorldCupTeam[]; updatedAt: string | null; nextFixture: WorldCupFixture | null; fixtures: WorldCupFixture[]; results: WorldCupResult[] } {
  const { data } = useQuery({
    queryKey: ['world-cup-teams'],
    queryFn: api.getWorldCupTeams,
    staleTime: 30 * 60 * 1000, // 30 min, matches the backend refresh cadence
    enabled: WORLD_CUP.enabled,
  });

  if (data?.teams) {
    return {
      teams: data.teams,
      updatedAt: data.updated_at ?? null,
      nextFixture: data.next_fixture ?? null,
      fixtures: data.fixtures ?? [],
      results: data.results ?? [],
    };
  }
  return { teams: [], updatedAt: null, nextFixture: null, fixtures: [], results: [] };
}
