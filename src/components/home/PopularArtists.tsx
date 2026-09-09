import React from 'react';
import { motion } from 'framer-motion';

const ARTISTS = [
  { id: 1, name: 'The Weeknd', listeners: '112M', image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=500&q=80' },
  { id: 2, name: 'Taylor Swift', listeners: '105M', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80' },
  { id: 3, name: 'Drake', listeners: '86M', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80' },
  { id: 4, name: 'Ariana Grande', listeners: '82M', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80' },
  { id: 5, name: 'Bad Bunny', listeners: '78M', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80' },
  { id: 6, name: 'Ed Sheeran', listeners: '75M', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80' },
];

export default function PopularArtists() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Popular Artists</h2>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {ARTISTS.map((artist, i) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            className="flex flex-col items-center gap-3 cursor-pointer group snap-start"
          >
            <div className="relative w-36 h-36 rounded-full overflow-hidden shadow-xl border-4 border-transparent group-hover:border-accent-blue/50 transition-colors duration-300">
              <img src={artist.image} alt={artist.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-sm group-hover:text-accent-blue transition-colors">{artist.name}</h3>
              <p className="text-text-secondary text-xs">{artist.listeners} monthly</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
