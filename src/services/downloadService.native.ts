import * as Network from 'expo-network';
import * as FileSystem from 'expo-file-system/legacy';
import type { Track } from '@/stores/usePlayerStore';
import { auth } from '@/lib/firebase';
import { API_BASE } from '@/lib/config';
import { getStorageAccount } from '@/lib/accountStorage';
import { trackKey } from '@/lib/tracks';
import { useSettingsStore } from '@/stores/useSettingsStore';
const jobs = new Map<string, FileSystem.DownloadResumable>();
export const cancelDownloads = () => { for (const job of jobs.values()) void job.cancelAsync().catch(() => {}); };
export async function deleteDownload(track: Track) {
  const root = FileSystem.documentDirectory + 'downloads/';
  if (track.localUri?.startsWith(root)) await FileSystem.deleteAsync(track.localUri, { idempotent: true });
}
export async function verifyDownloads(tracks: Track[]) {
  const valid: Track[] = [];
  for (const track of tracks) {
    if (!track.localUri?.startsWith(FileSystem.documentDirectory + 'downloads/')) continue;
    const info = await FileSystem.getInfoAsync(track.localUri);
    if (info.exists && !info.isDirectory && info.size > 0) valid.push({ ...track, fileSize: info.size });
  }
  return valid;
}
export async function downloadTrack(track: Track, progress: (value: number) => void): Promise<Track> {
  const uid = getStorageAccount();
  if (!uid || auth.currentUser?.uid !== uid) throw new Error('Sign in to download');
  const settings = useSettingsStore.getState();
  const network = await Network.getNetworkStateAsync();
  if (!network.isConnected || network.isInternetReachable === false) throw new Error('Connect to the internet to download.');
  if (settings.downloadWifiOnly && network.type !== Network.NetworkStateType.WIFI) throw new Error('Connect to Wi-Fi or turn off Wi-Fi-only downloads in settings.');
  let uri = track.audio || (track.source === 'spotify' ? '' : track.audiodownload);
  if (!uri || !/^https:\/\//.test(uri)) throw new Error('This track is not available to download.');
  if (track.source === 'jiosaavn') uri = uri.replace(/_(96|160|320)\.mp4/, settings.downloadQuality === 'high' ? '_320.mp4' : '_160.mp4');
  const key = uid + ':' + trackKey(track);
  if (getStorageAccount() !== uid || auth.currentUser?.uid !== uid) throw new Error('Session changed. Download cancelled.');
  if (jobs.has(key)) throw new Error('This download is already running.');
  const directory = FileSystem.documentDirectory + 'downloads/' + encodeURIComponent(uid) + '/';
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const free = await FileSystem.getFreeDiskStorageAsync();
  if (free < 60 * 1024 * 1024) throw new Error('Not enough free storage.');
  const token = await auth.currentUser.getIdToken();
  const url = API_BASE + '/catalog/download?' + new URLSearchParams({ audioUrl: uri, title: track.name, artist: track.artist_name, album: track.album_name || '', imageUrl: track.image }).toString();
  const temp = directory + encodeURIComponent(key) + '.partial';
  if (getStorageAccount() !== uid) throw new Error('Session changed. Download cancelled.');
  const job = FileSystem.createDownloadResumable(url, temp, { headers: { Authorization: 'Bearer ' + token } }, event => {
    progress(event.totalBytesExpectedToWrite > 0 ? event.totalBytesWritten / event.totalBytesExpectedToWrite : 0);
    if (event.totalBytesWritten > 32 * 1024 * 1024) void job.cancelAsync();
  });
  jobs.set(key, job);
  const timer = setTimeout(() => { void job.cancelAsync(); }, 45000);
  try {
    const result = await job.downloadAsync();
    if (!result || result.status !== 200) throw new Error(result?.status === 403 ? 'An active subscription is required.' : 'Download failed. Please retry.');
    if (getStorageAccount() !== uid) throw new Error('Session changed. Download cancelled.');
    const mime = String(result.headers['Content-Type'] || result.headers['content-type'] || '').split(';')[0];
    const extensions: Record<string, string> = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'video/mp4': 'm4a', 'audio/aac': 'aac', 'audio/ogg': 'ogg', 'audio/webm': 'webm', 'video/webm': 'webm' };
    const ext = extensions[mime];
    if (!ext) throw new Error('The server returned unsupported audio.');
    const info = await FileSystem.getInfoAsync(temp);
    if (!info.exists || info.isDirectory || info.size === 0 || info.size > 32 * 1024 * 1024) throw new Error('The downloaded file is empty.');
    const destination = directory + encodeURIComponent(key) + '.' + ext;
    await FileSystem.moveAsync({ from: temp, to: destination });
    return { ...track, localUri: destination, fileSize: info.size };
  } finally {
    clearTimeout(timer); if (jobs.get(key) === job) jobs.delete(key);
    await FileSystem.deleteAsync(temp, { idempotent: true });
  }
}
