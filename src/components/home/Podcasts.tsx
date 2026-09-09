import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const PODCASTS = [
  { id: 1, title: 'The Daily', publisher: 'The New York Times', eps: 1205, image: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?w=500&q=80', trending: true },
  { id: 2, title: 'Huberman Lab', publisher: 'Scicomm Media', eps: 156, image: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=500&q=80', trending: true },
  { id: 3, title: 'Syntax - Web Development', publisher: 'Wes Bos & Scott Tolinski', eps: 689, image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', trending: false },
  { id: 4, title: 'Lex Fridman Podcast', publisher: 'Lex Fridman', eps: 398, image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', trending: false },
];

export default function Podcasts() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Top Podcasts</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PODCASTS.map((podcast, i) => (
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-surface/50 border border-transparent hover:border-border p-4 rounded-2xl group cursor-pointer hover:bg-surface transition-all duration-300"
          >
            <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4 shadow-md">
              <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              {podcast.trending && (
                <div className="absolute top-2 left-2 bg-accent-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Trending
                </div>
              )}
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
              >
                <Play fill="currentColor" size={24} className="ml-1" />
              </motion.button>
            </div>
            <h3 className="text-white font-bold text-base truncate mb-1">{podcast.title}</h3>
            <p className="text-text-secondary text-sm truncate">{podcast.publisher}</p>
            <p className="text-accent-green text-xs mt-1 font-medium">{podcast.eps} Episodes</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
