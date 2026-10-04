import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, Share2, Plus } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

const FEATURED = [
  { id: 'f1', title: 'Midnight City', artist: 'M83', type: 'Featured Track', desc: 'The definitive synth-pop anthem of the decade.', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1600&q=80', duration: '4:03', durationSeconds: 243, color: 'from-accent-purple/80' },
  { id: 'f2', title: 'After Hours', artist: 'The Weeknd', type: 'Featured Album', desc: 'Dive into the neon-lit world of the latest chart-topping album.', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=1600&q=80', duration: '6:01', durationSeconds: 361, color: 'from-accent-orange/80' },
  { id: 'f3', title: 'Deep Focus', artist: 'Spotify', type: 'Playlist', desc: 'Keep calm and focus with ambient and post-rock music.', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80', duration: '2:10', durationSeconds: 130, color: 'from-accent-blue/80' }
];

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const playTrack = usePlayerStore(s => s.playTrack);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FEATURED.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const item = FEATURED[currentIndex];

  return (
    <div className="w-full h-[28rem] rounded-3xl relative overflow-hidden mb-12 shadow-2xl group">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img src={item.albumArt} alt="Hero" className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${item.color} to-primary/90 mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-10 w-full flex items-end justify-between">
            <div className="max-w-2xl">
              <motion.span 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-white/80 font-bold tracking-widest text-xs uppercase mb-3 block"
              >
                {item.type}
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tighter"
              >
                {item.title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="text-white/70 text-lg mb-8 max-w-lg"
              >
                {item.desc}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="flex items-center gap-4"
              >
                <button 
                  onClick={() => playTrack(item)}
                  className="h-14 px-8 rounded-full bg-accent-green hover:bg-accent-green/90 text-black font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(29,185,84,0.4)]"
                >
                  <Play fill="currentColor" size={20} />
                  Play Now
                </button>
                <button className="h-14 w-14 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center text-white transition-colors backdrop-blur-md">
                  <Heart size={20} />
                </button>
                <button className="h-14 w-14 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center text-white transition-colors backdrop-blur-md">
                  <Plus size={24} />
                </button>
                <button className="h-14 w-14 rounded-full border border-white/20 hover:bg-white/10 flex items-center justify-center text-white transition-colors backdrop-blur-md">
                  <Share2 size={20} />
                </button>
              </motion.div>
            </div>
            
            {/* Parallax Floating Artwork */}
            <motion.div 
              initial={{ opacity: 0, x: 50, rotateY: -20 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="hidden lg:block w-64 h-64 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 rotate-3 group-hover:rotate-6 transition-transform duration-500"
            >
              <img src={item.albumArt} alt={item.title} className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Pagination Dots */}
      <div className="absolute bottom-6 right-10 flex gap-2 z-10">
        {FEATURED.map((_, i) => (
          <button 
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
}
