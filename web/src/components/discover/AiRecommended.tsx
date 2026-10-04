import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, ListPlus, Sparkles } from 'lucide-react';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';

const AI_RECOMMENDED: (Track & { reason: string })[] = [
  { id: 'ai1', title: 'Cyberpunk City', artist: 'Neon Waves', reason: 'Because you listened to Midnight City', albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', duration: '4:15', durationSeconds: 255 },
  { id: 'ai2', title: 'Lofi Study', artist: 'Chillhop', reason: 'Because you listened to Deep Focus', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', duration: '2:30', durationSeconds: 150 },
  { id: 'ai3', title: 'Indie Pop Hits', artist: 'Various', reason: 'Because you like Harry Styles', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', duration: '3:20', durationSeconds: 200 },
];

export default function AiRecommended() {
  const playTrack = usePlayerStore(s => s.playTrack);

  return (
    <section className="mb-14">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={24} className="text-accent-purple" />
        <h2 className="text-2xl font-bold text-white tracking-tight">Recommended For You</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {AI_RECOMMENDED.map((track, i) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface/30 backdrop-blur-md border border-accent-purple/20 rounded-2xl p-4 flex flex-col gap-4 group hover:bg-surface transition-all duration-300 hover:border-accent-purple/50 shadow-lg"
          >
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-white font-bold text-base truncate mb-1">{track.title}</h3>
                <span className="text-text-secondary text-sm truncate">{track.artist}</span>
              </div>
            </div>
            
            <div className="bg-accent-purple/10 text-accent-purple text-xs font-medium px-3 py-2 rounded-lg italic">
              {track.reason}
            </div>
            
            <div className="flex items-center gap-2 mt-auto">
              <button 
                onClick={() => playTrack(track)}
                className="flex-1 bg-white text-black font-bold py-2 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-1 shadow-md"
              >
                <Play fill="currentColor" size={14} /> Play
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light border border-border text-text-secondary hover:text-white hover:border-white/20 transition-all">
                <Heart size={16} />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-light border border-border text-text-secondary hover:text-white hover:border-white/20 transition-all">
                <ListPlus size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
