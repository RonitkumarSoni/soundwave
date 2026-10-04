import * as FileSystem from 'expo-file-system/legacy';
import type { Track } from '@/stores/usePlayerStore';

// A temporary cache avoids device-specific handling of Apple's audio/x-m4p
// responses. These are public preview clips, never permanent downloads.
export async function previewFile(track: Track): Promise<string> {
  if (track.source !== 'itunes' || track.localUri) return track.localUri || track.audio;
  const url = new URL(track.audio);
  if (url.protocol !== 'https:' || url.hostname !== 'audio-ssl.itunes.apple.com') throw new Error('Invalid preview source');
  if (!FileSystem.cacheDirectory) throw new Error('Preview cache unavailable');
  const root = FileSystem.cacheDirectory + 'audio-previews/';
  await FileSystem.makeDirectoryAsync(root, { intermediates: true });
  const filename = encodeURIComponent(track.id) + '.m4a';
  const file = root + filename;
  const existing = await FileSystem.getInfoAsync(file);
  if (existing.exists && !existing.isDirectory && existing.size > 0) return file;
  const files = await FileSystem.readDirectoryAsync(root);
  if (files.length >= 20) await Promise.all(files.map(name => FileSystem.deleteAsync(root + name, { idempotent: true })));
  const pending = file + '.partial';
  try {
    const result = await FileSystem.downloadAsync(url.toString(), pending);
    const info = await FileSystem.getInfoAsync(pending);
    if (result.status !== 200 || !info.exists || info.isDirectory || info.size === 0 || info.size > 10 * 1024 * 1024) throw new Error('Preview unavailable');
    await FileSystem.moveAsync({ from: pending, to: file });
    return file;
  } finally {
    await FileSystem.deleteAsync(pending, { idempotent: true }).catch(() => {});
  }
}
