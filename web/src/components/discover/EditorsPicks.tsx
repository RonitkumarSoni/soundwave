import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

const EDITORS_PICKS = [
  { id: 1, title: 'Essential Hits', desc: 'The biggest songs right now, selected by our experts.', duration: '2h 15m', followers: '2.1M', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80' },
  { id: 2, title: 'Future Bass', desc: 'The future of electronic music.', duration: '4h 30m', followers: '850K', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80' },
  { id: 3, title: 'Acoustic Morning', desc: 'Wake up gently with these acoustic tunes.', duration: '3h 10m', followers: '1.4M', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80' },
  { id: 4, title: 'Late Night Beats', desc: 'Lofi and chill beats for late night coding.', duration: '5h 00m', followers: '3.2M', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80' },
];

export default function EditorsPicks() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Editor's Picks</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {EDITORS_PICKS.map((pick, i) => (
          <motion.div
            key={pick.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-4 shadow-xl border border-white/10 group-hover:border-white/30 transition-colors">
              <img src={pick.image} alt={pick.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1 border border-white/10">
                <BadgeCheck size={12} className="text-accent-blue" />
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Editor Pick</span>
              </div>
            </div>
            <h3 className="text-white font-bold text-base mb-1 group-hover:text-accent-blue transition-colors">{pick.title}</h3>
            <p className="text-text-secondary text-xs mb-2 line-clamp-2">{pick.desc}</p>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">{pick.duration} • {pick.followers} followers</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
