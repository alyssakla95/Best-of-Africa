/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import type { AuthUser } from '@/services/api';

export type MarketplaceAccessKind = 'enterprise' | 'specialist';

export function marketplaceDestinationFor(user: AuthUser) {
  if (user.type === 'specialist' || user.tier === 'specialist') return '/specialists/dashboard';
  if (user.tier === 'enterprise' && user.marketplace_access_status === 'enabled') return '/specialists/requests';
  if (user.tier === 'enterprise') return '/enterprise/access';
  return '/enterprise';
}

export function MarketplaceAccessGate({
  kind,
  children,
}: {
  kind: MarketplaceAccessKind;
  children: ReactNode;
}) {
  const location = useLocation();
  const { isAuthenticated, isHydrating, user } = useAuth();

  if (isHydrating) {
    return <div className="page-container py-20" role="status">Verifying your marketplace access…</div>;
  }
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={kind === 'specialist' ? '/specialists/sign-in' : '/enterprise/access'}
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }
  if (kind === 'specialist' && user.type !== 'specialist' && user.tier !== 'specialist') {
    return <Navigate to={marketplaceDestinationFor(user)} replace />;
  }
  if (kind === 'enterprise' && (user.tier !== 'enterprise' || user.marketplace_access_status !== 'enabled')) {
    return (
      <div className="page-container py-16">
        <SEO title="Marketplace access required" description="Enterprise marketplace access status." noIndex />
        <div className="max-w-2xl rounded-3xl border bg-white p-7">
          <h1 className="font-serif text-4xl text-navy">Enterprise marketplace access is not active</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {user.tier !== 'enterprise'
              ? 'Specialist requests are available to approved Enterprise organizations.'
              : user.marketplace_access_status === 'suspended'
                ? 'Your organization’s marketplace access is suspended. Contact your BOA-Story administrator before submitting or reviewing requests.'
                : 'Your Enterprise account is signed in, but an administrator has not enabled specialist marketplace access yet.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link to="/enterprise/apply">Contact the Enterprise team</Link></Button>
            <Button variant="outline" asChild><Link to="/enterprise">Return to Enterprise</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
