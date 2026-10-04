import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Heart, Share2, Plus } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

const FEATURED = [
  { id: 'df1', title: 'UTOPIA', subtitle: 'Featured Album', artist: 'Travis Scott', desc: 'Experience the sonic landscape of the year. Featuring Drake, The Weeknd, and more.', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=1600&q=80', duration: '1:13:00', durationSeconds: 4380, color: 'from-orange-600/80' },
  { id: 'df2', title: 'Top 50 Global', subtitle: 'Featured Playlist', artist: 'Spotify', desc: 'The most played tracks right now, updated daily.', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=1600&q=80', duration: '2:45:00', durationSeconds: 9900, color: 'from-blue-600/80' },
  { id: 'df3', title: 'Taylor Swift', subtitle: 'Featured Artist', artist: '105M Listeners', desc: 'Dive into the eras of one of the greatest songwriters of our generation.', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80', duration: '0:00', durationSeconds: 0, color: 'from-pink-600/80' }
];

export default function FeaturedBanner() {
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
    <div className="w-full h-[32rem] rounded-3xl relative overflow-hidden mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
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
          <div className={`absolute inset-0 bg-gradient-to-r ${item.color} to-primary mix-blend-multiply`} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-12 w-full flex items-end justify-between z-10">
            <div className="max-w-2xl">
              <motion.span 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="inline-block bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs uppercase px-3 py-1 rounded-full mb-4 tracking-widest shadow-lg"
              >
                {item.subtitle}
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-xl"
              >
                {item.title}
              </motion.h1>
              <motion.h2
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="text-2xl text-white/90 font-medium mb-4 drop-shadow-md"
              >
                {item.artist}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="text-white/70 text-lg mb-8 max-w-lg leading-relaxed"
              >
                {item.desc}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="flex items-center gap-4"
              >
                <button 
                  onClick={() => playTrack(item)}
                  className="h-14 px-10 rounded-full bg-white hover:bg-gray-200 text-black font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                >
                  <Play fill="currentColor" size={20} />
                  Play
                </button>
                <button className="h-14 w-14 rounded-full border border-white/30 bg-black/20 hover:bg-white/10 hover:border-white flex items-center justify-center text-white transition-all backdrop-blur-md">
                  <Heart size={20} />
                </button>
                <button className="h-14 w-14 rounded-full border border-white/30 bg-black/20 hover:bg-white/10 hover:border-white flex items-center justify-center text-white transition-all backdrop-blur-md">
                  <Plus size={24} />
                </button>
                <button className="h-14 w-14 rounded-full border border-white/30 bg-black/20 hover:bg-white/10 hover:border-white flex items-center justify-center text-white transition-all backdrop-blur-md">
                  <Share2 size={20} />
                </button>
              </motion.div>
            </div>
            
            {/* Massive Parallax Floating Artwork */}
            <motion.div 
              initial={{ opacity: 0, x: 100, rotateY: -30 }}
              animate={{ opacity: 1, x: 0, rotateY: -10 }}
              transition={{ delay: 0.6, type: 'spring', damping: 20 }}
              className="hidden lg:block w-80 h-80 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/20 group-hover:rotate-0 group-hover:scale-105 transition-all duration-700 ease-out"
              style={{ perspective: 1000 }}
            >
              <img src={item.albumArt} alt={item.title} className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Pagination Dots */}
      <div className="absolute bottom-8 right-12 flex gap-2 z-20">
        {FEATURED.map((_, i) => (
          <button 
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 shadow-md ${i === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </div>
  );
}
