import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Headphones, Clock, Plus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Mock data for Podcasts
const PODCASTS = [
  { id: 'p1', title: 'The Joe Rogan Experience', host: 'Joe Rogan', category: 'Comedy', duration: '2h 45m', image: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=500&q=80', isNew: true },
  { id: 'p2', title: 'Huberman Lab', host: 'Andrew Huberman', category: 'Science', duration: '1h 30m', image: 'https://images.unsplash.com/photo-1516280440502-85885ff42903?w=500&q=80', isNew: false },
  { id: 'p3', title: 'Crime Junkie', host: 'Ashley Flowers', category: 'True Crime', duration: '45m', image: 'https://images.unsplash.com/photo-1628062821815-592f6b86fb04?w=500&q=80', isNew: true },
  { id: 'p4', title: 'Lex Fridman Podcast', host: 'Lex Fridman', category: 'Technology', duration: '3h 15m', image: 'https://images.unsplash.com/photo-1550592704-6c76defa9985?w=500&q=80', isNew: false },
  { id: 'p5', title: 'Call Her Daddy', host: 'Alex Cooper', category: 'Comedy', duration: '1h 10m', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80', isNew: true },
  { id: 'p6', title: 'Waveform', host: 'MKBHD', category: 'Technology', duration: '55m', image: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&q=80', isNew: false },
  { id: 'p7', title: 'Stuff You Should Know', host: 'iHeartRadio', category: 'Education', duration: '48m', image: 'https://images.unsplash.com/photo-1546410531-ea4cea38d8ce?w=500&q=80', isNew: false },
  { id: 'p8', title: 'The Daily', host: 'The New York Times', category: 'News', duration: '25m', image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80', isNew: true },
];

const CATEGORIES = ['All', 'Comedy', 'Science', 'True Crime', 'Technology', 'Education', 'News'];

export default function Podcasts() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { user } = useAuthStore();

  const filteredPodcasts = activeCategory === 'All' 
    ? PODCASTS 
    : PODCASTS.filter(p => p.category === activeCategory);

  return (
    <div className="relative min-h-full pb-24 overflow-x-hidden p-8">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#F59E0B]/20 via-[#F59E0B]/5 to-transparent -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col gap-4 mt-8 mb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
        >
          Podcasts
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 text-sm text-text-secondary"
        >
          <Headphones size={16} className="text-[#F59E0B]" />
          <span>Discover the best audio shows and series</span>
        </motion.div>
      </div>

      {/* Categories Filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {CATEGORIES.map((category, index) => (
          <motion.button
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => setActiveCategory(category)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === category 
                ? 'bg-[#F59E0B] text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </div>

      {/* Podcasts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredPodcasts.map((podcast, index) => (
          <motion.div
            key={podcast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group cursor-pointer flex flex-col gap-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all shadow-lg"
          >
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md">
              <img 
                src={podcast.image} 
                alt={podcast.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* New Episode Badge */}
              {podcast.isNew && (
                <div className="absolute top-2 left-2 bg-[#F59E0B] text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg z-10">
                  New
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center text-black shadow-[0_0_20px_rgba(29,185,84,0.5)] transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  <Play size={24} fill="currentColor" className="ml-1" />
                </motion.button>
              </div>
            </div>

            <div className="flex flex-col gap-1 w-full">
              <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-[#F59E0B] transition-colors">{podcast.title}</h3>
              <p className="text-text-secondary text-sm line-clamp-1">{podcast.host}</p>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1 text-[#A1A1AA] text-xs font-medium">
                  <Clock size={12} />
                  <span>{podcast.duration}</span>
                </div>
                <button className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:text-[#F59E0B] transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
