import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { UpdateIcon, PlusIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

export const AdminClientsTab: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.getAdminClients();
            setClients(res.data || []);
        } catch (error) {
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-serif font-bold">API Clients</CardTitle>
                        <CardDescription>Manage corporate and institutional API access keys.</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={() => toast.info('Feature coming soon')}>
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
                <Table>
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
    );
};
