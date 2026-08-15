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

  it('consolidates persistent mobile navigation without removing product routes', () => {
    const dock = readFileSync(join(process.cwd(), 'frontend/src/components/MobileNavigationDock.tsx'), 'utf8');
    const breadcrumbs = readFileSync(join(process.cwd(), 'frontend/src/components/Breadcrumbs.tsx'), 'utf8');
    const nav = readFileSync(join(process.cwd(), 'frontend/src/components/NavBar.tsx'), 'utf8');
    expect(dock).toContain("label: 'Work'");
    expect(dock).toContain('grid-cols-4');
    expect(dock).toContain("currentJourney.id === 'network' || currentJourney.id === 'enterprise'");
    expect(breadcrumbs).toContain('sm:hidden');
    expect(breadcrumbs).toContain('OPEN_MOBILE_MENU_EVENT');
    expect(breadcrumbs).toContain('sm:flex');
    expect(nav).toContain('selectedMobileJourney.links.map');
    expect(nav).toContain('role="tablist"');
    expect(nav).toContain('You never need to understand the whole platform at once.');
  });

  it('uses compact route switching and progressive disclosure on analytical pages', () => {
    const switcher = readFileSync(join(process.cwd(), 'frontend/src/components/RouteViewSwitcher.tsx'), 'utf8');
    const intelligence = readFileSync(join(process.cwd(), 'frontend/src/pages/beta/BetaIntelligence.tsx'), 'utf8');
    const continental = readFileSync(join(process.cwd(), 'frontend/src/pages/beta/BetaContinentalOverview.tsx'), 'utf8');
    const guide = readFileSync(join(process.cwd(), 'frontend/src/components/PageReadingGuide.tsx'), 'utf8');
    const longPageNav = readFileSync(join(process.cwd(), 'frontend/src/components/ScrollToTopButton.tsx'), 'utf8');
    const workspace = readFileSync(join(process.cwd(), 'frontend/src/components/intelligence/DecisionWorkspace.tsx'), 'utf8');

    expect(switcher).toContain('sm:hidden');
    expect(switcher).toContain('hidden gap-1 overflow-x-auto sm:flex');
    expect(intelligence).toContain('<RouteViewSwitcher');
    expect(continental).toContain('<RouteViewSwitcher');
    expect(guide).toContain('return <details');
    expect(guide).toContain('<summary');
    expect(longPageNav).toContain('aria-label="Sections on this page"');
    expect(longPageNav).toContain('h-11 w-11');
    expect(workspace).toContain('decisionRows.map(([area,status,evidence,next]) => <details');
    expect(workspace).toContain('groupedMacroIndicators.map((group,index) => <details');
    expect(workspace).toContain('open={index === 0}');
  });

  it('records session-linked progress and only explicit journey milestones', () => {
    const telemetry = readFileSync(join(process.cwd(), 'frontend/src/lib/navigationTelemetry.ts'), 'utf8');
    const layout = readFileSync(join(process.cwd(), 'frontend/src/components/Layout.tsx'), 'utf8');
    const reports = readFileSync(join(process.cwd(), 'frontend/src/pages/beta/BetaReport.tsx'), 'utf8');
    const network = readFileSync(join(process.cwd(), 'frontend/src/pages/KnowledgeNetworkPages.tsx'), 'utf8');
    expect(telemetry).toContain("type: 'journey_progress'");
    expect(telemetry).toContain("type: 'journey_complete'");
    expect(layout).toContain('trackJourneyProgress(journeyForPath(location.pathname).id, path)');
    expect(reports).toContain("trackJourneyCompletion('markets', 'structured_report_open'");
    expect(network).toContain("trackJourneyCompletion('network', 'review_submission'");
  });
});
