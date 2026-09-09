import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Disc3, Mic2, Radio } from 'lucide-react';

const STATS = [
  { id: 1, title: 'Trending Songs', value: '45.2K', icon: <TrendingUp size={24} className="text-accent-blue" />, color: 'bg-accent-blue/10' },
  { id: 2, title: 'Active Artists', value: '1.2M', icon: <Users size={24} className="text-accent-purple" />, color: 'bg-accent-purple/10' },
  { id: 3, title: 'New Albums', value: '8,405', icon: <Disc3 size={24} className="text-accent-orange" />, color: 'bg-accent-orange/10' },
  { id: 4, title: 'Live Events', value: '342', icon: <Radio size={24} className="text-red-500" />, color: 'bg-red-500/10' },
  { id: 5, title: 'Podcasts', value: '125K', icon: <Mic2 size={24} className="text-accent-green" />, color: 'bg-accent-green/10' },
];

export default function DiscoverStats() {
  return (
    <section className="mb-20">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-surface/50 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-default shadow-lg group hover:border-white/20 transition-all"
          >
            <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <motion.div 
              initial={{ scale: 0.5 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', delay: i * 0.1 + 0.2 }}
              className="text-3xl font-black text-white mb-1"
            >
              {stat.value}
            </motion.div>
            <p className="text-text-secondary text-xs uppercase tracking-widest font-bold">{stat.title}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
