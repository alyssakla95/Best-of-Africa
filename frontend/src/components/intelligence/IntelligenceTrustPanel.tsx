import { Clock3, Database, ShieldCheck, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IntelligenceTrustPanelProps {
  updatedAt?: string | number | null;
  sourceLabel: string;
}

export const IntelligenceTrustPanel = ({ updatedAt, sourceLabel }: IntelligenceTrustPanelProps) => {
  const timestamp = updatedAt ? new Date(updatedAt) : null;
  const validTimestamp = timestamp && !Number.isNaN(timestamp.getTime());

  const items = [
    { Icon: Database, label: 'Source', value: sourceLabel },
    { Icon: Clock3, label: 'Freshness', value: validTimestamp ? timestamp.toLocaleString() : 'Updated with the live dataset' },
    { Icon: UserCheck, label: 'Review', value: 'Critical claims require editorial review' },
    { Icon: ShieldCheck, label: 'Evidence policy', value: 'Summaries must remain source-bound and factual' },
  ];

  return (
    <aside className="border-y border-border bg-card" aria-label="Intelligence trust protocol">
      <div className="max-w-6xl mx-auto px-5 py-5 sm:px-6 sm:py-7">
        <details className="group sm:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">BOA Trust Protocol</p>
              <p className="mt-1 text-sm font-semibold text-navy">Live, source-bound intelligence</p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-navy group-open:hidden">View method +</span>
            <span className="hidden shrink-0 text-xs font-semibold text-navy group-open:inline">Close −</span>
          </summary>
          <div className="mt-5 grid gap-4 border-t border-border pt-5">
            {items.map(({ Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
                <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-xs leading-relaxed text-navy">{value}</p></div>
              </div>
            ))}
            <Link to="/about" className="text-xs font-semibold text-navy underline decoration-accent/50 underline-offset-4">Read editorial standards</Link>
          </div>
        </details>
        <div className="hidden sm:block">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent-ink">BOA Trust Protocol</p>
            <h2 className="mt-1 font-serif text-2xl text-navy">Traceable by design.</h2>
          </div>
          <Link to="/about" className="text-xs font-semibold text-navy hover:text-accent-ink">Editorial standards →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ Icon, label, value }) => (
            <div key={label} className="flex gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-xs leading-relaxed text-navy">{value}</p></div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </aside>
  );
};
