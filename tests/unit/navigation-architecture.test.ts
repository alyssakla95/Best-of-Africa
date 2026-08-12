import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JOURNEYS, hasJourneyForPath, journeyForPath, journeysForAudience } from '../../frontend/src/lib/navigation';

describe('unified application navigation', () => {
  it('exposes four stable audience journeys', () => {
    expect(JOURNEYS.map(journey => journey.id)).toEqual(['read', 'markets', 'network', 'enterprise']);
    expect(JOURNEYS.every(journey => journey.links.length === 4)).toBe(true);
  });

  it('keeps market surfaces within one market journey', () => {
    expect(journeyForPath('/intelligence/sectors').id).toBe('markets');
    expect(journeyForPath('/dashboards/overview').id).toBe('markets');
    expect(journeyForPath('/countries/NG').id).toBe('markets');
  });

  it('distinguishes the professional network from enterprise workflows', () => {
    expect(journeyForPath('/specialists/circles').id).toBe('network');
    expect(journeyForPath('/decision-rooms/example').id).toBe('network');
    expect(journeyForPath('/community-transition/example').id).toBe('network');
    expect(journeyForPath('/specialists/requests/new').id).toBe('enterprise');
    expect(journeyForPath('/enterprise/access').id).toBe('enterprise');
  });

  it('does not force account and utility pages into a product journey', () => {
    expect(hasJourneyForPath('/settings')).toBe(false);
    expect(hasJourneyForPath('/search')).toBe(false);
    expect(hasJourneyForPath('/privacy')).toBe(false);
  });

  it('prioritizes the workspace that matches an authenticated role', () => {
    const enterprise = journeysForAudience('enterprise').find(journey => journey.id === 'enterprise');
    const specialist = journeysForAudience('specialist').find(journey => journey.id === 'network');
    const member = journeysForAudience('premium').find(journey => journey.id === 'read');
    expect(enterprise?.href).toBe('/specialists/requests');
    expect(enterprise?.links.map(link => link.href)).toContain('/enterprise/decision-rooms');
    expect(specialist?.href).toBe('/specialists/dashboard');
    expect(member?.links.map(link => link.href)).toContain('/library');
  });

  it('consolidates obsolete duplicate surfaces behind canonical redirects', () => {
    const app = readFileSync(join(process.cwd(), 'frontend/src/App.tsx'), 'utf8');
    const memberAccess = readFileSync(join(process.cwd(), 'frontend/src/pages/beta/BetaMemberAccess.tsx'), 'utf8');
    expect(app).toContain('path="/gallery"         element={<Navigate to="/posts" replace />}');
    expect(app).toContain('path="/supporter-feed"  element={<Navigate to="/intelligence" replace />}');
    expect(app).toContain('path="/login"    element={<LegacyMemberLoginRedirect />}');
    expect(app).not.toContain("import('./pages/beta/BetaGallery')");
    expect(app).not.toContain("import('./pages/beta/BetaMarketIntel')");
    expect(app).not.toContain("import('./pages/LoginPage')");
    expect(memberAccess).toContain('loginAuth(res.token');
    expect(memberAccess).toContain('logoutAuth();');
  });

  it('measures journey choices across the shared navigation without blocking navigation', () => {
    const telemetry = readFileSync(join(process.cwd(), 'frontend/src/lib/navigationTelemetry.ts'), 'utf8');
    const landing = readFileSync(join(process.cwd(), 'frontend/src/pages/beta/BetaLanding.tsx'), 'utf8');
    const nav = readFileSync(join(process.cwd(), 'frontend/src/components/NavBar.tsx'), 'utf8');
    expect(telemetry).toContain("type: 'click'");
    expect(telemetry).toContain('resource_id: `journey:${source}:${journey}`');
    expect(landing).toContain("'home_gateway'");
    expect(nav).toContain("'desktop_menu'");
    expect(nav).toContain("'mobile_menu'");
  });
});
