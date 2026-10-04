import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const CHARTS = [
  { id: 'c1', name: 'Global Top 50', type: 'Global', songs: 50, followers: '12M', color: 'from-blue-600 to-indigo-900', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80' },
  { id: 'c2', name: 'India Top 50', type: 'Regional', songs: 50, followers: '8.5M', color: 'from-orange-500 to-red-700', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80' },
  { id: 'c3', name: 'Hip-Hop Hits', type: 'Genre', songs: 100, followers: '15M', color: 'from-purple-600 to-black', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=300&q=80' },
  { id: 'c4', name: 'Pop Rising', type: 'Genre', songs: 75, followers: '9.2M', color: 'from-pink-500 to-rose-700', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80' },
  { id: 'c5', name: 'Rock Classics', type: 'Genre', songs: 200, followers: '6.4M', color: 'from-zinc-600 to-zinc-900', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80' },
  { id: 'c6', name: 'EDM Mainstage', type: 'Genre', songs: 150, followers: '11M', color: 'from-cyan-500 to-blue-700', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80' },
];

export default function TopCharts() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Top Charts</h2>
        <button className="text-xs font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors">Show all</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
        {CHARTS.map((chart, i) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group cursor-pointer"
          >
            <div className={`relative aspect-square w-full rounded-2xl mb-4 overflow-hidden shadow-lg bg-gradient-to-br ${chart.color} p-4 flex flex-col justify-between group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300 border border-white/5`}>
              <div className="absolute inset-0">
                <img src={chart.image} alt={chart.name} className="w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700" />
              </div>
              
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{chart.type}</span>
              </div>
              
              <div className="relative z-10">
                <h3 className="text-xl font-black text-white leading-tight drop-shadow-md mb-1">{chart.name}</h3>
                <p className="text-white/70 text-xs font-medium">{chart.songs} songs • {chart.followers} followers</p>
              </div>

              <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-xl z-20">
                <Play fill="currentColor" size={16} className="ml-1" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
