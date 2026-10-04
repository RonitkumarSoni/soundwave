// Web never imports the native filesystem.
import type { Track } from '@/stores/usePlayerStore';
export async function downloadTrack(_track: Track, _progress: (value: number) => void): Promise<Track> {
  throw new Error('Offline downloads are available in the Android/iOS app.');
}
export const cancelDownloads = () => {};
export const deleteDownload = async (_track: Track) => {};
export const verifyDownloads = async (_tracks: Track[]): Promise<Track[]> => [];
