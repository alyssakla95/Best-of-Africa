import React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const REGIONS = [
    { id: 'North', label: 'North', color: '#3b82f6', gridArea: 'north' },
    { id: 'West', label: 'West', color: '#0F1F3D', gridArea: 'west' },
    { id: 'Central', label: 'Central', color: '#10b981', gridArea: 'central' },
    { id: 'East', label: 'East', color: '#ef4444', gridArea: 'east' },
    { id: 'Southern', label: 'Southern', color: '#8b5cf6', gridArea: 'south' },
];

interface StrategicMapProps {
    onSelectRegion: (regionId: string | null) => void;
    selectedRegion: string | null;
    regionData?: Record<string, { countries: unknown[], ai_insight: string }>;
    intelligenceData?: {
        countries: { code: string; heat: number; sentiment: number; volume: number }[];
        global_pulse: { intensity: number };
    };
}

export const StrategicMap: React.FC<StrategicMapProps> = ({
    selectedRegion,
    onSelectRegion,
    regionData
}) => {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div className="relative w-full h-[500px] bg-card rounded-3xl border border-border/40 shadow-sm overflow-hidden flex flex-col">
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Live Intelligence Map</div>
                <div className="text-2xl font-serif font-black text-foreground">Strategic Overview</div>
            </div>

            {/* CSS-based Africa Region Map */}
            <div className="flex-1 flex items-center justify-center pt-16 pb-16 px-8">
                <div
                    className="relative w-full max-w-[320px] h-full"
                    style={{
                        display: 'grid',
                        gridTemplateAreas: `
                            ". north north ."
                            "west central central east"
                            ". . south ."
                        `,
                        gridTemplateColumns: '1fr 1fr 1fr 1fr',
                        gridTemplateRows: '1fr 1fr 1fr',
                        gap: '12px',
                    }}
                >
                    {REGIONS.map((region) => {
                        const count = (regionData?.[region.id]?.countries?.length as number) || 0;
                        const allCounts = REGIONS.map(r => (regionData?.[r.id]?.countries?.length as number) || 0).sort((a, b) => b - a);
                        const isTop3 = count >= (allCounts[2] || 0) && count > 0;
                        const isActive = selectedRegion === region.id;

                        return (
                            <button
                                key={region.id}
                                onClick={() => onSelectRegion(selectedRegion === region.id ? null : region.id)}
                                onMouseEnter={() => onSelectRegion(region.id)}
                                className="group relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                style={{
                                    gridArea: region.gridArea,
                                    borderColor: isActive ? '#0F1F3D' : 'var(--border)',
                                    background: isActive
                                        ? 'linear-gradient(135deg, #051828 0%, #0a2a45 100%)'
                                        : 'linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)',
                                    boxShadow: isActive
                                        ? '0 0 24px rgba(15,31,61,0.25), inset 0 1px 0 rgba(15,31,61,0.1)'
                                        : '0 2px 8px rgba(0,0,0,0.06)',
                                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                }}
                            >
                                {/* Gold indicator for top regions */}
                                {isTop3 && (
                                    <div
                                        className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-accent shadow-sm shadow-accent/50 ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
                                    />
                                )}

                                {/* Hex shape decorative element */}
                                <div
                                    className="w-10 h-10 mb-2 flex items-center justify-center transition-all duration-300"
                                    style={{
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        background: isActive
                                            ? 'linear-gradient(135deg, #0F1F3D, #0F1F3D)'
                                            : `linear-gradient(135deg, ${region.color}40, ${region.color}20)`,
                                    }}
                                >
                                    <span className="text-xs font-black text-foreground/90">{count || '-'}</span>
                                </div>

                                {/* Region label */}
                                <span className={`text-[9px] font-black uppercase tracking-[0.15em] font-serif transition-colors duration-300 ${isActive ? 'text-accent' : 'text-primary'}`}>
                                    {region.id}
                                </span>

                                {/* Country count sub-label */}
                                {count > 0 && (
                                    <span className={`text-[8px] font-bold mt-0.5 transition-colors duration-300 ${isActive ? 'text-foreground/60' : 'text-muted-foreground'}`}>
                                        {count} markets
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* Decorative connection lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" xmlns="http://www.w3.org/2000/svg">
                        <line x1="50%" y1="16%" x2="25%" y2="50%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="50%" y1="16%" x2="75%" y2="50%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="25%" y1="50%" x2="50%" y2="50%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="75%" y1="50%" x2="50%" y2="50%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" />
                        <line x1="50%" y1="50%" x2="62%" y2="83%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="4 4" />
                    </svg>
                </div>
            </div>

            {/* Diagrammatic Legend */}
            <div className="absolute bottom-6 left-6 z-10 bg-foreground/90 dark:bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#051828]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Standard Activity</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent shadow-sm shadow-accent/50"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">High Volume Interest</span>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 z-10 text-[10px] font-mono text-muted-foreground opacity-50">
                VIEW: {prefersReducedMotion ? 'STATIC (A11Y)' : 'INTERACTIVE'}
            </div>
        </div>
    );
};
