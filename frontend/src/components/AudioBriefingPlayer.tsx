import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon, SpeakerLoudIcon, StopIcon } from '@radix-ui/react-icons';
import { cn } from "@/lib/utils";

interface AudioBriefingPlayerProps {
    text: string;
    label?: string;
}

export const AudioBriefingPlayer: React.FC<AudioBriefingPlayerProps> = ({ text, label = "Listen to Briefing" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const synth = useRef<SpeechSynthesis>(window.speechSynthesis);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);

    // Load available voices and pick a "premium" English one if possible
    useEffect(() => {
        const synthesis = synth.current;
        const loadVoices = () => {
            const voices = synthesis.getVoices();
            // Try to find a "Google UK English Male" or similar "serious" voice
            const preferredVoice = voices.find(v => v.name.includes("Google UK English Male"))
                || voices.find(v => v.lang === 'en-GB' && v.name.includes("Male"))
                || voices.find(v => v.lang === 'en-US' && v.name.includes("Male"))
                || voices.find(v => v.lang === 'en-US');
            setVoice(preferredVoice || null);
        };

        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            synthesis.cancel();
        };
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            if (isPaused) {
                synth.current.resume();
                setIsPaused(false);
            } else {
                synth.current.pause();
                setIsPaused(true);
            }
        } else {
            // Start playing
            const u = new SpeechSynthesisUtterance(text);
            if (voice) u.voice = voice;
            u.rate = 1.0;
            u.pitch = 1.0;

            u.onend = () => {
                setIsPlaying(false);
                setIsPaused(false);
            };

            utterance.current = u;
            synth.current.speak(u);
            setIsPlaying(true);
            setIsPaused(false);
        }
    };

    const stopPlayback = () => {
        synth.current.cancel();
        setIsPlaying(false);
        setIsPaused(false);
    };

    return (
        <div className={cn(
            "flex items-center gap-3 rounded-full border border-primary/20 bg-background/50 pl-2 pr-4 py-1.5 backdrop-blur-sm transition-all hover:bg-background/80",
            isPlaying && !isPaused ? "border-primary/50 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]" : ""
        )}>
            <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full bg-background text-foreground hover:bg-background/90"
                onClick={togglePlay}
            >
                {isPlaying && !isPaused ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4 ml-0.5" />}
            </Button>

            {isPlaying && (
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={stopPlayback}>
                    <StopIcon className="h-4 w-4" />
                </Button>
            )}

            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isPlaying && !isPaused ? "Playing" : isPaused ? "Paused" : "Multimodal"}
                </span>
                <span className="text-xs font-bold text-foreground">
                    {label}
                </span>
            </div>

            {/* Visualizer */}
            {isPlaying && !isPaused && (
                <div className="ml-2 flex items-center gap-0.5 h-4">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-background rounded-full animate-waveform"
                            style={{ animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            )}

            {(!isPlaying && !isPaused) && (
                <SpeakerLoudIcon className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />
            )}
        </div>
    );
};
