import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Disc, Music, Flame } from 'lucide-react';

const STATS = [
  { id: 1, title: 'Hours Listened', value: '142', icon: <Clock size={24} className="text-accent-blue" />, color: 'bg-accent-blue/10' },
  { id: 2, title: 'Songs Played', value: '3,405', icon: <Music size={24} className="text-accent-purple" />, color: 'bg-accent-purple/10' },
  { id: 3, title: 'Top Artists', value: '48', icon: <Disc size={24} className="text-accent-orange" />, color: 'bg-accent-orange/10' },
  { id: 4, title: 'Weekly Streak', value: '12 Days', icon: <Flame size={24} className="text-accent-green" />, color: 'bg-accent-green/10' },
];

export default function ListeningStatistics() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Your Statistics</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-surface border border-border p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-default shadow-lg"
          >
            <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center mb-4`}>
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
