import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Mic, Play, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDebounce } from '../hooks/useDebounce';
import { usePlayerStore } from '../store/usePlayerStore';
import { searchRateLimiter } from '../utils/rateLimiter';

const GENRES = [
  { name: 'Pop', color: 'bg-pink-500' },
  { name: 'Hip-Hop', color: 'bg-purple-500' },
  { name: 'Rock', color: 'bg-red-500' },
  { name: 'Electronic', color: 'bg-blue-500' },
  { name: 'R&B', color: 'bg-yellow-500' },
  { name: 'Classical', color: 'bg-amber-700' },
  { name: 'Jazz', color: 'bg-orange-500' },
  { name: 'Indie', color: 'bg-teal-500' },
];

interface SearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl: string;
  trackTimeMillis: number;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, 500);
  const { currentTrack, isPlaying, playTrack, setQueue, togglePlay } = usePlayerStore();

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
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(debouncedQuery)}&entity=song&limit=20`);
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
  };

  const formatDuration = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-32">
      {/* Mobile Search Bar */}
      <div className="md:hidden relative mb-8 group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-white transition-colors" size={20} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?" 
          className="w-full h-14 bg-surface rounded-full pl-12 pr-12 text-sm text-white placeholder:text-text-secondary border border-border focus:outline-none focus:border-accent-blue/50 transition-colors"
        />
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white">
          <Mic size={20} />
        </button>
      </div>

      {/* Desktop Search Bar (Optional depending on TopNav usage, but good to have dedicated) */}
      <div className="hidden md:block relative mb-12 group max-w-2xl mx-auto">
        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-white transition-colors" size={24} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for songs, artists, or podcasts..." 
          className="w-full h-16 bg-[#121212] rounded-full pl-16 pr-12 text-lg text-white placeholder:text-text-secondary border border-white/5 focus:outline-none focus:border-white/20 transition-all focus:bg-[#1A1A1A] shadow-xl"
        />
      </div>

      {debouncedQuery.trim() === '' ? (
        <>
          <h2 className="text-2xl font-bold text-white mb-6">Browse all genres</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {GENRES.map((genre, i) => (
              <motion.div
                key={genre.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setQuery(genre.name)}
                className={`${genre.color} aspect-video rounded-2xl p-4 relative overflow-hidden cursor-pointer shadow-lg`}
              >
                <h3 className="text-white font-bold text-xl relative z-10">{genre.name}</h3>
                {/* Decorative rotated square */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black/20 rotate-[25deg] rounded-lg shadow-xl" />
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Results for "{debouncedQuery}"
          </h2>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 text-accent-blue">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="text-text-secondary">Searching iTunes...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400">
              {error}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {results.map((track, i) => {
                const isActive = currentTrack?.id === track.trackId.toString();
                const isActuallyPlaying = isActive && isPlaying;
                
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={track.trackId}
                    onClick={() => handlePlayTrack(track)}
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer group transition-all border ${isActive ? 'bg-white/10 border-accent-blue/30 shadow-[0_0_15px_rgba(0,168,225,0.1)]' : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/10'}`}
                  >
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-black/20 shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                      <img src={track.artworkUrl100.replace('100x100bb', '200x200bb')} alt={track.trackName} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isActuallyPlaying ? (
                          <div className="flex gap-1 items-end h-4">
                            <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-accent-blue rounded-full" />
                            <motion.div animate={{ height: [8, 12, 8] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-accent-blue rounded-full" />
                            <motion.div animate={{ height: [4, 16, 4] }} transition={{ repeat: Infinity, duration: 1.0 }} className="w-1 bg-accent-blue rounded-full" />
                          </div>
                        ) : (
                          <Play size={24} className={`${isActive ? 'text-accent-blue fill-accent-blue' : 'text-white fill-white'} ml-1`} />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`font-bold text-base truncate transition-colors ${isActive ? 'text-accent-blue' : 'text-white group-hover:text-accent-blue'}`}>
                        {track.trackName}
                      </span>
                      <span className={`text-sm truncate mt-1 ${isActive ? 'text-white/80' : 'text-text-secondary'}`}>
                        {track.artistName}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-medium uppercase tracking-wider px-2 py-1 rounded ${isActive ? 'bg-accent-blue/20 text-accent-blue' : 'bg-white/5 text-white/50'}`}>
                        Preview
                      </span>
                      <span className="text-text-secondary text-sm">
                        {formatDuration(track.trackTimeMillis)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 text-text-secondary">
              <SearchIcon size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl text-white mb-2">No results found</p>
              <p>Try adjusting your search query.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
