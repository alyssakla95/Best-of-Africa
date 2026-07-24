import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlayIcon,
    PauseIcon,
    SpeakerLoudIcon,
    SpeakerOffIcon,
    EnterFullScreenIcon
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';

interface ArticleVideoProps {
    videoUrl: string;
    posterUrl?: string;
    title: string;
    subtitle?: string;
}

export const ArticleVideo: React.FC<ArticleVideoProps> = ({
    videoUrl,
    posterUrl,
    title,
    subtitle = "BOA-Story Report"
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
            setProgress(currentProgress);
        }
    };

    return (
        <div
            className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-foreground/10 bg-black shadow-2xl"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* News Ticker Overlay (Top) */}
            <div className="absolute top-0 left-0 z-20 w-full bg-black/60 backdrop-blur-md px-6 py-3 border-b border-primary/20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-background px-2 py-0.5 rounded text-[10px] font-black text-foreground animate-pulse">LIVE</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/90">{subtitle}</div>
                </div>
                <div className="text-[10px] font-mono text-primary">v3.0.4-SIGNAL-DETECTED</div>
            </div>

            <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                className="h-full w-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                muted={isMuted}
                playsInline
            />

            {/* Brand Overlay (Bottom Left) */}
            <div className="absolute bottom-16 left-6 z-20 pointer-events-none">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="bg-background px-4 py-2 border-l-4 border-border"
                >
                    <div className="text-foreground font-serif font-black text-lg tracking-tighter leading-none">Best of Africa</div>
                    <div className="text-foreground/80 text-[10px] uppercase font-bold tracking-widest mt-1">BOA-Story</div>
                </motion.div>
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black/80 backdrop-blur-md px-4 py-1.5 mt-1 border-l-4 border-primary"
                >
                    <div className="text-foreground text-xs font-bold truncate max-w-[250px]">{title}</div>
                </motion.div>
            </div>

            {/* Play/Pause Center Indicator */}
            <AnimatePresence>
                {!isPlaying && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
                        onClick={togglePlay}
                    >
                        <div className="group/play flex h-20 w-20 items-center justify-center rounded-full bg-background/90 text-foreground shadow-2xl transition-transform hover:scale-110 active:scale-95">
                            <PlayIcon className="h-10 w-10 ml-1" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* News Ticker Overlay (Bottom Scroller) */}
            <div className="absolute bottom-0 left-0 z-20 w-full bg-background/90 text-foreground py-1.5 overflow-hidden border-t border-foreground/20">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-8 mr-8">
                            <span className="text-[10px] font-black uppercase tracking-widest">Market Alert: Mozambique Energy Sector Surge</span>
                            <span className="h-1 w-1 rounded-full bg-background opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Policy Update: AfCFTA Implementation Readiness</span>
                            <span className="h-1 w-1 rounded-full bg-background opacity-50" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Currency Brief: NGN Stabilizing against USD</span>
                            <span className="h-1 w-1 rounded-full bg-background opacity-50" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls Bar */}
            <AnimatePresence>
                {showControls && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 20, opacity: 0 }}
                        className="absolute bottom-10 left-0 z-30 w-full px-6 flex items-center gap-4"
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 text-foreground hover:bg-black/70 backdrop-blur-md"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                        </Button>

                        <div className="flex-1 h-1 bg-foreground/20 rounded-full overflow-hidden cursor-pointer relative group/progress">
                            <div
                                className="absolute top-0 left-0 h-full bg-background transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-background rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
                                style={{ left: `${progress}%` }}
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 text-foreground hover:bg-black/70 backdrop-blur-md"
                            onClick={toggleMute}
                        >
                            {isMuted ? <SpeakerOffIcon className="h-4 w-4" /> : <SpeakerLoudIcon className="h-4 w-4" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 text-foreground hover:bg-black/70 backdrop-blur-md"
                        >
                            <EnterFullScreenIcon className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
