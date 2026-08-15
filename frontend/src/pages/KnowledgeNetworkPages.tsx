import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpenCheck, ExternalLink, MessageSquare, ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  api,
  type KnowledgeContribution,
  type KnowledgeContributionInput,
  type KnowledgeContributionType,
  type KnowledgeFactBasis,
  type KnowledgeGroup,
  type KnowledgeGroupType,
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { trackJourneyCompletion } from '@/lib/navigationTelemetry';

type Surface = 'enterprise' | 'specialists' | 'readers';

const GROUP_LABELS: Record<KnowledgeGroupType, string> = {
  enterprise_audience: 'Enterprise groups',
  region: 'Regional circles',
  sector: 'Sector circles',
  profession: 'Professional circles',
  language: 'Language circles',
  decision: 'Decision circles',
};

const CONTRIBUTION_LABELS: Record<KnowledgeContributionType, string> = {
  field_signal: 'Field signal',
  expert_explanation: 'Expert explanation',
  evidence_challenge: 'Evidence challenge',
  enterprise_question: 'Enterprise question',
  reader_question: 'Reader question',
  country_perspective: 'Country perspective',
  sector_perspective: 'Sector perspective',
  decision_reflection: 'Decision reflection',
};

const FACT_LABELS: Record<KnowledgeFactBasis, string> = {
  sourced_analysis: 'Source-linked analysis',
  professional_experience: 'Professional experience',
  question: 'Open question',
  consented_learning: 'Consented engagement learning',
};

const splitList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

function availableTypes(tier?: string): KnowledgeContributionType[] {
  if (tier === 'specialist') return ['field_signal', 'expert_explanation', 'evidence_challenge', 'country_perspective', 'sector_perspective', 'reader_question'];
  if (tier === 'enterprise') return ['enterprise_question', 'decision_reflection'];
  return ['reader_question'];
}

function defaultBasis(type: KnowledgeContributionType): KnowledgeFactBasis {
  if (type.endsWith('_question')) return 'question';
  if (type === 'decision_reflection') return 'consented_learning';
  if (type === 'field_signal' || type === 'evidence_challenge') return 'sourced_analysis';
  return 'professional_experience';
}

function KnowledgeComposer({ group, onSubmitted }: { group: KnowledgeGroup; onSubmitted: () => void }) {
  const { isAuthenticated, user } = useAuth();
  const types = availableTypes(user?.tier);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: types[0], title: '', body: '', countries: '', sectors: '', sources: '', conflict: '', identity: false, confirmed: false,
  });
  const mutation = useMutation({
    mutationFn: () => api.submitKnowledgeContribution({
      group_slug: group.slug,
      contribution_type: form.type,
      title: form.title,
      body: form.body,
      countries: splitList(form.countries),
      sectors: splitList(form.sectors),
      source_urls: splitList(form.sources),
      fact_basis: defaultBasis(form.type),
      conflict_disclosure: form.conflict || undefined,
      no_sensitive_data_confirmed: true,
      public_identity_confirmed: form.identity,
    } satisfies KnowledgeContributionInput),
    onSuccess: () => {
      trackJourneyCompletion('network', 'review_submission', `/circles/${group.slug}`);
      setForm(current => ({ ...current, title: '', body: '', countries: '', sectors: '', sources: '', conflict: '', confirmed: false }));
      onSubmitted();
    },
  });

  if (!isAuthenticated) return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="font-bold text-navy">Ask the circle</p>
      <p className="mt-2 text-sm leading-6 text-navy/65">Sign in before submitting a moderated public question. Reading remains open.</p>
      <Button asChild variant="outline" className="mt-4"><Link to="/member-access">Sign in to contribute</Link></Button>
    </div>
  );

  if (!open) return <Button onClick={() => setOpen(true)}><MessageSquare size={16} /> Contribute to this circle</Button>;
  return (
    <form className="rounded-2xl border border-border bg-white p-5 md:p-6" onSubmit={(event: FormEvent) => { event.preventDefault(); if (form.confirmed) mutation.mutate(); }}>
      <div className="flex items-start justify-between gap-4"><div><p className="font-bold text-navy">Contribute to {group.name}</p><p className="mt-1 text-sm text-navy/60">Every submission receives human review before publication.</p></div><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div><Label htmlFor="knowledge-type">Contribution type</Label><select id="knowledge-type" className="mt-2 min-h-11 w-full rounded-xl border border-border bg-white px-3" value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as KnowledgeContributionType }))}>{types.map(type => <option key={type} value={type}>{CONTRIBUTION_LABELS[type]}</option>)}</select></div>
        <div><Label htmlFor="knowledge-title">Clear title</Label><Input id="knowledge-title" minLength={8} maxLength={180} required value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} /></div>
        <div className="md:col-span-2"><Label htmlFor="knowledge-body">Contribution</Label><Textarea id="knowledge-body" rows={6} minLength={30} maxLength={4000} required value={form.body} onChange={event => setForm(current => ({ ...current, body: event.target.value }))} /></div>
        <div><Label htmlFor="knowledge-countries">Countries (comma-separated)</Label><Input id="knowledge-countries" value={form.countries} onChange={event => setForm(current => ({ ...current, countries: event.target.value }))} /></div>
        <div><Label htmlFor="knowledge-sectors">Sectors (comma-separated)</Label><Input id="knowledge-sectors" value={form.sectors} onChange={event => setForm(current => ({ ...current, sectors: event.target.value }))} /></div>
        <div className="md:col-span-2"><Label htmlFor="knowledge-sources">Source links (comma-separated)</Label><Input id="knowledge-sources" type="text" required={form.type === 'field_signal' || form.type === 'evidence_challenge'} value={form.sources} onChange={event => setForm(current => ({ ...current, sources: event.target.value }))} /><p className="mt-1 text-xs text-navy/55">Required for field signals and evidence challenges.</p></div>
        <div className="md:col-span-2"><Label htmlFor="knowledge-conflict">Relevant conflict or commercial relationship (optional)</Label><Textarea id="knowledge-conflict" rows={2} maxLength={1000} value={form.conflict} onChange={event => setForm(current => ({ ...current, conflict: event.target.value }))} /></div>
      </div>
      <div className="mt-5 space-y-3 text-sm leading-6 text-navy/70">
        <label className="flex gap-3"><input type="checkbox" checked={form.identity} onChange={event => setForm(current => ({ ...current, identity: event.target.checked }))} /><span>Show my approved public identity. Otherwise BOA displays a role-only identity. Specialist public profiles remain attributed.</span></label>
        <label className="flex gap-3 rounded-xl bg-navy/[0.04] p-4"><input type="checkbox" required checked={form.confirmed} onChange={event => setForm(current => ({ ...current, confirmed: event.target.checked }))} /><span>I confirm this contains no confidential, regulated, personal or material non-public information and may be reviewed for public publication.</span></label>
      </div>
      {mutation.error && <p role="alert" className="mt-4 text-sm text-red-700">{mutation.error instanceof Error ? mutation.error.message : 'Submission failed.'}</p>}
      {mutation.isSuccess && <p role="status" className="mt-4 rounded-xl bg-navy/[0.05] p-4 text-sm font-semibold text-navy">Contribution received for human review. It is not public yet.</p>}
      <Button className="mt-5" type="submit" disabled={!form.confirmed || mutation.isPending}>{mutation.isPending ? 'Submitting for review…' : 'Submit for review'}</Button>
    </form>
  );
}

function CircleMembershipRequest({ group }: { group: KnowledgeGroup }) {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState('');
  const [open, setOpen] = useState(false);
  const mutation = useMutation({ mutationFn: () => api.requestKnowledgeMembership(group.slug, evidence) });
  if (user?.tier !== 'specialist') return null;
  if (mutation.isSuccess) return <p role="status" className="rounded-xl border border-border bg-white p-4 text-sm font-semibold text-navy">Circle membership is pending human review.</p>;
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>Request circle membership</Button>;
  return <form className="rounded-2xl border border-border bg-white p-5" onSubmit={event => { event.preventDefault(); mutation.mutate(); }}><Label htmlFor="membership-evidence">Why your documented experience fits this circle</Label><Textarea id="membership-evidence" className="mt-2" minLength={20} maxLength={1200} required value={evidence} onChange={event => setEvidence(event.target.value)} /><p className="mt-2 text-xs leading-5 text-navy/55">Membership is evidence-reviewed. Payment and popularity cannot approve it.</p>{mutation.error && <p role="alert" className="mt-3 text-sm text-red-700">{mutation.error instanceof Error ? mutation.error.message : 'Request failed.'}</p>}<div className="mt-4 flex gap-2"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Submitting…' : 'Request review'}</Button><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div></form>;
}

function FollowGroupButton({ group }: { group: KnowledgeGroup }) {
  const { isAuthenticated } = useAuth();
  const [following, setFollowing] = useState(false);
  const mutation = useMutation({ mutationFn: () => api.toggleKnowledgeGroupFollow(group.slug), onSuccess: result => setFollowing(result.following) });
  if (!isAuthenticated) return null;
  return <Button variant={following ? 'default' : 'outline'} disabled={mutation.isPending} onClick={() => mutation.mutate()}>{following ? 'Following circle' : 'Follow circle'}</Button>;
}

function ReviewedResponseComposer({ item }: { item: KnowledgeContribution }) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [sources, setSources] = useState('');
  const [identity, setIdentity] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const contributionType: KnowledgeContributionType = user?.tier === 'specialist'
    ? 'expert_explanation'
    : user?.tier === 'enterprise' ? 'enterprise_question' : 'reader_question';
  const mutation = useMutation({
    mutationFn: () => api.submitKnowledgeContribution({
      group_slug: item.group_slug,
      parent_id: item.id,
      contribution_type: contributionType,
      title: user?.tier === 'specialist' ? `Response to: ${item.title}` : `Follow-up: ${item.title}`,
      body,
      countries: item.countries,
      sectors: item.sectors,
      source_urls: splitList(sources),
      fact_basis: defaultBasis(contributionType),
      no_sensitive_data_confirmed: true,
      public_identity_confirmed: identity,
    }),
    onSuccess: () => {
      setBody(''); setSources(''); setConfirmed(false); setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['knowledge-contributions'] });
    },
  });
  if (!isAuthenticated) return <Button asChild variant="ghost"><Link to="/member-access"><MessageSquare size={15} /> Sign in to respond</Link></Button>;
  if (!open) return <Button variant="ghost" onClick={() => setOpen(true)}><MessageSquare size={15} /> Respond</Button>;
  return <form className="mt-5 w-full rounded-2xl border border-border bg-[#f7f8fa] p-4" onSubmit={event => { event.preventDefault(); if (confirmed) mutation.mutate(); }}>
    <p className="font-bold text-navy">Submit a reviewed response</p>
    <p className="mt-1 text-xs leading-5 text-navy/55">Your response appears only after human review and remains linked to the contribution above.</p>
    <Label className="mt-4 block">Response<Textarea className="mt-2 bg-white" minLength={30} maxLength={4000} required value={body} onChange={event => setBody(event.target.value)} /></Label>
    <Label className="mt-4 block">Supporting source links (comma-separated)<Input className="mt-2 bg-white" value={sources} onChange={event => setSources(event.target.value)} /></Label>
    <div className="mt-4 space-y-3 text-xs leading-5 text-navy/65">
      <label className="flex gap-2"><input type="checkbox" checked={identity} onChange={event => setIdentity(event.target.checked)} /><span>Show my approved public identity where my account permits it.</span></label>
      <label className="flex gap-2"><input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>I confirm this contains no confidential, regulated, personal or material non-public information.</span></label>
    </div>
    {mutation.error && <p role="alert" className="mt-3 text-sm text-red-700">{mutation.error instanceof Error ? mutation.error.message : 'Response could not be submitted.'}</p>}
    <div className="mt-4 flex gap-2"><Button type="submit" size="sm" disabled={!confirmed || mutation.isPending}>{mutation.isPending ? 'Submitting…' : 'Submit for review'}</Button><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
  </form>;
}

function ContributionCard({ item }: { item: KnowledgeContribution }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const useful = useMutation({
    mutationFn: () => api.toggleKnowledgeUseful(item.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-contributions'] }),
  });
  return (
    <article className="rounded-3xl border border-border bg-white p-6 md:p-7">
      <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{CONTRIBUTION_LABELS[item.contribution_type]}</Badge><Badge variant="secondary">{FACT_LABELS[item.fact_basis]}</Badge>{item.corrected_at && <Badge variant="outline">Corrected</Badge>}</div>
      <h3 className="mt-5 font-serif text-2xl text-navy">{item.title}</h3>
      <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-navy/75">{item.body}</p>
      {(item.countries.length > 0 || item.sectors.length > 0) && <div className="mt-5 flex flex-wrap gap-2">{[...item.countries, ...item.sectors].map(tag => <span key={tag} className="rounded-full bg-navy/[0.05] px-3 py-1 text-xs font-semibold text-navy">{tag}</span>)}</div>}
      {item.source_urls.length > 0 && <div className="mt-5 border-l-2 border-navy/15 pl-4"><p className="text-xs font-bold uppercase tracking-widest text-navy/50">Sources supplied</p>{item.source_urls.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 break-all text-sm font-semibold text-navy underline underline-offset-4">Source {index + 1}<ExternalLink size={13} /></a>)}</div>}
      {item.conflict_disclosure && <p className="mt-5 text-sm leading-6 text-navy/60"><strong>Disclosure:</strong> {item.conflict_disclosure}</p>}
      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-sm text-navy/60">
        <div><p className="font-bold text-navy">{item.author_display_name}</p><p>{item.group_name} · {new Date(item.published_at).toLocaleDateString()}</p></div>
        <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" disabled={!isAuthenticated || useful.isPending} title={isAuthenticated ? 'Mark this contribution useful' : 'Sign in to react'} onClick={() => useful.mutate()}><ThumbsUp size={15} /> {item.useful_count}</Button><ReviewedResponseComposer item={item} />{item.reply_count > 0 && <span>{item.reply_count} reviewed responses</span>}</div>
      </footer>
    </article>
  );
}

export function KnowledgeNetworkSection({ surface, compact = false }: { surface: Surface; compact?: boolean }) {
  const [groupType, setGroupType] = useState<KnowledgeGroupType | 'all'>('all');
  const [selected, setSelected] = useState('');
  const [submitted, setSubmitted] = useState(0);
  const groupsQuery = useQuery({ queryKey: ['knowledge-groups', surface], queryFn: () => api.getKnowledgeGroups(surface) });
  const contributionsQuery = useQuery({ queryKey: ['knowledge-contributions', selected, submitted], queryFn: () => api.getKnowledgeContributions(selected ? { group: selected, limit: compact ? '3' : '20' } : { limit: compact ? '3' : '20' }) });
  const groups = useMemo(() => groupsQuery.data?.data || [], [groupsQuery.data?.data]);
  const types = useMemo(() => [...new Set(groups.map(group => group.group_type))], [groups]);
  const visibleGroups = groupType === 'all' ? groups : groups.filter(group => group.group_type === groupType);
  const renderedGroups = compact ? visibleGroups.slice(0, 6) : visibleGroups;
  const selectedGroup = groups.find(group => group.slug === selected);

  return (
    <div>
      <div className="sm:hidden"><Label htmlFor="knowledge-group-type" className="sr-only">Knowledge groups</Label><select id="knowledge-group-type" className="min-h-12 w-full rounded-xl border border-border bg-white px-4 text-sm font-bold text-navy" value={groupType} onChange={event => setGroupType(event.target.value as KnowledgeGroupType | 'all')}><option value="all">All groups</option>{types.map(type => <option key={type} value={type}>{GROUP_LABELS[type]}</option>)}</select></div>
      <div className="hidden gap-2 overflow-x-auto pb-3 [scrollbar-width:none] sm:flex"><Button variant={groupType === 'all' ? 'default' : 'outline'} onClick={() => setGroupType('all')}>All groups</Button>{types.map(type => <Button key={type} variant={groupType === type ? 'default' : 'outline'} onClick={() => setGroupType(type)}>{GROUP_LABELS[type]}</Button>)}</div>
      {groupsQuery.isLoading && <p className="mt-5 text-sm text-navy/60">Loading knowledge circles…</p>}
      {groupsQuery.error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Knowledge circles could not be loaded. No substitute or generated activity is being shown.</p>}
      <div className={`mt-5 grid gap-3 ${compact ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-3'}`}>{renderedGroups.map(group => <button type="button" key={group.id} onClick={() => setSelected(current => current === group.slug ? '' : group.slug)} className={`rounded-2xl border p-5 text-left transition-colors ${selected === group.slug ? 'border-navy bg-navy text-white' : 'border-border bg-white text-navy hover:border-navy'}`}><p className="text-xs font-bold uppercase tracking-widest opacity-60">{GROUP_LABELS[group.group_type]}</p><h3 className="mt-3 text-lg font-bold">{group.name}</h3><p className="mt-2 text-sm leading-6 opacity-70">{group.description}</p><p className="mt-4 text-xs font-semibold opacity-65">{group.contribution_count} reviewed contributions · {group.follower_count} followers</p></button>)}</div>
      {selectedGroup && <div className="mt-7"><div className="mb-4 flex flex-wrap gap-2"><FollowGroupButton group={selectedGroup} /></div><div className="grid gap-4 lg:grid-cols-2"><CircleMembershipRequest group={selectedGroup} /><KnowledgeComposer group={selectedGroup} onSubmitted={() => setSubmitted(value => value + 1)} /></div></div>}
      <div className="mt-9 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-navy/55">Reviewed public knowledge</p><h3 className="mt-2 font-serif text-3xl text-navy">{selectedGroup ? selectedGroup.name : 'Latest across the network'}</h3></div>{compact && <Link to={surface === 'enterprise' ? '/enterprise/communities' : '/specialists/circles'} className="hidden items-center gap-2 text-sm font-bold text-navy underline underline-offset-4 sm:flex">Open the complete network <ArrowRight size={15} /></Link>}</div>
      {contributionsQuery.isLoading && <p className="mt-5 text-sm text-navy/60">Loading reviewed contributions…</p>}
      {!contributionsQuery.isLoading && contributionsQuery.data?.data.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-border bg-white p-7"><BookOpenCheck className="text-navy" /><h4 className="mt-4 text-lg font-bold text-navy">The circle is open for its first reviewed contribution</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-navy/65">BOA publishes real attributed knowledge only after review. Questions may be submitted now; empty activity is never replaced with invented participation.</p></div>}
      <div className="mt-5 grid gap-5 xl:grid-cols-2">{contributionsQuery.data?.data.map(item => <ContributionCard key={item.id} item={item} />)}</div>
    </div>
  );
}

export function ContextualKnowledgeFeed({ country, sector }: { country?: string; sector?: string }) {
  const filters = { ...(country ? { country } : {}), ...(sector ? { sector } : {}), limit: '4' };
  const query = useQuery({ queryKey: ['knowledge-contributions', 'context', country, sector], queryFn: () => api.getKnowledgeContributions(filters) });
  if (!query.isLoading && !query.error && query.data?.data.length === 0) return null;
  return <section className="rounded-3xl border border-border bg-[#f7f8fa] p-6 md:p-8" aria-labelledby="contextual-knowledge-title"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-navy/55">Reviewed community knowledge</p><h2 id="contextual-knowledge-title" className="mt-2 font-serif text-3xl text-navy">Questions, explanations and field perspectives</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-navy/65">Public contributions add accountable professional context without changing the underlying official record or BOA reporting.</p></div><Button asChild variant="outline"><Link to="/specialists/circles">Explore all circles</Link></Button></div>{query.isLoading && <p className="mt-6 text-sm text-navy/60">Loading reviewed contributions…</p>}{query.error && <p role="alert" className="mt-6 text-sm text-red-700">Reviewed contributions could not be loaded.</p>}<div className="mt-6 grid gap-5 xl:grid-cols-2">{query.data?.data.map(item => <ContributionCard key={item.id} item={item} />)}</div></section>;
}
