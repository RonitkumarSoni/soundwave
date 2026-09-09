import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

const PODCASTS = [
  { id: 1, title: 'The Joe Rogan Experience', host: 'Joe Rogan', eps: '2000+', trending: true, image: 'https://images.unsplash.com/photo-1593697821252-0c9137d9fc45?w=500&q=80', color: 'from-red-900 to-black' },
  { id: 2, title: 'Huberman Lab', host: 'Andrew Huberman', eps: '156', trending: true, image: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=500&q=80', color: 'from-blue-900 to-black' },
  { id: 3, title: 'Call Her Daddy', host: 'Alex Cooper', eps: '245', trending: false, image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', color: 'from-pink-900 to-black' },
  { id: 4, title: 'Anything Goes', host: 'Emma Chamberlain', eps: '189', trending: false, image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', color: 'from-yellow-900 to-black' },
];

export default function PodcastDiscovery() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Podcast Discovery</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PODCASTS.map((podcast, i) => (
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`bg-gradient-to-br ${podcast.color} rounded-2xl p-5 border border-white/10 hover:border-white/30 transition-all duration-300 group cursor-pointer shadow-lg`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md">
                <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              {podcast.trending && (
                <span className="bg-white text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  Trending
                </span>
              )}
            </div>
            
            <h3 className="text-white font-bold text-lg leading-tight mb-1">{podcast.title}</h3>
            <p className="text-white/70 text-sm mb-4">Hosted by {podcast.host}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <span className="text-white/50 text-xs font-medium uppercase tracking-widest">{podcast.eps} Episodes</span>
              <button className="text-white hover:text-accent-blue transition-colors hover:scale-110 active:scale-95 flex items-center gap-1 font-bold text-sm">
                <PlayCircle size={24} /> Listen
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
