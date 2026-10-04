import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Play } from 'lucide-react';

const ARTISTS = [
  { id: 1, name: 'The Weeknd', listeners: '112M', genre: 'R&B/Pop', image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&q=80', verified: true },
  { id: 2, name: 'Taylor Swift', listeners: '105M', genre: 'Pop', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80', verified: true },
  { id: 3, name: 'Drake', listeners: '86M', genre: 'Hip-Hop', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80', verified: true },
  { id: 4, name: 'Ariana Grande', listeners: '82M', genre: 'Pop', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80', verified: true },
  { id: 5, name: 'Bad Bunny', listeners: '78M', genre: 'Latin', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', verified: true },
  { id: 6, name: 'Ed Sheeran', listeners: '75M', genre: 'Pop', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80', verified: true },
];

export default function PopularArtists() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Popular Artists</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {ARTISTS.map((artist, i) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            className="flex flex-col items-center p-6 bg-surface/30 rounded-3xl border border-transparent hover:border-border hover:bg-surface cursor-pointer group transition-all duration-300 relative"
          >
            <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 shadow-xl group-hover:shadow-[0_0_30px_rgba(29,185,84,0.3)] transition-all duration-500">
              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              
              <button className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-accent-green text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-10 shadow-lg">
                <Play fill="currentColor" size={20} className="ml-1" />
              </button>
            </div>
            
            <div className="text-center w-full">
              <h3 className="text-white font-bold text-base flex items-center justify-center gap-1 mb-1 truncate group-hover:text-accent-green transition-colors">
                {artist.name}
                {artist.verified && <CheckCircle2 size={14} className="text-accent-blue flex-shrink-0" fill="currentColor" />}
              </h3>
              <p className="text-text-secondary text-xs mb-1">{artist.genre}</p>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-4">{artist.listeners} monthly</p>
              
              <button className="w-full py-1.5 rounded-full border border-border text-white text-xs font-bold hover:border-white transition-colors">
                Follow
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
