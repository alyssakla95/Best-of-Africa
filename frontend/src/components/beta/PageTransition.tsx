import React from 'react';

/** Route changes should feel immediate; page-level choreography made the
 * product feel staged and delayed useful content. */
export const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full min-h-full">{children}</div>
);
