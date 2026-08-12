import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Coffee } from 'lucide-react';
import { MagnifyingGlassIcon, GearIcon, HamburgerMenuIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { KO_FI_URL } from '../constants/beta';
import { Button } from '@/components/ui/button';
import { MissionControl } from './MissionControl';
import { DensityToggle } from './DensityToggle';
import { LanguageSelector } from './LanguageSelector';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { OPEN_MOBILE_MENU_EVENT } from './MobileNavigationDock';
import { isNavigationPathActive, journeyForPath, journeysForAudience } from '@/lib/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const NavBar: React.FC = () => {
    const location = useLocation();
    const { t } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [scrolled, setScrolled] = React.useState(false);
    const currentJourney = journeyForPath(location.pathname);
    const journeys = React.useMemo(() => journeysForAudience(user?.tier), [user?.tier]);

    React.useEffect(() => {
        const frame = window.requestAnimationFrame(() => setMobileMenuOpen(false));
        return () => window.cancelAnimationFrame(frame);
    }, [location.pathname]);

    React.useEffect(() => {
        const openMenu = () => setMobileMenuOpen(true);
        window.addEventListener(OPEN_MOBILE_MENU_EVENT, openMenu);
        return () => window.removeEventListener(OPEN_MOBILE_MENU_EVENT, openMenu);
    }, []);

    React.useEffect(() => {
        const update = () => setScrolled(window.scrollY > 12);
        update();
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <>
            <header className={cn('site-header fixed inset-x-0 top-0 z-50 w-full border-b border-border/80 bg-white/95 backdrop-blur-md transition-shadow duration-200', scrolled && 'shadow-[0_8px_30px_-22px_rgba(15,31,61,0.65)]')}>
                {isAuthenticated && (
                    <div className="hidden items-center justify-end gap-3 border-b border-border bg-page px-6 py-2 text-[11px] font-medium tracking-wide text-ink-blue lg:flex lg:px-8">
                        <LanguageSelector />
                        <MissionControl />
                        <DensityToggle />
                    </div>
                )}

                <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between px-5 sm:px-6 lg:h-[4.75rem] lg:px-8">
                    <Link to="/" className="group z-10 flex shrink-0 items-center gap-3" aria-label="BOA-Story home">
                        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy font-serif text-lg font-black leading-none text-white">B</span>
                        <span className="flex flex-col leading-none text-navy">
                            <span className="font-serif text-xl font-black tracking-[-.04em] md:text-2xl">BOA</span>
                            <span className="mt-1 text-[9px] font-bold uppercase tracking-[.24em] text-navy/55">Story</span>
                        </span>
                    </Link>

                    <nav aria-label="Primary navigation" className="relative z-0 ml-8 hidden flex-1 items-center justify-center gap-1 lg:flex xl:ml-14">
                        {journeys.map(journey => {
                            const active = currentJourney.id === journey.id && location.pathname !== '/';
                            return (
                                <DropdownMenu key={journey.id}>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            aria-current={active ? 'page' : undefined}
                                            className={cn('flex min-h-10 items-center gap-1.5 rounded-md px-4 text-xs font-bold uppercase tracking-[0.1em] text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy xl:px-5', active && 'bg-navy text-white hover:bg-navy hover:text-white')}
                                        >
                                            {journey.label}<ChevronDown size={14} aria-hidden="true" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center" className="w-[22rem] rounded-xl border-navy/15 bg-white p-2 shadow-xl">
                                        <div className="px-3 pb-3 pt-2">
                                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy">{journey.label}</p>
                                            <p className="mt-1 text-sm leading-5 text-navy/60">{journey.description}</p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        {journey.links.map(link => (
                                            <DropdownMenuItem key={link.href} asChild className="cursor-pointer rounded-lg p-0 focus:bg-navy/5">
                                                <Link to={link.href} className={cn('block w-full px-3 py-2.5', isNavigationPathActive(location.pathname, link.href) && 'bg-navy/[.06]')}>
                                                    <span className="block text-sm font-bold text-navy">{link.label}</span>
                                                    <span className="mt-0.5 block text-xs leading-5 text-navy/55">{link.description}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            );
                        })}
                    </nav>

                    <div className="z-10 flex flex-1 shrink-0 items-center justify-end gap-1 lg:flex-none">
                        <div className="mr-2 hidden items-center gap-1 lg:flex">
                            {!isAuthenticated && <LanguageSelector />}
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-navy/55 hover:bg-navy/5 hover:text-navy" asChild>
                                <Link to="/search"><MagnifyingGlassIcon className="h-5 w-5" /><span className="sr-only">{t('nav.search', 'Search')}</span></Link>
                            </Button>
                            {isAuthenticated && <NotificationBell />}
                            {isAuthenticated && (
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-navy/55 hover:bg-navy/5 hover:text-navy" asChild>
                                    <Link to="/settings"><GearIcon className="h-5 w-5" /><span className="sr-only">{t('nav.settings', 'Settings')}</span></Link>
                                </Button>
                            )}
                            {isAuthenticated && (
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-navy/55 hover:bg-navy/5 hover:text-navy" asChild>
                                    <Link to="/admin"><LockClosedIcon className="h-5 w-5" /><span className="sr-only">{t('nav.admin', 'Admin')}</span></Link>
                                </Button>
                            )}
                        </div>
                        <div className="mx-2 hidden h-6 w-px bg-border lg:block" />
                        <Button size="sm" asChild className="hidden h-10 rounded-md bg-navy px-5 text-[11px] font-bold uppercase tracking-widest text-white shadow-none hover:bg-navy-mid lg:flex xl:px-7">
                            <Link to={isAuthenticated ? '/settings' : '/member-access'}>{isAuthenticated ? t('nav.account', 'Account') : t('nav.signin', 'Sign In')}</Link>
                        </Button>

                        <div className="flex items-center gap-2 lg:hidden">
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-navy/65" asChild>
                                <Link to="/search"><MagnifyingGlassIcon className="h-5 w-5" /><span className="sr-only">{t('nav.search', 'Search')}</span></Link>
                            </Button>
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full"><HamburgerMenuIcon className="h-6 w-6" /><span className="sr-only">{t('nav.open_menu', 'Open complete menu')}</span></Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="flex w-full max-w-none flex-col border-l border-navy/15 bg-white p-0 sm:w-[28rem]">
                                    <SheetHeader className="border-b border-border bg-white p-5 text-left">
                                        <SheetTitle className="flex items-center gap-3 font-serif text-2xl font-black tracking-tight text-navy">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-lg text-white">B</span>Explore BOA-Story
                                        </SheetTitle>
                                        <p className="text-sm leading-6 text-navy/60">Choose what you are here to do. Every service sits within one of four clear paths.</p>
                                        <div className="mt-3 flex flex-wrap items-center gap-3"><LanguageSelector /><DensityToggle /></div>
                                    </SheetHeader>
                                    <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
                                        <div className="space-y-3">
                                            {journeys.map(journey => (
                                                <section key={journey.id} className={cn('overflow-hidden rounded-xl border bg-white', currentJourney.id === journey.id && location.pathname !== '/' ? 'border-navy' : 'border-border')}>
                                                    <Link to={journey.href} onClick={closeMobileMenu} className="flex items-start justify-between gap-4 px-4 py-3.5 hover:bg-navy/[.03]">
                                                        <span><span className="block text-sm font-bold text-navy">{journey.label}</span><span className="mt-1 block text-xs leading-5 text-navy/55">{journey.description}</span></span>
                                                        <span aria-hidden="true" className="mt-0.5 text-navy">→</span>
                                                    </Link>
                                                    <div className="grid grid-cols-2 border-t border-border bg-navy/[.025]">
                                                        {journey.links.map(link => (
                                                            <Link key={link.href} to={link.href} onClick={closeMobileMenu} className={cn('min-h-12 border-b border-r border-border px-3 py-2.5 text-xs font-bold leading-4 text-navy/70 last:border-b-0 hover:bg-white hover:text-navy', isNavigationPathActive(location.pathname, link.href) && 'bg-navy text-white hover:bg-navy hover:text-white')}>{link.label}</Link>
                                                        ))}
                                                    </div>
                                                </section>
                                            ))}
                                        </div>

                                        <div className="mt-6 border-t border-border pt-5">
                                            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-navy/50">More from BOA</p>
                                            <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-navy/70">
                                                <Link to="/membership" onClick={closeMobileMenu} className="rounded-lg border border-border px-3 py-2.5">Membership</Link>
                                                <Link to="/library" onClick={closeMobileMenu} className="rounded-lg border border-border px-3 py-2.5">Saved research</Link>
                                                <Link to="/trust" onClick={closeMobileMenu} className="rounded-lg border border-border px-3 py-2.5">Trust Center</Link>
                                                <Link to="/about" onClick={closeMobileMenu} className="rounded-lg border border-border px-3 py-2.5">About BOA</Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-border bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button asChild className="h-11 bg-navy text-white"><Link to={isAuthenticated ? '/settings' : '/member-access'} onClick={closeMobileMenu}>{isAuthenticated ? 'Your account' : 'Sign in'}</Link></Button>
                                            <a href={KO_FI_URL} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-md border border-navy/20 text-sm font-bold text-navy"><Coffee className="h-4 w-4" />Support BOA</a>
                                        </div>
                                        {isAuthenticated && <div className="mt-3 flex items-center justify-between px-1"><MissionControl /><Link to="/admin" onClick={closeMobileMenu} className="text-xs font-bold text-navy/60">Administration</Link></div>}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>
            <div aria-hidden="true" className={cn('h-[4.5rem] shrink-0 lg:h-[4.75rem]', isAuthenticated && 'lg:h-[7.5rem]')} />
        </>
    );
};
