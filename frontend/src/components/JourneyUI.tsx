import type { ReactNode } from 'react';
import { AlertCircle, Check, LoaderCircle, LockKeyhole, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.42fr)] lg:items-end', className)}>
      <div className="max-w-4xl">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
        <h1 className="mt-3 text-balance font-serif text-4xl font-bold leading-[0.95] md:text-6xl">{title}</h1>
        {description && <div className="mt-5 max-w-3xl text-pretty text-lg text-muted-foreground">{description}</div>}
        {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
      </div>
      {aside && <div className="rounded-3xl border bg-card p-5 shadow-sm">{aside}</div>}
    </header>
  );
}

export function AsyncState({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loadingLabel = 'Loading…',
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyAction,
  children,
  className,
}: {
  isLoading?: boolean;
  error?: Error | string | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4 py-8', className)} role="status" aria-live="polite" aria-label={loadingLabel}>
        <span className="sr-only">{loadingLabel}</span>
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-44 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    const message = typeof error === 'string' ? error : error.message;
    return (
      <Alert variant="destructive" className={cn('my-6', className)}>
        <AlertCircle aria-hidden="true" />
        <AlertTitle>We could not load this view</AlertTitle>
        <AlertDescription>
          <p>{message || 'Please try again.'}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              <RotateCcw aria-hidden="true" /> Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <section className={cn('my-8 rounded-3xl border border-dashed bg-muted/30 p-8 text-center', className)}>
        <h2 className="font-serif text-2xl font-bold">{emptyTitle}</h2>
        {emptyDescription && <div className="mx-auto mt-3 max-w-2xl text-muted-foreground">{emptyDescription}</div>}
        {emptyAction && <div className="mt-6 flex justify-center">{emptyAction}</div>}
      </section>
    );
  }

  return <>{children}</>;
}

export type JourneyStep = {
  id: string;
  label: string;
  description?: string;
  status: 'complete' | 'current' | 'upcoming' | 'blocked';
};

export function ProgressSteps({
  steps,
  label = 'Progress',
  className,
}: {
  steps: JourneyStep[];
  label?: string;
  className?: string;
}) {
  return (
    <ol aria-label={label} className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {steps.map((step, index) => {
        const complete = step.status === 'complete';
        const current = step.status === 'current';
        return (
          <li
            key={step.id}
            aria-current={current ? 'step' : undefined}
            className={cn(
              'rounded-2xl border p-4',
              current && 'border-primary bg-primary/5',
              step.status === 'blocked' && 'bg-muted/40 text-muted-foreground',
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  complete && 'border-primary bg-primary text-primary-foreground',
                  current && 'border-primary text-primary',
                )}
                aria-hidden="true"
              >
                {complete ? <Check className="size-4" /> : index + 1}
              </span>
              <span className="font-bold">{step.label}</span>
            </div>
            {step.description && <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>}
          </li>
        );
      })}
    </ol>
  );
}

export function AccessGate({
  title,
  description,
  actions,
  children,
  allowed = false,
  className,
}: {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  allowed?: boolean;
  className?: string;
}) {
  if (allowed) return <>{children}</>;
  return (
    <section className={cn('rounded-3xl border bg-card p-6 shadow-sm md:p-8', className)} aria-labelledby="access-gate-title">
      <LockKeyhole className="size-7 text-primary" aria-hidden="true" />
      <h2 id="access-gate-title" className="mt-4 font-serif text-3xl font-bold">{title}</h2>
      <div className="mt-3 max-w-2xl text-muted-foreground">{description}</div>
      {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
    </section>
  );
}

export function FormErrorSummary({
  error,
  title = 'Please check the form',
  className,
}: {
  error?: string | string[] | null;
  title?: string;
  className?: string;
}) {
  if (!error || (Array.isArray(error) && error.length === 0)) return null;
  const messages = Array.isArray(error) ? error : [error];
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc space-y-1 pl-5">
          {messages.map(message => <li key={message}>{message}</li>)}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export function SubmitButton({
  pending = false,
  pendingLabel = 'Working…',
  children,
  disabled,
  ...props
}: ButtonProps & {
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <Button {...props} disabled={disabled || pending} aria-busy={pending}>
      {pending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}
