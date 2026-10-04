import React from 'react';
import { Play, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';

const TRACKS = [
  { id: 'a1', title: 'Intro (End of the World)', artist: 'Ariana Grande', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', duration: '1:32', durationSeconds: 92, plays: '1.2M' },
  { id: 'a2', title: 'Bye', artist: 'Ariana Grande', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', duration: '2:44', durationSeconds: 164, plays: '14.5M' },
  { id: 'a3', title: 'Don\'t Wanna Break Up Again', artist: 'Ariana Grande', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', duration: '2:54', durationSeconds: 174, plays: '10.1M' },
  { id: 'a4', title: 'Saturn Returns Interlude', artist: 'Ariana Grande', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', duration: '0:42', durationSeconds: 42, plays: '3.4M' },
  { id: 'a5', title: 'Eternal Sunshine', artist: 'Ariana Grande', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', duration: '3:30', durationSeconds: 210, plays: '32.1M' },
];

export default function Album() {
  const playTrack = usePlayerStore(s => s.playTrack);

  return (
    <div className="pb-8">
      {/* Album Header */}
      <div className="relative pt-24 pb-8 px-8 flex items-end gap-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-purple/40 to-primary -z-10" />
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-3xl -z-20" />
        
        <motion.img 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80" 
          alt="Album Art" 
          className="w-48 h-48 md:w-60 md:h-60 rounded-xl shadow-2xl object-cover" 
        />
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col text-white"
        >
          <span className="text-xs font-bold uppercase mb-2">Album</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">Eternal Sunshine</h1>
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ariana" alt="Artist" className="w-6 h-6 rounded-full bg-white/20" />
            <span className="font-bold text-white hover:underline cursor-pointer">Ariana Grande</span>
            <span>•</span>
            <span>2024</span>
            <span>•</span>
            <span>13 songs, 35 min 32 sec</span>
          </div>
        </motion.div>
      </div>

      {/* Album Actions */}
      <div className="px-8 py-6 flex items-center gap-6">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => playTrack(TRACKS[0])}
          className="w-14 h-14 rounded-full bg-accent-green flex items-center justify-center text-black shadow-xl"
        >
          <Play fill="currentColor" size={24} className="ml-1" />
        </motion.button>
        <button className="text-text-secondary hover:text-white transition-colors">
          <Heart size={32} />
        </button>
        <button className="text-text-secondary hover:text-white transition-colors">
          <MoreHorizontal size={32} />
        </button>
      </div>

      {/* Track List */}
      <div className="px-8 mt-4">
        {/* Table Header */}
        <div className="flex items-center text-text-secondary text-sm border-b border-border pb-2 mb-4 px-4">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Title</span>
          <span className="w-32 text-right hidden md:block">Plays</span>
          <span className="w-16 flex justify-end"><Clock size={16} /></span>
        </div>

        {/* Tracks */}
        <div className="flex flex-col gap-1">
          {TRACKS.map((track, i) => (
            <div key={track.id} className="flex items-center text-text-secondary hover:bg-white/5 rounded-lg p-2 px-4 group transition-colors">
              <span className="w-8 text-center text-base group-hover:hidden">{i + 1}</span>
              <button onClick={() => playTrack(track)} className="w-8 text-center text-white hidden group-hover:block">
                <Play fill="currentColor" size={16} />
              </button>
              
              <div className="flex-1 flex flex-col pl-2">
                <span className="text-white text-base font-medium">{track.title}</span>
                <span className="text-sm">{track.artist}</span>
              </div>
              
              <span className="w-32 text-right hidden md:block text-sm">{track.plays}</span>
              <span className="w-16 text-right text-sm">{track.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
