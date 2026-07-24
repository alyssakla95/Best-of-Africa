import { useState, useEffect } from 'react';
import { Volume2, Pause, Play, Loader, AlertCircle } from 'lucide-react';
import { request } from '../../services/api';
import { useAudio } from '../../context/AudioContext';

interface BetaAudioPlayerProps {
  slug: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
}

export const BetaAudioPlayer = ({ slug, title = 'Article Audio', subtitle, imageUrl }: BetaAudioPlayerProps) => {
  const [status, setStatus] = useState<'checking' | 'available' | 'missing' | 'generating'>('checking');
  const [audioData, setAudioData] = useState<{ url: string; duration: number } | null>(null);
  
  const { currentTrack, isPlaying, togglePlay, playTrack, primeAudio } = useAudio();
  
  const isThisTrackPlaying = currentTrack?.slug === slug;

  useEffect(() => {
    // Check if audio exists
    request<{ success: boolean; available?: boolean; audio_url?: string; duration_seconds?: number }>(`/articles/${slug}/audio`)
      .then(res => {
        if (res.audio_url) {
          setAudioData({ url: res.audio_url, duration: res.duration_seconds || 120 });
          setStatus('available');
        } else {
          setStatus('missing');
        }
      })
      .catch(() => setStatus('missing'));
  }, [slug]);

  const generateAndPlay = async () => {
    primeAudio();
    setStatus('generating');
    try {
      const res = await request<{ success: boolean; audio_url: string; duration_seconds: number }>(
        `/articles/${slug}/audio`,
        { method: 'POST' }
      );
      if (res.success && res.audio_url) {
        setAudioData({ url: res.audio_url, duration: res.duration_seconds });
        setStatus('available');
        
        playTrack({
          title,
          subtitle,
          imageUrl,
          slug,
          audioUrl: res.audio_url,
          durationSeconds: res.duration_seconds
        });
      } else {
        setStatus('missing');
      }
    } catch {
      setStatus('missing');
    }
  };

  const handlePlayClick = () => {
    primeAudio();
    if (isThisTrackPlaying) {
      togglePlay();
    } else if (audioData) {
      playTrack({
        title,
        subtitle,
        imageUrl,
        slug,
        audioUrl: audioData.url,
        durationSeconds: audioData.duration
      });
    }
  };

  if (status === 'checking') {
    return (
      <div className="w-full max-w-sm h-12 flex items-center gap-3 px-4 rounded-full bg-card border border-foreground/5 opacity-50">
        <Volume2 size={16} className="text-foreground/20" />
        <span className="text-xs text-foreground/30 font-medium">Checking audio availability...</span>
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <button 
        onClick={generateAndPlay}
        className="group w-full max-w-sm h-12 flex items-center justify-between px-5 rounded-full bg-card border border-foreground/10 hover:border-accent/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors">
            <Volume2 size={12} />
          </div>
          <span className="text-[13px] font-medium text-foreground/70 group-hover:text-foreground transition-colors">Listen to article</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-foreground/30 group-hover:text-accent transition-colors font-bold">Generate Audio</span>
      </button>
    );
  }

  if (status === 'generating') {
    return (
      <div className="w-full max-w-sm h-12 flex items-center gap-3 px-5 rounded-full bg-card border border-accent/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/5 animate-pulse" />
        <Loader size={14} className="text-accent animate-spin relative z-10" />
        <span className="text-[13px] font-medium text-accent relative z-10">Preparing audio...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-card border border-accent/20 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <button 
          onClick={handlePlayClick}
          className="w-10 h-10 rounded-full bg-accent text-navy flex items-center justify-center hover:brightness-110 transition-all shrink-0 shadow-lg shadow-accent/20"
          aria-label={isThisTrackPlaying && isPlaying ? 'Pause' : 'Play'}
        >
          {isThisTrackPlaying && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
        </button>
        
        <div className="flex-1 flex flex-col gap-1 w-full">
          <div className="text-sm font-medium text-foreground">
            {isThisTrackPlaying ? 'Now Playing globally' : 'Listen to this article'}
          </div>
          <div className="text-[10px] text-foreground/70">
            {isThisTrackPlaying ? 'Controls are available at the bottom of your screen.' : 'Audio narration of this briefing.'}
          </div>
        </div>
      </div>
      
      {audioData?.url.includes('best-of-africa-media.r2.dev/audio/tts') && (
        <div className="flex items-center gap-2 mt-1 px-1">
          <AlertCircle size={10} className="text-accent/50" />
          <span className="text-[10px] text-foreground/30 italic">TTS mode, Premium integration pending.</span>
        </div>
      )}
    </div>
  );
};
