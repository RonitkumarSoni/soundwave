import React from 'react';
import { Play, MoreVertical, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';

interface MusicCardProps {
  item: Track & { desc?: string };
  index: number;
  variant?: 'standard' | 'horizontal' | 'compact';
}

export default function MusicCard({ item, index, variant = 'standard' }: MusicCardProps) {
  const playTrack = usePlayerStore(s => s.playTrack);

  if (variant === 'horizontal') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="flex items-center gap-4 bg-surface/50 hover:bg-surface border border-transparent hover:border-border p-3 rounded-xl group cursor-pointer transition-all duration-300 w-80 flex-shrink-0"
      >
        <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
          <img src={item.albumArt} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button onClick={() => playTrack(item)} className="text-white hover:scale-110 transition-transform">
              <Play fill="currentColor" size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm truncate group-hover:text-accent-green transition-colors">{item.title}</h3>
          <p className="text-text-secondary text-xs truncate">{item.artist}</p>
          <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-accent-blue rounded-full" style={{ width: `${Math.random() * 80 + 10}%` }} />
          </div>
        </div>
        <button className="text-text-secondary hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-2">
          <MoreVertical size={16} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -8 }}
      className="bg-surface/50 border border-transparent hover:border-border p-4 rounded-2xl group cursor-pointer hover:bg-surface transition-all duration-300 shadow-lg hover:shadow-2xl"
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 shadow-md">
        <img src={item.albumArt} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
        
        {/* Glow behind play button */}
        <div className="absolute bottom-4 right-4 w-12 h-12 bg-accent-green/50 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => playTrack(item)}
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-accent-green shadow-[0_5px_15px_rgba(0,0,0,0.4)] flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
        >
          <Play fill="currentColor" size={24} className="ml-1" />
        </motion.button>

        <button className="absolute top-3 right-3 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Heart size={20} />
        </button>
      </div>
      <h3 className="text-white font-bold text-base truncate mb-1">{item.title}</h3>
      <p className="text-text-secondary text-sm truncate">{item.desc || item.artist}</p>
    </motion.div>
  );
}
