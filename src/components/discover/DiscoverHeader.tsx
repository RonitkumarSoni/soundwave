import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Crown, Moon, Sun } from 'lucide-react';

export default function DiscoverHeader() {
  const [isDark, setIsDark] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4"
    >
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
          Discover New Music
        </h1>
        <p className="text-text-secondary text-base md:text-lg">
          Explore trending songs, artists, albums, playlists, podcasts, and personalized recommendations.
        </p>
      </div>

      {/* Actions removed as they are now handled by global TopNav */}
    </motion.div>
  );
}
