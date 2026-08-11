import { useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, RotateCcw, Search } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { FormErrorSummary, PageHero, SubmitButton } from '@/components/JourneyUI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { KnowledgeNetworkSection } from './KnowledgeNetworkPages';
import {
  api,
  type SpecialistApplicationInput,
  type SpecialistDashboard,
  type SpecialistProfile,
  type SpecialistRequestInput,
  type SpecialistRequestStatus,
} from '@/services/api';

const splitList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
const displayList = (value: string | string[]) => Array.isArray(value) ? value.join(', ') : splitList(value).join(', ');
const pretty = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
const verificationLabel = (level: SpecialistProfile['verification_level']) => ({
  boa_specialist: 'BOA Specialist',
  verified: 'Verified Specialist',
  senior_featured: 'Senior / Featured Specialist',
}[level]);
const approachableMarketplaceError = (message: string) => {
  if (/API Error:\s*40[13]/i.test(message) || /unauthorized|forbidden/i.test(message)) return 'Your account does not have access to this marketplace view.';
  if (/API Error:\s*404/i.test(message) || /not_found/i.test(message)) return 'This marketplace record is unavailable or no longer published.';
  if (/API Error:\s*5\d\d/i.test(message)) return 'The marketplace is temporarily unavailable. Please try again.';
  return message.replace(/\b[a-z]+(?:_[a-z]+)+\b/gi, value => pretty(value).toLowerCase());
};
const ErrorMessage = ({ message }: { message: string }) =>
  message ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{approachableMarketplaceError(message)}</p> : null;
const Loading = ({ label }: { label: string }) => <div className="page-container py-16" role="status">{label}</div>;

export function SpecialistsDirectoryPage() {
  const [filters, setFilters] = useState({ country: '', sector: '', language: '', service: '' });
  const activeFilters = Object.entries(filters).filter(([, value]) => value.trim());
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['specialists', filters],
    queryFn: () => api.getSpecialists(Object.fromEntries(activeFilters)),
  });
  const reset = () => setFilters({ country: '', sector: '', language: '', service: '' });
  return <div className="page-container py-12 md:py-16">
    <SEO title="African Specialist Directory" description="Browse screened, independently listed specialists working across African markets." />
    <header className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Specialist Marketplace</p>
      <h1 className="mt-3 font-serif text-4xl font-bold md:text-6xl">Find practical African market expertise.</h1>
      <p className="mt-5 text-lg text-muted-foreground">Profiles are screened for marketplace access. Screening is not an endorsement or a substitute for your own due diligence.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/specialists/interest">Express interest in joining</Link></Button><Button asChild variant="ghost"><Link to="/specialists/sign-in">Specialist sign in</Link></Button></div>
      <div className="mt-4"><Button asChild><Link to="/specialists/circles">Explore knowledge circles</Link></Button></div>
    </header>
    <section className="mt-8 grid gap-3 md:grid-cols-3" aria-labelledby="verification-hierarchy">
      <h2 id="verification-hierarchy" className="sr-only">Specialist verification hierarchy</h2>
      {[['BOA Specialist', 'Screened for network access using submitted professional evidence.'], ['Verified Specialist', 'Additional documented experience, references, or professional credentials reviewed.'], ['Senior / Featured Specialist', 'Stronger documented standing and relevant delivery history; never awarded through payment.']].map(([title, description]) => <div key={title} className="rounded-2xl border bg-card p-4"><p className="font-bold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>)}
    </section>
    <section className="mt-12 border-y border-border bg-[#f7f8fa] px-5 py-10 sm:px-7 md:rounded-3xl md:border" aria-labelledby="specialist-knowledge-network">
      <div className="flex flex-wrap items-end justify-between gap-5"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-widest text-navy/55">Public professional knowledge</p><h2 id="specialist-knowledge-network" className="mt-3 font-serif text-3xl text-navy md:text-4xl">Regional, sector and professional circles.</h2><p className="mt-4 text-sm leading-7 text-navy/65">The marketplace is also a moderated knowledge network. Readers can follow reviewed explanations and questions while private Enterprise engagements remain separate.</p></div><Button asChild variant="outline"><Link to="/specialists/circles">Open all circles</Link></Button></div>
      <div className="mt-8"><KnowledgeNetworkSection surface="specialists" compact /></div>
    </section>
    <section className="mt-8 rounded-2xl border p-4" aria-labelledby="directory-filters">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="directory-filters" className="font-bold">Narrow the directory</h2><Button type="button" variant="ghost" size="sm" onClick={reset} disabled={!activeFilters.length}><RotateCcw size={14} className="mr-2" />Reset all</Button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {Object.keys(filters).map(key => <div key={key}>
          <Label htmlFor={`filter-${key}`} className="capitalize">{key}</Label>
          <Input id={`filter-${key}`} placeholder={`Exact ${key}`} value={filters[key as keyof typeof filters]}
            onChange={event => setFilters(current => ({ ...current, [key]: event.target.value }))} />
        </div>)}
      </div>
      {activeFilters.length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">{activeFilters.map(([key, value]) => <button key={key} type="button" onClick={() => setFilters(current => ({ ...current, [key]: '' }))} className="rounded-full border bg-muted px-3 py-1 text-xs font-semibold">{pretty(key)}: {value} ×</button>)}</div>}
    </section>
    <div className="mt-8 flex items-center justify-between gap-3"><p className="text-sm font-semibold">{isLoading ? 'Searching directory…' : `${data?.data.length || 0} specialist${data?.data.length === 1 ? '' : 's'} found`}</p>{error && <Button variant="outline" size="sm" onClick={() => void refetch()}>Try again</Button>}</div>
    <ErrorMessage message={error instanceof Error ? error.message : ''} />
    <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data?.data.map(profile => <Card key={profile.id} className="flex flex-col">
        <CardHeader><div className="mb-2 flex flex-wrap gap-2"><Badge>{verificationLabel(profile.verification_level)}</Badge>{profile.founding_cohort && <Badge variant="outline">Founding Specialist</Badge>}</div><CardTitle>{profile.display_name}</CardTitle><p className="text-sm text-muted-foreground">{profile.organization || 'Independent specialist'}</p></CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <p>{profile.headline}</p>
          <p className="mt-3 text-sm text-muted-foreground">{profile.countries.slice(0, 3).join(' · ')}</p>
          <div className="mt-4 flex flex-wrap gap-2">{profile.service_categories.slice(0, 4).map(item => <Badge key={item} variant="outline">{item}</Badge>)}</div>
          <Button asChild className="mt-6"><Link to={`/specialists/${profile.slug}`}>View profile</Link></Button>
        </CardContent>
      </Card>)}
    </div>
    {!isLoading && data?.data.length === 0 && <div className="mt-8 rounded-2xl border border-dashed bg-muted/30 p-8 text-center"><Search className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-serif text-2xl font-bold">The directory is just getting started</h2><p className="mx-auto mt-2 max-w-xl text-muted-foreground">{activeFilters.length ? 'No active listings match every selected filter. Remove a filter or reset the search.' : 'Approved, subscribed specialists will appear here as the marketplace launches.'}</p><div className="mt-5 flex flex-wrap justify-center gap-3">{activeFilters.length > 0 && <Button variant="outline" onClick={reset}>Reset filters</Button>}<Button asChild variant={activeFilters.length ? 'ghost' : 'outline'}><Link to="/specialists/interest">Join the specialist waitlist</Link></Button></div></div>}
  </div>;
}

const initialInterest = {
  contact_name: '', work_email: '', entity_type: 'individual', organization: '', role_title: '',
  countries: '', sectors: '', service_categories: '', languages: '', interest_summary: '', confirmed: false,
};

export function SpecialistInterestPage() {
  const [form, setForm] = useState(initialInterest);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const update = (name: keyof typeof form, value: string | boolean) =>
    setForm(current => ({ ...current, [name]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const requiredLists = [form.countries, form.sectors, form.service_categories, form.languages];
    if (requiredLists.some(value => splitList(value).length === 0)) {
      setError('Add at least one country, sector, service, and working language.');
      return;
    }
    if (!form.confirmed) {
      setError('Confirm that your registration contains no sensitive personal or client information.');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitSpecialistInterest({
        contact_name: form.contact_name,
        work_email: form.work_email,
        entity_type: form.entity_type as 'individual' | 'organization',
        organization: form.organization || undefined,
        role_title: form.role_title || undefined,
        countries: splitList(form.countries),
        sectors: splitList(form.sectors),
        service_categories: splitList(form.service_categories),
        languages: splitList(form.languages),
        interest_summary: form.interest_summary,
        no_sensitive_data_confirmed: true,
      });
      setComplete(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your interest could not be registered.');
    } finally {
      setSubmitting(false);
    }
  };

  if (complete) return <div className="page-container py-16">
    <SEO title="Interest registered" description="Your interest in the BOA Specialist Network has been registered." noIndex />
    <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-8 text-center shadow-sm">
      <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
      <h1 className="mt-5 font-serif text-4xl font-bold">Your interest is registered.</h1>
      <p className="mt-4 text-muted-foreground">BOA reviews the registry against emerging Enterprise needs. If your expertise is relevant, the team may send a separate, single-use invitation to complete screening. Registration is not an application or a promise of admission or work.</p>
      <Button asChild className="mt-7"><Link to="/specialists">Return to the directory</Link></Button>
    </div>
  </div>;

  return <div className="page-container py-12 md:py-16">
    <SEO title="Join the BOA Specialist Network waitlist" description="Register your interest in being considered for the invite-only BOA Specialist Network." />
    <PageHero
      eyebrow="Curated specialist network"
      title="Interested in joining the BOA Specialist Network?"
      description="Register your interest. Selected specialists may be invited to complete our screening process when their expertise aligns with Enterprise needs."
      aside={<div><p className="font-bold">How entry works</p><ol className="mt-3 space-y-2 text-sm text-muted-foreground"><li>1. Register interest</li><li>2. BOA reviews demand and fit</li><li>3. Selected specialists receive an invitation</li><li>4. Screening precedes network access</li></ol></div>}
    />
    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <form onSubmit={submit} className="grid gap-5 rounded-3xl border bg-card p-6 shadow-sm md:grid-cols-2 md:p-8">
        <div className="md:col-span-2"><h2 className="font-serif text-2xl font-bold">Express your interest</h2><p className="mt-2 text-sm text-muted-foreground">Use concise professional information only. Do not submit identity documents, CV files, confidential records, or client information.</p></div>
        <div><Label htmlFor="interest-name">Full name</Label><Input id="interest-name" autoComplete="name" value={form.contact_name} onChange={event => update('contact_name', event.target.value)} required minLength={2} /></div>
        <div><Label htmlFor="interest-email">Work email</Label><Input id="interest-email" type="email" autoComplete="email" value={form.work_email} onChange={event => update('work_email', event.target.value)} required /></div>
        <div><Label htmlFor="interest-entity">Profile type</Label><select id="interest-entity" className="h-10 w-full rounded-md border bg-background px-3" value={form.entity_type} onChange={event => update('entity_type', event.target.value)}><option value="individual">Individual</option><option value="organization">Organization</option></select></div>
        <div><Label htmlFor="interest-organization">Organization (optional)</Label><Input id="interest-organization" value={form.organization} onChange={event => update('organization', event.target.value)} /></div>
        <div className="md:col-span-2"><Label htmlFor="interest-role">Role or professional title (optional)</Label><Input id="interest-role" value={form.role_title} onChange={event => update('role_title', event.target.value)} /></div>
        <div><Label htmlFor="interest-countries">Countries of expertise (comma-separated)</Label><Input id="interest-countries" value={form.countries} onChange={event => update('countries', event.target.value)} required /></div>
        <div><Label htmlFor="interest-sectors">Sectors (comma-separated)</Label><Input id="interest-sectors" value={form.sectors} onChange={event => update('sectors', event.target.value)} required /></div>
        <div><Label htmlFor="interest-services">Services (comma-separated)</Label><Input id="interest-services" value={form.service_categories} onChange={event => update('service_categories', event.target.value)} required /></div>
        <div><Label htmlFor="interest-languages">Working languages (comma-separated)</Label><Input id="interest-languages" value={form.languages} onChange={event => update('languages', event.target.value)} required /></div>
        <div className="md:col-span-2"><Label htmlFor="interest-summary">How could your expertise help Enterprise teams?</Label><Textarea id="interest-summary" rows={5} minLength={20} maxLength={1000} value={form.interest_summary} onChange={event => update('interest_summary', event.target.value)} required /></div>
        <label className="flex gap-3 rounded-xl bg-muted p-4 text-sm md:col-span-2"><input type="checkbox" checked={form.confirmed} onChange={event => update('confirmed', event.target.checked)} /><span>I confirm this registration contains no sensitive personal or client information. I understand it is not an application, admission, endorsement, or promise of work.</span></label>
        <div className="md:col-span-2"><FormErrorSummary error={error ? approachableMarketplaceError(error) : null} /><SubmitButton type="submit" className="mt-4" pending={submitting} pendingLabel="Registering interest…">Register interest</SubmitButton></div>
      </form>
      <aside className="space-y-5 rounded-3xl border p-6 text-sm">
        <h2 className="font-serif text-2xl font-bold">Why the network is invite-only</h2>
        <p className="text-muted-foreground">BOA is deliberately building a selective Founding Specialist Network of roughly 20–50 credible professionals, then recruiting around real Enterprise needs, geographic coverage, sectors, services, and languages.</p>
        <p className="text-muted-foreground">Screening is a marketplace access review, not an endorsement. Approved specialists still control independent contracting and delivery.</p>
        <p className="text-muted-foreground">Founding specialists receive waived listing access while BOA proves repeatable demand. Verification standing depends on documented evidence and relevant experience—not payment.</p>
        <Link to="/privacy" className="font-semibold text-primary underline">Read the privacy policy</Link>
      </aside>
    </div>
  </div>;
}

export function SpecialistProfilePage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ['specialist', slug], queryFn: () => api.getSpecialist(slug), enabled: Boolean(slug) });
  if (isLoading) return <Loading label="Loading specialist profile…" />;
  if (!data) return <div className="page-container py-16"><h1 className="font-serif text-4xl font-bold">Specialist profile</h1><ErrorMessage message={error instanceof Error ? error.message : 'Profile not found.'} /></div>;
  const p = data.data;
  const canRequest = user?.tier === 'enterprise' && user.marketplace_access_status === 'enabled';
  const requestUrl = `/specialists/requests/new?expertise=${encodeURIComponent(p.service_categories.join(', '))}&countries=${encodeURIComponent(p.countries.join(', '))}&specialist=${encodeURIComponent(p.display_name)}`;
  return <article className="page-container py-12 md:py-16">
    <SEO title={p.display_name} description={p.headline} />
    <Link to="/specialists" className="text-sm font-bold text-primary">← Specialist directory</Link>
    <h1 className="mt-6 font-serif text-4xl font-bold md:text-6xl">{p.display_name}</h1>
    <div className="mt-4 flex flex-wrap gap-2"><Badge>{verificationLabel(p.verification_level)}</Badge>{p.founding_cohort && <Badge variant="outline">Founding Specialist Network</Badge>}</div>
    <p className="mt-3 text-lg text-muted-foreground">{p.organization || 'Independent specialist'}</p>
    <p className="mt-6 max-w-3xl text-xl">{p.headline}</p>
    <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div><h2 className="font-serif text-2xl font-bold">About</h2><p className="mt-4 whitespace-pre-line leading-7">{p.biography}</p>
        <h2 className="mt-8 font-serif text-2xl font-bold">Credentials</h2><p className="mt-4 whitespace-pre-line leading-7">{p.credential_summary}</p>
        {p.verification_summary && <div className="mt-6 rounded-2xl border bg-muted/30 p-5"><h3 className="font-bold">BOA verification basis</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{p.verification_summary}</p></div>}
        {p.credential_links.length > 0 && <ul className="mt-4 space-y-2">{p.credential_links.map((url, index) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 break-all text-sm font-semibold text-primary underline">Credential or reference {index + 1}<ExternalLink size={13} /></a></li>)}</ul>}
      </div>
      <aside className="rounded-2xl border p-6">
        <h2 className="font-bold">Profile details</h2>
        {[['Countries', p.countries], ['Sectors', p.sectors], ['Services', p.service_categories], ['Languages', p.languages]].map(([label, values]) =>
          <div className="mt-5" key={label as string}><p className="text-xs font-bold uppercase tracking-wider">{label}</p><p className="mt-1 text-sm">{(values as string[]).join(', ')}</p></div>)}
        {p.indicative_pricing && <p className="mt-5 text-sm"><strong>Indicative pricing:</strong> {p.indicative_pricing}</p>}
        {p.availability && <p className="mt-3 text-sm"><strong>Availability:</strong> {p.availability}</p>}
        <Button asChild className="mt-6 w-full"><Link to={canRequest ? requestUrl : '/enterprise/access'}>{canRequest ? 'Start a scoped request' : 'Enterprise sign in to request'}</Link></Button>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">BOA-Story confirms marketplace screening and listing status only. Your organization remains responsible for diligence and engagement terms.</p>
      </aside>
    </div>
  </article>;
}

const initialApplication = {
  password: '', contact_name: '', entity_type: 'individual', organization: '', role_title: '',
  headline: '', biography: '', countries: '', sectors: '', service_categories: '', languages: '',
  credential_summary: '', credential_links: '', indicative_pricing: '', availability: '',
  conflicts_declaration: '', confirmed: false,
};
const applicationSteps = ['Account', 'Public profile', 'Credentials', 'Review'];

export function SpecialistJoinPage() {
  const { token = '' } = useParams();
  const { login, refreshSession } = useAuth();
  const [form, setForm] = useState(initialApplication);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const update = (name: keyof typeof form, value: string | boolean) => setForm(current => ({ ...current, [name]: value }));
  const validateStep = () => {
    if (step === 0 && (!form.contact_name.trim() || form.password.length < 12)) return 'Enter your name and a password of at least 12 characters.';
    if (step === 1 && (!form.headline.trim() || form.biography.trim().length < 80 || !form.countries.trim() || !form.sectors.trim() || !form.service_categories.trim() || !form.languages.trim())) return 'Complete every required public-profile field. Biography must be at least 80 characters.';
    if (step === 2 && (form.credential_summary.trim().length < 20 || form.conflicts_declaration.trim().length < 2)) return 'Add a credential summary and conflicts declaration.';
    return '';
  };
  const next = () => { const issue = validateStep(); setError(issue); if (!issue) setStep(current => Math.min(current + 1, 3)); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!form.confirmed) return setError('Confirm that the application contains no sensitive information.');
    setSubmitting(true);
    try {
      const payload: SpecialistApplicationInput = {
        token, password: form.password, contact_name: form.contact_name, entity_type: form.entity_type as 'individual' | 'organization',
        organization: form.organization || undefined, role_title: form.role_title || undefined, headline: form.headline, biography: form.biography,
        countries: splitList(form.countries), sectors: splitList(form.sectors), service_categories: splitList(form.service_categories),
        languages: splitList(form.languages), credential_summary: form.credential_summary, credential_links: splitList(form.credential_links),
        indicative_pricing: form.indicative_pricing || undefined, availability: form.availability || undefined,
        conflicts_declaration: form.conflicts_declaration, no_sensitive_data_confirmed: true,
      };
      const response = await api.redeemSpecialistInvite(payload);
      login(response.token, { email: '', tier: 'specialist', name: form.contact_name, type: 'specialist' });
      await refreshSession();
      setComplete(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Application could not be submitted.'); }
    finally { setSubmitting(false); }
  };
  if (complete) return <div className="page-container py-16"><SEO title="Application received" description="Specialist application status." noIndex /><h1 className="font-serif text-4xl font-bold">Application received</h1><p className="mt-4">An administrator will screen your application. Billing begins only after approval and your explicit checkout.</p><Button asChild className="mt-6"><Link to="/specialists/dashboard">Open dashboard</Link></Button></div>;
  return <div className="page-container py-12"><SEO title="Specialist invitation" description="Redeem an administrator-issued BOA-Story specialist invitation." noIndex />
    <h1 className="font-serif text-4xl font-bold">Specialist application</h1>
    <p className="mt-4 max-w-3xl text-muted-foreground">This guided application creates your account and prospective public listing. Provide links and concise summaries only—never identity documents, CV files, confidential client material, or other sensitive data.</p>
    <ol className="mt-8 grid max-w-4xl gap-2 sm:grid-cols-4">{applicationSteps.map((label, index) => <li key={label}><button type="button" onClick={() => index < step && setStep(index)} className={`w-full rounded-xl border p-3 text-left text-sm font-semibold ${index === step ? 'border-navy bg-navy text-white' : index < step ? 'bg-muted' : 'text-muted-foreground'}`}><span className="mr-2">{index + 1}.</span>{label}</button></li>)}</ol>
    <form onSubmit={submit} className="mt-8 max-w-4xl">
      {step === 0 && <section className="grid gap-5 md:grid-cols-2" aria-labelledby="application-account"><h2 id="application-account" className="font-serif text-2xl font-bold md:col-span-2">Account and identity</h2>
        <div><Label htmlFor="contact_name">Full name</Label><Input id="contact_name" value={form.contact_name} onChange={event => update('contact_name', event.target.value)} required /></div>
        <div><Label htmlFor="password">Password (12+ characters)</Label><Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={event => update('password', event.target.value)} required /></div>
        <div><Label htmlFor="entity_type">Entity type</Label><select id="entity_type" className="h-10 w-full rounded-md border bg-background px-3" value={form.entity_type} onChange={event => update('entity_type', event.target.value)}><option value="individual">Individual</option><option value="organization">Organization</option></select></div>
        <div><Label htmlFor="organization">Organization (optional)</Label><Input id="organization" value={form.organization} onChange={event => update('organization', event.target.value)} /></div>
        <div><Label htmlFor="role_title">Role/title (optional)</Label><Input id="role_title" value={form.role_title} onChange={event => update('role_title', event.target.value)} /></div>
      </section>}
      {step === 1 && <section className="grid gap-5 md:grid-cols-2" aria-labelledby="application-profile"><h2 id="application-profile" className="font-serif text-2xl font-bold md:col-span-2">Prospective public profile</h2>
        <div className="md:col-span-2"><Label htmlFor="headline">Public headline</Label><Input id="headline" value={form.headline} onChange={event => update('headline', event.target.value)} required /></div>
        <div className="md:col-span-2"><Label htmlFor="biography">Public biography (80+ characters)</Label><Textarea id="biography" rows={6} value={form.biography} onChange={event => update('biography', event.target.value)} required /></div>
        {[['countries', 'Countries'], ['sectors', 'Sectors'], ['service_categories', 'Services'], ['languages', 'Languages']].map(([name, label]) => <div key={name}><Label htmlFor={name}>{label} (comma-separated)</Label><Input id={name} value={String(form[name as keyof typeof form])} onChange={event => update(name as keyof typeof form, event.target.value)} required /></div>)}
        <div><Label htmlFor="indicative_pricing">Indicative pricing (optional)</Label><Input id="indicative_pricing" value={form.indicative_pricing} onChange={event => update('indicative_pricing', event.target.value)} /></div>
        <div><Label htmlFor="availability">Availability (optional)</Label><Input id="availability" value={form.availability} onChange={event => update('availability', event.target.value)} /></div>
      </section>}
      {step === 2 && <section className="grid gap-5" aria-labelledby="application-credentials"><h2 id="application-credentials" className="font-serif text-2xl font-bold">Credentials and conflicts</h2>
        <div><Label htmlFor="credential_summary">Credential summary</Label><Textarea id="credential_summary" rows={5} value={form.credential_summary} onChange={event => update('credential_summary', event.target.value)} required /></div>
        <div><Label htmlFor="credential_links">Credential/reference URLs (comma-separated)</Label><Input id="credential_links" type="text" placeholder="https://…" value={form.credential_links} onChange={event => update('credential_links', event.target.value)} /></div>
        <div><Label htmlFor="conflicts_declaration">Conflicts declaration</Label><Textarea id="conflicts_declaration" value={form.conflicts_declaration} onChange={event => update('conflicts_declaration', event.target.value)} required /></div>
      </section>}
      {step === 3 && <section className="space-y-5" aria-labelledby="application-review"><h2 id="application-review" className="font-serif text-2xl font-bold">Review and submit</h2>
        <div className="rounded-2xl border p-5"><p className="font-bold">{form.contact_name}</p><p className="mt-1 text-muted-foreground">{form.headline}</p><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">Countries</dt><dd>{form.countries}</dd></div><div><dt className="font-semibold">Services</dt><dd>{form.service_categories}</dd></div><div><dt className="font-semibold">Languages</dt><dd>{form.languages}</dd></div><div><dt className="font-semibold">Organization</dt><dd>{form.organization || 'Independent'}</dd></div></dl></div>
        <label className="flex gap-3 rounded-xl bg-muted p-4"><input type="checkbox" checked={form.confirmed} onChange={event => update('confirmed', event.target.checked)} /><span>I confirm this application contains no sensitive personal or client information, and the conflicts declaration is complete.</span></label>
      </section>}
      <div className="mt-6"><ErrorMessage message={error} /><div className="mt-4 flex justify-between gap-3">{step > 0 ? <Button type="button" variant="outline" onClick={() => { setError(''); setStep(current => current - 1); }}>Back</Button> : <span />}{step < 3 ? <Button type="button" onClick={next}>Continue</Button> : <Button type="submit" disabled={submitting}>{submitting ? 'Submitting application…' : 'Submit application'}</Button>}</div></div>
    </form>
  </div>;
}

const lifecycle = ['Application submitted', 'Screening', 'Approved', 'Listing access active', 'Listing live'];
const lifecycleIndex = (dashboard: SpecialistDashboard) => {
  if (dashboard.profile?.listed_at) return 4;
  if (dashboard.listing_access?.fee_waived || dashboard.subscription?.status === 'active') return 3;
  if (dashboard.application.status === 'approved') return 2;
  if (dashboard.application.status === 'screening' || dashboard.application.status === 'needs_information') return 1;
  return 0;
};

export function SpecialistDashboardPage() {
  const [params] = useSearchParams();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['specialist-dashboard'], queryFn: api.getSpecialistDashboard, staleTime: 0 });
  const [billingError, setBillingError] = useState('');
  const [billingBusy, setBillingBusy] = useState(false);
  const navigateBilling = async () => {
    if (!data || data.application.status !== 'approved') return;
    setBillingError(''); setBillingBusy(true);
    try {
      const portalStatuses = ['active', 'past_due', 'unpaid', 'canceled'];
      const response = data.subscription && portalStatuses.includes(data.subscription.status) ? await api.openSpecialistPortal() : await api.startSpecialistCheckout();
      window.location.assign(response.url);
    } catch (cause) { setBillingError(cause instanceof Error ? cause.message : 'Billing could not be opened.'); setBillingBusy(false); }
  };
  if (isLoading) return <Loading label="Loading specialist dashboard…" />;
  if (!data) return <div className="page-container py-16"><h1 className="font-serif text-3xl font-bold">Specialist dashboard</h1><ErrorMessage message={error instanceof Error ? error.message : 'Dashboard could not be loaded.'} /></div>;
  const currentStep = lifecycleIndex(data);
  const listingFeeWaived = Boolean(data.listing_access?.fee_waived);
  const billingMessage = params.get('billing') === 'success' ? 'Checkout completed. Stripe confirmation may take a moment; refresh to see the active status.' : params.get('billing') === 'cancelled' ? 'Checkout was cancelled. Your card was not charged and you can return when ready.' : '';
  return <div className="page-container py-12">
    <SEO title="Specialist dashboard" description="Manage your screened specialist listing and proposals." noIndex />
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Private specialist workspace</p><h1 className="mt-2 font-serif text-4xl font-bold">Welcome, {data.application.contact_name}</h1></div><Button variant="outline" onClick={() => void refetch()}>Refresh status</Button></div>
    {billingMessage && <p role="status" className="mt-6 rounded-xl border bg-muted p-4 text-sm">{billingMessage}</p>}
    <ol className="mt-8 grid gap-2 sm:grid-cols-5" aria-label="Listing lifecycle">{lifecycle.map((label, index) => <li key={label} className={`rounded-xl border p-3 text-sm ${index <= currentStep ? 'border-navy bg-navy text-white' : 'text-muted-foreground'}`}><span className="block text-xs font-bold">{index < currentStep ? '✓ Complete' : index === currentStep ? 'Current step' : `Step ${index + 1}`}</span><span className="mt-1 block">{label}</span></li>)}</ol>
    <div className="mt-8 grid gap-6 md:grid-cols-3">
      <Card><CardHeader><CardTitle>Screening</CardTitle></CardHeader><CardContent><Badge>{pretty(data.application.status)}</Badge><p className="mt-3 text-sm text-muted-foreground">{data.application.status === 'needs_information' ? 'The review team needs more information. Reply to your screening contact before approval can continue.' : 'Screening is separate from billing and public listing.'}</p><p className="mt-2 text-xs text-muted-foreground">Listing requires approval plus a BOA waiver or an active subscription. Payment never determines verification standing.</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Listing access</CardTitle></CardHeader><CardContent><Badge variant="outline">{listingFeeWaived ? 'Founding access waived' : pretty(data.subscription?.status || 'not started')}</Badge><p className="mt-3 text-sm text-muted-foreground">{listingFeeWaived ? `BOA has waived your listing fee${data.listing_access?.fee_waived_until ? ` through ${new Date(data.listing_access.fee_waived_until).toLocaleDateString()}` : ' during the founding-network stage'}. No payment is required for listing access.` : data.application.status !== 'approved' ? 'Listing arrangements are confirmed only after approval. You will never be charged for applying.' : data.subscription?.status === 'active' ? `Active${data.subscription.current_period_end ? ` through ${new Date(data.subscription.current_period_end).toLocaleDateString()}` : ''}.` : data.subscription?.status === 'past_due' ? 'Payment needs attention. Open billing to update the payment method.' : 'BOA will confirm a founding waiver or later billing arrangement before your profile is listed.'}</p>{!listingFeeWaived && <Button className="mt-4 w-full" disabled={data.application.status !== 'approved' || billingBusy} onClick={() => void navigateBilling()}>{billingBusy ? 'Opening billing…' : data.subscription && ['active', 'past_due', 'unpaid', 'canceled'].includes(data.subscription.status) ? 'Manage billing' : 'Open listing options'}</Button>}<ErrorMessage message={billingError} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Confirmed opportunities</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{data.matches.length}</p><p className="mt-2 text-sm text-muted-foreground">Only administrator-confirmed matches appear here.</p></CardContent></Card>
    </div>
    {data.profile && <ProfileEditor profile={data.profile} onSaved={() => void refetch()} />}
    <section className="mt-10"><h2 className="font-serif text-2xl font-bold">Confirmed opportunities</h2>
      {data.matches.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed p-7"><h3 className="font-bold">No confirmed opportunities yet</h3><p className="mt-2 text-sm text-muted-foreground">Matches are reviewed before sharing. Keep your profile current; there is nothing you need to submit until an opportunity appears here.</p></div> : <div className="mt-4 space-y-4">{data.matches.map(match => <Card key={match.id}><CardContent className="pt-6"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-bold">{match.title}</h3><Badge variant="outline">{pretty(match.status)}</Badge></div><p className="mt-2">{match.decision_question}</p><p className="mt-3 text-sm text-muted-foreground">{match.sector} · {displayList(match.countries)} · deadline {match.decision_deadline || 'not specified'}</p>{match.status === 'invited' ? <ProposalComposer matchId={match.id} /> : match.status === 'proposal_submitted' ? <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm">Proposal submitted. The Enterprise requester can now review it. You will see any lifecycle change after refreshing this workspace.</p> : <p className="mt-4 text-sm text-muted-foreground">This opportunity is {pretty(match.status).toLowerCase()} and no proposal action is available.</p>}</CardContent></Card>)}</div>}
    </section>
  </div>;
}

function ProfileEditor({ profile, onSaved }: { profile: SpecialistProfile; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    display_name: profile.display_name, organization: profile.organization || '', headline: profile.headline, biography: profile.biography,
    countries: profile.countries.join(', '), sectors: profile.sectors.join(', '), service_categories: profile.service_categories.join(', '),
    languages: profile.languages.join(', '), credential_summary: profile.credential_summary, credential_links: profile.credential_links.join(', '),
    indicative_pricing: profile.indicative_pricing || '', availability: profile.availability || '',
  });
  const mutation = useMutation({
    mutationFn: () => api.updateSpecialistProfile({
      display_name: form.display_name, organization: form.organization || null, headline: form.headline, biography: form.biography,
      countries: splitList(form.countries), sectors: splitList(form.sectors), service_categories: splitList(form.service_categories),
      languages: splitList(form.languages), credential_summary: form.credential_summary, credential_links: splitList(form.credential_links),
      indicative_pricing: form.indicative_pricing || null, availability: form.availability || null,
    }),
    onSuccess: () => { setOpen(false); onSaved(); },
  });
  return <section className="mt-10 rounded-2xl border p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Public profile</h2><p className="mt-1 text-sm text-muted-foreground">Keep the information used for matching and your public listing current.</p></div><Button variant="outline" onClick={() => setOpen(value => !value)}>{open ? 'Close editor' : 'Edit profile'}</Button></div>
    {open && <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={event => { event.preventDefault(); mutation.mutate(); }}>
      {[['display_name', 'Display name'], ['organization', 'Organization'], ['headline', 'Headline'], ['countries', 'Countries (comma-separated)'], ['sectors', 'Sectors (comma-separated)'], ['service_categories', 'Services (comma-separated)'], ['languages', 'Languages (comma-separated)'], ['credential_links', 'Credential links (comma-separated)'], ['indicative_pricing', 'Indicative pricing'], ['availability', 'Availability']].map(([name, label]) => <div key={name} className={name === 'headline' ? 'md:col-span-2' : ''}><Label htmlFor={`profile-${name}`}>{label}</Label><Input id={`profile-${name}`} value={form[name as keyof typeof form]} onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))} required={['display_name', 'headline', 'countries', 'sectors', 'service_categories', 'languages'].includes(name)} /></div>)}
      {[['biography', 'Biography'], ['credential_summary', 'Credential summary']].map(([name, label]) => <div key={name} className="md:col-span-2"><Label htmlFor={`profile-${name}`}>{label}</Label><Textarea id={`profile-${name}`} rows={5} value={form[name as keyof typeof form]} onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))} required /></div>)}
      <div className="md:col-span-2"><ErrorMessage message={mutation.error instanceof Error ? mutation.error.message : ''} /><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving profile…' : 'Save profile'}</Button></div>
    </form>}
  </section>;
}

function ProposalComposer({ matchId }: { matchId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ scope_summary: '', assumptions: '', timeline: '', indicative_fee: '' });
  const mutation = useMutation({
    mutationFn: () => api.submitSpecialistProposal(matchId, form),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['specialist-dashboard'] }); },
  });
  return <form onSubmit={event => { event.preventDefault(); mutation.mutate(); }} className="mt-6 space-y-4 rounded-xl border bg-muted/30 p-4">
    <h4 className="font-bold">Submit an indicative proposal</h4><p className="text-sm text-muted-foreground">Set scope boundaries and assumptions clearly. The requester will still complete its own diligence and contracting.</p>
    <Label htmlFor={`scope-${matchId}`}>Scope<Textarea id={`scope-${matchId}`} required minLength={20} value={form.scope_summary} onChange={event => setForm(current => ({ ...current, scope_summary: event.target.value }))} /></Label>
    <Label htmlFor={`assumptions-${matchId}`}>Assumptions<Textarea id={`assumptions-${matchId}`} value={form.assumptions} onChange={event => setForm(current => ({ ...current, assumptions: event.target.value }))} /></Label>
    <div className="grid gap-4 md:grid-cols-2"><Label htmlFor={`timeline-${matchId}`}>Timeline<Input id={`timeline-${matchId}`} required value={form.timeline} onChange={event => setForm(current => ({ ...current, timeline: event.target.value }))} /></Label><Label htmlFor={`fee-${matchId}`}>Indicative fee<Input id={`fee-${matchId}`} required value={form.indicative_fee} onChange={event => setForm(current => ({ ...current, indicative_fee: event.target.value }))} /></Label></div>
    <ErrorMessage message={mutation.error instanceof Error ? mutation.error.message : ''} />{mutation.isSuccess && <p role="status" className="text-sm font-semibold text-green-700">Proposal submitted and the opportunity status has been refreshed.</p>}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Submitting proposal…' : 'Submit proposal'}</Button>
  </form>;
}

export function SpecialistRequestsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['specialist-requests'], queryFn: api.getSpecialistRequests, staleTime: 0 });
  if (isLoading) return <Loading label="Loading your specialist requests…" />;
  return <div className="page-container py-12"><SEO title="Specialist requests" description="Private Enterprise specialist request inbox." noIndex />
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Enterprise workspace</p><h1 className="mt-2 font-serif text-4xl font-bold">Specialist requests</h1><p className="mt-3 text-muted-foreground">Track scoped requests and review proposals shared by confirmed specialists.</p></div><Button asChild><Link to="/specialists/requests/new">New request</Link></Button></div>
    <ErrorMessage message={error instanceof Error ? error.message : ''} />{error && <Button className="mt-3" variant="outline" onClick={() => void refetch()}>Retry inbox</Button>}
    {data?.data.length === 0 && <div className="mt-8 rounded-2xl border border-dashed p-8"><h2 className="font-serif text-2xl font-bold">No requests yet</h2><p className="mt-2 text-muted-foreground">Create a bounded decision request when specialist verification would help your team move forward.</p><Button asChild className="mt-5"><Link to="/specialists/requests/new">Create first request</Link></Button></div>}
    <div className="mt-8 grid gap-4">{data?.data.map(request => <Card key={request.id}><CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{request.title}</h2><Badge variant="outline">{pretty(request.status)}</Badge></div><p className="mt-2 text-sm text-muted-foreground">{request.sector} · {displayList(request.countries)} · deadline {request.decision_deadline || 'not specified'}</p><p className="mt-1 text-xs text-muted-foreground">Updated {new Date(request.updated_at).toLocaleDateString()}</p></div><Button asChild variant="outline"><Link to={`/specialists/requests/${request.id}`}>Open request</Link></Button></CardContent></Card>)}</div>
  </div>;
}

export function SpecialistRequestNewPage() {
  const [params] = useSearchParams();
  const initialForm = useMemo(() => ({
    title: params.get('specialist') ? `Specialist support: ${params.get('specialist')}` : '', decision_question: '',
    countries: params.get('countries') || params.get('country') || '', sector: params.get('sector') || '',
    required_expertise: params.get('expertise') || '', preferred_languages: params.get('languages') || '',
    decision_deadline: '', context_summary: '', confirmed: false,
  }), [params]);
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState('');
  const mutation = useMutation({
    mutationFn: (payload: SpecialistRequestInput) => api.createSpecialistRequest(payload),
    onSuccess: response => setCreated(response.id),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.confirmed) return;
    mutation.mutate({ title: form.title, decision_question: form.decision_question, countries: splitList(form.countries), sector: form.sector, required_expertise: splitList(form.required_expertise), preferred_languages: splitList(form.preferred_languages), decision_deadline: form.decision_deadline || undefined, context_summary: form.context_summary || undefined, no_sensitive_data_confirmed: true });
  };
  if (created) return <div className="page-container py-16"><SEO title="Request received" description="Private specialist request confirmation." noIndex /><h1 className="font-serif text-4xl font-bold">Request received</h1><p className="mt-4">Administrators will rank and confirm suitable active specialists before request details are shared.</p><Button asChild className="mt-6"><Link to={`/specialists/requests/${created}`}>View request</Link></Button></div>;
  return <div className="page-container py-12"><SEO title="Request a specialist" description="Submit a structured specialist request for an approved Enterprise account." noIndex /><h1 className="font-serif text-4xl font-bold">Request a specialist</h1>
    <p className="mt-4 text-muted-foreground">Frame one decision and the expertise needed to verify it. Do not include confidential, regulated, or sensitive information.</p>
    {(params.get('country') || params.get('sector') || params.get('expertise')) && <p className="mt-5 rounded-xl bg-muted p-4 text-sm">We prefilled this request from the market workspace or specialist profile. Review every field before submitting.</p>}
    <form onSubmit={submit} className="mt-8 grid max-w-3xl gap-5">
      {[['title', 'Request title'], ['countries', 'Target countries (comma-separated)'], ['sector', 'Sector'], ['required_expertise', 'Required expertise (comma-separated)'], ['preferred_languages', 'Preferred languages (comma-separated)'], ['decision_deadline', 'Decision deadline']].map(([name, label]) => <div key={name}><Label htmlFor={name}>{label}</Label><Input id={name} type={name === 'decision_deadline' ? 'date' : 'text'} required={name !== 'decision_deadline'} value={String(form[name as keyof typeof form])} onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))} /></div>)}
      {[['decision_question', 'Decision question'], ['context_summary', 'Context summary (optional)']].map(([name, label]) => <div key={name}><Label htmlFor={name}>{label}</Label><Textarea id={name} required={name === 'decision_question'} value={String(form[name as keyof typeof form])} onChange={event => setForm(current => ({ ...current, [name]: event.target.value }))} /></div>)}
      <label className="flex gap-3 rounded-xl bg-muted p-4"><input type="checkbox" checked={form.confirmed} onChange={event => setForm(current => ({ ...current, confirmed: event.target.checked }))} /><span>I confirm this request contains no sensitive information.</span></label>
      {!form.confirmed && mutation.isError && <ErrorMessage message="Confirm the data boundary before submitting." />}<ErrorMessage message={mutation.error instanceof Error ? mutation.error.message : ''} /><Button type="submit" disabled={mutation.isPending || !form.confirmed}>{mutation.isPending ? 'Submitting request…' : 'Submit request'}</Button>
    </form>
  </div>;
}

const requestStages: SpecialistRequestStatus[] = ['submitted', 'matching', 'proposals_ready', 'closed'];

export function SpecialistRequestPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['specialist-request', id], queryFn: () => api.getSpecialistRequest(id), enabled: Boolean(id), staleTime: 0 });
  const proposalMutation = useMutation({
    mutationFn: ({ proposalId, status }: { proposalId: string; status: 'accepted' | 'declined' }) => api.updateSpecialistProposal(proposalId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['specialist-request', id] }),
        queryClient.invalidateQueries({ queryKey: ['specialist-requests'] }),
      ]);
    },
  });
  if (query.isLoading) return <Loading label="Loading specialist request…" />;
  if (!query.data) return <div className="page-container py-16"><h1 className="font-serif text-4xl font-bold">Specialist request</h1><ErrorMessage message={query.error instanceof Error ? query.error.message : 'Request not found.'} /></div>;
  const { request, proposals } = query.data;
  const stageIndex = requestStages.indexOf(request.status);
  return <div className="page-container py-12"><SEO title="Specialist request" description="Private Enterprise specialist request." noIndex />
    <Link to="/specialists/requests" className="text-sm font-bold text-primary">← Request inbox</Link><div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-serif text-4xl font-bold">{request.title}</h1><p className="mt-3 max-w-3xl text-lg">{request.decision_question}</p></div><Badge>{pretty(request.status)}</Badge></div>
    <ol className="mt-8 grid gap-2 sm:grid-cols-4" aria-label="Request status timeline">{requestStages.map((stage, index) => <li key={stage} className={`rounded-xl border p-3 text-sm ${index <= stageIndex ? 'border-navy bg-navy text-white' : 'text-muted-foreground'}`}><span className="block text-xs font-bold">{index < stageIndex ? '✓ Complete' : index === stageIndex ? 'Current status' : 'Upcoming'}</span>{pretty(stage)}</li>)}</ol>
    <div className="mt-8 grid gap-4 rounded-2xl border p-5 text-sm md:grid-cols-3"><div><strong>Markets</strong><p>{request.countries.join(', ')}</p></div><div><strong>Sector</strong><p>{request.sector}</p></div><div><strong>Decision deadline</strong><p>{request.decision_deadline || 'Not specified'}</p></div><div className="md:col-span-3"><strong>Required expertise</strong><p>{request.required_expertise.join(', ')}</p></div>{request.context_summary && <div className="md:col-span-3"><strong>Context</strong><p className="mt-1 whitespace-pre-line">{request.context_summary}</p></div>}</div>
    <section className="mt-10"><h2 className="font-serif text-2xl font-bold">Proposals</h2>
      {proposals.length === 0 && <div className="mt-4 rounded-2xl border border-dashed p-6"><p className="font-semibold">No proposals are ready yet.</p><p className="mt-2 text-sm text-muted-foreground">Administrators first rank and confirm eligible specialists. Return here when the request reaches “Proposals ready.”</p></div>}
      <div className="mt-4 grid gap-4">{proposals.map(proposal => <Card key={proposal.id}><CardContent className="pt-6"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{proposal.display_name}</h3><p className="text-sm text-muted-foreground">{proposal.organization || 'Independent specialist'}</p></div><Badge variant="outline">{pretty(proposal.status)}</Badge></div><p className="mt-3 whitespace-pre-line">{proposal.scope_summary}</p>{proposal.assumptions && <p className="mt-3 text-sm text-muted-foreground"><strong>Assumptions:</strong> {proposal.assumptions}</p>}<p className="mt-3 text-sm"><strong>Timeline:</strong> {proposal.timeline} · <strong>Indicative fee:</strong> {proposal.indicative_fee}</p><Link className="mt-3 inline-block text-sm font-semibold text-primary underline" to={`/specialists/${proposal.slug}`}>Review public profile</Link>{proposal.status === 'submitted' && <div className="mt-5 flex flex-wrap gap-2"><Button disabled={proposalMutation.isPending} onClick={() => proposalMutation.mutate({ proposalId: proposal.id, status: 'accepted' })}>Accept proposal</Button><Button disabled={proposalMutation.isPending} variant="outline" onClick={() => proposalMutation.mutate({ proposalId: proposal.id, status: 'declined' })}>Decline</Button></div>}</CardContent></Card>)}</div>
      <ErrorMessage message={proposalMutation.error instanceof Error ? proposalMutation.error.message : ''} />{proposalMutation.isPending && <p role="status" className="mt-3 text-sm">Updating proposal and refreshing the request…</p>}
    </section>
  </div>;
}
