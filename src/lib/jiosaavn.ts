import CryptoJS from 'crypto-js';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { Track } from '@/stores/usePlayerStore';
export function jioAudio(song: any) {
  if (!song.encrypted_media_url) return '';
  try {
    const decoded = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(song.encrypted_media_url) } as any,
      CryptoJS.enc.Utf8.parse('38346591'), { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }).toString(CryptoJS.enc.Utf8);
    const { audioQuality, dataSaver } = useSettingsStore.getState();
    const bitrate = dataSaver || audioQuality === 'low' ? '96' : audioQuality === 'high' ? '320' : '160';
    return decoded.replace(/_(96|160|320)\.mp4/, '_' + bitrate + '.mp4');
  } catch { return ''; }
}
export function jioTrack(song: any): Track {
  return {
    id: String(song.id), name: String(song.song || song.title || ''), artist_name: song.primary_artists || song.singers || 'Unknown Artist',
    album_name: song.album || '', image: (song.image || '').replace('http:', 'https:').replace(/(50|80|150)x\1/, '500x500'),
    audio: jioAudio(song), duration: Math.max(0, Number(song.duration) || 0), source: 'jiosaavn',
    artist_id: song.primary_artists_id?.split(',')[0],
  };
}
