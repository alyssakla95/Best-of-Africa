import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type RouteViewOption = {
  value: string;
  label: string;
  href: string;
};

export function RouteViewSwitcher({
  value,
  options,
  label,
}: {
  value: string;
  options: RouteViewOption[];
  label: string;
}) {
  const navigate = useNavigate();

  return (
    <nav className='sticky top-[4.5rem] z-30 border-b border-navy/15 bg-white/95 backdrop-blur-md lg:top-16' aria-label={label}>
      <div className='mx-auto max-w-[1400px] px-4 py-2 sm:px-6 lg:px-8'>
        <select
          value={options.find(option => option.value === value)?.href || options[0]?.href}
          onChange={event => navigate(event.target.value)}
          aria-label={label}
          className='h-11 w-full rounded-lg border border-navy/20 bg-white px-3 text-sm font-bold text-navy sm:hidden'
        >
          {options.map(option => <option key={option.value} value={option.href}>{option.label}</option>)}
        </select>
        <div className='hidden gap-1 overflow-x-auto sm:flex'>
          {options.map(option => (
            <Link
              key={option.value}
              to={option.href}
              aria-current={value === option.value ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-md px-4 py-2.5 text-sm font-bold transition-colors',
                value === option.value ? 'bg-navy text-white' : 'text-navy/70 hover:bg-navy/5 hover:text-navy',
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
