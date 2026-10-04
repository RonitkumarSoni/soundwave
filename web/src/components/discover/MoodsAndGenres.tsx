import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Flame, BrainCircuit, Moon, PartyPopper, Terminal, Headphones, Heart, Plane, Flower2, Music4, Film, Radio, Mic2, Tv2 } from 'lucide-react';

const CATEGORIES = [
  { name: 'Chill', color: 'from-blue-500 to-cyan-400', icon: Coffee, count: '2.4M' },
  { name: 'Workout', color: 'from-red-600 to-orange-500', icon: Flame, count: '5.1M' },
  { name: 'Focus', color: 'from-teal-600 to-emerald-400', icon: BrainCircuit, count: '3.8M' },
  { name: 'Sleep', color: 'from-indigo-900 to-purple-800', icon: Moon, count: '1.9M' },
  { name: 'Party', color: 'from-pink-500 to-rose-400', icon: PartyPopper, count: '6.2M' },
  { name: 'Coding', color: 'from-slate-700 to-slate-500', icon: Terminal, count: '890K' },
  { name: 'Lo-Fi', color: 'from-amber-600 to-orange-400', icon: Headphones, count: '4.5M' },
  { name: 'Romance', color: 'from-rose-600 to-pink-500', icon: Heart, count: '2.1M' },
  { name: 'Travel', color: 'from-sky-500 to-blue-400', icon: Plane, count: '1.2M' },
  { name: 'Meditation', color: 'from-emerald-700 to-teal-500', icon: Flower2, count: '950K' },
  { name: 'Jazz', color: 'from-yellow-700 to-amber-500', icon: Music4, count: '1.5M' },
  { name: 'Bollywood', color: 'from-orange-600 to-red-500', icon: Film, count: '8.4M' },
  { name: 'K-Pop', color: 'from-purple-600 to-pink-500', icon: Radio, count: '9.2M' },
  { name: 'Indie', color: 'from-zinc-500 to-zinc-400', icon: Mic2, count: '3.1M' },
  { name: 'Electronic', color: 'from-cyan-600 to-blue-500', icon: Tv2, count: '7.8M' },
];

export default function MoodsAndGenres() {
  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Moods & Genres</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`bg-gradient-to-br ${cat.color} h-28 rounded-2xl p-4 relative overflow-hidden cursor-pointer shadow-lg group`}
            >
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <h3 className="text-white font-black text-lg drop-shadow-md">{cat.name}</h3>
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-wider">{cat.count} Songs</span>
              </div>

              {/* Massive decorative icon */}
              <div className="absolute -bottom-4 -right-4 opacity-30 group-hover:opacity-50 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500 z-0">
                <Icon size={80} className="text-white" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
