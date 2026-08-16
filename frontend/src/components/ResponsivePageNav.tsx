import { ChevronDown } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';

export interface ResponsivePageNavItem {
  label: string;
  href: string;
  current?: boolean;
}

interface ResponsivePageNavProps {
  label: string;
  items: ResponsivePageNavItem[];
}

const itemClass = (current = false) =>
  `min-h-11 rounded-lg border px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
    current
      ? 'border-navy bg-navy text-white'
      : 'border-border bg-white text-navy hover:border-navy hover:bg-navy hover:text-white'
  }`;

export function ResponsivePageNav({ label, items }: ResponsivePageNavProps) {
  const closeMobileMenu = (target: HTMLElement) => {
    const menu = target.closest('details');
    if (menu instanceof HTMLDetailsElement) menu.open = false;
  };

  const renderItem = (item: ResponsivePageNavItem, mobile = false) => {
    const className = `${itemClass(item.current)} ${mobile ? 'flex w-full items-center' : 'inline-flex items-center whitespace-nowrap'}`;
    const shared = {
      className,
      'aria-current': item.current ? ('page' as const) : undefined,
      onClick: mobile ? (event: MouseEvent<HTMLElement>) => closeMobileMenu(event.currentTarget) : undefined,
    };
    return item.href.startsWith('/')
      ? <Link key={item.href} to={item.href} {...shared}>{item.label}</Link>
      : <a key={item.href} href={item.href} {...shared}>{item.label}</a>;
  };

  return (
    <nav aria-label={label} className="sticky top-[4.5rem] z-30 border-b border-border bg-white/95 backdrop-blur lg:top-[4.75rem]">
      <div className="page-container py-2 sm:hidden">
        <details className="group rounded-xl border border-border bg-white">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-bold text-navy">
            <span>{label}</span>
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className="grid gap-2 border-t border-border p-2">
            {items.map(item => renderItem(item, true))}
          </div>
        </details>
      </div>
      <div className="page-container hidden gap-2 overflow-x-auto py-3 [scrollbar-width:none] sm:flex">
        {items.map(item => renderItem(item))}
      </div>
    </nav>
  );
}
