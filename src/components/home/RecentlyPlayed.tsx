import React from 'react';
import MusicCard from './MusicCard';
import type { Track } from '../../store/usePlayerStore';

const RECENT: (Track & { desc?: string })[] = [
  { id: 'r1', title: 'Late Night Drive', artist: 'Synthwave', desc: 'Played 2 hrs ago', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80', duration: '3:45', durationSeconds: 225 },
  { id: 'r2', title: 'Workout Mix', artist: 'High Energy', desc: 'Played yesterday', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', duration: '4:12', durationSeconds: 252 },
  { id: 'r3', title: 'Focus Flow', artist: 'Productivity', desc: 'Played Tuesday', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', duration: '2:55', durationSeconds: 175 },
  { id: 'r4', title: 'Weekend Vibes', artist: 'Party', desc: 'Played Saturday', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', duration: '5:10', durationSeconds: 310 },
  { id: 'r5', title: 'Morning Coffee', artist: 'Acoustic', desc: 'Played Monday', albumArt: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80', duration: '3:30', durationSeconds: 210 },
];

export default function RecentlyPlayed() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Recently Played</h2>
        <button className="text-xs font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors">Show all</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {RECENT.map((mix, i) => (
          <MusicCard key={mix.id} item={mix} index={i} />
        ))}
      </div>
    </section>
  );
}
