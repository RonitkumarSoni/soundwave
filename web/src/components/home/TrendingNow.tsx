import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';

const TRENDING: (Track & { plays: string })[] = [
  { id: 't1', title: 'Paint The Town Red', artist: 'Doja Cat', plays: '12M', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100&q=80', duration: '3:51', durationSeconds: 231, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 't2', title: 'Vampire', artist: 'Olivia Rodrigo', plays: '10M', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=100&q=80', duration: '3:40', durationSeconds: 220, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 't3', title: 'Cruel Summer', artist: 'Taylor Swift', plays: '9.8M', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&q=80', duration: '2:58', durationSeconds: 178, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 't4', title: 'I Remember Everything', artist: 'Zach Bryan', plays: '8.5M', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=100&q=80', duration: '3:47', durationSeconds: 227, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 't5', title: 'Fukumean', artist: 'Gunna', plays: '7.2M', albumArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=100&q=80', duration: '2:05', durationSeconds: 125, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

export default function TrendingNow() {
  const playTrack = usePlayerStore(s => s.playTrack);
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const isPlaying = usePlayerStore(s => s.isPlaying);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Trending Now</h2>
      </div>
      <div className="bg-surface/30 rounded-2xl border border-border overflow-hidden">
        {TRENDING.map((track, i) => {
          const isActive = currentTrack?.id === track.id;
          return (
            <motion.div 
              key={track.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group cursor-pointer border-b border-border/50 last:border-0 ${isActive ? 'bg-white/5' : ''}`}
              onClick={() => playTrack(track)}
            >
              <div className="w-8 text-center text-text-secondary font-bold group-hover:hidden">
                {isActive && isPlaying ? (
                  <div className="flex items-end justify-center gap-0.5 h-4">
                    <motion.div animate={{ height: ['40%', '100%', '40%'] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-accent-green rounded-full" />
                    <motion.div animate={{ height: ['80%', '30%', '80%'] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-accent-green rounded-full" />
                    <motion.div animate={{ height: ['50%', '90%', '50%'] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-accent-green rounded-full" />
                  </div>
                ) : (
                  i + 1
                )}
              </div>
              <div className="w-8 text-center text-white hidden group-hover:block">
                <Play fill="currentColor" size={16} />
              </div>
              
              <img src={track.albumArt} alt={track.title} className="w-12 h-12 rounded-md object-cover shadow-md" />
              
              <div className="flex-1 flex flex-col min-w-0">
                <span className={`font-bold text-sm truncate transition-colors ${isActive ? 'text-accent-green' : 'text-white group-hover:text-accent-green'}`}>
                  {track.title}
                </span>
                <span className="text-text-secondary text-xs truncate">{track.artist}</span>
              </div>
              
              <div className="hidden md:block w-32 text-right text-text-secondary text-sm">
                {track.plays} plays
              </div>
              
              <div className="w-16 text-right text-text-secondary text-sm">
                {track.duration}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
