import React, { useState, useEffect } from 'react';
import {
    api,
    type AdminBookingRequest,
    type AdminContactSubmission,
    type AdminEventRegistration,
} from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { UpdateIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

interface InboxData {
    contact: AdminContactSubmission[];
    bookings: AdminBookingRequest[];
    registrations: AdminEventRegistration[];
    newsletter_subscribers: number;
}

const fmtDate = (d?: string) =>
    d ? new Date(d.replace(' ', 'T') + (d.includes('Z') ? '' : 'Z')).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }) : '—';

const InboxSection = ({ title, description, empty, children }: {
    title: string;
    description: string;
    empty: boolean;
    children: React.ReactNode;
}) => (
    <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
            <CardTitle className="text-lg font-serif font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            {empty
                ? <p className="p-6 text-sm text-muted-foreground">Nothing yet.</p>
                : children}
        </CardContent>
    </Card>
);

export const AdminInboxTab: React.FC = () => {
    const [data, setData] = useState<InboxData | null>(null);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            setData(await api.getAdminInbox());
        } catch {
            toast.error('Failed to load inbox');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <EnvelopeClosedIcon className="h-5 w-5 text-accent" />
                    <div>
                        <h2 className="text-xl font-serif font-bold">Operator Inbox</h2>
                        <p className="text-sm text-muted-foreground">
                            Every inbound submission — {data?.newsletter_subscribers ?? '…'} active newsletter subscriber{data?.newsletter_subscribers === 1 ? '' : 's'}.
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                    <UpdateIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <InboxSection
                title="Consultation Requests"
                description="Concierge and booking submissions with the preliminary brief already sent."
                empty={!data?.bookings?.length}
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">From</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Requirements</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Received</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.bookings?.map(b => (
                            <TableRow key={b.id}>
                                <TableCell className="pl-6">
                                    <div className="font-medium">{b.guest_name || '—'}</div>
                                    <div className="text-xs text-muted-foreground">{b.guest_email}{b.guest_organization ? ` · ${b.guest_organization}` : ''}</div>
                                </TableCell>
                                <TableCell className="capitalize">{b.service_type}</TableCell>
                                <TableCell className="max-w-[320px]"><span className="line-clamp-2 text-sm">{b.requirements || '—'}</span></TableCell>
                                <TableCell><Badge variant={b.status === 'New' ? 'default' : 'secondary'}>{b.status}</Badge></TableCell>
                                <TableCell className="whitespace-nowrap text-sm">{fmtDate(b.created_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </InboxSection>

            <InboxSection
                title="Contact Messages"
                description="Submissions from the contact page."
                empty={!data?.contact?.length}
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">From</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Received</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.contact?.map(m => (
                            <TableRow key={m.id}>
                                <TableCell className="pl-6">
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-xs text-muted-foreground">{m.email}{m.organization ? ` · ${m.organization}` : ''}</div>
                                </TableCell>
                                <TableCell><Badge variant="outline">{m.inquiry_type || 'General'}</Badge></TableCell>
                                <TableCell className="max-w-[380px]"><span className="line-clamp-2 text-sm">{m.message}</span></TableCell>
                                <TableCell className="whitespace-nowrap text-sm">{fmtDate(m.created_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </InboxSection>

            <InboxSection
                title="Event Registrations"
                description="Sign-ups for summits and forums."
                empty={!data?.registrations?.length}
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Attendee</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Registered</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.registrations?.map(r => (
                            <TableRow key={r.id}>
                                <TableCell className="pl-6">
                                    <div className="font-medium">{r.user_name || '—'}</div>
                                    <div className="text-xs text-muted-foreground">{r.user_email}{r.user_organization ? ` · ${r.user_organization}` : ''}</div>
                                </TableCell>
                                <TableCell className="max-w-[240px]"><span className="line-clamp-1">{r.event_title || r.event_id}</span></TableCell>
                                <TableCell>{r.ticket_type || 'Standard'}</TableCell>
                                <TableCell className="font-mono text-xs">{r.confirmation_code}</TableCell>
                                <TableCell className="whitespace-nowrap text-sm">{fmtDate(r.registered_at)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </InboxSection>
        </div>
    );
};
