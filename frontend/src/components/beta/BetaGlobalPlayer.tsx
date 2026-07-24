import { useAudio } from '../../context/AudioContext';
import { Play, Pause, SkipForward, X, Volume2, ListMusic } from 'lucide-react';

import { useState } from 'react';
import { stripMarkdown } from '@/lib/utils';

export const BetaGlobalPlayer = () => {
    const [showQueue, setShowQueue] = useState(false);
    const { 
        currentTrack, 
        isPlaying, 
        currentTime, 
        duration, 
        togglePlay, 
        nextTrack, 
        closePlayer,
        playlist,
        currentIndex
    } = useAudio();

    if (!currentTrack) return null;

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const hasNext = currentIndex < playlist.length - 1;

    return (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 sm:right-8 lg:bottom-8 z-[100] flex flex-col items-end gap-3 animate-in slide-in-from-bottom-12 duration-500 ease-out">
            
            {/* Queue Popover */}
            {showQueue && playlist.length > 0 && (
                <div className="w-[320px] bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col origin-bottom animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-border/50 bg-muted/20 flex justify-between items-center">
                        <h3 className="text-foreground font-serif font-bold flex items-center gap-2">
                            <ListMusic size={16} className="text-primary" />
                            Up Next
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono font-medium bg-background/50 px-2 py-0.5 rounded-full border border-border/50">{playlist.length} tracks</span>
                    </div>
                    <div className="overflow-y-auto p-2 scrollbar-thin">
                        {playlist.map((track, idx) => (
                            <div 
                                key={idx} 
                                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${idx === currentIndex ? 'bg-background/10 border border-primary/20 shadow-sm' : 'hover:bg-muted/50 border border-transparent cursor-pointer'}`}
                            >
                                <div className="text-xs font-mono text-muted-foreground w-5 flex justify-center">
                                    {idx === currentIndex ? (
                                        <Volume2 size={14} className="text-primary animate-pulse" />
                                    ) : (
                                        idx + 1
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm truncate ${idx === currentIndex ? 'text-primary font-bold' : 'text-foreground font-medium'}`}>
                                        {stripMarkdown(track.title)}
                                    </div>
                                    {track.subtitle && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {stripMarkdown(track.subtitle)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Floating Pill Player */}
            <div className="flex items-center gap-3 p-1.5 pr-4 bg-background/90 backdrop-blur-xl border border-border/60 rounded-full shadow-2xl hover:shadow-primary/10 transition-shadow">
                
                {/* Play/Pause with Progress Ring */}
                <div className="relative w-11 h-11 flex-shrink-0 group cursor-pointer bg-muted/30 rounded-full" onClick={togglePlay}>
                    {/* Circular Progress SVG */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-primary/10" strokeWidth="2" />
                        <circle 
                            cx="18" cy="18" r="16" fill="none" className="stroke-primary transition-all duration-300 ease-linear" strokeWidth="2" 
                            strokeDasharray="100" strokeDashoffset={100 - progressPercent} 
                        />
                    </svg>
                    {/* Play/Pause Icon */}
                    <div className="absolute inset-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                    </div>
                </div>

                {/* Track Info */}
                <div className="flex flex-col min-w-0 max-w-[160px] sm:max-w-[220px] cursor-pointer" onClick={() => setShowQueue(!showQueue)}>
                    <div className="text-[13px] font-bold text-foreground truncate leading-tight">
                        {stripMarkdown(currentTrack.title)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="text-[10px] text-muted-foreground truncate font-medium">
                            {stripMarkdown(currentTrack.subtitle) || "Audio Briefing"}
                        </div>
                        <span className="text-[9px] font-mono text-muted-foreground/50 hidden sm:inline-block">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 border-l border-border/50 pl-2 ml-1">
                    <button 
                        onClick={nextTrack} 
                        className={`p-1.5 rounded-full transition-colors ${hasNext ? 'text-muted-foreground hover:text-foreground hover:bg-muted' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                        disabled={!hasNext}
                        aria-label="Next track"
                    >
                        <SkipForward size={16} />
                    </button>
                    <button 
                        onClick={closePlayer} 
                        className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-0.5"
                        aria-label="Close player"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
