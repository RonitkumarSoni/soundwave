import React from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, Download, Share2 } from 'lucide-react';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';

const RELEASES: (Track & { releaseDate: string, genre: string })[] = [
  { id: 'nr1', title: 'UTOPIA', artist: 'Travis Scott', releaseDate: 'July 28, 2023', genre: 'Hip-Hop', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', duration: '1:13:00', durationSeconds: 4380 },
  { id: 'nr2', title: 'GUTS', artist: 'Olivia Rodrigo', releaseDate: 'Sept 8, 2023', genre: 'Pop Rock', albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', duration: '39:00', durationSeconds: 2340 },
  { id: 'nr3', title: 'For All The Dogs', artist: 'Drake', releaseDate: 'Oct 6, 2023', genre: 'Rap', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', duration: '1:24:00', durationSeconds: 5040 },
  { id: 'nr4', title: '1989 (Taylor\'s Version)', artist: 'Taylor Swift', releaseDate: 'Oct 27, 2023', genre: 'Pop', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', duration: '1:17:00', durationSeconds: 4620 },
];

export default function NewReleases() {
  const playTrack = usePlayerStore(s => s.playTrack);

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">New Releases</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {RELEASES.map((album, i) => (
          <motion.div
            key={album.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ y: -8 }}
            className="bg-surface/40 backdrop-blur-md rounded-3xl p-5 border border-white/5 hover:border-white/20 transition-all duration-300 group cursor-pointer shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex gap-5 mb-5 relative z-10">
              <div className="w-28 h-28 rounded-xl overflow-hidden shadow-lg flex-shrink-0 relative">
                <img src={album.albumArt} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-2 left-2 bg-accent-blue text-white text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-md">
                  NEW
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => playTrack(album)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                    <Play fill="currentColor" size={16} className="ml-1" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="text-white font-black text-lg mb-1 truncate group-hover:text-accent-blue transition-colors">{album.title}</h3>
                <span className="text-white/80 font-medium text-sm truncate mb-2">{album.artist}</span>
                <span className="text-text-secondary text-[10px] uppercase tracking-widest font-bold mb-1">{album.genre}</span>
                <span className="text-white/40 text-xs">{album.releaseDate}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-white/10 pt-4 relative z-10">
              <button className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
                <Heart size={18} />
              </button>
              <div className="flex gap-2">
                <button className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
                  <Download size={18} />
                </button>
                <button className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
