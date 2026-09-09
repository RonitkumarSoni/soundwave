import React from 'react';
import MusicCard from './MusicCard';
import type { Track } from '../../store/usePlayerStore';

const RECOMMENDED: (Track & { desc?: string })[] = [
  { id: 're1', title: 'Cyberpunk City', artist: 'Neon Waves', desc: 'Because you listened to Midnight City', albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', duration: '4:15', durationSeconds: 255 },
  { id: 're2', title: 'Lofi Study', artist: 'Chillhop', desc: 'Because you listened to Deep Focus', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', duration: '2:30', durationSeconds: 150 },
  { id: 're3', title: 'Indie Pop Hits', artist: 'Various', desc: 'Because you like Harry Styles', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', duration: '3:20', durationSeconds: 200 },
];

export default function RecommendedForYou() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Recommended For You</h2>
          <p className="text-text-secondary text-sm">Powered by AI based on your recent activity</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {RECOMMENDED.map((track, i) => (
          <div key={track.id} className="relative">
            <MusicCard item={track} index={i} variant="horizontal" />
            <div className="absolute -top-3 left-4 bg-accent-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-10 shadow-lg">
              AI Pick
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
