import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon } from '@radix-ui/react-icons';
import { useBreadcrumbOverride } from '@/context/BreadcrumbContext';
import { hasJourneyForPath, isNavigationPathActive, journeyForPath, journeysForAudience } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

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
            <div className="page-container flex min-h-12 items-center gap-4 overflow-hidden">
                <div className="flex min-w-0 shrink-0 items-center gap-2 text-xs font-semibold text-navy/55" aria-label="Current location">
                    <Link to="/" className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-navy/5 hover:text-navy" aria-label="Home"><HomeIcon /></Link>
                    <span aria-hidden="true">/</span>
                    {belongsToJourney && <><Link to={journey.href} className="whitespace-nowrap font-bold text-navy hover:underline">{journey.label}</Link><span aria-hidden="true">/</span></>}
                    <span className="max-w-[11rem] truncate text-navy/70 sm:max-w-[18rem]" aria-current="page">{currentLabel}</span>
                </div>

                {belongsToJourney && (
                    <nav aria-label={`${journey.label} destinations`} className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {journey.links.map(link => {
                            const active = isNavigationPathActive(location.pathname, link.href);
                            return <Link key={link.href} to={link.href} aria-current={active ? 'page' : undefined} className={cn('whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold text-navy/55 transition-colors hover:bg-navy/5 hover:text-navy', active && 'bg-navy text-white hover:bg-navy hover:text-white')}>{link.label}</Link>;
                        })}
                    </nav>
                )}
            </div>
        </div>
    );
};
