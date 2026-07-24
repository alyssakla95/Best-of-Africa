import { BarChart3, Home, Menu, Newspaper, Radar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

export const OPEN_MOBILE_MENU_EVENT = 'boa:open-mobile-menu';

export function MobileNavigationDock() {
  const { pathname } = useLocation();
  const { t } = useLanguage();

  const destinations = [
    { href: '/', label: t('nav.home', 'Home'), Icon: Home, active: pathname === '/' },
    { href: '/intelligence', label: t('nav.intelligence_short', 'Intel'), Icon: Radar, active: pathname.startsWith('/intelligence') },
    { href: '/dashboards/overview', label: t('nav.dashboard_short', 'Dashboard'), Icon: BarChart3, active: pathname.startsWith('/dashboards') },
    { href: '/posts', label: t('nav.stories', 'Stories'), Icon: Newspaper, active: pathname.startsWith('/posts') },
  ];

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="mobile-navigation-dock fixed inset-x-0 bottom-0 z-40 border-t border-navy/20 bg-white/[0.98] px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {destinations.map(({ href, label, Icon, active }) => (
          <Link
            key={href}
            to={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex min-h-[3.6rem] min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy',
              active ? 'bg-navy text-white' : 'text-navy/60 hover:bg-navy/5 hover:text-navy',
            )}
          >
            <Icon size={19} strokeWidth={active ? 2.25 : 1.8} aria-hidden="true" />
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_MOBILE_MENU_EVENT))}
          className="flex min-h-[3.6rem] min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-bold leading-none text-navy/60 transition-colors hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          aria-label={t('nav.open_menu', 'Open complete menu')}
        >
          <Menu size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>{t('nav.menu', 'Menu')}</span>
        </button>
      </div>
    </nav>
  );
}
