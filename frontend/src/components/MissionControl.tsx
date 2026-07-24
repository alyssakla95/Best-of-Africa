import React, { useEffect, useState } from 'react';
import { useMission } from '../context/MissionContext';
import type { MissionRole, MissionFormat } from '../types';
import { api } from '../services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Crosshair2Icon,
    PersonIcon,
    SpeakerLoudIcon,
    FileTextIcon,
    MixerHorizontalIcon
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import type { Country, Sector } from '../types';


export const MissionControl: React.FC = () => {
    const {
        role, focus, format, isOpen,
        setRole, setFormat, toggleCountry, toggleSector, setPanelOpen
    } = useMission();

    const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
    const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);

    // Fetch available vectors on mount
    useEffect(() => {
        api.getCountries().then(res => setAvailableCountries(res.data)).catch(console.error);
        api.getSectors().then(res => setAvailableSectors(res.data)).catch(console.error);
    }, []);

    // RoleIcon removed - unused

    return (
        <Popover open={isOpen} onOpenChange={setPanelOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "h-8 gap-2 rounded-full px-3 hover:bg-foreground/50",
                        isOpen ? "bg-background/10 text-primary" : "text-muted-foreground"
                    )}
                >
                    <Crosshair2Icon className="h-4 w-4 text-primary" />
                    <span className="hidden md:inline font-bold text-[10px] uppercase tracking-widest">
                        {role === 'standard' ? 'General' : role}
                        {(focus.countries.length > 0 || focus.sectors.length > 0) && ` (${focus.countries.length + focus.sectors.length})`}
                    </span>
                    <MixerHorizontalIcon className="h-3 w-3 opacity-50 ml-1" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] sm:w-[400px] p-0 rounded-3xl overflow-hidden border-border shadow-2xl" align="end">
                <div className="relative flex flex-col h-[600px] bg-background/95 backdrop-blur-xl border border-foreground/20 text-foreground">

                    {/* Golden Pulse Background (CSS) */}
                    <div className="absolute inset-0 z-0 opacity-40">
                        <div className="absolute inset-0 bg-white" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(15,31,61,0.12)_0%,transparent_50%)]" />
                    </div>

                    {/* Content Layer */}
                    <div className="relative z-10 flex flex-col h-full">
                        {/* Header */}
                        <div className="p-4 border-b border-border/10 bg-foreground/40">
                            <div className="flex items-center gap-2 mb-1">
                                <Crosshair2Icon className="h-4 w-4 text-accent" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Mission Control</h3>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Define your operational parameters.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar">

                            {/* 1. ROLE SELECTOR */}
                            <section>
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <PersonIcon className="h-3 w-3" /> Operational Role
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['standard', 'investor', 'operator', 'policy'] as MissionRole[]).map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRole(r)}
                                            className={cn(
                                                "flex flex-col items-start gap-1 p-3 rounded-2xl border text-left transition-all",
                                                role === r
                                                    ? "bg-accent/10 border-accent/50 text-accent shadow-sm"
                                                    : "bg-foreground/40 border-border/50 hover:bg-foreground/60 text-foreground hover:border-accent"
                                            )}
                                        >
                                            <span className="text-xs font-bold uppercase">{r}</span>
                                            <span className="text-[10px] opacity-70 leading-tight">
                                                {r === 'standard' && 'Balanced reporting.'}
                                                {r === 'investor' && 'ROI, Deals, Risk.'}
                                                {r === 'operator' && 'Logistics, Labor.'}
                                                {r === 'policy' && 'Stability, Regs.'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* 2. FORMAT SELECTOR */}
                            <section>
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <FileTextIcon className="h-3 w-3" /> Delivery Format
                                </h4>
                                <div className="flex gap-2">
                                    {(['deep', 'brief', 'audio'] as MissionFormat[]).map((f) => (
                                        <Badge
                                            key={f}
                                            variant="outline"
                                            className={cn(
                                                "cursor-pointer px-3 py-1.5 capitalize transition-all border-border/50 bg-foreground/40 text-foreground hover:bg-foreground/60",
                                                format === f && "bg-accent/10 text-accent border-accent/50"
                                            )}
                                            onClick={() => setFormat(f)}
                                        >
                                            {f === 'audio' && <SpeakerLoudIcon className="mr-1 h-3 w-3" />}
                                            {f}
                                        </Badge>
                                    ))}
                                </div>
                            </section>

                            {/* 3. TARGET VECTORS */}
                            <section>
                                <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                                    <Crosshair2Icon className="h-3 w-3" /> Target Vectors
                                </h4>

                                <div className="mb-4">
                                    <div className="text-[10px] font-bold mb-2 text-muted-foreground/80">Priority Markets</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {availableCountries.slice(0, 12).map(c => (
                                            <Badge
                                                key={c.code}
                                                variant="outline"
                                                onClick={() => toggleCountry(c.code)}
                                                className={cn(
                                                    "cursor-pointer text-[10px] border-border/50 bg-foreground/40 transition-all text-foreground",
                                                    focus.countries.includes(c.code)
                                                        ? "bg-background/10 text-primary border-primary/50"
                                                        : "opacity-60 hover:opacity-100 hover:border-blue-200"
                                                )}
                                            >
                                                {c.flag_emoji} {c.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] font-bold mb-2 text-muted-foreground/80">Strategic Sectors</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {availableSectors.map(s => (
                                            <Badge
                                                key={s.id}
                                                variant="outline"
                                                onClick={() => toggleSector(s.id)}
                                                className={cn(
                                                    "cursor-pointer text-[10px] border-border/50 bg-foreground/40 transition-all text-foreground",
                                                    focus.sectors.includes(s.id)
                                                        ? "bg-accent/10 text-accent border-accent/50"
                                                        : "opacity-60 hover:opacity-100 hover:border-accent"
                                                )}
                                            >
                                                {s.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
