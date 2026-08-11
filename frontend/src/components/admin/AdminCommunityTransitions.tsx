import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, ExternalLink, Network } from 'lucide-react';
import { toast } from 'sonner';
import { api, type AdminCommunityTransitionApplication } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ReviewDraft = { notes: string; groupId: string; summary: string; steward: string };
type InviteDraft = { label: string; channel: string };

export function AdminCommunityTransitions() {
  const [busy, setBusy] = useState('');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [inviteDrafts, setInviteDrafts] = useState<Record<string, InviteDraft>>({});
  const applications = useQuery({ queryKey:['admin-community-transition-applications'], queryFn:()=>api.getAdminCommunityTransitionApplications('pending') });
  const programmes = useQuery({ queryKey:['admin-community-transitions'], queryFn:api.getAdminCommunityTransitions });
  const groups = useQuery({ queryKey:['knowledge-groups','admin-transition'], queryFn:async()=>{
    const [specialists,enterprise]=await Promise.all([api.getKnowledgeGroups('specialists'),api.getKnowledgeGroups('enterprise')]);
    return {data:[...new Map([...specialists.data,...enterprise.data].map(group=>[group.id,group])).values()]};
  } });

  const draftFor = (application: AdminCommunityTransitionApplication): ReviewDraft => reviewDrafts[application.id] || {
    notes:'', groupId:'', summary:`${application.community_name} is establishing a steward-led BOA presence connected to reviewed African evidence, specialist interpretation and voluntary member participation.`, steward:application.contact_name,
  };
  const updateDraft = (application: AdminCommunityTransitionApplication, change: Partial<ReviewDraft>) => {
    const current=draftFor(application); setReviewDrafts(value=>({...value,[application.id]:{...current,...change}}));
  };
  const review = async (application: AdminCommunityTransitionApplication, status:'reviewing'|'approved'|'rejected') => {
    const draft=draftFor(application);
    if(draft.notes.trim().length<3){toast.error('Record the stewardship review before deciding');return;}
    if(status==='approved'&&(!draft.groupId||draft.summary.trim().length<30||draft.steward.trim().length<2)){toast.error('Approval requires a receiving circle, public summary and steward name');return;}
    setBusy(`review:${application.id}`);
    try{const result=await api.reviewCommunityTransitionApplication(application.id,{status,notes:draft.notes,knowledge_group_id:draft.groupId||undefined,public_summary:draft.summary,steward_display_name:draft.steward});toast.success(status==='approved'?`Transition approved. Invitation token: ${result.invitation_token}`:`Application marked ${status}`);await Promise.all([applications.refetch(),programmes.refetch()]);}
    catch(error){toast.error(error instanceof Error?error.message:'Transition review failed');}finally{setBusy('');}
  };
  const createInvite = async (programId:string) => {
    const draft=inviteDrafts[programId]||{label:'',channel:'community_post'};
    if(draft.label.trim().length<3){toast.error('Name the invitation before creating it');return;}
    setBusy(`invite:${programId}`);
    try{const result=await api.createCommunityTransitionInvitation(programId,{label:draft.label,channel:draft.channel});await navigator.clipboard.writeText(result.token);toast.success('Invitation token created and copied');setInviteDrafts(value=>({...value,[programId]:{label:'',channel:'community_post'}}));await programmes.refetch();}
    catch(error){toast.error(error instanceof Error?error.message:'Invitation could not be created');}finally{setBusy('');}
  };
  const copyInvite = async (slug:string,token:string) => {await navigator.clipboard.writeText(`${window.location.origin}/community-transition/${slug}?invite=${token}`);toast.success('Transition invitation copied');};

  return <section className="space-y-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Community transition programme</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Verify stewardship and consent before connecting any established external community to a BOA circle. Never import member lists or private posts.</p></div><Badge variant="outline">{applications.data?.data.length||0} pending</Badge></div>
    {applications.isLoading&&<p className="text-sm">Loading community transition applications…</p>}{applications.error&&<p role="alert" className="text-sm text-destructive">Community transition applications could not be loaded.</p>}
    <div className="grid gap-5">{applications.data?.data.map(application=>{const draft=draftFor(application);return <Card key={application.id}><CardContent className="pt-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-lg font-bold">{application.community_name}</h3><p className="mt-1 text-sm text-muted-foreground">{application.source_platform} · {application.member_range.replace(/_/g,' ')} · {application.contact_name}</p><a className="mt-2 inline-flex items-center gap-2 text-sm font-semibold underline" href={application.community_url} target="_blank" rel="noreferrer">Inspect existing community <ExternalLink size={13}/></a></div><Badge>{application.status}</Badge></div><dl className="mt-5 grid gap-4 text-sm md:grid-cols-2"><div><dt className="font-bold">Stewardship basis</dt><dd className="mt-1 whitespace-pre-line leading-6 text-muted-foreground">{application.steward_role}: {application.stewardship_evidence}</dd></div><div><dt className="font-bold">Transition objective</dt><dd className="mt-1 whitespace-pre-line leading-6 text-muted-foreground">{application.transition_goals}</dd></div><div><dt className="font-bold">Proposed boundary</dt><dd className="mt-1 whitespace-pre-line leading-6 text-muted-foreground">{application.proposed_boundary}</dd></div><div><dt className="font-bold">Contact</dt><dd className="mt-1 leading-6 text-muted-foreground">{application.work_email}{application.organization?` · ${application.organization}`:''}</dd></div></dl><div className="mt-5 grid gap-4 md:grid-cols-2"><Label>Receiving BOA circle<select className="mt-2 min-h-11 w-full rounded-xl border bg-white px-3" value={draft.groupId} onChange={e=>updateDraft(application,{groupId:e.target.value})}><option value="">Select a reviewed circle</option>{groups.data?.data.map(group=><option key={group.id} value={group.id}>{group.name}</option>)}</select></Label><Label>Public steward name<Input className="mt-2" value={draft.steward} onChange={e=>updateDraft(application,{steward:e.target.value})}/></Label><Label className="md:col-span-2">Public transition summary<Textarea className="mt-2" rows={4} value={draft.summary} onChange={e=>updateDraft(application,{summary:e.target.value})}/></Label><Label className="md:col-span-2">Required private stewardship and consent review<Textarea className="mt-2" rows={3} value={draft.notes} onChange={e=>updateDraft(application,{notes:e.target.value})}/></Label></div><div className="mt-5 flex flex-wrap gap-2"><Button disabled={Boolean(busy)} onClick={()=>void review(application,'approved')}>Approve transition</Button><Button variant="outline" disabled={Boolean(busy)} onClick={()=>void review(application,'reviewing')}>Continue review</Button><Button variant="destructive" disabled={Boolean(busy)} onClick={()=>void review(application,'rejected')}>Reject</Button></div></CardContent></Card>;})}</div>
    {!applications.isLoading&&applications.data?.data.length===0&&<p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No community transition applications are awaiting review.</p>}
    <div className="border-t pt-8"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-serif text-2xl font-bold">Active transition records</h3><p className="mt-1 text-sm text-muted-foreground">Create channel-specific links and compare observed visits, activations and contributors.</p></div><Badge variant="outline">{programmes.data?.data.length||0} programmes</Badge></div>{programmes.isLoading&&<p className="mt-4 text-sm">Loading active transition records…</p>}{programmes.error&&<p role="alert" className="mt-4 text-sm text-destructive">Transition records could not be loaded.</p>}<div className="mt-4 grid gap-4">{programmes.data?.data.map(program=><Card key={program.id}><CardContent className="pt-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h4 className="font-bold">{program.community_name}</h4><p className="mt-1 text-sm text-muted-foreground">{program.group_name} · {program.source_platform}</p></div><div className="flex gap-2"><Badge>{program.activated_members} activated</Badge><Badge variant="outline">{program.active_contributors} contributors</Badge></div></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_auto]"><Input placeholder="Invitation label, such as August moderator post" value={(inviteDrafts[program.id]||{label:'',channel:'community_post'}).label} onChange={e=>setInviteDrafts(value=>({...value,[program.id]:{...(value[program.id]||{label:'',channel:'community_post'}),label:e.target.value}}))}/><select className="min-h-11 rounded-xl border bg-white px-3" value={(inviteDrafts[program.id]||{label:'',channel:'community_post'}).channel} onChange={e=>setInviteDrafts(value=>({...value,[program.id]:{...(value[program.id]||{label:'',channel:'community_post'}),channel:e.target.value}}))}><option value="community_post">Community post</option><option value="moderator_message">Moderator message</option><option value="newsletter">Newsletter</option><option value="event">Event</option><option value="direct">Direct</option><option value="other">Other</option></select><Button disabled={Boolean(busy)} onClick={()=>void createInvite(program.id)}>Create invitation</Button></div><div className="mt-4 space-y-2">{programmes.data?.invitations.filter(invite=>invite.program_id===program.id).map(invite=><div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-3 text-sm"><span>{invite.label} · {invite.channel.replace(/_/g,' ')} · {invite.click_count} visits</span><Button size="sm" variant="ghost" onClick={()=>void copyInvite(program.slug,invite.token)}><Copy size={14}/> Copy link</Button></div>)}</div></CardContent></Card>)}</div>{!programmes.isLoading&&programmes.data?.data.length===0&&<div className="mt-4 rounded-xl border border-dashed p-5 text-sm text-muted-foreground"><Network className="mb-3"/>No approved transition programmes yet.</div>}</div>
  </section>;
}
