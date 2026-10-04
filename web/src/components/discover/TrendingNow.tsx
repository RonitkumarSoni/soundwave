import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, MoreVertical } from 'lucide-react';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';

const TRENDING_DISCOVER: (Track & { rank: number, popularity: string })[] = [
  { id: 'td1', title: 'Paint The Town Red', artist: 'Doja Cat', rank: 1, popularity: '98%', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80', duration: '3:51', durationSeconds: 231 },
  { id: 'td2', title: 'Vampire', artist: 'Olivia Rodrigo', rank: 2, popularity: '95%', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=300&q=80', duration: '3:40', durationSeconds: 220 },
  { id: 'td3', title: 'Cruel Summer', artist: 'Taylor Swift', rank: 3, popularity: '92%', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80', duration: '2:58', durationSeconds: 178 },
  { id: 'td4', title: 'I Remember Everything', artist: 'Zach Bryan', rank: 4, popularity: '89%', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80', duration: '3:47', durationSeconds: 227 },
  { id: 'td5', title: 'Fukumean', artist: 'Gunna', rank: 5, popularity: '86%', albumArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80', duration: '2:05', durationSeconds: 125 },
];

export default function TrendingNow() {
  const playTrack = usePlayerStore(s => s.playTrack);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Trending Now <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live</span>
        </h2>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
        {TRENDING_DISCOVER.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          
          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className={`snap-start min-w-[280px] bg-surface border rounded-2xl p-4 cursor-pointer group shadow-lg transition-all duration-300 relative ${isActive ? 'border-accent-green' : 'border-border hover:border-white/20'}`}
              onClick={() => !isActive && playTrack(track)}
            >
              {isActive && (
                <div className="absolute inset-0 bg-accent-green/5 blur-xl rounded-2xl -z-10" />
              )}
              
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 shadow-md">
                <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/20">
                  #{track.rank}
                </div>
                
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-full border border-white/20">
                  {track.popularity}
                </div>

                {isActive && isPlaying ? (
                  <div className="absolute bottom-4 left-4 flex items-end gap-1 h-6">
                    <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 bg-accent-green rounded-t-sm" />
                    <motion.div animate={{ height: ['80%', '30%', '80%'] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1.5 bg-accent-green rounded-t-sm" />
                    <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1.5 bg-accent-green rounded-t-sm" />
                  </div>
                ) : (
                  <button className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-accent-green text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-[0_0_15px_rgba(29,185,84,0.5)]">
                    <Play fill="currentColor" size={20} className="ml-1" />
                  </button>
                )}
              </div>
              
              <div className="flex items-start justify-between">
                <div className="min-w-0 pr-2">
                  <h3 className={`font-bold text-lg truncate mb-1 ${isActive ? 'text-accent-green' : 'text-white'}`}>{track.title}</h3>
                  <p className="text-text-secondary text-sm truncate">{track.artist}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button className="text-text-secondary hover:text-white p-1 transition-colors">
                    <Heart size={18} />
                  </button>
                  <button className="text-text-secondary hover:text-white p-1 transition-colors opacity-0 group-hover:opacity-100">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
