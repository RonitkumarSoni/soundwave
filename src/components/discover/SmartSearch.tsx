import React, { useEffect, useRef, useState } from 'react';
import { Search, Mic, X, Sparkles, TrendingUp, History, Play, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';
import { usePlayerStore } from '../../store/usePlayerStore';
import { searchRateLimiter } from '../../utils/rateLimiter';

interface SearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackTimeMillis: number;
}

export default function SmartSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, 500);
  const { play, setQueue } = usePlayerStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      if (!searchRateLimiter.checkLimit()) {
        setError("Rate limit exceeded. Please wait a moment before searching again.");
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(debouncedQuery)}&entity=song&limit=6`);
        const data = await response.json();
        
        // Filter out results without playable previews
        const playableResults = data.results.filter((track: any) => track.previewUrl);
        setResults(playableResults);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to fetch results. Please try again.");
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handlePlayTrack = (track: SearchResult) => {
    // If clicking the currently playing track, toggle play/pause
    if (currentTrack?.id === track.trackId.toString()) {
      togglePlay();
      return;
    }

    // Convert iTunes result to our Track format
    const playableTrack = {
      id: track.trackId.toString(),
      title: track.trackName,
      artist: track.artistName,
      albumArt: track.artworkUrl100.replace('100x100bb', '600x600bb'),
      duration: formatDuration(track.trackTimeMillis),
      durationSeconds: track.trackTimeMillis / 1000,
      audioUrl: track.previewUrl
    };

    // Replace queue with just this track to play immediately
    setQueue([playableTrack]);
    playTrack(playableTrack);
    
    // Close search dropdown
    inputRef.current?.blur();
    setQuery('');
  };

  const formatDuration = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative mb-12 w-full max-w-4xl z-40"
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-accent-blue via-accent-purple to-pink-500 rounded-full blur-xl transition-opacity duration-500 ${isFocused ? 'opacity-40' : 'opacity-10'}`} />
      
      <div className={`relative flex items-center bg-surface/90 backdrop-blur-2xl border transition-all duration-300 rounded-full h-16 shadow-2xl ${isFocused ? 'border-accent-purple/50' : 'border-border'}`}>
        <Search className={`absolute left-6 transition-colors ${isFocused ? 'text-white' : 'text-text-secondary'}`} size={24} />
        
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search for songs, artists, or podcasts... (Ctrl + K)" 
          className="w-full h-full bg-transparent pl-16 pr-32 text-white text-lg placeholder:text-text-secondary focus:outline-none rounded-full"
        />
        
        <div className="absolute right-4 flex items-center gap-2">
          {query && (
            <button onClick={() => setQuery('')} className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          )}
          <div className="w-px h-6 bg-border mx-1" />
          <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-colors bg-surface-light border border-white/5">
            <Mic size={20} className={isFocused ? "text-accent-blue" : ""} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isFocused && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="absolute top-20 left-0 right-0 bg-surface border border-border rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar"
          >
            {debouncedQuery.trim() === '' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Suggestions */}
                <div>
                  <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-accent-purple" /> Discover
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {['The Weeknd', 'Taylor Swift', 'Daft Punk', 'Lofi Hip Hop'].map(s => (
                      <li 
                        key={s} 
                        onClick={() => setQuery(s)}
                        className="px-3 py-2 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white cursor-pointer transition-colors text-sm flex items-center justify-between group"
                      >
                        {s}
                        <Search size={14} className="opacity-0 group-hover:opacity-100 text-accent-blue transition-opacity" />
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Trending & Recent */}
                <div>
                  <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-accent-orange" /> Trending Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {['Drake', 'UTOPIA', 'Sabrina Carpenter', 'Post Malone'].map(s => (
                      <span 
                        key={s} 
                        onClick={() => setQuery(s)}
                        className="px-3 py-1.5 bg-surface-light border border-border rounded-full text-xs text-text-secondary hover:text-white hover:border-white/20 cursor-pointer transition-colors"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
                  <Search size={16} className="text-accent-blue" /> Results for "{debouncedQuery}"
                </h3>
                
                {isSearching ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="text-accent-blue animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-400 text-sm">
                    {error}
                  </div>
                ) : results.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {results.map((track) => {
                      const isActive = currentTrack?.id === track.trackId.toString();
                      const isActuallyPlaying = isActive && isPlaying;
                      
                      return (
                        <div 
                          key={track.trackId}
                          onClick={() => handlePlayTrack(track)}
                          className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer group transition-all border ${isActive ? 'bg-white/10 border-accent-blue/30 shadow-[0_0_15px_rgba(0,168,225,0.1)]' : 'hover:bg-white/5 border-transparent hover:border-white/10'}`}
                        >
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-black/20 shadow-sm">
                            <img src={track.artworkUrl100} alt={track.trackName} className="w-full h-full object-cover" />
                            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              {isActuallyPlaying ? (
                                <div className="flex gap-0.5 items-end h-3">
                                  <motion.div animate={{ height: [3, 10, 3] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[3px] bg-accent-blue rounded-full" />
                                  <motion.div animate={{ height: [6, 8, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-[3px] bg-accent-blue rounded-full" />
                                  <motion.div animate={{ height: [3, 10, 3] }} transition={{ repeat: Infinity, duration: 1.0 }} className="w-[3px] bg-accent-blue rounded-full" />
                                </div>
                              ) : (
                                <Play size={16} className={`${isActive ? 'text-accent-blue fill-accent-blue' : 'text-white fill-white'}`} />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className={`font-medium text-sm truncate transition-colors ${isActive ? 'text-accent-blue' : 'text-white group-hover:text-accent-blue'}`}>
                              {track.trackName}
                            </span>
                            <span className={`text-xs truncate ${isActive ? 'text-white/80' : 'text-text-secondary'}`}>
                              {track.artistName} • {track.collectionName}
                            </span>
                          </div>
                          <div className="text-text-secondary text-xs hidden sm:block">
                            {formatDuration(track.trackTimeMillis)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-secondary text-sm">
                    No playable results found for "{debouncedQuery}"
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
