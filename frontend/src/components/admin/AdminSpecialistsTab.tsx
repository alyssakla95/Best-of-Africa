import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { AdminDecisionRoom, AdminDecisionRoomItem, AdminKnowledgeContribution, AdminKnowledgeMembership, AdminSpecialistApplication, SpecialistVerificationLevel } from '@/services/api';
import { AdminCommunityTransitions } from './AdminCommunityTransitions';

const formatList = (value: string | string[]) => {
  if (Array.isArray(value)) return value.join(', ');
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.join(', ') : value;
  } catch {
    return value;
  }
};

type StandingDraft = {
  verification_level: SpecialistVerificationLevel;
  verification_summary: string;
  founding_cohort: boolean;
  listing_fee_waived: boolean;
  listing_fee_waived_until: string;
};

const standingFrom = (application: AdminSpecialistApplication): StandingDraft => ({
  verification_level: application.verification_level || 'boa_specialist',
  verification_summary: application.verification_summary || '',
  founding_cohort: Boolean(application.founding_cohort),
  listing_fee_waived: Boolean(application.listing_fee_waived),
  listing_fee_waived_until: application.listing_fee_waived_until?.slice(0, 10) || '',
});

export function AdminSpecialistsTab() {
  const [email, setEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [enterpriseClientId, setEnterpriseClientId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [standingDrafts, setStandingDrafts] = useState<Record<string, StandingDraft>>({});
  const [knowledgeNotes, setKnowledgeNotes] = useState<Record<string, string>>({});
  const [membershipNotes, setMembershipNotes] = useState<Record<string, string>>({});
  const [roomDrafts, setRoomDrafts] = useState<Record<string, { summary: string; priorities: string; notes: string }>>({});
  const [roomItemNotes, setRoomItemNotes] = useState<Record<string, string>>({});
  const [roomSpecialists, setRoomSpecialists] = useState<Record<string, string>>({});
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-specialists'],
    queryFn: api.getAdminSpecialists,
  });
  const knowledge = useQuery({
    queryKey: ['admin-knowledge-contributions'],
    queryFn: () => api.getAdminKnowledgeContributions('pending'),
  });
  const memberships = useQuery({
    queryKey: ['admin-knowledge-memberships'],
    queryFn: api.getAdminKnowledgeMemberships,
  });
  const decisionRooms = useQuery({ queryKey: ['admin-decision-rooms'], queryFn: () => api.getAdminDecisionRooms('pending') });
  const approvedDecisionRooms = useQuery({ queryKey: ['admin-decision-rooms', 'approved'], queryFn: () => api.getAdminDecisionRooms('approved') });
  const decisionRoomItems = useQuery({ queryKey: ['admin-decision-room-items'], queryFn: () => api.getAdminDecisionRoomItems('pending') });

  const moderateKnowledge = async (item: AdminKnowledgeContribution, status: 'approved' | 'rejected') => {
    const note = knowledgeNotes[item.id]?.trim();
    if (!note) {
      toast.error('Record a moderation reason before deciding');
      return;
    }
    setBusyAction(`${item.id}:${status}`);
    try {
      await api.moderateKnowledgeContribution(item.id, status, note);
      toast.success(status === 'approved' ? 'Contribution published' : 'Contribution rejected');
      await knowledge.refetch();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Contribution could not be moderated');
    } finally {
      setBusyAction('');
    }
  };

  const moderateMembership = async (item: AdminKnowledgeMembership, status: 'approved' | 'rejected') => {
    const key = `${item.group_id}:${item.client_id}`;
    const note = membershipNotes[key]?.trim();
    if (!note) {
      toast.error('Record a membership review reason before deciding');
      return;
    }
    setBusyAction(`${key}:${status}`);
    try {
      await api.moderateKnowledgeMembership(item.group_id, item.client_id, { status, member_role: 'contributor', notes: note });
      toast.success(status === 'approved' ? 'Circle membership approved' : 'Circle membership rejected');
      await memberships.refetch();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Membership could not be reviewed');
    } finally {
      setBusyAction('');
    }
  };

  const reviewRoom = async (room: AdminDecisionRoom, moderation_status: 'approved' | 'rejected') => {
    const draft = roomDrafts[room.id] || { summary: room.editorial_summary, priorities: room.verification_priorities.join('\n'), notes: '' };
    if (!draft.notes.trim() || (moderation_status === 'approved' && !draft.summary.trim())) {
      toast.error('Record the editorial synthesis and private review reason before deciding'); return;
    }
    setBusyAction(`${room.id}:room:${moderation_status}`);
    try {
      await api.reviewDecisionRoom(room.id, { moderation_status, status: moderation_status === 'approved' ? 'evidence_review' : 'archived', editorial_summary: draft.summary.trim(), verification_priorities: draft.priorities.split('\n').map(value => value.trim()).filter(Boolean), notes: draft.notes.trim() });
      toast.success(moderation_status === 'approved' ? 'Decision room published' : 'Decision room rejected');
      await decisionRooms.refetch();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Room review failed'); }
    finally { setBusyAction(''); }
  };

  const reviewRoomItem = async (item: AdminDecisionRoomItem, status: 'approved' | 'rejected') => {
    const note = roomItemNotes[item.id]?.trim(); if (!note) { toast.error('Record an item review reason before deciding'); return; }
    setBusyAction(`${item.id}:item:${status}`);
    try { await api.reviewDecisionRoomItem(item.id, status, note); toast.success(status === 'approved' ? 'Evidence item published' : 'Evidence item rejected'); await decisionRoomItems.refetch(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Evidence item review failed'); }
    finally { setBusyAction(''); }
  };

  const inviteToRoom = async (roomId: string) => {
    const profileId = roomSpecialists[roomId];
    if (!profileId) { toast.error('Select an approved specialist'); return; }
    setBusyAction(`${roomId}:invite-specialist`);
    try { await api.inviteSpecialistToDecisionRoom(roomId, profileId); toast.success('Specialist invited to the decision room'); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Specialist invitation failed'); }
    finally { setBusyAction(''); }
  };

  const issueInvite = async (targetEmail = email, interestId?: string) => {
    setBusyAction(interestId ? `${interestId}:invite` : 'direct-invite');
    try {
      const response = await api.issueSpecialistInvite(targetEmail, 7, interestId);
      setInviteUrl(response.invitation_url);
      if (!interestId) setEmail('');
      toast.success(response.emailed ? 'Invitation issued and emailed' : 'Invitation issued; copy the URL');
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not issue invitation');
    } finally {
      setBusyAction('');
    }
  };

  const reviewInterest = async (id: string, status: 'reviewing' | 'closed') => {
    setBusyAction(`${id}:${status}`);
    try {
      await api.reviewSpecialistInterest(id, status, notes[id]);
      toast.success(status === 'reviewing' ? 'Interest marked for review' : 'Interest record closed');
      await refetch();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Interest record could not be updated');
    } finally {
      setBusyAction('');
    }
  };

  const updateEnterpriseAccess = async (clientId: string, status: 'enabled' | 'suspended' | 'revoked') => {
    setBusyAction(`${clientId}:${status}`);
    try {
      await api.grantMarketplaceAccess(clientId.trim(), status);
      toast.success(`Enterprise marketplace access ${status}`);
      if (clientId === enterpriseClientId) setEnterpriseClientId('');
      await refetch();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Access could not be updated');
    } finally {
      setBusyAction('');
    }
  };

  const review = async (id: string, status: 'screening' | 'needs_information' | 'approved' | 'rejected') => {
    try {
      const result = await api.reviewSpecialistApplication(id, status, notes[id]);
      if (result.approval_url) {
        await navigator.clipboard.writeText(result.approval_url).catch(() => undefined);
        toast.success('Approved; dashboard URL copied');
      } else toast.success(`Application marked ${status}`);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Review failed');
    }
  };

  const updateStanding = async (application: AdminSpecialistApplication) => {
    if (!application.profile_id) return;
    const draft = standingDrafts[application.id] || standingFrom(application);
    setBusyAction(`${application.id}:standing`);
    try {
      await api.updateSpecialistStanding(application.profile_id, {
        verification_level: draft.verification_level,
        verification_summary: draft.verification_summary || null,
        founding_cohort: draft.founding_cohort,
        listing_fee_waived: draft.listing_fee_waived,
        listing_fee_waived_until: draft.listing_fee_waived_until || null,
      });
      toast.success('Specialist standing and listing access updated');
      await refetch();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Specialist standing could not be updated');
    } finally {
      setBusyAction('');
    }
  };

  return <div className="space-y-8">
    <AdminCommunityTransitions />
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Decision-room publication</h2><p className="mt-1 text-sm text-muted-foreground">Confirm consent, remove private detail, establish the initial synthesis and publish explicit verification priorities.</p></div><Badge variant="outline">{decisionRooms.data?.data.length || 0} pending</Badge></div>
      <div className="mt-4 grid gap-4">{decisionRooms.data?.data.map(room => { const draft=roomDrafts[room.id]||{summary:room.editorial_summary,priorities:room.verification_priorities.join('\n'),notes:''}; const update=(change:Partial<typeof draft>)=>setRoomDrafts(current=>({...current,[room.id]:{...draft,...change}})); return <Card key={room.id}><CardContent className="pt-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{room.title}</h3><p className="mt-2 font-semibold">{room.decision_question}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{room.decision_context}</p></div><Badge variant="outline">{room.visibility}</Badge></div><div className="mt-4 flex flex-wrap gap-2">{[...room.countries,...room.sectors].map(tag=><Badge key={tag} variant="secondary">{tag}</Badge>)}</div><div className="mt-5 grid gap-4"><div><Label>Required public editorial synthesis</Label><Textarea value={draft.summary} onChange={event=>update({summary:event.target.value})} rows={4}/></div><div><Label>Verification priorities, one per line</Label><Textarea value={draft.priorities} onChange={event=>update({priorities:event.target.value})} rows={4}/></div><div><Label>Required private review record</Label><Textarea value={draft.notes} onChange={event=>update({notes:event.target.value})}/></div></div><div className="mt-4 flex gap-2"><Button disabled={Boolean(busyAction)} onClick={()=>void reviewRoom(room,'approved')}>Approve and publish room</Button><Button variant="destructive" disabled={Boolean(busyAction)} onClick={()=>void reviewRoom(room,'rejected')}>Reject</Button></div></CardContent></Card>; })}</div>
      {!decisionRooms.isLoading && decisionRooms.data?.data.length===0&&<p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No public decision rooms are awaiting review.</p>}
    </section>

    <section>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Decision-room evidence review</h2><p className="mt-1 text-sm text-muted-foreground">Check attribution, source support, confidence label, confidentiality and conflicts before adding anything to a room ledger.</p></div><Badge variant="outline">{decisionRoomItems.data?.data.length || 0} pending</Badge></div>
      <div className="mt-4 grid gap-4">{decisionRoomItems.data?.data.map(item=><Card key={item.id}><CardContent className="pt-6"><div className="flex flex-wrap gap-2"><Badge>{item.item_type.replace(/_/g,' ')}</Badge><Badge variant="outline">{item.confidence.replace(/_/g,' ')}</Badge><Badge variant="secondary">{item.author_role}</Badge></div><h3 className="mt-4 text-lg font-bold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.room_title} · {item.author_display_name}</p><p className="mt-4 whitespace-pre-line text-sm leading-7">{item.body}</p>{item.source_urls.map(url=><a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 block break-all text-sm font-semibold underline">{url}</a>)}{item.conflict_disclosure&&<p className="mt-4 text-sm"><strong>Disclosure:</strong> {item.conflict_disclosure}</p>}<div className="mt-5"><Label>Required item review record</Label><Textarea value={roomItemNotes[item.id]||''} onChange={event=>setRoomItemNotes(current=>({...current,[item.id]:event.target.value}))}/></div><div className="mt-4 flex gap-2"><Button disabled={Boolean(busyAction)} onClick={()=>void reviewRoomItem(item,'approved')}>Approve evidence item</Button><Button variant="destructive" disabled={Boolean(busyAction)} onClick={()=>void reviewRoomItem(item,'rejected')}>Reject</Button></div></CardContent></Card>)}</div>
      {!decisionRoomItems.isLoading&&decisionRoomItems.data?.data.length===0&&<p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No room evidence items are awaiting review.</p>}
    </section>
    <section>
      <div><h2 className="font-serif text-2xl font-bold">Decision-room specialist invitations</h2><p className="mt-1 text-sm text-muted-foreground">Invite approved specialists only where their documented coverage fits the room’s countries, sectors and verification priorities.</p></div>
      <div className="mt-4 grid gap-4">{approvedDecisionRooms.data?.data.filter(room=>!['resolved','archived'].includes(room.status)).map(room=><Card key={room.id}><CardContent className="pt-6"><h3 className="font-bold">{room.title}</h3><p className="mt-2 text-sm text-muted-foreground">{[...room.countries,...room.sectors].join(' · ')}</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><select className="min-h-11 rounded-xl border bg-white px-3" value={roomSpecialists[room.id]||''} onChange={event=>setRoomSpecialists(current=>({...current,[room.id]:event.target.value}))}><option value="">Select an approved specialist</option>{data?.applications.filter(application=>application.status==='approved'&&application.profile_id).map(application=><option key={application.profile_id!} value={application.profile_id!}>{application.contact_name} · {formatList(application.countries)} · {formatList(application.sectors)}</option>)}</select><Button disabled={Boolean(busyAction)||!roomSpecialists[room.id]} onClick={()=>void inviteToRoom(room.id)}>Send invitation</Button></div></CardContent></Card>)}</div>
      {!approvedDecisionRooms.isLoading&&approvedDecisionRooms.data?.data.filter(room=>!['resolved','archived'].includes(room.status)).length===0&&<p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No approved open decision rooms are ready for specialist invitations.</p>}
    </section>
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Public knowledge moderation</h2><p className="mt-1 text-sm text-muted-foreground">Nothing reaches the public knowledge network until a human checks evidence, confidentiality, attribution and disclosure.</p></div><Badge variant="outline">{knowledge.data?.data.length || 0} pending</Badge></div>
      {knowledge.isLoading && <p className="mt-4 text-sm">Loading pending contributions…</p>}
      {knowledge.error && <p role="alert" className="mt-4 text-sm text-destructive">{knowledge.error instanceof Error ? knowledge.error.message : 'Knowledge moderation could not load.'}</p>}
      <div className="mt-4 grid gap-4">{knowledge.data?.data.map(item => <Card key={item.id}><CardContent className="pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Badge>{item.contribution_type.replace(/_/g, ' ')}</Badge><Badge variant="outline">{item.author_role}</Badge><Badge variant="secondary">{item.fact_basis.replace(/_/g, ' ')}</Badge></div><h3 className="mt-3 text-lg font-bold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.author_display_name} · {item.group_name}</p></div><span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span></div>
        <p className="mt-4 whitespace-pre-line text-sm leading-7">{item.body}</p>
        {item.source_urls.length > 0 && <div className="mt-4 space-y-1 text-sm">{item.source_urls.map(url => <a key={url} className="block break-all font-semibold underline" href={url} target="_blank" rel="noreferrer">{url}</a>)}</div>}
        {item.conflict_disclosure && <p className="mt-4 text-sm"><strong>Disclosure:</strong> {item.conflict_disclosure}</p>}
        <div className="mt-5"><Label htmlFor={`knowledge-note-${item.id}`}>Required moderation record</Label><Textarea id={`knowledge-note-${item.id}`} value={knowledgeNotes[item.id] || ''} onChange={event => setKnowledgeNotes(current => ({ ...current, [item.id]: event.target.value }))} placeholder="Evidence checked, privacy boundary, corrections required, or reason for rejection." /></div>
        <div className="mt-4 flex gap-2"><Button disabled={Boolean(busyAction)} onClick={() => void moderateKnowledge(item, 'approved')}>Approve and publish</Button><Button variant="destructive" disabled={Boolean(busyAction)} onClick={() => void moderateKnowledge(item, 'rejected')}>Reject</Button></div>
      </CardContent></Card>)}</div>
      {!knowledge.isLoading && knowledge.data?.data.length === 0 && <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No knowledge contributions are awaiting review.</p>}
    </section>

    <section>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Knowledge-circle membership</h2><p className="mt-1 text-sm text-muted-foreground">Approve specialists only where their submitted experience supports the circle. Membership affects standing inside that circle, not verification elsewhere.</p></div><Badge variant="outline">{memberships.data?.data.length || 0} pending</Badge></div>
      {memberships.isLoading && <p className="mt-4 text-sm">Loading membership requests…</p>}
      {memberships.error && <p role="alert" className="mt-4 text-sm text-destructive">{memberships.error instanceof Error ? memberships.error.message : 'Membership requests could not load.'}</p>}
      <div className="mt-4 grid gap-4">{memberships.data?.data.map(item => {
        const key = `${item.group_id}:${item.client_id}`;
        return <Card key={key}><CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{item.display_name}</h3><p className="mt-1 text-sm text-muted-foreground">{item.group_name} · {item.specialist_slug}</p></div><Badge variant="outline">Pending review</Badge></div>
          <p className="mt-4 whitespace-pre-line text-sm leading-7"><strong>Submitted fit:</strong> {item.evidence_summary}</p>
          <div className="mt-5"><Label htmlFor={`membership-note-${key}`}>Required private review record</Label><Textarea id={`membership-note-${key}`} value={membershipNotes[key] || ''} onChange={event => setMembershipNotes(current => ({ ...current, [key]: event.target.value }))} placeholder="Evidence reviewed, scope approved, or reason for rejection." /></div>
          <div className="mt-4 flex gap-2"><Button disabled={Boolean(busyAction)} onClick={() => void moderateMembership(item, 'approved')}>Approve as contributor</Button><Button variant="destructive" disabled={Boolean(busyAction)} onClick={() => void moderateMembership(item, 'rejected')}>Reject</Button></div>
        </CardContent></Card>;
      })}</div>
      {!memberships.isLoading && memberships.data?.data.length === 0 && <p className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No circle memberships are awaiting review.</p>}
    </section>

    <Card>
      <CardHeader><CardTitle>Demand-led recruitment signals</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">These counts come from active Enterprise requests. Recruit against repeated country, sector, language, and service needs before expanding unrelated supply.</p>
        <div className="mt-4 flex flex-wrap gap-2">{data?.demand_signals.map(signal => <Badge key={`${signal.dimension}:${signal.value}`} variant="outline">{signal.dimension}: {signal.value} · {signal.request_count}</Badge>)}</div>
        {!isLoading && data?.demand_signals.length === 0 && <p className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No active Enterprise request signals yet. Keep recruitment selective.</p>}
      </CardContent>
    </Card>

    <section>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Specialist interest registry</h2><p className="mt-1 text-sm text-muted-foreground">Review demand-aligned expertise before issuing a single-use application invitation.</p></div><Badge variant="outline">{data?.interest.filter(item => item.status === 'new').length || 0} new</Badge></div>
      <div className="mt-4 grid gap-4">
        {data?.interest.map(interest => <Card key={interest.id}><CardContent className="pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{interest.contact_name}</h3><p className="text-sm text-muted-foreground">{interest.work_email} · {interest.organization || 'Independent'}{interest.role_title ? ` · ${interest.role_title}` : ''}</p></div><Badge variant={interest.status === 'new' ? 'default' : 'outline'}>{interest.status}</Badge></div>
          <p className="mt-4">{interest.interest_summary}</p>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2"><div><dt className="font-semibold">Countries</dt><dd>{formatList(interest.countries)}</dd></div><div><dt className="font-semibold">Sectors</dt><dd>{formatList(interest.sectors)}</dd></div><div><dt className="font-semibold">Services</dt><dd>{formatList(interest.service_categories)}</dd></div><div><dt className="font-semibold">Languages</dt><dd>{formatList(interest.languages)}</dd></div></dl>
          {['new', 'reviewing'].includes(interest.status) && <><div className="mt-4"><Label htmlFor={`interest-notes-${interest.id}`}>Private qualification notes</Label><Textarea id={`interest-notes-${interest.id}`} value={notes[interest.id] ?? interest.qualification_notes ?? ''} onChange={event => setNotes(current => ({ ...current, [interest.id]: event.target.value }))} /></div>
            <div className="mt-4 flex flex-wrap gap-2">{interest.status === 'new' && <Button variant="outline" disabled={Boolean(busyAction)} onClick={() => void reviewInterest(interest.id, 'reviewing')}>Review for demand fit</Button>}<Button disabled={Boolean(busyAction)} onClick={() => void issueInvite(interest.work_email, interest.id)}>Issue invitation</Button><Button variant="destructive" disabled={Boolean(busyAction)} onClick={() => void reviewInterest(interest.id, 'closed')}>Close</Button></div></>}
        </CardContent></Card>)}
        {!isLoading && data?.interest.length === 0 && <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No specialists have registered interest yet.</p>}
      </div>
    </section>

    <Card>
      <CardHeader><CardTitle>Issue specialist invitation</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label htmlFor="specialist-email">Work email</Label><Input id="specialist-email" type="email" value={email} onChange={event => setEmail(event.target.value)} /></div>
        <Button onClick={() => void issueInvite()} disabled={!email || Boolean(busyAction)}>Issue single-use invitation</Button>
        {inviteUrl && <div className="rounded-lg bg-muted p-4">
          <Label htmlFor="specialist-invite-url">Copy this URL now</Label>
          <div className="mt-2 flex gap-2"><Input id="specialist-invite-url" readOnly value={inviteUrl} /><Button variant="outline" onClick={() => void navigator.clipboard.writeText(inviteUrl)}>Copy</Button></div>
        </div>}
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Enterprise marketplace access</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">Grant access only after confirming the client is an active Enterprise account. Suspension takes effect on the next verified request.</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div><Label htmlFor="enterprise-client-id">Enterprise client ID</Label><Input id="enterprise-client-id" value={enterpriseClientId} onChange={event => setEnterpriseClientId(event.target.value)} placeholder="Client UUID" /></div>
          <Button disabled={!enterpriseClientId.trim() || Boolean(busyAction)} onClick={() => void updateEnterpriseAccess(enterpriseClientId, 'enabled')}>Grant access</Button>
        </div>
        <div className="grid gap-3">
          {data?.enterprise_access.map(access => <div key={access.client_id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
            <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{access.organization || access.name}</p><Badge variant={access.status === 'enabled' ? 'default' : 'outline'}>{access.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{access.email} · {access.client_id}</p></div>
            <div className="flex gap-2">{access.status !== 'enabled' && <Button size="sm" disabled={Boolean(busyAction)} onClick={() => void updateEnterpriseAccess(access.client_id, 'enabled')}>Enable</Button>}{access.status === 'enabled' && <Button size="sm" variant="outline" disabled={Boolean(busyAction)} onClick={() => void updateEnterpriseAccess(access.client_id, 'suspended')}>Suspend</Button>}<Button size="sm" variant="destructive" disabled={Boolean(busyAction) || access.status === 'revoked'} onClick={() => void updateEnterpriseAccess(access.client_id, 'revoked')}>Revoke</Button></div>
          </div>)}
          {!isLoading && data?.enterprise_access.length === 0 && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No Enterprise organizations have marketplace access.</p>}
        </div>
      </CardContent>
    </Card>

    <section>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Applications and network standing</h2><p className="mt-1 text-sm text-muted-foreground">Founding membership is capped at 50. Verification reflects reviewed evidence, never payment.</p></div><Badge variant="outline">{data?.applications.filter(item => Boolean(item.founding_cohort)).length || 0} / 50 founding</Badge></div>
      {isLoading && <p className="mt-4">Loading…</p>}
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error instanceof Error ? error.message : 'Marketplace administration could not load.'}</p>}
      <div className="mt-4 grid gap-4">
        {data?.applications.map(application => {
          const id = application.id;
          const standing = standingDrafts[id] || standingFrom(application);
          const setStanding = (change: Partial<StandingDraft>) => setStandingDrafts(current => ({
            ...current,
            [id]: { ...standing, ...change },
          }));
          return <Card key={id}><CardContent className="pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-bold">{application.contact_name}</h3><p className="text-sm text-muted-foreground">{application.work_email} · {application.organization || 'Independent'}</p></div>
              <Badge>{application.status}</Badge>
            </div>
            <p className="mt-4">{application.headline}</p>
            <p className="mt-3 text-sm"><strong>Credentials:</strong> {application.credential_summary}</p>
            <p className="mt-3 text-sm"><strong>Conflicts:</strong> {application.conflicts_declaration}</p>
            <div className="mt-4"><Label htmlFor={`notes-${id}`}>Private screening notes</Label><Textarea id={`notes-${id}`} value={notes[id] || ''} onChange={event => setNotes(current => ({ ...current, [id]: event.target.value }))} /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void review(id, 'screening')}>Start screening</Button>
              <Button variant="outline" onClick={() => void review(id, 'needs_information')}>Request information</Button>
              <Button onClick={() => void review(id, 'approved')}>Approve</Button>
              <Button variant="destructive" onClick={() => void review(id, 'rejected')}>Reject</Button>
            </div>
            {application.profile_id && <div className="mt-6 rounded-2xl border bg-muted/20 p-5">
              <h4 className="font-bold">Verification and listing access</h4>
              <p className="mt-2 text-sm text-muted-foreground">Document the public basis for elevated standing. Founding specialists automatically receive a listing-fee waiver.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Label>Verification level<select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={standing.verification_level} onChange={event => setStanding({ verification_level: event.target.value as SpecialistVerificationLevel })}><option value="boa_specialist">BOA Specialist</option><option value="verified">Verified Specialist</option><option value="senior_featured">Senior / Featured Specialist</option></select></Label>
                <Label>Waiver end date (optional)<Input className="mt-1" type="date" value={standing.listing_fee_waived_until} onChange={event => setStanding({ listing_fee_waived_until: event.target.value })} /></Label>
                <Label className="md:col-span-2">Public verification evidence summary<Textarea className="mt-1" value={standing.verification_summary} onChange={event => setStanding({ verification_summary: event.target.value })} placeholder="Documented experience, references, credentials, and relevant BOA delivery evidence reviewed." /></Label>
              </div>
              <div className="mt-4 flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={standing.founding_cohort} onChange={event => setStanding({ founding_cohort: event.target.checked, listing_fee_waived: event.target.checked || standing.listing_fee_waived })} />Founding Specialist Network</label><label className="flex items-center gap-2"><input type="checkbox" checked={standing.listing_fee_waived || standing.founding_cohort} disabled={standing.founding_cohort} onChange={event => setStanding({ listing_fee_waived: event.target.checked })} />Waive listing fee</label></div>
              <Button className="mt-4" disabled={Boolean(busyAction)} onClick={() => void updateStanding(application)}>Save standing</Button>
            </div>}
          </CardContent></Card>;
        })}
      </div>
    </section>

    <section>
      <h2 className="font-serif text-2xl font-bold">Enterprise requests</h2>
      <div className="mt-4 grid gap-4">{data?.requests.map(request => <Card key={request.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><h3 className="font-bold">{request.title}</h3><p className="text-sm text-muted-foreground">{request.requester_organization || request.requester_name} · {request.status}</p></div><Button onClick={async () => { const result = await api.rankSpecialistMatches(request.id); toast.success(`${result.matches.length} candidate matches ranked`); }}>Rank matches</Button></CardContent></Card>)}</div>
    </section>

    <section>
      <h2 className="font-serif text-2xl font-bold">Suggested matches</h2>
      <div className="mt-4 grid gap-4">{data?.matches.filter(match => match.status === 'suggested').map(match => <Card key={match.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><h3 className="font-bold">{match.display_name} → {match.request_title}</h3><p className="text-sm text-muted-foreground">Score {match.match_score} · {Array.isArray(match.match_reasons) ? match.match_reasons.join(', ') : match.match_reasons}</p></div><div className="flex gap-2"><Button onClick={async () => { await api.confirmSpecialistMatch(match.id, true); toast.success('Match confirmed'); await refetch(); }}>Confirm</Button><Button variant="outline" onClick={async () => { await api.confirmSpecialistMatch(match.id, false); toast.success('Match declined'); await refetch(); }}>Decline</Button></div></CardContent></Card>)}</div>
    </section>
  </div>;
}
