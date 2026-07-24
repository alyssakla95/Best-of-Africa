import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingBenefitBadge } from './BookingBenefitBadge';
import { CheckIcon, ArrowTopRightIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';

interface BookingWidgetProps {
    propertyName?: string;
    baseRate?: number;
    vipRate?: number;
    affiliateUrl?: string; // e.g., Booking.com link
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({
    // propertyName = "Polana Serena Hotel",
    baseRate = 350,
    vipRate = 320,
    affiliateUrl = "#"
}) => {
    // const [date, setDate] = useState<Date | undefined>(new Date());

    const handleVipRequest = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("VIP Booking Request Sent", {
            description: "Our concierge team will confirm your exclusive rate within 2 hours."
        });
    };

    const handleCustomRequest = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Itinerary Request Received", {
            description: "A travel specialist will contact you shortly to plan your trip."
        });
    };

    return (
        <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-primary/10 shadow-xl">
            <div className="bg-background px-6 py-4 text-foreground">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold tracking-tight">Featured Property</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium text-foreground ring-1 ring-inset ring-white/20">
                        <LockClosedIcon className="w-3 h-3" />
                        Verified Partner
                    </span>
                </div>
                <p className="text-foreground/80 text-sm">Best of Africa Corporate Rates & Benefits</p>
            </div>

            <Tabs defaultValue="vip" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-muted/30 p-0 h-12">
                    <TabsTrigger value="vip" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background h-full">VIP Direct</TabsTrigger>
                    <TabsTrigger value="compare" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background h-full">Compare</TabsTrigger>
                    <TabsTrigger value="custom" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-background h-full">Concierge</TabsTrigger>
                </TabsList>

                {/* TIER 1: VIP DIRECT */}
                <TabsContent value="vip" className="p-0">
                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-end justify-between border-b pb-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Exclusive Corporate Rate</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-foreground">${vipRate}</span>
                                        <span className="text-sm text-muted-foreground line-through decoration-destructive/50 decoration-2">${baseRate}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">Save ${(baseRate - vipRate)}/night</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <BookingBenefitBadge type="breakfast" variant="minimal" />
                                <BookingBenefitBadge type="upgrade" variant="minimal" />
                                <BookingBenefitBadge type="credit" variant="minimal" />
                                <BookingBenefitBadge type="checkout" variant="minimal" />
                            </div>
                        </div>

                        <form onSubmit={handleVipRequest} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="checkin">Check-in</Label>
                                    <div className="relative">
                                        <Input id="checkin" type="date" className="pl-3" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="checkout">Check-out</Label>
                                    <div className="relative">
                                        <Input id="checkout" type="date" className="pl-3" required />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input id="email" type="email" placeholder="name@company.com" required />
                            </div>

                            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md transform transition active:scale-[0.98]">
                                Request VIP Rate
                            </Button>
                            <p className="text-[10px] text-center text-muted-foreground">
                                No credit card required to request. Availabilty confirmed in 2h.
                            </p>
                        </form>
                    </div>
                </TabsContent>

                {/* TIER 2: AFFILIATE COMPARE */}
                <TabsContent value="compare" className="p-0">
                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <h4 className="font-bold text-lg">Compare Public Rates</h4>
                            <p className="text-sm text-muted-foreground">Check availability on major platforms if you don't require corporate benefits.</p>
                        </div>

                        <div className="space-y-3">
                            <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-[#003580] flex items-center justify-center text-foreground font-bold text-xs">B.</div>
                                    <div>
                                        <div className="font-bold">Booking.com</div>
                                        <div className="text-xs text-muted-foreground">Public Rate</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">${baseRate}</span>
                                    <ArrowTopRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                </div>
                            </a>

                            <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-navy flex items-center justify-center text-white font-bold text-xs">E.</div>
                                    <div>
                                        <div className="font-bold">Expedia</div>
                                        <div className="text-xs text-muted-foreground">Public Rate</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">${baseRate}</span>
                                    <ArrowTopRightIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                </div>
                            </a>
                        </div>

                        <div className="rounded-md bg-muted p-4 text-xs text-muted-foreground">
                            <div className="flex gap-2">
                                <LockClosedIcon className="w-4 h-4 shrink-0" />
                                <p>We earn a small commission when you book through these links at no extra cost to you.</p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TIER 3: CONCIERGE / CUSTOM */}
                <TabsContent value="custom" className="p-0">
                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <h4 className="font-bold text-lg">Complex Itinerary?</h4>
                            <p className="text-sm text-muted-foreground">Let our specialized Africa travel partners handle logistics, transfers, and multi-city bookings.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 p-2 rounded bg-muted/40">
                                <CheckIcon className="w-3 h-3 text-primary" /> Multi-city flights
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-muted/40">
                                <CheckIcon className="w-3 h-3 text-primary" /> Private transfers
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-muted/40">
                                <CheckIcon className="w-3 h-3 text-primary" /> Visa assistance
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded bg-muted/40">
                                <CheckIcon className="w-3 h-3 text-primary" /> Translator services
                            </div>
                        </div>

                        <form onSubmit={handleCustomRequest} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-email">Email</Label>
                                <Input id="custom-email" type="email" placeholder="name@company.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="custom-req">Tell us about your trip</Label>
                                <textarea
                                    id="custom-req"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="I need to visit Maputo, then Beira..."
                                />
                            </div>
                            <Button type="submit" variant="outline" className="w-full border-primary/50 text-primary hover:bg-background hover:text-foreground">
                                Contact Travel Desk
                            </Button>
                        </form>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
};
