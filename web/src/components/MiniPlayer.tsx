import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, Maximize2, Heart, ChevronUp, ListMusic, MonitorSpeaker } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, toggleOverlay, progress, volume, setProgress, nextTrack, prevTrack } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Default fallback audio if track doesn't have one
  const audioSrc = currentTrack?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (!isDragging && audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    const newTime = percent * (audioRef.current.duration || currentTrack?.durationSeconds || 0);
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  if (!currentTrack) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const durationToUse = audioRef.current?.duration || currentTrack.durationSeconds || 1;
  const progressPercent = (progress / durationToUse) * 100;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[90px] bg-surface/90 backdrop-blur-xl border-t border-border px-4 flex items-center justify-between z-[60] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={audioSrc}
        autoPlay={isPlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/4 min-w-[200px]">
        <motion.div 
          whileHover={{ scale: 1.05, y: -5 }} 
          onClick={toggleOverlay}
          className="w-14 h-14 rounded-md overflow-hidden group cursor-pointer relative shadow-[0_5px_15px_rgba(0,0,0,0.4)]"
        >
          <img src={currentTrack.albumArt} alt={currentTrack.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
            <ChevronUp size={24} className="text-white" />
          </div>
        </motion.div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-white font-bold text-sm truncate hover:underline cursor-pointer group flex items-center gap-2">
            {currentTrack.title}
          </span>
          <span className="text-text-secondary text-xs truncate hover:underline cursor-pointer font-medium">{currentTrack.artist}</span>
        </div>
        <button className="text-text-secondary hover:text-accent-green transition-colors ml-2 hover:scale-110 active:scale-95">
          <Heart size={18} />
        </button>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col items-center max-w-[40%] w-full gap-2">
        <div className="flex items-center gap-6">
          <button className="text-text-secondary hover:text-white transition-colors hover:scale-110 active:scale-95">
            <Shuffle size={16} />
          </button>
          <button onClick={prevTrack} className="text-white/80 hover:text-white transition-colors hover:scale-110 active:scale-95">
            <SkipBack size={20} fill="currentColor" />
          </button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </motion.button>
          
          <button onClick={nextTrack} className="text-white/80 hover:text-white transition-colors hover:scale-110 active:scale-95">
            <SkipForward size={20} fill="currentColor" />
          </button>
          <button className="text-text-secondary hover:text-white transition-colors hover:scale-110 active:scale-95">
            <Repeat size={16} />
          </button>
        </div>
        
        <div className="w-full flex items-center gap-3 text-[11px] text-text-secondary font-medium">
          <span className="w-8 text-right">{formatTime(progress)}</span>
          <div 
            className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden group cursor-pointer relative"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-white group-hover:bg-accent-green relative rounded-full transition-colors"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-[0_0_10px_rgba(0,0,0,0.5)] transform translate-x-1/2" />
            </div>
          </div>
          <span className="w-8">{formatTime(durationToUse)}</span>
        </div>
      </div>

      {/* Extra Controls */}
      <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
        <button className="text-text-secondary hover:text-white transition-colors relative group">
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Lyrics</span>
          <Mic2 size={16} />
        </button>
        <button className="text-text-secondary hover:text-white transition-colors relative group">
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Queue</span>
          <ListMusic size={16} />
        </button>
        <button className="text-accent-green hover:text-white transition-colors relative group">
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Devices</span>
          <MonitorSpeaker size={16} />
        </button>
        
        <div className="flex items-center gap-2 group w-24 cursor-pointer ml-2">
          <Volume2 size={16} className="text-text-secondary group-hover:text-white transition-colors" />
          <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white group-hover:bg-accent-green rounded-full transition-colors" style={{ width: `${volume}%` }} />
          </div>
        </div>
        <button onClick={toggleOverlay} className="text-text-secondary hover:text-white transition-colors ml-2 relative group hover:scale-110 active:scale-95">
          <span className="absolute -top-8 right-0 bg-surface border border-border text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">Full Player</span>
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}
