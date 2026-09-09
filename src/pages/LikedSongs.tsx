import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, Clock, MoreHorizontal, Pause } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useAuthStore } from '../store/useAuthStore';

// Mock data for liked songs
const LIKED_TRACKS = [
  { id: 'l1', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', dateAdded: '2 days ago', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&q=80', duration: '3:50', durationSeconds: 230, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'l2', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', dateAdded: '5 days ago', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=100&q=80', duration: '3:23', durationSeconds: 203, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'l3', title: 'As It Was', artist: 'Harry Styles', album: 'Harry\'s House', dateAdded: '1 week ago', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80', duration: '2:47', durationSeconds: 167, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'l4', title: 'Anti-Hero', artist: 'Taylor Swift', album: 'Midnights', dateAdded: '2 weeks ago', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&q=80', duration: '3:20', durationSeconds: 200, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'l5', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', dateAdded: '1 month ago', albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80', duration: '4:03', durationSeconds: 243, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

export default function LikedSongs() {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { user } = useAuthStore();

  const handlePlayAll = () => {
    if (LIKED_TRACKS.length > 0) {
      if (currentTrack?.id === LIKED_TRACKS[0].id) {
        togglePlay();
      } else {
        playTrack(LIKED_TRACKS[0]);
      }
    }
  };

  const isCurrentPlaylistPlaying = currentTrack && LIKED_TRACKS.some(t => t.id === currentTrack.id) && isPlaying;

  return (
    <div className="relative min-h-full pb-24 overflow-x-hidden">
      {/* Dynamic Header Gradient Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#4F46E5]/40 via-[#4F46E5]/10 to-transparent -z-10 pointer-events-none" />

      <div className="px-8 pt-20 pb-8 flex items-end gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#00A8E1] flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex-shrink-0"
        >
          <Heart size={80} className="text-white fill-white" />
        </motion.div>
        
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-white/80 uppercase tracking-widest">Playlist</span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-2"
          >
            Liked Songs
          </motion.h1>
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            {user && user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center">
                <span className="text-[10px] text-white">SW</span>
              </div>
            )}
            <span className="text-white font-medium hover:underline cursor-pointer">{user?.displayName || "User"}</span>
            <span>•</span>
            <span>{LIKED_TRACKS.length} songs</span>
          </div>
        </div>
      </div>

      <div className="px-8 mt-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-6 mb-8">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-accent-green flex items-center justify-center text-black shadow-[0_0_20px_rgba(29,185,84,0.4)] hover:bg-[#1ed760] transition-colors"
          >
            {isCurrentPlaylistPlaying ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" className="ml-1" />
            )}
          </motion.button>
        </div>

        {/* Tracks Header */}
        <div className="grid grid-cols-[16px_minmax(200px,1fr)_minmax(150px,200px)_minmax(150px,200px)_100px] gap-4 px-4 py-2 text-xs font-semibold text-text-secondary border-b border-border/50 uppercase tracking-widest mb-4">
          <div className="text-center">#</div>
          <div>Title</div>
          <div className="hidden md:block">Album</div>
          <div className="hidden lg:block">Date Added</div>
          <div className="flex justify-end"><Clock size={16} /></div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-1">
          {LIKED_TRACKS.map((track, index) => {
            const isPlayingThisTrack = currentTrack?.id === track.id;
            
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={track.id}
                onDoubleClick={() => playTrack(track)}
                className="grid grid-cols-[16px_minmax(200px,1fr)_minmax(150px,200px)_minmax(150px,200px)_100px] gap-4 px-4 py-3 rounded-lg hover:bg-white/5 group items-center transition-colors cursor-pointer"
              >
                <div className="text-text-secondary text-sm text-center relative w-4 h-4 flex items-center justify-center">
                  {isPlayingThisTrack && isPlaying ? (
                    <img src="https://open.spotifycdn.com/cdn/images/equaliser-animated-green.f5eb96f2.gif" alt="playing" className="w-3 h-3" />
                  ) : (
                    <span className="group-hover:hidden">{index + 1}</span>
                  )}
                  <button 
                    onClick={() => isPlayingThisTrack ? togglePlay() : playTrack(track)}
                    className={`hidden group-hover:flex absolute inset-0 items-center justify-center ${isPlayingThisTrack ? 'text-accent-green' : 'text-white'}`}
                  >
                    {isPlayingThisTrack && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                </div>
                
                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={track.albumArt} alt={track.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                  <div className="flex flex-col overflow-hidden">
                    <span className={`truncate text-sm font-medium ${isPlayingThisTrack ? 'text-accent-green' : 'text-white'}`}>
                      {track.title}
                    </span>
                    <span className="truncate text-xs text-text-secondary group-hover:text-white transition-colors">
                      {track.artist}
                    </span>
                  </div>
                </div>

                <div className="hidden md:block truncate text-sm text-text-secondary group-hover:text-white transition-colors">
                  {track.album}
                </div>

                <div className="hidden lg:block truncate text-sm text-text-secondary">
                  {track.dateAdded}
                </div>

                <div className="flex items-center justify-end gap-4 text-sm text-text-secondary">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-accent-green hover:scale-110">
                    <Heart size={16} fill="currentColor" />
                  </button>
                  <span>{track.duration}</span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
