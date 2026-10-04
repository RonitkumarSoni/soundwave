import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, HardDrive, Play, Trash2, CheckCircle2 } from 'lucide-react';

// Mock data for Downloads
const DOWNLOADED_ITEMS = [
  { id: 'd1', title: 'Starboy', artist: 'The Weeknd', type: 'Song', size: '8.4 MB', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80' },
  { id: 'd2', title: 'The Joe Rogan Experience #1933', artist: 'Joe Rogan', type: 'Podcast', size: '145 MB', image: 'https://images.unsplash.com/photo-1559523161-0fc0d8b38a7a?w=500&q=80' },
  { id: 'd3', title: 'Midnights', artist: 'Taylor Swift', type: 'Album', size: '94 MB', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80' },
  { id: 'd4', title: 'Levitating', artist: 'Dua Lipa', type: 'Song', size: '6.2 MB', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80' },
  { id: 'd5', title: 'Huberman Lab: Sleep Toolkit', artist: 'Andrew Huberman', type: 'Podcast', size: '112 MB', image: 'https://images.unsplash.com/photo-1516280440502-85885ff42903?w=500&q=80' },
];

export default function Downloads() {
  const [filter, setFilter] = useState('All');

  const filteredItems = filter === 'All' 
    ? DOWNLOADED_ITEMS 
    : DOWNLOADED_ITEMS.filter(item => item.type === filter);

  return (
    <div className="relative min-h-full pb-24 overflow-x-hidden p-8">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#1DB954]/20 via-[#1DB954]/5 to-transparent -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-8 mb-10">
        <div className="flex flex-col gap-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
          >
            Downloads
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            <CheckCircle2 size={16} className="text-[#1DB954]" />
            <span>Available offline for your listening</span>
          </motion.div>
        </div>

        {/* Storage Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4 w-full md:w-72 flex flex-col gap-3 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white font-medium">
              <HardDrive size={16} className="text-[#1DB954]" />
              <span>Storage</span>
            </div>
            <span className="text-text-secondary">4.2 GB free</span>
          </div>
          <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#1DB954] to-[#00A8E1] w-[85%] rounded-full relative">
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-text-secondary">
            <span>28.4 GB used</span>
            <span>32.6 GB total</span>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8">
        {['All', 'Song', 'Podcast', 'Album'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === type 
                ? 'bg-[#1DB954] text-black shadow-[0_0_15px_rgba(29,185,84,0.4)]' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            {type}s
          </button>
        ))}
      </div>

      {/* Downloads List */}
      <div className="flex flex-col gap-2">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-surface flex-shrink-0 shadow-md">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={20} className="text-white fill-white" />
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <h3 className="text-white font-medium text-base group-hover:text-[#1DB954] transition-colors line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-2 text-sm text-text-secondary mt-0.5">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-white/80">{item.type}</span>
                  <span>{item.artist}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-sm text-text-secondary hidden sm:block">{item.size}</span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1DB954]/10 flex items-center justify-center text-[#1DB954]" title="Downloaded">
                  <Download size={16} />
                </div>
                <button className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100" title="Remove download">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <Download size={48} className="mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No {filter.toLowerCase()}s found</h3>
            <p>You haven't downloaded any {filter.toLowerCase()}s yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
