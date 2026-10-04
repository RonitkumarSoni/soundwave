import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, Music, Clock, Settings2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

// Mock data
const RECENTLY_PLAYED = [
  { id: 'r1', title: 'Blinding Lights', artist: 'The Weeknd', time: '2 hours ago', image: 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?w=100&q=80' },
  { id: 'r2', title: 'Cruel Summer', artist: 'Taylor Swift', time: '5 hours ago', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&q=80' },
  { id: 'r3', title: 'One Dance', artist: 'Drake', time: 'Yesterday', image: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=100&q=80' },
];

export default function Profile() {
  const { user } = useAuthStore();

  return (
    <div className="relative min-h-full pb-24 overflow-x-hidden p-8">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#F59E0B]/30 via-[#F59E0B]/5 to-transparent -z-10 pointer-events-none" />

      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mt-8 mb-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-48 h-48 rounded-full overflow-hidden border-4 border-[#121212] shadow-[0_0_40px_rgba(245,158,11,0.3)] bg-surface"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F59E0B] to-[#EF4444]">
              <User size={64} className="text-white" />
            </div>
          )}
        </motion.div>
        
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-sm font-bold text-white/80 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">Pro Member</span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight"
          >
            {user?.displayName || 'User'}
          </motion.h1>
          <div className="flex items-center gap-6 mt-2 text-sm text-text-secondary">
            <div className="flex items-center gap-1.5"><Users size={16} /> <span className="text-white font-medium">124</span> Followers</div>
            <div className="flex items-center gap-1.5"><Users size={16} /> <span className="text-white font-medium">38</span> Following</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Top Artists */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Top Artists this Month</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 p-4 rounded-xl flex flex-col items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden">
                    <img src={`https://images.unsplash.com/photo-1549834125-82d3c48159a3?w=200&q=80&sig=${i}`} alt="Artist" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium text-sm">Artist Name</p>
                    <p className="text-text-secondary text-xs">Top 1% Fan</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Public Playlists */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">Public Playlists</h2>
            <div className="flex items-center justify-center py-12 bg-white/5 rounded-xl border border-white/5 border-dashed">
              <div className="text-center flex flex-col items-center">
                <Music size={40} className="text-text-secondary mb-3 opacity-50" />
                <p className="text-white font-medium">No public playlists yet</p>
                <p className="text-sm text-text-secondary mt-1">Create a playlist and set it to public.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          
          <div className="flex flex-col gap-2">
            {RECENTLY_PLAYED.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover" />
                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className="text-white font-medium text-sm truncate group-hover:text-[#F59E0B] transition-colors">{item.title}</span>
                  <span className="text-text-secondary text-xs truncate">{item.artist}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-text-secondary whitespace-nowrap">
                  <Clock size={10} />
                  {item.time}
                </div>
              </motion.div>
            ))}
          </div>
          
          <button className="mt-2 w-full py-3 rounded-full border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
}
