import type { Track } from '@/stores/usePlayerStore';
import axios from 'axios';

const rapidCache = new Map<string, { until: number; link: string }>();

const RAPID_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '3d1e03cde9mshed1d6dbdc9d8136p1fb009jsn64712300c043';
const RAPID_HOST = process.env.EXPO_PUBLIC_RAPIDAPI_HOST || 'youtube-mp36.p.rapidapi.com';

/**
 * Option 3: Client-Side Direct Audio Stream Resolver
 * Directly resolves high-speed 320kbps MP3 stream on the user device,
 * completely bypassing cloud backend data-center blocks and eliminating 503 errors!
 */
export async function resolvePlayableUri(track: Track, requestedUri: string, signal: AbortSignal): Promise<string> {
  // 1. Direct Saavn CDN or local storage audio streams play directly
  if (track.source !== 'youtube') {
    return requestedUri;
  }

  const cached = rapidCache.get(track.id);
  if (cached && cached.until > Date.now()) {
    return cached.link;
  }

  // 2. Resolve YouTube stream directly from client (residential/mobile IP)
  try {
    const res = await axios.get(`https://${RAPID_HOST}/dl?id=${encodeURIComponent(track.id)}`, {
      headers: {
        'x-rapidapi-key': RAPID_KEY,
        'x-rapidapi-host': RAPID_HOST,
      },
      timeout: 12000,
      signal,
    });

    if (res.data?.link) {
      const link = res.data.link;
      rapidCache.set(track.id, { until: Date.now() + 3600000, link });
      return link;
    }
  } catch (error: any) {
    console.warn('Client-side stream resolution fallback to backend stream:', error?.message);
  }

  // Fallback to backend stream if client request fails
  return requestedUri;
}
