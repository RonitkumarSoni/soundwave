import React from 'react';
import { motion } from 'framer-motion';
import { Globe2 } from 'lucide-react';

const COUNTRIES = [
  { id: 'c1', name: 'India', songs: 'Top 50 Trending', color: 'from-orange-500 via-white to-green-500' },
  { id: 'c2', name: 'USA', songs: 'Hot 100 Billboard', color: 'from-red-600 via-white to-blue-600' },
  { id: 'c3', name: 'Korea', songs: 'K-Pop Top Hits', color: 'from-red-500 to-blue-600' },
  { id: 'c4', name: 'Japan', songs: 'J-Pop & Anime Hits', color: 'from-white to-red-600' },
  { id: 'c5', name: 'Brazil', songs: 'Samba & Funk', color: 'from-green-500 via-yellow-400 to-blue-500' },
  { id: 'c6', name: 'France', songs: 'French Pop', color: 'from-blue-600 via-white to-red-600' },
];

export default function MusicByCountry() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Globe2 className="text-accent-blue" /> Music by Country
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {COUNTRIES.map((country, i) => (
          <motion.div
            key={country.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5, scale: 1.05 }}
            className={`h-32 rounded-2xl p-4 relative overflow-hidden cursor-pointer shadow-lg group bg-surface border border-white/5 hover:border-white/20 transition-all duration-300`}
          >
            {/* Background Flag Blur */}
            <div className={`absolute inset-0 bg-gradient-to-br ${country.color} opacity-10 group-hover:opacity-30 transition-opacity blur-md`} />
            
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
              <h3 className="text-white font-black text-xl mb-1">{country.name}</h3>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{country.songs}</p>
            </div>
            
            <div className="absolute top-2 right-2 text-white/20 group-hover:text-white/40 transition-colors">
              <Globe2 size={40} />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
