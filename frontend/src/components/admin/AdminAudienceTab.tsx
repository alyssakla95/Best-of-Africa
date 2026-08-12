import { useQuery } from '@tanstack/react-query';
import { Activity, BookOpenCheck, Compass, Headphones, Mail, RefreshCw, RotateCcw, Users } from 'lucide-react';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';

const number = (value: number) => value.toLocaleString('en-GB');

export const AdminAudienceTab = () => {
  const query = useQuery({
    queryKey: ['admin-audience-metrics'],
    queryFn: api.getAudienceMetrics,
    staleTime: 60_000,
  });

  if (query.isLoading) {
    return <div className="rounded-3xl border border-border bg-white p-8 text-sm text-muted-foreground">Loading recorded reader activity…</div>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-3xl border border-border bg-white p-8">
        <h2 className="font-serif text-2xl">Audience evidence could not be loaded.</h2>
        <p className="mt-2 text-sm text-muted-foreground">No estimate has been substituted for the missing measurement.</p>
        <Button className="mt-5 rounded-xl" variant="outline" onClick={() => query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
      </div>
    );
  }

  const data = query.data;
  const navigation = data.navigation || { total_selections_30d: 0, distinct_selectors_30d: 0, by_journey: [], destinations: [] };
  const cards = [
    { Icon: Users, label: 'Monthly active readers', value: number(data.audience.monthly_active_readers), note: 'Distinct recorded sessions in 30 days' },
    { Icon: Activity, label: 'Weekly active readers', value: number(data.audience.weekly_active_readers), note: 'Distinct recorded sessions in 7 days' },
    { Icon: RotateCcw, label: 'Returning-reader rate', value: `${data.audience.returning_reader_rate_pct}%`, note: `${number(data.audience.returning_readers_30d)} sessions on at least two dates` },
    { Icon: BookOpenCheck, label: 'High-progress reading', value: `${data.habits.high_progress_rate_pct}%`, note: `${number(data.habits.high_progress_reads_30d)} of ${number(data.habits.article_reads_30d)} recorded reads reached 75%` },
    { Icon: Headphones, label: 'Audio completion', value: `${data.habits.audio_completion_rate_pct}%`, note: `${number(data.habits.audio_completions_30d)} of ${number(data.habits.audio_starts_30d)} starts reached media end` },
    { Icon: Mail, label: 'Active newsletter readers', value: number(data.distribution.active_newsletter_subscribers), note: `${number(data.distribution.newsletter_subscribers_added_30d)} added in 30 days` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-navy p-6 text-white md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Observed first-party activity</p>
          <h2 className="mt-2 font-serif text-3xl">Reader habit and retention</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
            These are recorded product events, not estimates of market size, brand awareness, paying subscribers or revenue.
          </p>
        </div>
        <Button variant="outline" className="min-h-11 rounded-xl border-white/30 bg-transparent text-white hover:bg-white hover:text-navy" onClick={() => query.refetch()}>
          <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ Icon, label, value, note }) => (
          <article key={label} className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <Icon className="h-5 w-5 text-navy" />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="mt-2 font-serif text-4xl text-navy">{value}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{note}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-white">
        <div className="grid gap-5 border-b border-border p-6 md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"><Compass className="h-4 w-4 text-navy" />Navigation evidence</p>
            <h3 className="mt-2 font-serif text-3xl text-navy">Which paths readers choose</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Observed selections from the homepage gateway, desktop and mobile menus, journey bar and footer. These counts show chosen destinations, not whether a task was completed.</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-right">
            <div className="rounded-xl bg-navy/[.04] px-4 py-3"><dt className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">Selections</dt><dd className="mt-1 font-serif text-3xl text-navy">{number(navigation.total_selections_30d)}</dd></div>
            <div className="rounded-xl bg-navy/[.04] px-4 py-3"><dt className="text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">Sessions</dt><dd className="mt-1 font-serif text-3xl text-navy">{number(navigation.distinct_selectors_30d)}</dd></div>
          </dl>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          {navigation.by_journey.map(item => <article key={item.journey} className="bg-white p-5"><p className="text-xs font-bold uppercase tracking-[.1em] text-navy/60">{item.journey}</p><p className="mt-3 font-serif text-3xl capitalize text-navy">{number(item.selections)}</p><p className="mt-1 text-xs text-muted-foreground">{number(item.distinct_sessions)} distinct sessions</p></article>)}
        </div>
        {navigation.destinations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-left text-sm">
              <thead className="border-b border-border bg-navy/[.025] text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground"><tr><th className="px-6 py-3">Journey</th><th className="px-6 py-3">Interface</th><th className="px-6 py-3">Destination</th><th className="px-6 py-3 text-right">Selections</th><th className="px-6 py-3 text-right">Sessions</th></tr></thead>
              <tbody className="divide-y divide-border">{navigation.destinations.slice(0, 20).map((item, index) => <tr key={`${item.journey}-${item.source}-${item.path}-${index}`}><td className="px-6 py-3 font-bold capitalize text-navy">{item.journey}</td><td className="px-6 py-3 capitalize text-muted-foreground">{item.source.replace(/_/g, ' ')}</td><td className="px-6 py-3 font-mono text-xs text-navy/75">{item.path}</td><td className="px-6 py-3 text-right font-bold text-navy">{number(item.selections)}</td><td className="px-6 py-3 text-right text-muted-foreground">{number(item.distinct_sessions)}</td></tr>)}</tbody>
            </table>
          </div>
        ) : <p className="p-6 text-sm text-muted-foreground md:px-8">Journey selections will appear after readers use the newly instrumented navigation.</p>}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-white p-6">
          <h3 className="font-serif text-2xl text-navy">Thirty-day habit counts</h3>
          <dl className="mt-5 divide-y divide-border text-sm">
            {[
              ['Page views', data.audience.page_views_30d],
              ['Africa Briefing opens', data.habits.briefing_opens_30d],
              ['Saved articles', data.habits.saves_30d],
              ['Readers who saved', data.habits.saving_readers_30d],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between gap-5 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-bold text-navy">{number(Number(value))}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-3xl border border-border bg-white p-6">
          <h3 className="font-serif text-2xl text-navy">Measurement boundaries</h3>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            {Object.values(data.definitions).map(definition => <li key={definition} className="border-l-2 border-navy/20 pl-4">{definition}</li>)}
            <li className="border-l-2 border-navy/20 pl-4">{data.distribution.email_open_rate_note}</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
