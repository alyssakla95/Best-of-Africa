// ─────────────────────────────────────────────────────────────────────────────
// WORLD CUP — auto-updating list of African nations still in the tournament.
//
// A scheduled task refreshes this from a live sports feed (TheSportsDB, keyless)
// and caches it in KV. The public endpoint serves the cache; the UI renders from
// it and falls back to SEED_TEAMS if the feed is ever unavailable, so the banner
// never breaks. "Still in" = appears in upcoming fixtures (eliminated teams drop
// out of the schedule automatically).
// ─────────────────────────────────────────────────────────────────────────────

import type { Env } from '../types';

export interface WorldCupTeam { name: string; flag: string; code: string; }

/** The next scheduled fixture involving an African nation. */
export interface WorldCupFixture {
  utcDate: string;                                    // ISO kickoff time
  stage?: string;                                     // e.g. "Round of 16"
  home: { name: string; code?: string };              // code present when African
  away: { name: string; code?: string };
}

/** A finished match involving an African nation, with the score. */
export interface WorldCupResult {
  utcDate: string;
  stage?: string;
  home: { name: string; code?: string; score?: number | null };
  away: { name: string; code?: string; score?: number | null };
}

const KV_KEY = 'world_cup:teams';
// TheSportsDB league id for the FIFA World Cup (overridable via env if needed).
const WC_LEAGUE_ID = '4429';

// Canonical African national teams (name variants → display/flag/code). Only
// these are ever surfaced, guaranteeing the banner stays African-only.
const AFRICAN_TEAMS: Record<string, WorldCupTeam> = {
  morocco: { name: 'Morocco', flag: '🇲🇦', code: 'MA' },
  senegal: { name: 'Senegal', flag: '🇸🇳', code: 'SN' },
  nigeria: { name: 'Nigeria', flag: '🇳🇬', code: 'NG' },
  egypt: { name: 'Egypt', flag: '🇪🇬', code: 'EG' },
  algeria: { name: 'Algeria', flag: '🇩🇿', code: 'DZ' },
  ghana: { name: 'Ghana', flag: '🇬🇭', code: 'GH' },
  tunisia: { name: 'Tunisia', flag: '🇹🇳', code: 'TN' },
  'ivory coast': { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'CI' },
  "cote d'ivoire": { name: "Côte d'Ivoire", flag: '🇨🇮', code: 'CI' },
  cameroon: { name: 'Cameroon', flag: '🇨🇲', code: 'CM' },
  'south africa': { name: 'South Africa', flag: '🇿🇦', code: 'ZA' },
  mali: { name: 'Mali', flag: '🇲🇱', code: 'ML' },
  'cape verde': { name: 'Cape Verde', flag: '🇨🇻', code: 'CV' },
  'cabo verde': { name: 'Cape Verde', flag: '🇨🇻', code: 'CV' },
  'burkina faso': { name: 'Burkina Faso', flag: '🇧🇫', code: 'BF' },
  'dr congo': { name: 'DR Congo', flag: '🇨🇩', code: 'CD' },
  'congo dr': { name: 'DR Congo', flag: '🇨🇩', code: 'CD' },
  guinea: { name: 'Guinea', flag: '🇬🇳', code: 'GN' },
  gabon: { name: 'Gabon', flag: '🇬🇦', code: 'GA' },
  angola: { name: 'Angola', flag: '🇦🇴', code: 'AO' },
  zambia: { name: 'Zambia', flag: '🇿🇲', code: 'ZM' },
  'equatorial guinea': { name: 'Equatorial Guinea', flag: '🇬🇶', code: 'GQ' },
};

// Fallback used only if the live feed has never populated the cache.
export const SEED_TEAMS: WorldCupTeam[] = [
  AFRICAN_TEAMS['morocco'], AFRICAN_TEAMS['senegal'], AFRICAN_TEAMS['nigeria'],
  AFRICAN_TEAMS['egypt'], AFRICAN_TEAMS['algeria'], AFRICAN_TEAMS['ghana'],
  AFRICAN_TEAMS['tunisia'], AFRICAN_TEAMS['ivory coast'], AFRICAN_TEAMS['cameroon'],
  AFRICAN_TEAMS['south africa'],
];

function matchAfrican(teamName: string): WorldCupTeam | null {
  const n = (teamName || '').toLowerCase().trim();
  if (AFRICAN_TEAMS[n]) return AFRICAN_TEAMS[n];
  for (const key in AFRICAN_TEAMS) {
    if (n.includes(key)) return AFRICAN_TEAMS[key];
  }
  return null;
}

// football-data.org stage codes → human labels.
const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Group Stage',
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-final',
  SEMI_FINALS: 'Semi-final',
  THIRD_PLACE: 'Third-place Play-off',
  FINAL: 'Final',
};
function prettyStage(stage?: string | null): string | undefined {
  if (!stage) return undefined;
  return STAGE_LABELS[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

// Name → flag code for likely non-African World Cup nations, so opponents also
// render a real flag. Codes are ISO 3166-1 alpha-2 (flagcdn), except the Home
// Nations which use flagcdn's UK subdivision codes (gb-eng / gb-sct / gb-wls).
const OPPONENT_CODES: Record<string, string> = {
  // UEFA
  england: 'gb-eng', scotland: 'gb-sct', wales: 'gb-wls', 'northern ireland': 'gb-nir',
  spain: 'es', france: 'fr', germany: 'de', italy: 'it', portugal: 'pt', netherlands: 'nl',
  belgium: 'be', switzerland: 'ch', croatia: 'hr', denmark: 'dk', poland: 'pl', serbia: 'rs',
  austria: 'at', czechia: 'cz', 'czech republic': 'cz', turkey: 'tr', 'türkiye': 'tr', turkiye: 'tr',
  ukraine: 'ua', norway: 'no', sweden: 'se', hungary: 'hu', romania: 'ro', greece: 'gr',
  slovenia: 'si', slovakia: 'sk', albania: 'al', russia: 'ru',
  // CONMEBOL
  argentina: 'ar', brazil: 'br', uruguay: 'uy', colombia: 'co', chile: 'cl', peru: 'pe',
  ecuador: 'ec', paraguay: 'py', bolivia: 'bo', venezuela: 've',
  // CONCACAF
  usa: 'us', 'united states': 'us', 'united states of america': 'us', mexico: 'mx', canada: 'ca',
  'costa rica': 'cr', panama: 'pa', honduras: 'hn', jamaica: 'jm', 'el salvador': 'sv',
  // AFC
  japan: 'jp', 'south korea': 'kr', 'korea republic': 'kr', 'north korea': 'kp', 'korea dpr': 'kp',
  australia: 'au', 'saudi arabia': 'sa', qatar: 'qa', iran: 'ir', 'ir iran': 'ir', iraq: 'iq',
  uae: 'ae', 'united arab emirates': 'ae', uzbekistan: 'uz', china: 'cn', 'china pr': 'cn',
  jordan: 'jo', oman: 'om', bahrain: 'bh', india: 'in', indonesia: 'id', kuwait: 'kw',
  // OFC
  'new zealand': 'nz',
};

// A side carries a flag code when we can resolve it — African nations first
// (preserving canonical display names/variants), then the opponent map.
function sideOf(name?: string | null): { name: string; code?: string } {
  const t = name ? matchAfrican(name) : null;
  if (t) return { name: t.name, code: t.code };
  const raw = (name || '').trim();
  const code = OPPONENT_CODES[raw.toLowerCase()];
  return code ? { name: raw, code } : { name: raw || 'TBD' };
}

/** Read the cached African teams still in (or the seed list if not yet populated). */
export async function getWorldCupTeams(env: Env): Promise<{ teams: WorldCupTeam[]; updatedAt: string | null; nextFixture: WorldCupFixture | null; fixtures: WorldCupFixture[]; results: WorldCupResult[] }> {
  try {
    const raw = await env.CACHE.get(KV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { teams: WorldCupTeam[]; updatedAt: string; nextFixture?: WorldCupFixture | null; fixtures?: WorldCupFixture[]; results?: WorldCupResult[] };
      // An empty teams array is meaningful once the feed has written the cache:
      // it means the African run is over (no scheduled matches left) — the page
      // then leads with the final results instead of a stale "still standing".
      if (Array.isArray(parsed.teams)) {
        // Drop fixtures that have already kicked off since the last refresh.
        const upcoming = (parsed.fixtures || []).filter(f => Date.parse(f.utcDate) > Date.now());
        const nf = parsed.nextFixture && Date.parse(parsed.nextFixture.utcDate) > Date.now()
          ? parsed.nextFixture
          : (upcoming[0] || null);
        return { teams: parsed.teams, updatedAt: parsed.updatedAt, nextFixture: nf, fixtures: upcoming, results: parsed.results || [] };
      }
    }
  } catch { /* fall through to seed */ }
  return { teams: SEED_TEAMS, updatedAt: null, nextFixture: null, fixtures: [], results: [] };
}

/**
 * Fetch upcoming World Cup fixtures from the live feed and cache the African
 * nations that still have matches scheduled. Never throws; on any failure it
 * simply leaves the existing cache untouched.
 */
export async function refreshWorldCupTeams(env: Env): Promise<void> {
  try {
    const found = new Map<string, WorldCupTeam>();
    const add = (name?: string | null) => { const t = name ? matchAfrican(name) : null; if (t) found.set(t.code, t); };

    // Candidate fixtures that involve at least one African nation; we pick the
    // earliest future one as the "next fixture".
    const fixtures: WorldCupFixture[] = [];
    const considerFixture = (home?: string | null, away?: string | null, utcDate?: string | null, stage?: string | null) => {
      if (!utcDate) return;
      const ts = Date.parse(utcDate);
      if (!Number.isFinite(ts) || ts <= Date.now()) return;      // future only
      if (!matchAfrican(home || '') && !matchAfrican(away || '')) return;
      fixtures.push({ utcDate: new Date(ts).toISOString(), stage: prettyStage(stage), home: sideOf(home), away: sideOf(away) });
    };

    const token = (env as Record<string, any>).FOOTBALL_DATA_TOKEN as string | undefined;
    let scheduledFeedOk = false;
    const results: WorldCupResult[] = [];

    if (token) {
      // Preferred: football-data.org (complete WC coverage; free tier needs
      // only a token). ONE unfiltered fetch: "still in" must count IN_PLAY /
      // PAUSED / TIMED matches too, not just SCHEDULED — filtering to
      // SCHEDULED made a lone African team "disappear" the moment its match
      // kicked off, and the empty roster read as elimination mid-match.
      const ACTIVE_STATUSES = new Set(['SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED']);
      const r = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
        headers: { 'X-Auth-Token': token },
      });
      if (r.ok) {
        scheduledFeedOk = true;
        const d = await r.json() as { matches?: Array<{ homeTeam?: { name?: string }; awayTeam?: { name?: string }; utcDate?: string; stage?: string; status?: string; score?: { fullTime?: { home?: number | null; away?: number | null } } }> };
        const tenDaysAgo = Date.now() - 10 * 86400_000;
        for (const m of d.matches || []) {
          if (ACTIVE_STATUSES.has(m.status || '')) {
            add(m.homeTeam?.name); add(m.awayTeam?.name);
            considerFixture(m.homeTeam?.name, m.awayTeam?.name, m.utcDate, m.stage);
          } else if (m.status === 'FINISHED' && Date.parse(m.utcDate || '') > tenDaysAgo) {
            // Recent results involving African sides, with scores — the page
            // shows these, and they carry the story once the run is over.
            if (!matchAfrican(m.homeTeam?.name || '') && !matchAfrican(m.awayTeam?.name || '')) continue;
            results.push({
              utcDate: m.utcDate || new Date().toISOString(),
              stage: prettyStage(m.stage),
              home: { ...sideOf(m.homeTeam?.name), score: m.score?.fullTime?.home ?? null },
              away: { ...sideOf(m.awayTeam?.name), score: m.score?.fullTime?.away ?? null },
            });
          }
        }
        results.sort((a, b) => Date.parse(b.utcDate) - Date.parse(a.utcDate));
        results.splice(6);
      }
    }

    // Fallback: TheSportsDB (keyless). Use the UPCOMING-fixtures endpoint —
    // "still in" = has a scheduled match. (The season endpoint returns stale,
    // sparse data on the free tier, which is why the banner never updated.)
    if (found.size === 0 && !scheduledFeedOk) {
      const leagueId = (env as Record<string, any>).WC_LEAGUE_ID || WC_LEAGUE_ID;
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${leagueId}`, {
        headers: { 'User-Agent': 'BestOfAfrica/1.0' },
      });
      if (res.ok) {
        const data = await res.json() as { events?: Array<{ strHomeTeam?: string; strAwayTeam?: string; strTimestamp?: string; dateEvent?: string; strTime?: string; strRound?: string }> | null };
        for (const ev of data.events || []) {
          add(ev.strHomeTeam); add(ev.strAwayTeam);
          const iso = ev.strTimestamp || (ev.dateEvent ? `${ev.dateEvent}T${ev.strTime || '00:00:00'}Z` : null);
          considerFixture(ev.strHomeTeam, ev.strAwayTeam, iso, ev.strRound ? `Round ${ev.strRound}` : null);
        }
      }
    }

    // Distinguish "feed failed" (keep the last cache, don't wipe) from "feed
    // answered and no African side has a match left" (the run is over — write
    // the empty roster so the site stops claiming someone is still standing).
    if (found.size === 0 && !scheduledFeedOk) return;

    // Guard the bracket-entry gap: if the most recent African result was a win
    // (or an ambiguous draw → decided on penalties, which fullTime can't
    // settle), the team advanced but the next round's pairing may not be in
    // the feed yet — keep the last cache rather than declaring the run over.
    // Only a clear full-time loss ends the run.
    if (found.size === 0 && results.length > 0) {
      const last = results[0];
      const h = last.home.score ?? null, a = last.away.score ?? null;
      const africanIsHome = !!matchAfrican(last.home.name);
      // An all-African tie always sends someone through — never a clear loss.
      const bothAfrican = africanIsHome && !!matchAfrican(last.away.name);
      const clearLoss = !bothAfrican && h !== null && a !== null && h !== a &&
        (africanIsHome ? h < a : a < h);
      if (!clearLoss) return;
    }

    fixtures.sort((a, b) => Date.parse(a.utcDate) - Date.parse(b.utcDate));
    const upcoming = fixtures.slice(0, 24);
    const nextFixture = upcoming[0] || null;

    const payload = JSON.stringify({ teams: Array.from(found.values()), updatedAt: new Date().toISOString(), nextFixture, fixtures: upcoming, results });
    await env.CACHE.put(KV_KEY, payload, { expirationTtl: 7 * 24 * 3600 });
  } catch (err) {
    console.error('[worldcup] refresh failed:', err);
  }
}
