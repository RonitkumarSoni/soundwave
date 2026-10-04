import React from 'react';
import { motion } from 'framer-motion';

const MIXES = [
  { id: 1, title: 'Daily Mix 1', artists: 'The Weeknd, Drake, Future', color: 'from-accent-purple/80 to-accent-blue/80', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80' },
  { id: 2, title: 'Daily Mix 2', artists: 'Taylor Swift, Ed Sheeran', color: 'from-accent-orange/80 to-accent-purple/80', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80' },
  { id: 3, title: 'Daily Mix 3', artists: 'Dua Lipa, Ariana Grande', color: 'from-pink-500/80 to-accent-orange/80', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=300&q=80' },
  { id: 4, title: 'Daily Mix 4', artists: 'Bad Bunny, J Balvin', color: 'from-accent-green/80 to-teal-500/80', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80' },
  { id: 5, title: 'Daily Mix 5', artists: 'Metallica, AC/DC', color: 'from-red-600/80 to-black/80', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80' },
  { id: 6, title: 'Daily Mix 6', artists: 'Miles Davis, John Coltrane', color: 'from-accent-blue/80 to-indigo-900/80', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80' },
];

export default function DailyMix() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Your Daily Mixes</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {MIXES.map((mix, i) => (
          <motion.div
            key={mix.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group cursor-pointer"
          >
            <div className={`relative aspect-square w-full rounded-2xl mb-4 overflow-hidden shadow-lg bg-gradient-to-br ${mix.color}`}>
              <img src={mix.image} alt={mix.title} className="absolute -bottom-4 -right-4 w-24 h-24 rotate-[15deg] rounded-lg shadow-xl group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 left-4 font-black text-2xl text-white drop-shadow-md">
                {mix.title.split(' ').map((word, i) => <div key={i}>{word}</div>)}
              </div>
            </div>
            <p className="text-text-secondary text-sm line-clamp-2">{mix.artists}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
