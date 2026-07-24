import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { UpdateIcon, TrashIcon, PlusIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

export const AdminSourcesTab: React.FC = () => {
    const [sources, setSources] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.getAdminSources();
            setSources(res.data || []);
        } catch (error) {
            toast.error('Failed to load sources');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
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

    return (
        <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-serif font-bold">Data Ingestion Sources</CardTitle>
                        <CardDescription>Manage RSS, API, and Scraper endpoints feeding the platform.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={() => toast.info('Feature coming soon')}>
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
                <Table>
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
    );
};
