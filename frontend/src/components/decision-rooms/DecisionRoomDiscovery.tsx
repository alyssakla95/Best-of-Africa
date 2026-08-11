import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, type DecisionRoom } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

export function DecisionRoomCard({ room }: { room: DecisionRoom }) {
  return <article className="flex h-full flex-col rounded-3xl border border-border bg-white p-6 md:p-7">
    <div className="flex flex-wrap gap-2"><Badge>{titleCase(room.status)}</Badge>{room.group_name && <Badge variant="outline">{room.group_name}</Badge>}</div>
    <h3 className="mt-5 font-serif text-2xl leading-tight text-navy">{room.title}</h3>
    <p className="mt-4 text-sm font-semibold leading-6 text-navy">{room.decision_question}</p>
    <p className="mt-3 line-clamp-3 text-sm leading-7 text-navy/65">{room.editorial_summary || room.decision_context}</p>
    <div className="mt-5 flex flex-wrap gap-2">{[...room.countries, ...room.sectors].slice(0, 6).map(tag => <span key={tag} className="rounded-full bg-navy/[.05] px-3 py-1 text-xs font-semibold text-navy">{tag}</span>)}</div>
    <dl className="mt-6 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm sm:grid-cols-4"><div><dt className="text-xs text-navy/50">Evidence</dt><dd className="mt-1 font-bold text-navy">{room.evidence_count}</dd></div><div><dt className="text-xs text-navy/50">Specialists</dt><dd className="mt-1 font-bold text-navy">{room.specialist_count}</dd></div><div><dt className="text-xs text-navy/50">Unresolved</dt><dd className="mt-1 font-bold text-navy">{room.unresolved_count}</dd></div><div><dt className="text-xs text-navy/50">Outcomes</dt><dd className="mt-1 font-bold text-navy">{room.outcome_count}</dd></div></dl>
    <Link to={`/decision-rooms/${room.slug}`} className="mt-5 inline-flex items-center justify-between text-sm font-bold text-navy">Open evidence room <ArrowRight size={16} /></Link>
  </article>;
}

export function ContextualDecisionRooms({ country, sector, limit = 3 }: { country?: string; sector?: string; limit?: number }) {
  const filters = { ...(country ? { country } : {}), ...(sector ? { sector } : {}), limit: String(limit) };
  const query = useQuery({ queryKey: ['decision-rooms', 'context', country, sector, limit], queryFn: () => api.getDecisionRooms(filters) });
  if (!query.isLoading && !query.error && query.data?.data.length === 0) return null;
  return <section className="page-section" aria-labelledby="contextual-decision-rooms"><div className="flex flex-wrap items-end justify-between gap-5"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-widest text-navy/55">Live decision rooms</p><h2 id="contextual-decision-rooms" className="mt-3 font-serif text-3xl text-navy md:text-4xl">Follow the question, evidence and unresolved work.</h2><p className="mt-4 text-sm leading-7 text-navy/65">Rooms combine official records, reviewed professional interpretation, contradictions, verification priorities and documented outcomes without turning discussion into fact.</p></div><Button asChild variant="outline"><Link to="/decision-rooms">Explore all rooms</Link></Button></div>{query.isLoading && <p className="mt-7 text-sm text-navy/60">Loading active decision rooms…</p>}{query.error && <p role="alert" className="mt-7 text-sm text-red-700">Decision rooms could not be loaded.</p>}<div className="mt-8 grid gap-5 xl:grid-cols-3">{query.data?.data.map(room => <DecisionRoomCard key={room.id} room={room} />)}</div></section>;
}
