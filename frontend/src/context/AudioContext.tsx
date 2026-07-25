import { createContext, useCallback, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface PlayableTrack {
    title: string;
    subtitle?: string;
    audioUrl: string;
    imageUrl?: string;
    durationSeconds?: number;
    slug: string;
}

interface AudioContextState {
    playlist: PlayableTrack[];
    currentIndex: number;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    playbackRate: number;
    volume: number;
    isMinimized: boolean;
    playTrack: (track: PlayableTrack, playlist?: PlayableTrack[]) => void;
    addToQueue: (track: PlayableTrack) => void;
    removeFromQueue: (index: number) => void;
    togglePlay: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    closePlayer: () => void;
    toggleMinimize: () => void;
    seek: (time: number) => void;
    skipBy: (seconds: number) => void;
    setPlaybackRate: (rate: number) => void;
    setVolume: (volume: number) => void;
    currentTrack: PlayableTrack | null;
    primeAudio: () => void;
}

const AudioContext = createContext<AudioContextState | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
    const [playlist, setPlaylist] = useState<PlayableTrack[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRateState] = useState(1);
    const [volume, setVolumeState] = useState(1);
    const [isMinimized, setIsMinimized] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastAudioUrlRef = useRef<string | null>(null);
    const playlistRef = useRef<PlayableTrack[]>([]);

    const currentTrack = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;

    useEffect(() => {
        playlistRef.current = playlist;
    }, [playlist]);

    const nextTrack = useCallback(() => {
        setCurrentIndex(previousIndex => {
            if (previousIndex < playlistRef.current.length - 1) {
                return previousIndex + 1;
            }
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            return previousIndex;
        });
    }, []);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            
            audioRef.current.addEventListener('timeupdate', () => {
                setCurrentTime(audioRef.current?.currentTime || 0);
            });
            
            audioRef.current.addEventListener('loadedmetadata', () => {
                setDuration(audioRef.current?.duration || 0);
            });
            
            audioRef.current.addEventListener('ended', nextTrack);
            
            audioRef.current.addEventListener('play', () => setIsPlaying(true));
            audioRef.current.addEventListener('pause', () => setIsPlaying(false));
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        };
    }, [nextTrack]);

    // Effect to handle track change
    useEffect(() => {
        if (currentTrack && audioRef.current) {
            if (lastAudioUrlRef.current !== currentTrack.audioUrl) {
                lastAudioUrlRef.current = currentTrack.audioUrl;
                audioRef.current.src = currentTrack.audioUrl;
                // Re-apply user preferences: some engines reset these on src change.
                audioRef.current.playbackRate = playbackRate;
                audioRef.current.volume = volume;
                audioRef.current.play().catch(e => console.warn('Audio playback prevented:', e));
            }
        } else if (!currentTrack && audioRef.current) {
            lastAudioUrlRef.current = null;
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    }, [currentTrack, playbackRate, volume]);

    const playTrack = (track: PlayableTrack, newPlaylist?: PlayableTrack[]) => {
        if (newPlaylist) {
            setPlaylist(newPlaylist);
            const index = newPlaylist.findIndex(t => t.audioUrl === track.audioUrl);
            setCurrentIndex(index >= 0 ? index : 0);
        } else {
            // Just play single track, clear existing playlist
            setPlaylist([track]);
            setCurrentIndex(0);
        }
    };

    const addToQueue = (track: PlayableTrack) => {
        setPlaylist(prev => [...prev, track]);
        if (currentIndex === -1) setCurrentIndex(0);
    };

    const removeFromQueue = (index: number) => {
        setPlaylist(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
        if (currentIndex === index) {
            nextTrack();
        } else if (currentIndex > index) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current || !currentTrack) return;
        
        if (audioRef.current.paused) {
            audioRef.current.play().catch(e => console.warn('Audio playback prevented:', e));
        } else {
            audioRef.current.pause();
        }
    };

    const prevTrack = () => {
        if (currentTime > 3 && audioRef.current) {
            // If more than 3 seconds in, just restart current track
            audioRef.current.currentTime = 0;
        } else if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const skipBy = (seconds: number) => {
        if (!audioRef.current) return;
        const target = audioRef.current.currentTime + seconds;
        seek(Math.min(Math.max(0, target), duration || target));
    };

    const setPlaybackRate = (rate: number) => {
        setPlaybackRateState(rate);
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
        }
    };

    const setVolume = (nextVolume: number) => {
        const clamped = Math.min(Math.max(0, nextVolume), 1);
        setVolumeState(clamped);
        if (audioRef.current) {
            audioRef.current.volume = clamped;
        }
    };

    const closePlayer = () => {
        setPlaylist([]);
        setCurrentIndex(-1);
        setIsPlaying(false);
        setIsMinimized(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
    };

    const toggleMinimize = () => setIsMinimized(prev => !prev);

    const primeAudio = () => {
        if (audioRef.current && audioRef.current.src === '') {
            // Prime the audio element on user interaction to bypass autoplay restrictions
            audioRef.current.play().catch(() => {});
            audioRef.current.pause();
        }
    };

    return (
        <AudioContext.Provider value={{
            playlist,
            currentIndex,
            isPlaying,
            currentTime,
            duration,
            playbackRate,
            volume,
            isMinimized,
            playTrack,
            addToQueue,
            removeFromQueue,
            togglePlay,
            nextTrack,
            prevTrack,
            closePlayer,
            toggleMinimize,
            seek,
            skipBy,
            setPlaybackRate,
            setVolume,
            currentTrack,
            primeAudio
        }}>
            {children}
        </AudioContext.Provider>
    );
}

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
