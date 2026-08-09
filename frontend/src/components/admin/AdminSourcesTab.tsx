import React, { useState, useEffect } from 'react';
import { api, type AdminSource, type CreateAdminSourceInput } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { UpdateIcon, TrashIcon, PlusIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INITIAL_SOURCE: CreateAdminSourceInput = {
    name: '',
    type: 'rss',
    url: '',
    fetch_interval_minutes: 30,
};

export const AdminSourcesTab: React.FC = () => {
    const [sources, setSources] = useState<AdminSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [draft, setDraft] = useState<CreateAdminSourceInput>(INITIAL_SOURCE);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.getAdminSources();
            setSources(res.data || []);
        } catch {
            toast.error('Failed to load sources');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => { void loadData(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this source?')) return;
        try {
            await api.deleteAdminSource(id);
            toast.success('Source deleted');
            loadData();
        } catch {
            toast.error('Failed to delete source');
        }
    };

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault();
        setCreating(true);
        try {
            await api.createAdminSource({
                ...draft,
                name: draft.name.trim(),
                url: draft.url.trim(),
                country_code: draft.country_code?.trim().toUpperCase() || undefined,
            });
            toast.success('Source added to the ingestion registry');
            setDialogOpen(false);
            setDraft(INITIAL_SOURCE);
            await loadData();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create source');
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
        <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-xl font-serif font-bold">Data Ingestion Sources</CardTitle>
                        <CardDescription>Manage verified RSS, API and scraper endpoints feeding the platform.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={() => setDialogOpen(true)}>
                            <PlusIcon className="h-4 w-4 mr-2" /> Add Source
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
                    {sources.map(source => (
                        <article key={source.id} className="space-y-3 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-foreground">{source.name}</h3>
                                    <p className="mt-1 break-all text-xs text-muted-foreground">{source.url}</p>
                                </div>
                                <Badge variant="outline" className="uppercase">{source.type}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Every {source.fetch_interval_minutes} minutes</span>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(source.id)}>
                                    <TrashIcon className="mr-2 h-4 w-4 text-destructive" /> Delete
                                </Button>
                            </div>
                        </article>
                    ))}
                    {!sources.length && !loading && <p className="p-6 text-sm text-muted-foreground">No ingestion sources are registered.</p>}
                </div>
                <Table className="hidden md:table">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-6">Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sources.map(s => (
                            <TableRow key={s.id}>
                                <TableCell className="pl-6 font-medium">{s.name}</TableCell>
                                <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                                <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">{s.url}</TableCell>
                                <TableCell className="text-right pr-6">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                                        <TrashIcon className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Add a verified source</DialogTitle>
                    <DialogDescription>The ingestion worker will poll this endpoint on the selected interval. Use the publisher’s canonical feed or API URL.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="grid gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="source-name">Publisher or source name</Label>
                        <Input id="source-name" required minLength={2} maxLength={200} value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="source-url">Canonical feed or API URL</Label>
                        <Input id="source-url" type="url" required value={draft.url} onChange={event => setDraft(current => ({ ...current, url: event.target.value }))} placeholder="https://publisher.example/feed.xml" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Source type</Label>
                            <Select value={draft.type} onValueChange={(type: AdminSource['type']) => setDraft(current => ({ ...current, type }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rss">RSS or Atom</SelectItem>
                                    <SelectItem value="api">API</SelectItem>
                                    <SelectItem value="scraper">Publisher page</SelectItem>
                                    <SelectItem value="manual">Manual registry</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="source-interval">Polling interval (minutes)</Label>
                            <Input id="source-interval" type="number" min={5} max={1440} required value={draft.fetch_interval_minutes} onChange={event => setDraft(current => ({ ...current, fetch_interval_minutes: Number(event.target.value) }))} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="source-country">Country code (optional)</Label>
                        <Input id="source-country" maxLength={2} value={draft.country_code || ''} onChange={event => setDraft(current => ({ ...current, country_code: event.target.value }))} placeholder="NG" className="uppercase" />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={creating}>{creating ? 'Adding source…' : 'Add source'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    );
};
