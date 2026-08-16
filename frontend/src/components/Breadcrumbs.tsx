import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon } from '@radix-ui/react-icons';
import { useBreadcrumbOverride } from '@/context/BreadcrumbContext';
import { hasJourneyForPath, isNavigationPathActive, journeyForPath, journeysForAudience } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { trackJourneySelection } from '@/lib/navigationTelemetry';
import { ChevronDown } from 'lucide-react';
import { OPEN_MOBILE_MENU_EVENT } from './MobileNavigationDock';

const titleCase = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const { override } = useBreadcrumbOverride();
    const { user } = useAuth();
    if (location.pathname === '/') return null;

    const baseJourney = journeyForPath(location.pathname);
    const journey = journeysForAudience(user?.tier).find(item => item.id === baseJourney.id) || baseJourney;
    const belongsToJourney = hasJourneyForPath(location.pathname);
    const matchingLink = [...journey.links]
        .sort((a, b) => b.href.length - a.href.length)
        .find(link => isNavigationPathActive(location.pathname, link.href));
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || 'Home';
    const currentLabel = override?.path === location.pathname
        ? override.label
        : matchingLink?.label || titleCase(lastSegment);

    return (
        <div className="border-b border-border bg-white">
            <div className="page-container flex min-h-11 items-center gap-3 overflow-hidden sm:min-h-12 sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold text-navy/55 sm:shrink-0 sm:flex-none" aria-label="Current location">
                    <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-navy/5 hover:text-navy" aria-label="Home"><HomeIcon /></Link>
                    <span aria-hidden="true">/</span>
                    {belongsToJourney && <><Link to={journey.href} className="whitespace-nowrap font-bold text-navy hover:underline">{journey.label}</Link><span aria-hidden="true">/</span></>}
                    <span className="min-w-0 truncate text-navy/70 sm:max-w-[18rem]" aria-current="page">{currentLabel}</span>
                </div>

                {belongsToJourney && (
                    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_MOBILE_MENU_EVENT))} className="ml-auto flex h-9 shrink-0 items-center gap-1 rounded-md border border-navy/15 px-2.5 text-[11px] font-bold text-navy sm:hidden" aria-label={`Explore ${journey.label} destinations`}>
                        Explore <ChevronDown size={14} aria-hidden="true" />
                    </button>
                )}

                {belongsToJourney && (
                    <nav aria-label={`${journey.label} destinations`} className="ml-auto hidden min-w-0 items-center gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
                        {journey.links.map(link => {
                            const active = isNavigationPathActive(location.pathname, link.href);
                            return <Link key={link.href} to={link.href} onClick={() => trackJourneySelection(journey.id, 'journey_bar', link.href)} aria-current={active ? 'page' : undefined} className={cn('whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold text-navy/55 transition-colors hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1', active && 'bg-navy text-white hover:bg-navy hover:text-white')}>{link.label}</Link>;
                        })}
                    </nav>
                )}
            </div>
        </div>
    );
};
