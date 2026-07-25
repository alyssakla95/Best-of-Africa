import { useAudio } from '../../context/AudioContext';
import {
    Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX, ListMusic,
    Rewind, FastForward
} from 'lucide-react';

import { useState } from 'react';
import { stripMarkdown } from '@/lib/utils';

const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2];

export const BetaGlobalPlayer = () => {
    const [showQueue, setShowQueue] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        togglePlay,
        nextTrack,
        prevTrack,
        closePlayer,
        playlist,
        currentIndex,
        seek,
        skipBy,
        setPlaybackRate,
        setVolume,
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
    const hasPrev = currentIndex > 0 || currentTime > 3;

    const handleSeek = (value: number) => {
        if (duration > 0) {
            seek((value / 100) * duration);
        }
    };

    const cycleSpeed = () => {
        const idx = SPEED_STEPS.indexOf(playbackRate);
        setPlaybackRate(SPEED_STEPS[(idx + 1) % SPEED_STEPS.length]);
    };

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

            {/* Player Card */}
            <div className="w-[min(360px,calc(100vw-1.5rem))] bg-background/90 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl hover:shadow-primary/10 transition-shadow overflow-hidden">

                {/* Seek Bar */}
                <div className="px-4 pt-3">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.1}
                        value={progressPercent}
                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                        aria-label="Seek"
                        className="w-full h-1.5 appearance-none rounded-full cursor-pointer accent-primary bg-muted/60"
                        style={{
                            background: `linear-gradient(to right, hsl(var(--primary)) ${progressPercent}%, hsl(var(--muted) / 0.6) ${progressPercent}%)`
                        }}
                    />
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground">{formatTime(currentTime)}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Track Info + Controls */}
                <div className="flex items-center gap-2 px-3 pb-3 pt-1">

                    {/* Track Info */}
                    <div className="flex flex-col min-w-0 flex-1 cursor-pointer" onClick={() => setShowQueue(!showQueue)}>
                        <div className="text-[13px] font-bold text-foreground truncate leading-tight">
                            {stripMarkdown(currentTrack.title)}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate font-medium mt-0.5">
                            {stripMarkdown(currentTrack.subtitle) || "Audio Briefing"}
                        </div>
                    </div>

                    {/* Transport Controls */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                            onClick={prevTrack}
                            className={`p-1.5 rounded-full transition-colors ${hasPrev ? 'text-muted-foreground hover:text-foreground hover:bg-muted' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                            disabled={!hasPrev}
                            aria-label="Previous track"
                        >
                            <SkipBack size={15} />
                        </button>
                        <button
                            onClick={() => skipBy(-15)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Back 15 seconds"
                        >
                            <Rewind size={15} />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-9 h-9 mx-0.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <button
                            onClick={() => skipBy(15)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Forward 15 seconds"
                        >
                            <FastForward size={15} />
                        </button>
                        <button
                            onClick={nextTrack}
                            className={`p-1.5 rounded-full transition-colors ${hasNext ? 'text-muted-foreground hover:text-foreground hover:bg-muted' : 'text-muted-foreground/30 cursor-not-allowed'}`}
                            disabled={!hasNext}
                            aria-label="Next track"
                        >
                            <SkipForward size={15} />
                        </button>
                    </div>
                </div>

                {/* Secondary Controls */}
                <div className="flex items-center justify-between px-3 pb-2.5 border-t border-border/40 pt-2">
                    <button
                        onClick={cycleSpeed}
                        className="text-[11px] font-mono font-bold text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors min-w-[3rem]"
                        aria-label="Playback speed"
                    >
                        {playbackRate}x
                    </button>

                    <div className="flex items-center gap-1">
                        <div className="relative flex items-center">
                            <button
                                onClick={() => setShowVolume(!showVolume)}
                                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                aria-label="Volume"
                            >
                                {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                            </button>
                            {showVolume && (
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={Math.round(volume * 100)}
                                    onChange={(e) => setVolume(parseInt(e.target.value, 10) / 100)}
                                    aria-label="Volume level"
                                    className="w-20 h-1 appearance-none rounded-full cursor-pointer accent-primary bg-muted/60 ml-1"
                                />
                            )}
                        </div>
                        <button
                            onClick={() => setShowQueue(!showQueue)}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label="Show queue"
                        >
                            <ListMusic size={15} />
                        </button>
                        <button
                            onClick={closePlayer}
                            className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Close player"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
