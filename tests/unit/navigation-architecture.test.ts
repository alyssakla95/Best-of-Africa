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

  it('keeps all four product journeys available in persistent mobile navigation', () => {
    const dock = readFileSync(join(process.cwd(), 'frontend/src/components/MobileNavigationDock.tsx'), 'utf8');
    const breadcrumbs = readFileSync(join(process.cwd(), 'frontend/src/components/Breadcrumbs.tsx'), 'utf8');
    const nav = readFileSync(join(process.cwd(), 'frontend/src/components/NavBar.tsx'), 'utf8');
    expect(dock).toContain('label: read.mobileLabel');
    expect(dock).toContain('label: markets.mobileLabel');
    expect(dock).toContain('label: network.mobileLabel');
    expect(dock).toContain('label: enterprise.mobileLabel');
    expect(dock).toContain("t('nav.mobile_primary', 'Primary mobile navigation')");
    expect(dock).toContain('grid-cols-4');
    expect(dock).toContain("currentJourney.id === 'network'");
    expect(dock).toContain("currentJourney.id === 'enterprise'");
    expect(dock).not.toContain("t('nav.work', 'Work')");
    expect(dock).not.toContain("t('nav.menu', 'More')");
    expect(breadcrumbs).toContain('sm:hidden');
    expect(breadcrumbs).toContain('OPEN_MOBILE_MENU_EVENT');
    expect(breadcrumbs).toContain('sm:flex');
    expect(nav).toContain("t('nav.open_menu', 'Open complete menu')");
    expect(nav).toContain('selectedMobileJourney.links.map');
    expect(nav).toContain('role="tablist"');
    expect(nav).toContain('You never need to understand the whole platform at once.');
  });

  it('codes persistent long-page controls for every interface language', () => {
    const controls = readFileSync(join(process.cwd(), 'frontend/src/components/ScrollToTopButton.tsx'), 'utf8');
    const dictionary = readFileSync(join(process.cwd(), 'frontend/src/i18n/dict.ts'), 'utf8');

    expect(dictionary.match(/'nav\.work'/g)).toHaveLength(7);
    expect(dictionary.match(/'nav\.mobile_primary'/g)).toHaveLength(7);
    expect(dictionary.match(/'nav\.sections'/g)).toHaveLength(7);
    expect(dictionary.match(/'nav\.on_this_page'/g)).toHaveLength(7);
    expect(dictionary.match(/'nav\.close_sections'/g)).toHaveLength(7);
    expect(dictionary.match(/'nav\.return_top'/g)).toHaveLength(7);
    expect(dictionary.match(/'nav\.menu_top'/g)).toHaveLength(7);
    expect(controls).toContain("t('nav.sections', 'Sections on this page')");
    expect(controls).toContain("t('nav.return_top', 'Return to the main menu and top of page')");
    expect(controls).toContain("t('nav.menu_top', 'Menu & top')");
  });

  it('requests generated interface translations by public catalogue key, never raw DOM text', () => {
    const translator = readFileSync(join(process.cwd(), 'frontend/src/components/InterfaceTranslator.tsx'), 'utf8');
    const client = readFileSync(join(process.cwd(), 'frontend/src/services/api.ts'), 'utf8');

    expect(translator).toContain('REMOTE_KEY_BY_TEXT.get(text)');
    expect(translator).toContain('api.translateInterface(remoteLanguage, batch.map(item => item.key))');
    expect(translator).not.toContain('api.translateInterface(remoteLanguage, batch.map(item => item.text))');
    expect(client).toContain('body: JSON.stringify({ language, keys })');
  });

  it('prevents the global player and member chat from occupying the same floating-control area', () => {
    const chat = readFileSync(join(process.cwd(), 'frontend/src/components/beta/BetaChatWidget.tsx'), 'utf8');
    const player = readFileSync(join(process.cwd(), 'frontend/src/components/beta/BetaGlobalPlayer.tsx'), 'utf8');

    expect(player).toContain('bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3');
    expect(chat).toContain("import { useAudio } from '../../context/AudioContext'");
    expect(chat).toContain('const { currentTrack } = useAudio();');
    expect(chat).toContain('if (currentTrack) setIsOpen(false);');
    expect(chat).toContain('if (!isMember || currentTrack) return null;');
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
    expect(longPageNav).toContain("aria-label={t('nav.sections', 'Sections on this page')}");
    expect(longPageNav).toContain('h-11 w-11');
    expect(workspace).toContain('decisionRows.map(([area,status,evidence,next]) => <details');
    expect(workspace).toContain('groupedMacroIndicators.map((group,index) => <details');
    expect(workspace).toContain('open={index === 0}');
  });

  it('keeps enterprise and specialist navigation task-first on phones', () => {
    const responsiveNav = readFileSync(join(process.cwd(), 'frontend/src/components/ResponsivePageNav.tsx'), 'utf8');
    const enterprise = readFileSync(join(process.cwd(), 'frontend/src/pages/EnterprisePage.tsx'), 'utf8');
    const communities = readFileSync(join(process.cwd(), 'frontend/src/pages/KnowledgeNetworkRoutePages.tsx'), 'utf8');
    const specialists = readFileSync(join(process.cwd(), 'frontend/src/pages/SpecialistMarketplacePages.tsx'), 'utf8');

    expect(responsiveNav).toContain('sm:hidden');
    expect(responsiveNav).toContain('<details');
    expect(responsiveNav).toContain('hidden gap-2 overflow-x-auto');
    expect(enterprise).toContain('<ResponsivePageNav');
    expect(communities).toContain('<ResponsivePageNav');
    expect(specialists).toContain('<a href="#directory">Browse specialists</a>');
    expect(specialists).toContain('id="directory"');
  });

  it('condenses decision-room evidence and workflow progress on phones', () => {
    const rooms = readFileSync(join(process.cwd(), 'frontend/src/pages/DecisionRoomPages.tsx'), 'utf8');
    const specialists = readFileSync(join(process.cwd(), 'frontend/src/pages/SpecialistMarketplacePages.tsx'), 'utf8');
    const progress = readFileSync(join(process.cwd(), 'frontend/src/components/ResponsiveProgressTimeline.tsx'), 'utf8');

    expect(rooms).toContain('id="decision-room-status"');
    expect(rooms).toContain('className="hidden gap-2 overflow-x-auto pb-3 sm:flex"');
    expect(rooms).toContain('function RoomItemGroup');
    expect(rooms).toContain('<details className="overflow-hidden rounded-2xl');
    expect(specialists).toContain('<ResponsiveProgressTimeline items={lifecycle}');
    expect(specialists).toContain('<ResponsiveProgressTimeline items={requestStages.map(pretty)}');
    expect(progress).toContain('sm:hidden');
    expect(progress).toContain('mt-8 hidden gap-2 sm:grid');
  });

  it('exposes every knowledge-circle category without phone-only swiping', () => {
    const network = readFileSync(join(process.cwd(), 'frontend/src/pages/KnowledgeNetworkPages.tsx'), 'utf8');

    expect(network).toContain('id="knowledge-group-type"');
    expect(network).toContain('<option value="all">All groups</option>');
    expect(network).toContain('hidden gap-2 overflow-x-auto pb-3 [scrollbar-width:none] sm:flex');
  });

  it('exposes every Stories sector without phone-only swiping', () => {
    const stories = readFileSync(join(process.cwd(), 'frontend/src/pages/beta/BetaStories.tsx'), 'utf8');

    expect(stories).toContain('id="stories-sector-filter"');
    expect(stories).toContain("t('stories.sector_filter', 'Filter stories by sector')");
    expect(stories).toContain('mb-8 hidden gap-2 pb-2 sm:flex sm:flex-wrap');
    expect(stories).not.toContain('mobile-scroll-strip -mx-4 mb-8');
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
