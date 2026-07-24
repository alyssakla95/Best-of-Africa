import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowTopRightIcon } from '@radix-ui/react-icons';



interface IntelligenceBriefingProps {
    region: string;
    stabilityScore: number; // 0-100
    topSector: string;
    articleCount: number;
    trendingTopics: string[];
}

export const IntelligenceBriefing: React.FC<IntelligenceBriefingProps> = ({
    region,
    stabilityScore,
    topSector,
    articleCount,
    trendingTopics,
}) => {
    // Determine status color and text based on stability
    const isStable = stabilityScore > 60;
    const isVolatile = stabilityScore < 40;

    // Status config (Neutral/SaaS Style)
    const statusConfig = isStable
        ? { color: "text-primary", bg: "bg-background/10", border: "border-primary/20", text: "Stable" }
        : isVolatile
            ? { color: "text-foreground", bg: "bg-muted", border: "border-border", text: "Watchlist" }
            : { color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border/50", text: "Developing" };

    return (
        <Card className="relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5">
            {/* SaaS Background (No blobs) */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            <CardHeader className="relative z-10 pb-2">
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="font-bold uppercase tracking-widest text-[10px] border-primary/20 text-primary">
                        MARKET CONTEXT
                    </Badge>
                </div>

                <div className="flex items-center justify-between">
                    <div className={cn("flex items-center gap-2 rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-wider bg-muted border border-border text-foreground")}>
                        {statusConfig.text}
                    </div>
                </div>

                <CardTitle className="mt-4 font-serif text-3xl font-normal leading-tight tracking-tight md:text-4xl text-foreground">
                    The {region} market is <span className={cn("italic", isStable ? "text-accent" : isVolatile ? "text-destructive" : "text-primary")}>{statusConfig.text.toLowerCase()}</span> today, driven by dynamic shifts in <span className="border-b-2 border-foreground/20 decoration-skip-ink-none">{topSector}</span>.
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10">
                <div className="space-y-6 text-lg text-muted-foreground">
                    <p>
                        Coverage includes <strong className="text-foreground">{articleCount} new reports</strong> from the last 24 hours.
                        The primary narrative thread is <strong className="text-foreground">{trendingTopics[0]}</strong>, which is currently outpacing broader regional currents.
                    </p>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
                        <div className="group rounded-xl border border-border/50 bg-muted/50 p-4 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-muted">
                            <div className="text-xs font-medium uppercase text-muted-foreground">Stability Index</div>
                            <div className="mt-1 flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-foreground">{stabilityScore}</span>
                                <span className="text-xs text-muted-foreground">/100</span>
                            </div>
                        </div>
                        <div className="group rounded-xl border border-border/50 bg-muted/50 p-4 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-muted">
                            <div className="text-xs font-medium uppercase text-muted-foreground">Dominant Sector</div>
                            <div className="mt-1 text-lg font-bold text-foreground truncate" title={topSector}>{topSector}</div>
                        </div>
                        <div className="group col-span-2 rounded-xl border border-border/50 bg-muted/50 p-4 backdrop-blur-sm transition-colors hover:border-primary/50 hover:bg-muted">
                            <div className="text-xs font-medium uppercase text-muted-foreground">Emerging Narratives</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {trendingTopics.slice(0, 3).map(topic => (
                                    <span key={topic} className="inline-flex items-center rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors group-hover:bg-secondary">
                                        {topic} <ArrowTopRightIcon className="ml-1 h-3 w-3 opacity-50" />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

