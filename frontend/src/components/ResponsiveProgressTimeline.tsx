interface ResponsiveProgressTimelineProps {
  items: string[];
  currentIndex: number;
  label: string;
  columnsClass: string;
  statusLabel: (index: number) => string;
}

const timelineItemClass = (active: boolean) =>
  `rounded-xl border p-3 text-sm ${active ? 'border-navy bg-navy text-white' : 'text-muted-foreground'}`;

export function ResponsiveProgressTimeline({
  items,
  currentIndex,
  label,
  columnsClass,
  statusLabel,
}: ResponsiveProgressTimelineProps) {
  const safeIndex = Math.max(0, currentIndex);

  return (
    <>
      <details className="mt-8 overflow-hidden rounded-xl border border-border bg-white sm:hidden">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
          <span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            <strong className="mt-1 block text-sm text-navy">{items[safeIndex]}</strong>
          </span>
          <span className="shrink-0 text-sm font-bold tabular-nums text-navy">{safeIndex + 1}/{items.length}</span>
        </summary>
        <ol className="grid gap-2 border-t border-border p-2" aria-label={label}>
          {items.map((item, index) => (
            <li key={item} className={timelineItemClass(index <= safeIndex)}>
              <span className="block text-xs font-bold">{statusLabel(index)}</span>
              <span className="mt-1 block">{item}</span>
            </li>
          ))}
        </ol>
      </details>
      <ol className={`mt-8 hidden gap-2 sm:grid ${columnsClass}`} aria-label={label}>
        {items.map((item, index) => (
          <li key={item} className={timelineItemClass(index <= safeIndex)}>
            <span className="block text-xs font-bold">{statusLabel(index)}</span>
            <span className="mt-1 block">{item}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
