import React from 'react';
import { motion } from 'framer-motion';

const GENRES = [
  { name: 'Pop', color: 'from-pink-500 to-rose-500', icon: '🎤' },
  { name: 'Hip-Hop', color: 'from-purple-500 to-indigo-500', icon: '🎧' },
  { name: 'Electronic', color: 'from-blue-500 to-cyan-500', icon: '🎛️' },
  { name: 'Rock', color: 'from-red-500 to-orange-500', icon: '🎸' },
  { name: 'Jazz', color: 'from-amber-600 to-yellow-600', icon: '🎷' },
  { name: 'Classical', color: 'from-slate-500 to-slate-700', icon: '🎻' },
];

export default function MusicGenres() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Music Genres</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {GENRES.map((genre, i) => (
          <motion.div
            key={genre.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className={`bg-gradient-to-br ${genre.color} h-32 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer shadow-lg group relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors" />
            <span className="text-4xl mb-2 filter drop-shadow-md group-hover:scale-110 transition-transform">{genre.icon}</span>
            <h3 className="text-white font-bold text-sm drop-shadow-md">{genre.name}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
