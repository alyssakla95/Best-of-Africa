import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon } from '@radix-ui/react-icons';
import { useBreadcrumbOverride } from '@/context/BreadcrumbContext';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const { override } = useBreadcrumbOverride();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    // Title-case each hyphen-separated word: "request-consultation" → "Request Consultation".
    const capitalize = (s: string) =>
        s.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

    return (
        <div className="container overflow-x-auto py-3.5 sm:py-2.5">
            <Breadcrumb>
                <BreadcrumbList className="min-w-max">
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link to="/" className="flex items-center">
                                <HomeIcon className="mr-1 h-3.5 w-3.5" /> Home
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathnames.map((value, index) => {
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                        const isLast = index === pathnames.length - 1;
                        // A detail page can override its own (last) crumb with a real title.
                        const label = isLast && override && override.path === location.pathname
                            ? override.label
                            : capitalize(value);

                        return (
                            <React.Fragment key={to}>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage>{label}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link to={to}>{capitalize(value)}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>
    );
};
