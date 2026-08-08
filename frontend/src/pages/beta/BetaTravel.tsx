import React from 'react';
import { motion } from 'framer-motion';
import { PlaneIcon, ShieldCheckIcon, SearchCheckIcon, CheckIcon, ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { SEO } from '../../components/SEO';

// A geographically balanced set of business/luxury hotels spanning all five
// African regions and distinct countries — not a two-country shortlist.
// Images are bundled local WebP (premium, on-brand, and always load — external
// stock URLs kept 404-ing).
const HOTELS = [
    {
        name: "La Mamounia",
        location: "Marrakech, Morocco",
        description: "A legendary palace hotel blending Moorish grandeur with modern executive comfort — a landmark for high-level meetings in North Africa.",
        image: "/images/v2_concierge.webp",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "Spa & hammam credit", "Early check-in/late checkout"]
    },
    {
        name: "Eko Hotel & Suites",
        location: "Lagos, Nigeria",
        description: "West Africa's premier business address on Victoria Island, with the conference infrastructure and security serious deal-making demands.",
        image: "/images/v2_events.webp",
        benefits: ["Daily breakfast for two", "Executive lounge access", "Complimentary high-speed WiFi", "Airport fast-track"]
    },
    {
        name: "Kempinski Gold Coast City",
        location: "Accra, Ghana",
        description: "A contemporary five-star anchor for investors moving through the AfCFTA's fastest-opening market.",
        image: "/images/v2_real_background.webp",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "$100 dining credit", "Late checkout"]
    },
    {
        name: "Villa Rosa Kempinski",
        location: "Nairobi, Kenya",
        description: "East Africa's diplomatic and tech hub, from a tower designed around the executive traveller.",
        image: "/images/v2_hero_kigali.webp",
        benefits: ["Daily breakfast for two", "Executive lounge access", "Complimentary airport transfers", "Early check-in/late checkout"]
    },
    {
        name: "Kigali Serena Hotel",
        location: "Kigali, Rwanda",
        description: "The calm, secure base of choice in Africa's most walkable capital — minutes from the convention centre.",
        image: "/images/v2_travel.webp",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "Spa credit", "Complimentary WiFi"]
    },
    {
        name: "The Mora Zanzibar",
        location: "Zanzibar, Tanzania",
        description: "A luxury lifestyle resort offering an effortlessly chic business retreat — ideal for executive retreats and strategy offsites.",
        image: "/images/v2_travel.webp",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "$100 Resort Credit", "Early check-in/late checkout"]
    },
    {
        name: "The Silo Hotel",
        location: "Cape Town, South Africa",
        description: "A design icon above the V&A Waterfront, pairing world-class hospitality with boardrooms fit for the continent's biggest deals.",
        image: "/images/v2_concierge.webp",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "Rooftop spa access", "Late checkout"]
    },
    {
        name: "Polana Serena Hotel",
        location: "Maputo, Mozambique",
        description: "The 'Grand Dame' of Maputo — a historic, palatial hotel with the finest executive amenities and secure conference facilities in the capital.",
        image: "/images/v2_real_background.webp",
        benefits: ["Daily breakfast for two", "Room upgrade (subject to availability)", "Complimentary high-speed WiFi", "Early check-in/late checkout"]
    }
];

export const BetaTravel: React.FC = () => {

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <SEO 
                title="Africa Business Travel Guide | BOA-Story" 
                description="A research-led starting point for planning business travel across African cities."
            />
            
            {/* Hero Section */}
            <div className="app-hero border-b border-border bg-card px-4 py-14 sm:px-6 md:py-20">
                <motion.div 
                  className="hidden"
                >
                  <img
                    src="/images/v2_travel.webp"
                    alt="Luxury African Eco-Lodge"
                    className="w-full h-[120%] object-cover object-center absolute top-[-10%] hero-photo"
                  />
                  <div className="absolute inset-0 z-10 hero-scrim" />
                </motion.div>

                <div className="max-w-6xl mx-auto w-full text-foreground">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
                        <div className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                            <PlaneIcon size={14} />
                            Business Travel Guide
                        </div>
                        <h1 className="max-w-3xl text-foreground text-[2.75rem] md:text-[4.5rem] font-serif leading-[0.96] tracking-tight mb-6">
                            Travel with confidence.
                        </h1>
                        <p className="text-lg text-foreground/65 max-w-2xl mb-8 leading-relaxed">
                            Compare established properties by city, then verify current rates, availability, entry requirements and transport arrangements directly before booking.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/request-consultation">
                                <Button className="w-full sm:w-auto rounded-xl font-bold uppercase tracking-widest text-[11px] px-10 py-6 bg-accent text-navy hover:brightness-110 shadow-[0_0_30px_rgba(15,31,61,0.3)] transition-all">
                                    Request Custom Itinerary
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Why Book With Us */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 md:mt-14">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card text-foreground rounded-xl border border-foreground/10 p-8 md:p-10">
                    <div className="grid md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div className="px-6 py-4 md:py-0">
                            <SearchCheckIcon className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h3 className="text-xl font-serif font-bold mb-3">Research Shortlist</h3>
                            <p className="text-foreground/50 text-[15px] leading-relaxed font-light">A geographically balanced starting point for comparing business-travel options.</p>
                        </div>
                        <div className="px-6 py-4 md:py-0">
                            <ShieldCheckIcon className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h3 className="text-xl font-serif font-bold mb-3">Verify Current Conditions</h3>
                            <p className="text-foreground/50 text-[15px] leading-relaxed font-light">Security, connectivity, transport and amenities can change. Confirm them with the property and current official guidance.</p>
                        </div>
                        <div className="px-6 py-4 md:py-0">
                            <CheckIcon className="w-12 h-12 text-accent mx-auto mb-6" />
                            <h3 className="text-xl font-serif font-bold mb-3">Human Research Support</h3>
                            <p className="text-foreground/50 text-[15px] leading-relaxed font-light">Submit a brief for itinerary research. A request is not a booking or a promise of rates, benefits or availability.</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Featured Partners */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-24">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
                    <h2 className="text-[3rem] font-serif mb-6 text-foreground leading-none">Business-travel starting points</h2>
                    <p className="text-foreground/60 max-w-2xl mx-auto text-[1.125rem] font-light leading-relaxed">
                        These properties are presented as research candidates, not as partners or endorsements. Confirm every rate, policy and service directly with the property.
                    </p>
                </motion.div>

                <div className="space-y-16">
                    {HOTELS.map((hotel, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="bg-card text-foreground rounded-xl border border-foreground/10 overflow-hidden group hover:border-accent/30 transition-colors"
                        >
                            <div className="p-8 sm:p-10 md:p-14 flex flex-col z-10">
                                <div className="mb-4 text-[11px] font-bold uppercase tracking-widest text-accent">
                                    {hotel.location}
                                </div>
                                <h3 data-no-translate className="text-[2.5rem] font-serif leading-none mb-6 text-foreground">{hotel.name}</h3>
                                <p className="text-foreground/60 mb-10 text-[1.125rem] font-light leading-[1.8]">
                                    An established property included as a starting point for independent research. Confirm location, facilities, policies, rates and current operating conditions directly before making travel decisions.
                                </p>
                                
                                <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-6 items-center justify-between border-t border-foreground/10">
                                    <span className="text-[13px] text-foreground/40 italic">
                                        Rates and services are not verified in real time
                                    </span>
                                    <Link to="/request-consultation">
                                        <Button className="w-full sm:w-auto rounded-xl gap-3 bg-accent text-navy hover:bg-gold-italic px-8 py-6 font-bold uppercase tracking-widest text-[11px]">
                                            Request itinerary research <ArrowRightIcon size={16} />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Research disclosure */}
                <div className="mt-24 p-8 bg-card rounded-2xl border border-foreground/5 text-center text-foreground/40 font-light max-w-4xl mx-auto">
                    <p className="text-[13px] leading-[1.8]">
                        <strong className="text-foreground/60">Research disclosure:</strong> This shortlist is informational. BOA-Story does not represent that it has a commercial relationship with the listed properties and does not guarantee prices, availability, security conditions or amenities.
                    </p>
                </div>
            </div>
        </div>
    );
};
