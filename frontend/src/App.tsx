import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/beta/PageTransition';
import { Layout } from './components/Layout';

// Resilient lazy import. After a redeploy, an already-open tab still references the
// previous build's chunk hashes; navigating to a lazy route then 404s on a chunk
// that no longer exists and the dynamic import rejects ("Failed to fetch
// dynamically imported module"). Instead of crashing into the error boundary, we
// reload once to pull the fresh index.html + new chunk names. The sessionStorage
// guard (cleared on any successful load) prevents reload loops for genuine errors.
function lazyWithRetry<T extends React.ComponentType>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    const KEY = 'boa-chunk-reloaded';
    try {
      const mod = await factory();
      sessionStorage.removeItem(KEY);
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
        // Hold render until the reload swaps in the fresh document.
        return await new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}

// ── BOA-Story pages ───────────────────────────────────────────────────────────
// The landing page is the default route and the most-visited entry point: it is
// imported statically so its code ships in the main bundle. Lazy-loading it put
// a second network round trip between index.js and the hero render, which held
// the (already-downloaded, preloaded) hero image unpainted for ~3 extra seconds
// of mobile LCP.
import { BetaLanding } from './pages/beta/BetaLanding';
const BetaMembership  = lazyWithRetry(() => import('./pages/beta/BetaMembership').then(m => ({ default: m.BetaMembership })));
const BetaIntelligence = lazyWithRetry(() => import('./pages/beta/BetaIntelligence').then(m => ({ default: m.BetaIntelligence })));
const BetaReport = lazyWithRetry(() => import('./pages/beta/BetaReport').then(m => ({ default: m.BetaReport })));
const BetaStories     = lazyWithRetry(() => import('./pages/beta/BetaStories').then(m => ({ default: m.BetaStories })));
const BetaLibrary     = lazyWithRetry(() => import('./pages/beta/BetaLibrary').then(m => ({ default: m.BetaLibrary })));
const BetaArticle     = lazyWithRetry(() => import('./pages/beta/BetaArticle').then(m => ({ default: m.BetaArticle })));
const BetaCountryTeaser = lazyWithRetry(() => import('./pages/beta/BetaCountryTeaser').then(m => ({ default: m.BetaCountryTeaser })));
const BetaCountryHub  = lazyWithRetry(() => import('./pages/beta/BetaCountryHub').then(m => ({ default: m.BetaCountryHub })));
const BetaMarketIntel = lazyWithRetry(() => import('./pages/beta/BetaMarketIntel').then(m => ({ default: m.BetaMarketIntel })));
const BetaGallery     = lazyWithRetry(() => import('./pages/beta/BetaGallery').then(m => ({ default: m.BetaGallery })));
const BetaAbout       = lazyWithRetry(() => import('./pages/beta/BetaAbout').then(m => ({ default: m.BetaAbout })));
const BetaNewsletter  = lazyWithRetry(() => import('./pages/beta/BetaNewsletter').then(m => ({ default: m.BetaNewsletter })));
const BetaMemberAccess = lazyWithRetry(() => import('./pages/beta/BetaMemberAccess').then(m => ({ default: m.BetaMemberAccess })));
const BetaEvents      = lazyWithRetry(() => import('./pages/beta/BetaEvents').then(m => ({ default: m.BetaEvents })));
const BetaConcierge   = lazyWithRetry(() => import('./pages/beta/BetaConcierge').then(m => ({ default: m.BetaConcierge })));
const BetaTravel      = lazyWithRetry(() => import('./pages/beta/BetaTravel').then(m => ({ default: m.BetaTravel })));
const BetaSearch      = lazyWithRetry(() => import('./pages/beta/BetaSearch').then(m => ({ default: m.BetaSearch })));
const BetaFeed        = lazyWithRetry(() => import('./pages/beta/BetaFeed').then(m => ({ default: m.BetaFeed })));
const BetaContinentalOverview = lazyWithRetry(() => import('./pages/beta/BetaContinentalOverview').then(m => ({ default: m.BetaContinentalOverview })));
const BetaSponsorDashboard = lazyWithRetry(() => import('./pages/beta/BetaSponsorDashboard').then(m => ({ default: m.BetaSponsorDashboard })));
const BetaNarrativeToolkit = lazyWithRetry(() => import('./pages/beta/BetaNarrativeToolkit').then(m => ({ default: m.BetaNarrativeToolkit })));
const BetaWorldCup    = lazyWithRetry(() => import('./pages/beta/BetaWorldCup').then(m => ({ default: m.BetaWorldCup })));

// ── Utility / Account pages ───────────────────────────────────────────────────
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const PremiumSectorTrends = lazyWithRetry(() => import('./pages/beta/PremiumSectorTrends').then(m => ({ default: m.PremiumSectorTrends })));
const LoginPage    = lazyWithRetry(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AdminPage    = lazyWithRetry(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const PrivacyPage  = lazyWithRetry(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage    = lazyWithRetry(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const ContactPage  = lazyWithRetry(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

import { TooltipProvider } from "@/components/ui/tooltip";
import { MissionProvider } from './context/MissionContext';
import { LensProvider } from './context/LensContext';
import { LanguageProvider } from './context/LanguageContext';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import { AuthProvider } from './context/AuthContext';
import { MemberProvider } from './context/MemberContext';
import { AudioProvider } from './context/AudioContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContentPrefetcher } from './components/ContentPrefetcher';

// ── Deferred chrome ─────────────────────────────────────────────────────────
// None of these are needed for first paint, and together (cmdk, sonner, audio
// player, chat widget, cursor) they add real parse+mount work to the boot-time
// long task that delays mobile LCP. They lazy-load and mount after first idle.
const BetaGlobalPlayer = lazyWithRetry(() => import('./components/beta/BetaGlobalPlayer').then(m => ({ default: m.BetaGlobalPlayer })));
const BetaChatWidget   = lazyWithRetry(() => import('./components/beta/BetaChatWidget').then(m => ({ default: m.BetaChatWidget })));
const ToasterDeferred  = lazyWithRetry(() => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })));
const CommandMenuDeferred = lazyWithRetry(() => import('@/components/CommandMenu').then(m => ({ default: m.CommandMenu })));

const DeferredChrome = () => {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const start = () => setReady(true);
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(start, { timeout: 3000 });
    } else {
      setTimeout(start, 1500);
    }
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <BetaGlobalPlayer />
      <BetaChatWidget />
      <ToasterDeferred />
      <CommandMenuDeferred />
    </Suspense>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const PageLoader = () => (
  <div className="max-w-7xl mx-auto px-5 sm:px-6 py-12" aria-label="Loading page">
    <div className="h-3 w-28 rounded bg-muted mb-5 animate-pulse" />
    <div className="h-10 w-2/3 max-w-xl rounded bg-muted mb-3 animate-pulse" />
    <div className="h-5 w-1/2 max-w-md rounded bg-muted animate-pulse" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* ── BOA-Story narrative pages ─────────────────────────────── */}
          <Route path="/"                element={<PageTransition><BetaLanding /></PageTransition>} />
          <Route path="/about"           element={<PageTransition><BetaAbout /></PageTransition>} />
          <Route path="/membership"      element={<PageTransition><BetaMembership /></PageTransition>} />
          <Route path="/gallery"         element={<PageTransition><BetaGallery /></PageTransition>} />
          <Route path="/posts"           element={<PageTransition><BetaStories /></PageTransition>} />
          <Route path="/posts/:slug"     element={<PageTransition><BetaArticle /></PageTransition>} />
          <Route path="/supporter-feed"  element={<PageTransition><BetaMarketIntel /></PageTransition>} />
          <Route path="/newsletter"      element={<PageTransition><BetaNewsletter /></PageTransition>} />
          <Route path="/member-access"   element={<PageTransition><BetaMemberAccess /></PageTransition>} />

          {/* ── Countries (shared between both sections) ──────────────── */}
          <Route path="/countries"       element={<PageTransition><BetaCountryTeaser /></PageTransition>} />
          <Route path="/countries/:code" element={<PageTransition><BetaCountryHub /></PageTransition>} />
          <Route path="/countries/:code/narratives" element={<PageTransition><BetaNarrativeToolkit /></PageTransition>} />
          <Route path="/intelligence"    element={<PageTransition><BetaIntelligence /></PageTransition>} />
          <Route path="/intelligence/reports" element={<PageTransition><BetaReport /></PageTransition>} />
          <Route path="/intelligence/reports/:id" element={<PageTransition><BetaReport /></PageTransition>} />
          <Route path="/intelligence/:view" element={<PageTransition><BetaIntelligence /></PageTransition>} />
          {/* /intel is a legacy alias, canonical intelligence page is /intelligence.
              (Supporter Feed lives at /supporter-feed.) Redirect avoids a duplicate route. */}
          <Route path="/intel" element={<Navigate to="/intelligence" replace />} />
          <Route path="/sectors/:id/trends" element={<PageTransition><PremiumSectorTrends /></PageTransition>} />
          <Route path="/dashboards/overview" element={<PageTransition><BetaContinentalOverview /></PageTransition>} />
          <Route path="/dashboards/:view" element={<PageTransition><BetaContinentalOverview /></PageTransition>} />
          <Route path="/dashboards"      element={<Navigate to="/dashboards/overview" replace />} />
          <Route path="/library"         element={<PageTransition><BetaLibrary /></PageTransition>} />
          <Route path="/sponsor/dashboard" element={<PageTransition><BetaSponsorDashboard /></PageTransition>} />

          {/* ── Corporate Services ──────────────────────────────────────── */}
          <Route path="/events"                 element={<PageTransition><BetaEvents /></PageTransition>} />
          <Route path="/request-consultation"   element={<PageTransition><BetaConcierge /></PageTransition>} />
          <Route path="/travel"                 element={<PageTransition><BetaTravel /></PageTransition>} />
          <Route path="/search"                 element={<PageTransition><BetaSearch /></PageTransition>} />
          <Route path="/feed"                   element={<PageTransition><BetaFeed /></PageTransition>} />
          <Route path="/world-cup"              element={<PageTransition><BetaWorldCup /></PageTransition>} />

          {/* ── Utility pages ─────────────────────────────────────────── */}
          <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          <Route path="/login"    element={<PageTransition><LoginPage /></PageTransition>} />
          <Route path="/admin"    element={<PageTransition><AdminPage /></PageTransition>} />
          <Route path="/privacy"  element={<PageTransition><PrivacyPage /></PageTransition>} />
          <Route path="/terms"    element={<PageTransition><TermsPage /></PageTransition>} />
          <Route path="/contact"  element={<PageTransition><ContactPage /></PageTransition>} />

          {/* Catch-all */}
          <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <MemberProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <LanguageProvider>
              <LensProvider>
                <MissionProvider>
                  <AudioProvider>
                    <Router>
                      <ContentPrefetcher />
                      <BreadcrumbProvider>
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <AnimatedRoutes />
                        </Suspense>
                      </ErrorBoundary>
                      </BreadcrumbProvider>
                      <DeferredChrome />
                    </Router>
                  </AudioProvider>
                </MissionProvider>
              </LensProvider>
            </LanguageProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </MemberProvider>
    </AuthProvider>
  );
}

export default App;
