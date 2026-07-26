import { useQuery } from '@tanstack/react-query';
import { Activity, BookOpenCheck, Headphones, Mail, RefreshCw, RotateCcw, Users } from 'lucide-react';
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
