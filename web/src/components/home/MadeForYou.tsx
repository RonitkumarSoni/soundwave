import React from 'react';
import MusicCard from './MusicCard';
import type { Track } from '../../store/usePlayerStore';

const MIXES: (Track & { desc?: string })[] = [
  { id: 'm1', title: 'Daily Mix 1', artist: 'Various Artists', desc: 'Chill Vibes, Lo-Fi, Study', albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', duration: '3:45', durationSeconds: 225 },
  { id: 'm2', title: 'Discover Weekly', artist: 'New Artists', desc: 'New music based on your taste', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', duration: '4:12', durationSeconds: 252 },
  { id: 'm3', title: 'Release Radar', artist: 'Top Global', desc: 'Catch up on the latest releases', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', duration: '2:55', durationSeconds: 175 },
  { id: 'm4', title: 'Your Top Songs', artist: 'You', desc: 'The songs you loved most', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', duration: '5:10', durationSeconds: 310 },
  { id: 'm5', title: 'Chill Tracks', artist: 'Ambient', desc: 'Softer kinda dance', albumArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80', duration: '3:30', durationSeconds: 210 },
];

export default function MadeForYou() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Made For You</h2>
        <button className="text-xs font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors">Show all</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {MIXES.map((mix, i) => (
          <MusicCard key={mix.id} item={mix} index={i} />
        ))}
      </div>
    </section>
  );
}
