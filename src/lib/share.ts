import { Platform } from 'react-native';
import { SITE_URL } from './config';
import type { Track } from '@/stores/usePlayerStore';
export function trackShareUrl(track: Track) {
  const query = new URLSearchParams({ id: track.id, source: track.source || 'jamendo' });
  if (Platform.OS !== 'web') return 'soundwave://play?' + query.toString();
  const origin = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  return origin + '/?' + new URLSearchParams({ play: track.id, source: track.source || 'jamendo' }).toString();
}
