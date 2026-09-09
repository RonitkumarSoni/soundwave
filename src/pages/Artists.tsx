import React from 'react';
import { motion } from 'framer-motion';
import { Play, MoreHorizontal, UserCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Mock data for followed artists
const FOLLOWED_ARTISTS = [
  { id: 'a1', name: 'The Weeknd', followers: '108M', image: 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?w=500&q=80', isLive: false },
  { id: 'a2', name: 'Taylor Swift', followers: '101M', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', isLive: true },
  { id: 'a3', name: 'Drake', followers: '84M', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', isLive: false },
  { id: 'a4', name: 'Olivia Rodrigo', followers: '32M', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', isLive: false },
  { id: 'a5', name: 'M83', followers: '8M', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', isLive: false },
  { id: 'a6', name: 'Dua Lipa', followers: '45M', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', isLive: false },
  { id: 'a7', name: 'Doja Cat', followers: '28M', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80', isLive: true },
  { id: 'a8', name: 'Zach Bryan', followers: '12M', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80', isLive: false },
];

export default function Artists() {
  const { user } = useAuthStore();

  return (
    <div className="relative min-h-full pb-24 overflow-x-hidden p-8">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#00A8E1]/20 via-[#00A8E1]/5 to-transparent -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col gap-4 mt-8 mb-12">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
        >
          Following
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 text-sm text-text-secondary"
        >
          <UserCheck size={16} className="text-[#00A8E1]" />
          <span>You are following {FOLLOWED_ARTISTS.length} artists</span>
        </motion.div>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {FOLLOWED_ARTISTS.map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="relative w-full aspect-square rounded-full overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-surface">
              <img 
                src={artist.image} 
                alt={artist.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Live Badge */}
              {artist.isLive && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg z-10 border border-black border-opacity-50">
                  Live
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

            <div className="text-center w-full px-2">
              <h3 className="text-white font-bold text-base truncate group-hover:text-[#00A8E1] transition-colors">{artist.name}</h3>
              <p className="text-text-secondary text-xs mt-1 truncate">Artist • {artist.followers} followers</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
