import React from 'react';
import MusicCard from './MusicCard';
import type { Track } from '../../store/usePlayerStore';

const NEW_RELEASES: (Track & { desc?: string })[] = [
  { id: 'n1', title: 'UTOPIA', artist: 'Travis Scott', desc: 'New Album', albumArt: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52285?w=500&q=80', duration: '1:13:00', durationSeconds: 4380 },
  { id: 'n2', title: 'GUTS', artist: 'Olivia Rodrigo', desc: 'New Album', albumArt: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80', duration: '39:00', durationSeconds: 2340 },
  { id: 'n3', title: 'For All The Dogs', artist: 'Drake', desc: 'New Album', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', duration: '1:24:00', durationSeconds: 5040 },
  { id: 'n4', title: '1989 (Taylor\'s Version)', artist: 'Taylor Swift', desc: 'New Album', albumArt: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80', duration: '1:17:00', durationSeconds: 4620 },
];

export default function NewReleases() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">New Releases</h2>
          <span className="bg-accent-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">New</span>
        </div>
        <button className="text-xs font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors">Show all</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {NEW_RELEASES.map((album, i) => (
          <MusicCard key={album.id} item={album} index={i} />
        ))}
      </div>
    </section>
  );
}
