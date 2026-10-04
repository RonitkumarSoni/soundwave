import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, Share2 } from 'lucide-react';

const REELS = [
  { id: 1, artist: 'Doja Cat', song: 'Paint The Town Red', duration: '0:15', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80' },
  { id: 2, artist: 'Olivia Rodrigo', song: 'Vampire', duration: '0:30', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80' },
  { id: 3, artist: 'Gunna', song: 'fukumean', duration: '0:22', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80' },
  { id: 4, artist: 'Dua Lipa', song: 'Dance The Night', duration: '0:18', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80' },
  { id: 5, artist: 'Ice Spice', song: 'Deli', duration: '0:25', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80' },
];

export default function ShortMusicVideos() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Short Music Videos</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {REELS.map((reel, i) => (
          <motion.div
            key={reel.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative w-48 h-80 rounded-2xl overflow-hidden flex-shrink-0 snap-start group cursor-pointer shadow-lg border border-white/10"
          >
            <img src={reel.image} alt={reel.song} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
            
            {/* Simulated Autoplay indicator */}
            <div className="absolute top-3 left-3 bg-red-500 w-2 h-2 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-2 right-3 text-white/80 font-bold text-[10px] bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
              {reel.duration}
            </div>

            <button className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-white hover:text-black shadow-xl border border-white/30">
              <Play fill="currentColor" size={20} className="ml-1" />
            </button>
            
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <h3 className="text-white font-bold text-sm truncate mb-1 leading-tight">{reel.song}</h3>
              <p className="text-white/70 text-xs truncate mb-3">{reel.artist}</p>
              
              <div className="flex items-center justify-between border-t border-white/20 pt-3">
                <button className="text-white hover:text-accent-pink transition-colors hover:scale-110">
                  <Heart size={18} />
                </button>
                <button className="text-white hover:text-accent-blue transition-colors hover:scale-110">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
