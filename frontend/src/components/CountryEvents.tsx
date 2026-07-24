import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { CalendarEvent } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MixerVerticalIcon, RocketIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { stripMarkdown } from '@/lib/utils';

interface CountryEventsProps {
    countryCode: string;
}

export const CountryEvents: React.FC<CountryEventsProps> = ({ countryCode }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                const res = await api.getEvents({ country: countryCode, limit: '3' });
                if (res.success) {
                    setEvents(res.data);
                }
            } catch (err) {
                console.error("Failed to load country events:", err);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, [countryCode]);

    if (loading) {
        return <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-xl" />)}
        </div>;
    }

    if (events.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-20" />
                <p className="text-sm text-muted-foreground">No upcoming summits scheduled for this region.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> Key Upcoming Summits
            </h3>
            <div className="grid grid-cols-1 gap-4">
                {events.map((event) => (
                    <Card key={event.id} className="group hover:border-primary/50 transition-all border-border bg-background/50 overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-background/5 text-primary border-primary/20 text-[10px] uppercase font-bold px-2 py-0">
                                            {event.category}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1">
                                            <CalendarIcon className="h-3 w-3" /> {new Date(event.date_start).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-base group-hover:text-primary transition-colors">{stripMarkdown(event.title)}</h4>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MixerVerticalIcon className="h-3 w-3" /> {event.location}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2 md:mt-0">
                                    <Button asChild size="sm" variant="outline" className="rounded-full text-[10px] font-bold uppercase tracking-wider py-0 h-8">
                                        <Link to={`/events/${event.slug || event.id}`}>View Agenda</Link>
                                    </Button>
                                    <Button asChild size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-wider py-0 h-8 shadow-sm">
                                        <Link to={`/events/${event.slug || event.id}/register`}>Register</Link>
                                    </Button>
                                </div>
                            </div>

                            {event.ai_context_brief && (
                                <div className="mt-4 pt-4 border-t border-border/50 text-[11px] text-muted-foreground italic flex gap-2 items-start">
                                    <RocketIcon className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                                    <span>{stripMarkdown(event.ai_context_brief)}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Button variant="ghost" size="sm" asChild className="w-full text-xs font-bold text-primary hover:bg-background/5 transition-colors">
                <Link to="/events">Browse All Continent Summits &rarr;</Link>
            </Button>
        </div>
    );
};
