import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const PLAYLISTS = [
  { id: 1, title: 'Today\'s Top Hits', followers: '34M', songs: 50, updated: '2 hours ago', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80' },
  { id: 2, title: 'RapCaviar', followers: '15M', songs: 50, updated: '5 hours ago', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80' },
  { id: 3, title: 'Viva Latino', followers: '14M', songs: 50, updated: '1 day ago', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80' },
  { id: 4, title: 'Rock Classics', followers: '11M', songs: 100, updated: '3 days ago', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80' },
];

export default function TrendingPlaylists() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Trending Playlists</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {PLAYLISTS.map((playlist, i) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-4 shadow-lg">
              <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
            <h3 className="text-white font-bold text-base mb-1 truncate group-hover:text-accent-blue transition-colors">{playlist.title}</h3>
            <p className="text-white/60 text-xs font-medium mb-1">{playlist.followers} followers • {playlist.songs} songs</p>
            <p className="text-text-secondary text-[10px] flex items-center gap-1 uppercase tracking-wider">
              <Clock size={10} /> Updated {playlist.updated}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
