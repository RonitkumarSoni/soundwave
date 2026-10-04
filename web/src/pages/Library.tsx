import React from 'react';
import { motion } from 'framer-motion';
import { ListMusic, Heart, Folder } from 'lucide-react';

const LIB_ITEMS = [
  { id: 1, title: 'Liked Songs', type: 'Playlist', icon: <Heart size={32} className="text-white" />, color: 'bg-gradient-to-br from-accent-purple to-accent-blue' },
  { id: 2, title: 'Coding Focus', type: 'Playlist', icon: <ListMusic size={32} className="text-white" />, color: 'bg-surface' },
  { id: 3, title: 'Local Files', type: 'Folder', icon: <Folder size={32} className="text-white" />, color: 'bg-surface' },
];

export default function Library() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-6 mb-8 border-b border-border pb-4">
        <button className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold">Playlists</button>
        <button className="px-4 py-2 text-text-secondary hover:text-white rounded-full text-sm font-semibold transition-colors">Podcasts</button>
        <button className="px-4 py-2 text-text-secondary hover:text-white rounded-full text-sm font-semibold transition-colors">Albums</button>
        <button className="px-4 py-2 text-text-secondary hover:text-white rounded-full text-sm font-semibold transition-colors">Artists</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {LIB_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -5 }}
            className="group cursor-pointer"
          >
            <div className={`aspect-square w-full rounded-2xl mb-4 flex items-center justify-center shadow-lg ${item.color} ${item.color === 'bg-surface' ? 'border border-border' : ''}`}>
              {item.icon}
            </div>
            <h3 className="text-white font-bold text-base mb-1">{item.title}</h3>
            <p className="text-text-secondary text-xs">{item.type}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
