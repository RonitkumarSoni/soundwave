import React, { useEffect, useRef } from 'react';
import { Search, Mic, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative mb-10 group w-full max-w-3xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent-purple to-accent-blue rounded-full blur-md opacity-20 group-focus-within:opacity-50 transition-opacity duration-500" />
      <div className="relative flex items-center bg-surface/80 backdrop-blur-xl border border-border group-focus-within:border-accent-blue/50 rounded-full h-16 shadow-2xl transition-colors">
        <Search className="absolute left-6 text-text-secondary group-focus-within:text-white transition-colors" size={24} />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search for songs, artists, or podcasts... (Ctrl + K)" 
          className="w-full h-full bg-transparent pl-16 pr-24 text-white text-lg placeholder:text-text-secondary focus:outline-none rounded-full"
        />
        <div className="absolute right-4 flex items-center gap-2">
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
          <div className="w-px h-6 bg-border" />
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors">
            <Mic size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
