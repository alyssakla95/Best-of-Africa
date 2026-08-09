import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpdateIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

export const AdminIntelligenceTab: React.FC = () => {
    const [recs, setRecs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.getIntelligenceRecommendations();
            setRecs(res.recommendations || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load intelligence recommendations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(() => { void loadData(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    return (
        <Card className="border-border rounded-3xl overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-serif font-bold">Intelligence: Coverage Gaps</CardTitle>
                        <CardDescription>Measured gaps in the actual publication record — thinnest sectors, silent countries and unclassified stories.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
                        <UpdateIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {loading ? (
                    <div className="text-center text-muted-foreground">Measuring recent coverage...</div>
                ) : recs.length > 0 ? (
                    <div className="space-y-4">
                        {recs.map((rec, i) => (
                            <div key={i} className="p-4 rounded-xl border border-accent/20 bg-accent/5">
                                <Badge className="mb-2 bg-accent/10 text-accent border-accent/20">Gap {i+1}</Badge>
                                <p className="text-foreground font-medium">{rec}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground">No measurable coverage gaps identified.</div>
                )}
            </CardContent>
        </Card>
    );
};
