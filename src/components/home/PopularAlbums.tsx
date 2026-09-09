import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Share2, Download } from 'lucide-react';

const ALBUMS = [
  { id: 1, title: '1989 (Taylor\'s Version)', artist: 'Taylor Swift', year: '2023', rating: '4.9', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', color: 'bg-blue-500/20' },
  { id: 2, title: 'UTOPIA', artist: 'Travis Scott', year: '2023', rating: '4.7', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', color: 'bg-orange-500/20' },
  { id: 3, title: 'SOS', artist: 'SZA', year: '2022', rating: '4.8', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', color: 'bg-blue-900/40' },
];

export default function PopularAlbums() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Popular Albums</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ALBUMS.map((album, i) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ y: -5 }}
            className={`relative rounded-2xl overflow-hidden shadow-2xl p-6 group cursor-pointer border border-white/5 ${album.color} backdrop-blur-md`}
          >
            <div className="flex gap-4 mb-6">
              <div className="w-24 h-24 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                <img src={album.image} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-white font-bold text-xl mb-1 line-clamp-2">{album.title}</h3>
                <span className="text-white/80 font-medium text-sm">{album.artist}</span>
                <span className="text-white/50 text-xs mt-1">{album.year} • ★ {album.rating}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <button className="text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <Heart size={18} /> Like
              </button>
              <div className="flex gap-4">
                <button className="text-white/70 hover:text-white transition-colors">
                  <Share2 size={18} />
                </button>
                <button className="text-white/70 hover:text-white transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
