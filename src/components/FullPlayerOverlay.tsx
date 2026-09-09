import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, Maximize2, Share, Heart } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function FullPlayerOverlay() {
  const { currentTrack, isOverlayOpen, toggleOverlay, isPlaying, togglePlay, progress, volume } = usePlayerStore();

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isOverlayOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-primary flex flex-col overflow-hidden"
        >
          {/* Animated Gradient Background matching album art dominant color (simulated with glass blur over image) */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img src={currentTrack.albumArt} alt="bg" className="w-full h-full object-cover blur-[100px] scale-150 opacity-50" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-8 py-6">
            <button 
              onClick={toggleOverlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            >
              <ChevronDown size={24} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs tracking-widest uppercase text-white/70 font-semibold mb-1">Playing from playlist</span>
              <span className="text-white font-bold text-sm">Best of Synthwave</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors">
              <Share size={18} />
            </button>
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center px-8 md:px-24 gap-12 max-w-7xl mx-auto w-full">
            
            {/* Album Art - Left Side */}
            <div className="flex-1 flex items-center justify-center max-w-lg w-full">
              <motion.div 
                layoutId={`album-art-${currentTrack.id}`}
                className="w-full aspect-square rounded-2xl shadow-2xl overflow-hidden relative"
              >
                <img src={currentTrack.albumArt} alt={currentTrack.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none" />
              </motion.div>
            </div>

            {/* Controls & Lyrics - Right Side */}
            <div className="flex-1 flex flex-col w-full max-w-lg">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">{currentTrack.title}</h1>
                  <h2 className="text-xl md:text-2xl text-white/70 font-medium">{currentTrack.artist}</h2>
                </div>
                <button className="text-white/70 hover:text-accent-green transition-colors">
                  <Heart size={32} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-3 cursor-pointer group">
                  <div className="h-full bg-white group-hover:bg-accent-green relative rounded-full" style={{ width: '45%' }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transform translate-x-1/2" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-white/50 font-medium">
                  <span>1:24</span>
                  <span>{currentTrack.duration}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-between mb-12">
                <button className="text-white/70 hover:text-white transition-colors">
                  <Shuffle size={24} />
                </button>
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipBack size={40} fill="currentColor" />
                </button>
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
                </motion.button>
                
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipForward size={40} fill="currentColor" />
                </button>
                <button className="text-white/70 hover:text-white transition-colors">
                  <Repeat size={24} />
                </button>
              </div>

              {/* Secondary Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Mic2 size={20} />
                  </button>
                  <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                    <Maximize2 size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-3 w-40 group cursor-pointer">
                  <Volume2 size={20} className="text-white/70 group-hover:text-white transition-colors" />
                  <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white group-hover:bg-accent-green rounded-full" style={{ width: `${volume}%` }} />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
