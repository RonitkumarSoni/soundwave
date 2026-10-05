import { useEffect } from 'react';
import { Audio } from 'expo-av';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { audioUri, sameTrack, trackKey } from '@/lib/tracks';
import { useSettingsStore } from '@/stores/useSettingsStore';
export let soundInstance: Audio.Sound | null = null;
let serial = Promise.resolve();
let revision = 0;
let loadedKey = '';
let loadedRevision = -1;
let loadedUri = '';
async function syncSound(version: number) {
  if (version !== revision) return;
  const state = usePlayerStore.getState();
  const track = state.currentTrack;
  const downloaded = state.downloadedTracks.find(t => sameTrack(t, track));
  const uri = track ? audioUri({ ...track, localUri: downloaded?.localUri || track.localUri }) : '';
  if (track?.source === 'youtube' && !downloaded?.localUri && !track.localUri) {
    if (soundInstance) await soundInstance.unloadAsync();
    soundInstance = null; loadedKey = ''; return;
  }
  if (!track) {
    if (soundInstance) await soundInstance.unloadAsync();
    soundInstance = null; loadedKey = ''; return;
  }
  if (!uri) throw new Error('This track has no playable audio.');
  if (useSettingsStore.getState().offlineMode && !downloaded?.localUri) throw new Error('Offline playback requires a downloaded file in the mobile app.');
  const key = trackKey(track);
  if (!soundInstance || loadedKey !== key || uri !== loadedUri) {
    if (soundInstance) await soundInstance.unloadAsync();
    soundInstance = null;
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false, progressUpdateIntervalMillis: 500 });
    if (version !== revision) { await sound.unloadAsync(); return; }
    soundInstance = sound; loadedKey = key; loadedUri = uri; loadedRevision = state.playbackRevision;
    sound.setOnPlaybackStatusUpdate(status => {
      if (soundInstance !== sound) return;
      if (!status.isLoaded) {
        if (status.error) usePlayerStore.setState({ isPlaying: false, audioError: 'Audio could not be played. Try another track.' });
        return;
      }
      usePlayerStore.getState().updateProgress(status.positionMillis, status.durationMillis ? status.positionMillis / status.durationMillis : 0);
      if (status.didJustFinish && !status.isLooping) usePlayerStore.getState().finishTrack();
    });
  } else if (loadedRevision !== state.playbackRevision) {
    await soundInstance.setPositionAsync(0); loadedRevision = state.playbackRevision;
  }
  if (version !== revision || !soundInstance) return;
  const desired = usePlayerStore.getState();
  await soundInstance.setIsLoopingAsync(desired.repeatMode === 'one');
  await soundInstance.setRateAsync(desired.playbackRate, true);
  if (version !== revision) return;
  if (usePlayerStore.getState().isPlaying) await soundInstance.playAsync(); else await soundInstance.pauseAsync();
}
export async function seekGlobalAudio(position: number) {
  if (!soundInstance) return;
  const status = await soundInstance.getStatusAsync();
  if (!status.isLoaded || !status.durationMillis) return;
  const fraction = Math.max(0, Math.min(1, position));
  await soundInstance.setPositionAsync(fraction * status.durationMillis);
  usePlayerStore.getState().updateProgress(fraction * status.durationMillis, fraction);
}
export function useAudioPlayer() {
  useEffect(() => {
    const schedule = () => {
      const version = ++revision;
      serial = serial.then(() => syncSound(version)).catch(error => {
        if (version === revision) usePlayerStore.setState({ isPlaying: false, audioError: error instanceof Error ? error.message : 'Audio playback failed' });
      });
    };
    const unsubscribe = usePlayerStore.subscribe((state, previous) => {
      if (state.currentTrack !== previous.currentTrack || state.playbackRevision !== previous.playbackRevision ||
          state.isPlaying !== previous.isPlaying || state.repeatMode !== previous.repeatMode ||
          state.playbackRate !== previous.playbackRate || state.downloadedTracks !== previous.downloadedTracks) schedule();
    });
    const settings = useSettingsStore.subscribe((state, previous) => { if (state.offlineMode !== previous.offlineMode) schedule(); });
    schedule();
    return () => { unsubscribe(); settings(); ++revision; serial = serial.then(async () => { await soundInstance?.unloadAsync(); soundInstance = null; loadedKey = ''; }); };
  }, []);
}
