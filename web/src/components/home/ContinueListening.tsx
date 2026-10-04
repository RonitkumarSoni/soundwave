import React from 'react';
import MusicCard from './MusicCard';
import type { Track } from '../../store/usePlayerStore';

const ITEMS: (Track & { desc?: string })[] = [
  { id: 'c1', title: 'Starboy', artist: 'The Weeknd', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', duration: '3:50', durationSeconds: 230 },
  { id: 'c2', title: 'Levitating', artist: 'Dua Lipa', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', duration: '3:23', durationSeconds: 203 },
  { id: 'c3', title: 'As It Was', artist: 'Harry Styles', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', duration: '2:47', durationSeconds: 167 },
  { id: 'c4', title: 'Anti-Hero', artist: 'Taylor Swift', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', duration: '3:20', durationSeconds: 200 },
];

export default function ContinueListening() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Continue Listening</h2>
        <button className="text-xs font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors">Show all</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {ITEMS.map((item, i) => (
          <div key={item.id} className="snap-start">
            <MusicCard item={item} index={i} variant="horizontal" />
          </div>
        ))}
      </div>
    </section>
  );
}
