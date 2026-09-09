import React from 'react';
import { motion } from 'framer-motion';
import { ListMusic } from 'lucide-react';

const RECENTLY_ADDED = [
  { id: 1, title: 'Late Night Coding', songs: 42, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80' },
  { id: 2, title: 'Gym Playlist 2024', songs: 85, image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=300&q=80' },
  { id: 3, title: 'Roadtrip Vibes', songs: 120, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80' },
];

export default function RecentlyAdded() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Recently Added Playlists</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {RECENTLY_ADDED.map((playlist, i) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="flex items-center gap-4 bg-surface p-4 rounded-xl cursor-pointer group shadow-lg border border-border"
          >
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img src={playlist.image} alt={playlist.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm mb-1 group-hover:text-accent-blue transition-colors">{playlist.title}</h3>
              <p className="text-text-secondary text-xs flex items-center gap-1">
                <ListMusic size={12} /> {playlist.songs} songs
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
