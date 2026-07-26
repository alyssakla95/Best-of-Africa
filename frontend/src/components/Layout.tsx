import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';
import { InterfaceTranslator } from './InterfaceTranslator';
import { MEMBER_PREVIEW_MODE } from '../config/flags';
import { ScrollToTopButton } from './ScrollToTopButton';
import { MobileNavigationDock } from './MobileNavigationDock';
import { PageReadingGuide } from './PageReadingGuide';
import { api } from '../services/api';




interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        api.trackEvent({
            type: 'page_view',
            path: `${location.pathname}${location.search}`,
        });
    }, [location.pathname, location.search]);

    return (
        <div className="flex min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-background text-foreground overflow-x-clip">
            <InterfaceTranslator />
            <div className="flex-1 flex flex-col min-h-screen min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
                <NavBar />
                {MEMBER_PREVIEW_MODE && (
                    <div className="border-b border-navy/20 bg-white px-5 py-2.5 text-center text-[9px] font-bold uppercase leading-4 tracking-[0.11em] text-navy sm:text-[10px] sm:tracking-[0.16em]">
                        <span className="sm:hidden">Member preview · Subscription content temporarily open</span>
                        <span className="hidden sm:inline">Member preview mode — all subscription content is temporarily open</span>
                    </div>
                )}
                <Breadcrumbs />
                <PageReadingGuide />
                <main className="route-canvas flex-1 transition-colors duration-200">
                    {children}
                </main>
                <Footer />
                <ScrollToTopButton />
                <MobileNavigationDock />
            </div>
        </div>
    );
};
