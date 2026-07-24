import React from 'react';
import type { Country } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon, InfoCircledIcon, RocketIcon, GlobeIcon } from '@radix-ui/react-icons';

interface CountryPortalsProps {
    country: Country;
}

export const CountryPortals: React.FC<CountryPortalsProps> = ({ country }) => {
    const hasAnyPortal = country.visa_portal_url || country.business_portal_url || country.tourism_portal_url;

    if (!hasAnyPortal) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <GlobeIcon className="h-5 w-5 text-primary" /> Official Government Portals
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Visa / Ivisa Section */}
                {country.visa_portal_url && (
                    <Card className="border-border hover:border-primary/50 transition-colors bg-background/50 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-bold flex items-center gap-2 text-primary">
                                        <InfoCircledIcon className="h-4 w-4" /> Ivisa / Entry
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Official portal for e-visas and entry requirements for {country.name}.
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-full gap-2 rounded-full border-primary/20 hover:bg-background/5">
                                    <a href={country.visa_portal_url} target="_blank" rel="noopener noreferrer">
                                        Open E-Visa <ExternalLinkIcon className="h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Business Registration */}
                {country.business_portal_url && (
                    <Card className="border-border hover:border-primary/50 transition-colors bg-background/50 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-bold flex items-center gap-2 text-primary">
                                        <RocketIcon className="h-4 w-4" /> Business Setup
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Register your company and explore local partnership opportunities in {country.name}.
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-full gap-2 rounded-full border-primary/20 hover:bg-background/5">
                                    <a href={country.business_portal_url} target="_blank" rel="noopener noreferrer">
                                        Commercial Portal <ExternalLinkIcon className="h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tourism Portal */}
                {country.tourism_portal_url && (
                    <Card className="border-border hover:border-primary/50 transition-colors bg-background/50 overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex flex-col h-full justify-between gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-bold flex items-center gap-2 text-primary">
                                        <GlobeIcon className="h-4 w-4" /> Experience {country.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Official tourism board info, hotels, and travel experiences.
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm" className="w-full gap-2 rounded-full border-primary/20 hover:bg-background/5">
                                    <a href={country.tourism_portal_url} target="_blank" rel="noopener noreferrer">
                                        Visit {country.name} <ExternalLinkIcon className="h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="rounded-2xl bg-background/5 border border-primary/10 p-4 text-xs text-muted-foreground flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-background animate-pulse" />
                <span>The platform facilitates direct links to sovereign government assets for investor clarity.</span>
            </div>
        </div>
    );
};
