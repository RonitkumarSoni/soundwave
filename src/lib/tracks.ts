import type { Track } from '@/stores/usePlayerStore';
export const trackKey = (track: Pick<Track, 'id' | 'source'>) => (track.source || 'jamendo') + ':' + track.id;
export const sameTrack = (a: Track | null | undefined, b: Track | null | undefined) => !!a && !!b && trackKey(a) === trackKey(b);
export function audioUri(track: Track) {
  if (track.localUri) return track.localUri;
  const uri = track.audio || (track.source === 'spotify' ? '' : track.audiodownload) || '';
  return /^https?:\/\//.test(uri) ? uri : '';
}
export function normalizeTrack(raw: any): Track {
  return {
    id: String(raw.id), source: raw.source || 'jamendo', name: String(raw.name || raw.title || ''),
    artist_name: String(raw.artist_name || raw.artist || ''), album_name: String(raw.album_name || raw.album || ''),
    duration: Math.max(0, Number(raw.durationMs ? raw.durationMs / 1000 : raw.duration) || 0),
    image: String(raw.image || raw.coverUrl || ''), audio: String(raw.audio || ''), artist_id: raw.artist_id,
  };
}
