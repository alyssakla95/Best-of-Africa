import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lets a detail page supply a human label for the *current* route's last
 * breadcrumb crumb, instead of the ugly de-slugified URL segment (e.g. an
 * article slug "...-congo-s-...-nete"). Scoped to the pathname that set it, so
 * it never leaks onto the next page.
 */
type Override = { path: string; label: string } | null;

const BreadcrumbCtx = createContext<{ override: Override; setOverride: (o: Override) => void }>({
  override: null,
  setOverride: () => {},
});

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [override, setOverride] = useState<Override>(null);
  return <BreadcrumbCtx.Provider value={{ override, setOverride }}>{children}</BreadcrumbCtx.Provider>;
};

export const useBreadcrumbOverride = () => useContext(BreadcrumbCtx);

/** Page-side helper: register a label for the current route's last crumb. */
export function useSetBreadcrumb(label?: string | null) {
  const { setOverride } = useBreadcrumbOverride();
  const { pathname } = useLocation();
  useEffect(() => {
    if (label && label.trim()) {
      setOverride({ path: pathname, label: label.trim() });
    }
    return () => setOverride(null);
  }, [label, pathname, setOverride]);
}
