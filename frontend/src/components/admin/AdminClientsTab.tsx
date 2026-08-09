import React, { useState, useEffect } from 'react';
import { api, type AdminClient, type CreateAdminClientInput } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { UpdateIcon, PlusIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INITIAL_CLIENT: CreateAdminClientInput = {
    name: '',
    email: '',
    organization: '',
    type: 'other',
    tier: 'basic',
    rate_limit_per_hour: 100,
};

export const AdminClientsTab: React.FC = () => {
    const [clients, setClients] = useState<AdminClient[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draft, setDraft] = useState<CreateAdminClientInput>(INITIAL_CLIENT);
    const [provisionedKey, setProvisionedKey] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.getAdminClients();
            setClients(res.data || []);
        } catch {
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => { void loadData(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setCreating(true);
        try {
            const result = await api.createAdminClient({
                ...draft,
                name: draft.name.trim(),
                email: draft.email.trim().toLowerCase(),
                organization: draft.organization?.trim() || undefined,
            });
            setProvisionedKey(result.api_key);
            setDraft(INITIAL_CLIENT);
            await loadData();
            toast.success('Client access provisioned');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to provision client');
        } finally {
            setCreating(false);
        }
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setProvisionedKey(null);
    };

    return (
        <>
        <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-xl font-serif font-bold">API Clients</CardTitle>
                        <CardDescription>Manage corporate and institutional API access keys.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={() => setDialogOpen(true)}>
                            <PlusIcon className="h-4 w-4 mr-2" /> Provision Key
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                            <UpdateIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border md:hidden">
                    {clients.map(client => (
                        <article key={client.id} className="space-y-3 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-foreground">{client.organization || client.name}</h3>
                                    <p className="mt-1 break-all text-xs text-muted-foreground">{client.email}</p>
                                </div>
                                <Badge className={client.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                                    {client.is_active ? 'Active' : 'Disabled'}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="capitalize">{client.tier}</Badge>
                                <Badge variant="outline" className="capitalize">{client.type || 'standard'}</Badge>
                            </div>
                        </article>
                    ))}
                    {!clients.length && !loading && <p className="p-6 text-sm text-muted-foreground">No API clients are provisioned.</p>}
                </div>
                <Table className="hidden md:table">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Organization</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.map(c => (
                            <TableRow key={c.id}>
                                <TableCell className="pl-6 font-medium">
                                    <div className="flex flex-col">
                                        <span>{c.organization || c.name}</span>
                                        <span className="text-xs text-muted-foreground">{c.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{c.tier}</Badge></TableCell>
                                <TableCell className="capitalize text-sm">{c.type || 'Standard'}</TableCell>
                                <TableCell>
                                    <Badge className={c.is_active ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}>
                                        {c.is_active ? 'Active' : 'Disabled'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Dialog open={dialogOpen} onOpenChange={open => open ? setDialogOpen(true) : closeDialog()}>
            <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{provisionedKey ? 'Client key created' : 'Provision API access'}</DialogTitle>
                    <DialogDescription>
                        {provisionedKey ? 'This credential is shown once. Copy it into the client’s secure secret store before closing.' : 'Create a scoped client identity and hourly request allowance.'}
                    </DialogDescription>
                </DialogHeader>
                {provisionedKey ? (
                    <div className="grid gap-5">
                        <div className="rounded-xl border border-border bg-muted/40 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">One-time API key</p>
                            <code className="block break-all text-sm text-foreground">{provisionedKey}</code>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={closeDialog}>I have stored it</Button>
                            <Button type="button" onClick={async () => {
                                await navigator.clipboard.writeText(provisionedKey);
                                toast.success('API key copied');
                            }}>Copy key</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleCreate} className="grid gap-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="client-name">Contact name</Label>
                                <Input id="client-name" required minLength={2} maxLength={120} value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="client-email">Contact email</Label>
                                <Input id="client-email" type="email" required maxLength={254} value={draft.email} onChange={event => setDraft(current => ({ ...current, email: event.target.value }))} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="client-organization">Organization</Label>
                            <Input id="client-organization" maxLength={200} value={draft.organization || ''} onChange={event => setDraft(current => ({ ...current, organization: event.target.value }))} />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Client type</Label>
                                <Select value={draft.type} onValueChange={(type: AdminClient['type']) => setDraft(current => ({ ...current, type }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="government">Government</SelectItem>
                                        <SelectItem value="investor">Investor</SelectItem>
                                        <SelectItem value="partner">Partner</SelectItem>
                                        <SelectItem value="media">Media</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Access tier</Label>
                                <Select value={draft.tier} onValueChange={(tier: AdminClient['tier']) => setDraft(current => ({ ...current, tier }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="basic">Basic</SelectItem>
                                        <SelectItem value="premium">Premium</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="client-rate-limit">Hourly request allowance</Label>
                            <Input id="client-rate-limit" type="number" min={10} max={100000} required value={draft.rate_limit_per_hour} onChange={event => setDraft(current => ({ ...current, rate_limit_per_hour: Number(event.target.value) }))} />
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button type="submit" disabled={creating}>{creating ? 'Provisioning…' : 'Provision key'}</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
        </>
    );
};
