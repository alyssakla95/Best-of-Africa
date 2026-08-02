import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, type PilotRequestInput } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';

const organizationTypes: Array<[PilotRequestInput['organization_type'], string]> = [
  ['corporate', 'Company or corporate team'],
  ['exporter', 'Exporter or trade operator'],
  ['adviser', 'Professional adviser'],
  ['investor', 'Investor or financial institution'],
  ['public-sector', 'Public-sector institution'],
  ['nonprofit', 'Nonprofit or development organization'],
  ['other', 'Other organization'],
];

const initialForm = {
  contact_name: '',
  work_email: '',
  organization: '',
  role_title: '',
  organization_type: 'corporate' as PilotRequestInput['organization_type'],
  target_sector: '',
  country_one: '',
  country_two: '',
  country_three: '',
  decision_question: '',
  decision_deadline: '',
  current_research_process: '',
  success_measure: '',
  confirmed: false,
};

export const EnterprisePilotPage = () => {
  const { language } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');

  const update = (name: keyof typeof form, value: string | boolean) =>
    setForm(current => ({ ...current, [name]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!form.confirmed) {
      setError('Confirm that the application contains no confidential or sensitive information.');
      return;
    }

    setSubmitting(true);
    try {
      const candidateCountries = [form.country_one, form.country_two, form.country_three]
        .map(value => value.trim())
        .filter(Boolean);
      const response = await api.submitPilotRequest({
        contact_name: form.contact_name,
        work_email: form.work_email,
        organization: form.organization,
        role_title: form.role_title,
        organization_type: form.organization_type,
        target_sector: form.target_sector,
        candidate_countries: candidateCountries,
        decision_question: form.decision_question,
        decision_deadline: form.decision_deadline || undefined,
        current_research_process: form.current_research_process,
        success_measure: form.success_measure,
        no_sensitive_data_confirmed: true,
      });
      setRequestId(response.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The application could not be recorded. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-white text-navy">
      <SEO
        title="Apply for a Market-Entry Pilot"
        description="Submit a structured application for a measurable BOA-Story African market-entry intelligence pilot."
      />

      <header className="border-b border-white/15 bg-navy text-white">
        <div className="page-container py-12 md:py-16">
          <Link to="/enterprise" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-white/75 hover:text-white">
            <ArrowLeft size={17} /> Pilot overview
          </Link>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-white/65">Structured pilot application</p>
          <h1 className="mt-4 max-w-4xl font-serif text-[clamp(2.5rem,6vw,4.8rem)] leading-[1.03] text-white">
            Define the decision before the work begins.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">
            This application establishes the markets being compared, the decision to be supported, your present research
            baseline and the result that would make a pilot useful. It is an application for operator review, not a purchase
            or a promise of acceptance.
          </p>
        </div>
      </header>

      <div className="page-container grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {requestId ? (
          <section className="rounded-3xl border border-navy/15 bg-white p-7 shadow-sm md:p-10" aria-live="polite">
            <CheckCircle2 className="h-10 w-10 text-navy" aria-hidden="true" />
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-navy/55">Application recorded</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl">Your decision scope is ready for review.</h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-navy/70">
              The operator inbox now contains the full application and its measurement baseline. Keep the reference below
              for your records. A human review determines whether the question is sufficiently defined and suitable for a pilot.
            </p>
            <div className="mt-7 rounded-2xl border border-navy/15 bg-navy/[0.03] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-navy/55">Application reference</p>
              <p className="mt-2 break-all font-mono text-sm font-semibold text-navy">{requestId}</p>
              <p className="mt-3 text-sm text-navy/65">Status: New — awaiting operator review</p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/enterprise" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white">
                Return to pilot overview
              </Link>
              <Link to="/trust" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-navy px-6 py-3 text-sm font-bold text-navy">
                Review data and procurement controls
              </Link>
            </div>
          </section>
        ) : (
          <form onSubmit={submit} className="space-y-10" noValidate={false}>
            <FormSection number="01" title="Applicant" description="Who owns or materially supports the decision?">
              <Field label="Full name" name="contact_name">
                <Input id="contact_name" required minLength={2} maxLength={100} autoComplete="name" value={form.contact_name} onChange={e => update('contact_name', e.target.value)} />
              </Field>
              <Field label="Work email" name="work_email">
                <Input id="work_email" required type="email" maxLength={254} autoComplete="email" value={form.work_email} onChange={e => update('work_email', e.target.value)} />
              </Field>
              <Field label="Organization" name="organization">
                <Input id="organization" required minLength={2} maxLength={150} autoComplete="organization" value={form.organization} onChange={e => update('organization', e.target.value)} />
              </Field>
              <Field label="Role or title" name="role_title">
                <Input id="role_title" required minLength={2} maxLength={120} autoComplete="organization-title" value={form.role_title} onChange={e => update('role_title', e.target.value)} />
              </Field>
              <Field label="Organization type" name="organization_type">
                <select id="organization_type" required className="flex min-h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-base text-navy" value={form.organization_type} onChange={e => update('organization_type', e.target.value)}>
                  {organizationTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
            </FormSection>

            <FormSection number="02" title="Decision scope" description="Describe one decision that can be evaluated within a bounded pilot.">
              <Field label="Sector or operating category" name="target_sector">
                <Input id="target_sector" required minLength={2} maxLength={120} placeholder={language === 'pt' ? 'Por exemplo: logística, tecnologia financeira, agro-indústria' : 'For example: logistics, fintech, agribusiness'} value={form.target_sector} onChange={e => update('target_sector', e.target.value)} />
              </Field>
              <div className="md:col-span-2">
                <Label className="text-sm font-bold text-navy">Candidate African markets</Label>
                <p className="mt-1 text-sm leading-6 text-navy/60">Name one required market and up to two alternatives. This is deliberately limited to keep the pilot comparable.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Input aria-label={language === 'pt' ? 'Primeiro mercado candidato' : 'First candidate market'} required minLength={2} maxLength={100} placeholder={language === 'pt' ? 'Obrigatório' : 'Required'} value={form.country_one} onChange={e => update('country_one', e.target.value)} />
                  <Input aria-label={language === 'pt' ? 'Segundo mercado candidato' : 'Second candidate market'} minLength={2} maxLength={100} placeholder={language === 'pt' ? 'Facultativo' : 'Optional'} value={form.country_two} onChange={e => update('country_two', e.target.value)} />
                  <Input aria-label={language === 'pt' ? 'Terceiro mercado candidato' : 'Third candidate market'} minLength={2} maxLength={100} placeholder={language === 'pt' ? 'Facultativo' : 'Optional'} value={form.country_three} onChange={e => update('country_three', e.target.value)} />
                </div>
              </div>
              <Field wide label="Decision question" name="decision_question" hint="State the decision, not a broad topic. Minimum 20 characters.">
                <Textarea id="decision_question" required minLength={20} maxLength={2000} rows={5} placeholder={language === 'pt' ? 'Que mercado devemos priorizar para…' : 'Which market should we prioritize for…'} value={form.decision_question} onChange={e => update('decision_question', e.target.value)} />
              </Field>
              <Field label="Decision deadline, if known" name="decision_deadline">
                <Input id="decision_deadline" type="date" value={form.decision_deadline} onChange={e => update('decision_deadline', e.target.value)} />
              </Field>
            </FormSection>

            <FormSection number="03" title="Measurement baseline" description="A useful pilot must be judged against the process it is intended to improve.">
              <Field wide label="How is this research handled today?" name="current_research_process" hint="Include the people, sources, time or external support normally involved. Minimum 20 characters.">
                <Textarea id="current_research_process" required minLength={20} maxLength={2000} rows={6} value={form.current_research_process} onChange={e => update('current_research_process', e.target.value)} />
              </Field>
              <Field wide label="What measurable result would make the pilot useful?" name="success_measure" hint="Examples include time saved, evidence coverage, risks surfaced or decisions narrowed. Minimum 20 characters.">
                <Textarea id="success_measure" required minLength={20} maxLength={1000} rows={5} value={form.success_measure} onChange={e => update('success_measure', e.target.value)} />
              </Field>
            </FormSection>

            <section className="rounded-3xl border-2 border-navy p-6 md:p-8">
              <div className="flex gap-4">
                <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-navy" aria-hidden="true" />
                <div>
                  <h2 className="font-serif text-2xl">Information boundary</h2>
                  <p className="mt-3 leading-7 text-navy/70">
                    Do not submit confidential, personal, regulated, privileged or commercially sensitive information.
                    Use a generalized decision description. Detailed material should only be considered after appropriate
                    terms and a separately agreed handling process.
                  </p>
                </div>
              </div>
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-navy/[0.04] p-4 text-sm font-semibold leading-6">
                <input type="checkbox" required className="mt-1 h-5 w-5 shrink-0 accent-navy" checked={form.confirmed} onChange={e => update('confirmed', e.target.checked)} />
                I confirm that this application contains no confidential or sensitive information.
              </label>
            </section>

            {error && <p role="alert" className="rounded-2xl border border-red-700/25 bg-red-50 p-4 text-sm font-semibold text-red-900">{error}</p>}

            <Button type="submit" disabled={submitting} className="min-h-14 w-full rounded-xl bg-navy px-7 text-base font-bold text-white sm:w-auto">
              {submitting ? 'Recording application…' : 'Submit pilot application'}
              {!submitting && <ArrowRight className="ml-2 h-5 w-5" />}
            </Button>
          </form>
        )}

        <aside className="space-y-5 lg:sticky lg:top-28">
          <div className="rounded-3xl border border-navy bg-white p-6 md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/55">Published introductory pricing</p>
            <div className="mt-5 space-y-4">
              <div><p className="font-bold text-navy">Focused market brief</p><p className="mt-1 text-sm text-navy/65">$750 fixed · one country · 10 business days</p></div>
              <div className="h-px bg-navy/10" />
              <div><p className="font-bold text-navy">Comparative entry pilot</p><p className="mt-1 text-sm text-navy/65">$1,800 fixed · up to three countries · four weeks</p></div>
              <div className="h-px bg-navy/10" />
              <p className="text-xs leading-6 text-navy/55">No fee to apply. Suitable work proceeds only after a written scope and agreement.</p>
            </div>
          </div>
          <div className="rounded-3xl bg-navy p-6 text-white md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Review sequence</p>
            <ol className="mt-5 space-y-5">
              {[
                ['Scope check', 'Is there one clear decision, one sector and no more than three markets?'],
                ['Fit review', 'Can available evidence support useful comparison without overstating certainty?'],
                ['Measurement check', 'Can the result be compared with the applicant’s current research process?'],
                ['Pilot proposal', 'Only suitable applications move to a separately defined scope and commercial discussion.'],
              ].map(([title, copy], index) => (
                <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 text-xs font-bold">{index + 1}</span>
                  <div><p className="font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-white/65">{copy}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl border border-navy/15 p-6">
            <h2 className="font-serif text-2xl">Before applying</h2>
            <p className="mt-3 text-sm leading-7 text-navy/65">
              Review the public pilot scope and current controls. The application does not create a service contract,
              guarantee acceptance or establish that BOA-Story has delivered a verified client outcome.
            </p>
            <div className="mt-5 grid gap-2">
              <Link to="/enterprise" className="font-bold underline underline-offset-4">Read the pilot scope</Link>
              <Link to="/trust" className="font-bold underline underline-offset-4">Open the Trust Center</Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};

const FormSection = ({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) => (
  <section className="rounded-3xl border border-navy/15 bg-white p-6 shadow-sm md:p-8">
    <div className="border-b border-navy/10 pb-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy/50">{number}</p>
      <h2 className="mt-2 font-serif text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-navy/65">{description}</p>
    </div>
    <div className="mt-6 grid gap-6 md:grid-cols-2">{children}</div>
  </section>
);

const Field = ({ label, name, hint, wide, children }: { label: string; name: string; hint?: string; wide?: boolean; children: React.ReactNode }) => (
  <div className={wide ? 'md:col-span-2' : ''}>
    <Label htmlFor={name} className="text-sm font-bold text-navy">{label}</Label>
    {hint && <p className="mt-1 text-sm leading-6 text-navy/60">{hint}</p>}
    <div className="mt-2 [&_input]:min-h-12 [&_input]:rounded-xl [&_input]:text-base [&_textarea]:rounded-xl [&_textarea]:text-base">{children}</div>
  </div>
);

export default EnterprisePilotPage;
