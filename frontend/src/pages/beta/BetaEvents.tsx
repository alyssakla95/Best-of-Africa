import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { formatReaderDate } from '../../i18n/locale';
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowRightIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';
import { stripMarkdown } from '@/lib/utils';
import type { CalendarEvent } from '@/types';
import { useLanguage } from '../../context/LanguageContext';
import { translatePortugueseInterfaceText } from '../../i18n/pt-PT-1945';

interface EventRegistrationInput {
    user_email: string;
    user_name: string;
    user_organization?: string;
    ticket_type: string;
}

// Local fallback imagery rotated by index so events without a hero_image_url
// don't all share one (previously external, washed-out) photo.
export const BetaEvents: React.FC = () => {
    const { language } = useLanguage();
    const localText = (value: string) => language === 'pt' ? (translatePortugueseInterfaceText(value) || value) : value;
    const eventCategory = (value: string) => language === 'pt' ? ({
        Trade: 'Comércio', Investment: 'Investimento', Energy: 'Energia', Mining: 'Mineração',
        Resources: 'Recursos', Technology: 'Tecnologia', Tech: 'Tecnologia', Tourism: 'Turismo',
        Agriculture: 'Agricultura', Business: 'Negócios',
    }[value] || localText(value)) : value;
    const eventStatus = (value: string) => language === 'pt' ? ({
        open: 'Inscrições abertas', upcoming: 'Próximo', registration_open: 'Inscrições abertas',
    }[value.toLowerCase()] || localText(value.replace(/_/g, ' '))) : value.replace(/_/g, ' ');
    const { data: eventsData, isLoading, isError, refetch } = useQuery({
        queryKey: ['events'],
        queryFn: () => api.getCorporateEvents()
    });

    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form State
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [organization, setOrganization] = useState('');
    const [ticketType, setTicketType] = useState('Standard');
    const [isSuccess, setIsSuccess] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');

    const registerMutation = useMutation({
        mutationFn: (data: EventRegistrationInput) => {
            if (!selectedEvent) throw new Error('Select an event before registering');
            return api.registerForEvent(selectedEvent.id, data);
        },
        onSuccess: response => {
            setConfirmationCode(response.data.confirmation_code);
            setIsSuccess(true);
            toast.success("Event registration recorded");
        },
        onError: () => {
            toast.error("Failed to register. Please try again.");
        }
    });

    const handleRegisterClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsSuccess(false);
        setConfirmationCode('');
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEvent) return;
        
        registerMutation.mutate({
            user_email: email,
            user_name: name,
            user_organization: organization,
            ticket_type: ticketType
        });
    };

    const events = eventsData?.data || [];

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <SEO 
                title="Summits & Events | BOA-Story" 
                description="Verified forums, summits, and roundtables focused on African markets when records are available."
            />
            
            {/* Header */}
            <div className="app-hero border-b border-border bg-card px-5 py-12 sm:px-6 sm:py-14 md:py-20">
                <div className="max-w-6xl mx-auto w-full">
                    <div>
                        <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">BOA-Story Network</p>
                        <h1 className="max-w-3xl break-words text-foreground text-[clamp(2.35rem,11vw,4.5rem)] font-serif leading-[1.02] md:leading-[0.96] tracking-tight mb-6">
                            Summits & Executive Forums
                        </h1>
                        <p className="text-lg text-foreground/65 max-w-2xl leading-relaxed">
                            Browse event records only when dates, locations and registration details are available from the event system.
                        </p>
                    </div>
                </div>
            </div>

            {/* Event List */}
            <div className="max-w-6xl mx-auto px-5 sm:px-6 mt-12 md:mt-14">
                {isLoading ? (
                    <div className="rounded-xl border border-border bg-card p-8" role="status">
                        <p className="mb-6 text-sm font-medium text-foreground/60">Loading scheduled events…</p>
                        <div className="grid gap-4 md:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
                            ))}
                        </div>
                    </div>
                ) : isError ? (
                    <div className="text-center py-16 text-foreground/60 bg-card rounded-xl border border-foreground/10">
                        <CalendarIcon className="w-10 h-10 mx-auto mb-5 opacity-50" />
                        <h2 className="text-[2rem] font-serif mb-4">Event records could not be loaded</h2>
                        <p className="mx-auto max-w-xl text-base leading-7">The service did not return a verified schedule. No placeholder events are being shown.</p>
                        <Button type="button" variant="outline" onClick={() => refetch()} className="mt-6">Retry event records</Button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-16 text-foreground/50 bg-card rounded-xl border border-foreground/10">
                        <CalendarIcon className="w-10 h-10 mx-auto mb-5 opacity-50" />
                        <h2 className="text-[2rem] font-serif mb-4">No upcoming events</h2>
                        <p className="text-[1.125rem] font-light">Check back later for newly scheduled summits.</p>
                    </div>
                ) : (
                    <div className="grid gap-12">
                        {events.map((event, index) => (
                            <motion.div 
                                key={event.id} 
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                className="bg-card text-foreground rounded-xl border border-foreground/10 overflow-hidden flex flex-col md:flex-row group hover:border-accent/30 transition-colors"
                            >
                                <div className="z-10 flex w-full flex-col justify-center p-5 sm:p-8 md:p-12">
                                    <div className="flex flex-wrap items-center gap-4 mb-6">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
                                            {eventCategory(event.event_type || event.category)}
                                        </span>
                                        {event.is_vip && (
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                                                <UsersIcon size={14} /> Exclusive
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="mb-5 break-words font-serif text-[clamp(1.85rem,8vw,2.5rem)] leading-[1.05] text-foreground md:mb-6">{stripMarkdown(event.title)}</h2>
                                    <p className="mb-7 text-base font-light leading-7 text-foreground/60 line-clamp-4 md:mb-10 md:text-[1.125rem] md:leading-[1.8]">
                                        {localText(stripMarkdown(event.description))}
                                    </p>
                                    
                                    <div className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-foreground/10 bg-foreground/5 p-4 min-[520px]:grid-cols-2 md:mb-10 md:gap-6 md:rounded-2xl md:p-6">
                                        <div className="flex items-center gap-3 text-[15px] font-light text-foreground/80">
                                            <CalendarIcon className="w-5 h-5 text-accent" />
                                            {formatReaderDate(event.date_start, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-3 text-[15px] font-light text-foreground/80">
                                            <MapPinIcon className="w-5 h-5 text-accent" />
                                            {event.location}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-foreground/10">
                                        <span className="text-[13px] font-bold uppercase tracking-widest text-foreground/60">
                                            {eventStatus(event.status)}
                                        </span>
                                        <Button 
                                            onClick={() => handleRegisterClick(event)}
                                            disabled={!['open', 'upcoming', 'registration_open'].includes(event.status.toLowerCase())}
                                            className="w-full sm:w-auto rounded-xl gap-3 bg-accent text-navy hover:bg-gold-italic px-8 py-6 font-bold uppercase tracking-widest text-[11px]"
                                        >
                                            Register Interest <ArrowRightIcon size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Registration Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-foreground/10 text-foreground rounded-3xl p-8 shadow-2xl">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="font-serif text-[2rem] leading-none mb-2">{isSuccess ? 'Registration Confirmed' : 'Register for Event'}</DialogTitle>
                        <DialogDescription className="text-foreground/60 font-light text-[1.125rem]">
                            {isSuccess 
                                ? 'We have received your registration details.'
                                : stripMarkdown(selectedEvent?.title)}
                        </DialogDescription>
                    </DialogHeader>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <CheckCircleIcon className="w-20 h-20 text-accent mb-6" />
                            <h3 className="text-[2rem] font-serif mb-4">You're on the list!</h3>
                            <p className="text-foreground/60 font-light leading-relaxed mb-8">
                                Your registration is stored. Keep this confirmation code for attendance enquiries.
                            </p>
                            <div className="mb-8 w-full rounded-xl border border-border bg-background p-4">
                                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confirmation code</p>
                                <code className="break-all text-lg font-bold text-foreground">{confirmationCode}</code>
                            </div>
                            <Button 
                                className="w-full rounded-xl px-8 py-6 bg-accent text-navy hover:brightness-110 font-bold uppercase tracking-widest text-[11px]"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="name" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Full Name</Label>
                                <Input 
                                    id="name" 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    required 
                                    className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="email" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Work Email</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    required 
                                    className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="org" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Organization</Label>
                                <Input 
                                    id="org" 
                                    value={organization} 
                                    onChange={(e) => setOrganization(e.target.value)} 
                                    required 
                                    className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label htmlFor="ticket" className="text-foreground/70 text-xs uppercase tracking-widest font-bold">Ticket Type</Label>
                                <Select value={ticketType} onValueChange={setTicketType}>
                                    <SelectTrigger id="ticket" className="bg-background/50 border-foreground/10 text-foreground focus:border-accent/50 focus:ring-accent/20 h-12 rounded-xl">
                                        <SelectValue placeholder="Select ticket" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-foreground/10 text-foreground">
                                        <SelectItem value="Standard">Standard Pass</SelectItem>
                                        <SelectItem value="VIP">VIP Delegate</SelectItem>
                                        <SelectItem value="Media">Media/Press</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter className="pt-6">
                                <Button 
                                    type="submit" 
                                    className="w-full rounded-xl gap-3 px-8 py-6 bg-accent text-navy hover:brightness-110 font-bold uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(15,31,61,0.2)] transition-all"
                                    disabled={registerMutation.isPending}
                                >
                                    {registerMutation.isPending ? 'Submitting...' : 'Complete Registration'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
