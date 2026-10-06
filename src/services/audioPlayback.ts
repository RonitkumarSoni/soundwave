import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { audioUri, sameTrack, trackKey } from '@/lib/tracks';
import { previewFile } from './previewCache';
import { checkAudioSource } from '@/lib/audioSource';
import { API_BASE } from '@/lib/config';

// Expo Go cannot install the app's background playback service config plugin.
const supportsBackgroundPlayback = Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';

let player: AudioPlayer | null = null;
let setup: Promise<void> | null = null;
let commands = Promise.resolve();
let revision = 0;
let loadedKey = '';
let loadedUri = '';
let loadedRevision = -1;
let suppression = false;
let failed = false;
let wasPlaying = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let check: AbortController | null = null;
let lifecycle = 0;
let unsubscribePlayer: (() => void) | null = null;
let unsubscribeSettings: (() => void) | null = null;
let statusSubscription: { remove: () => void } | null = null;
let loadTimeout: ReturnType<typeof setTimeout> | null = null;

function fromPlayer(update: Partial<ReturnType<typeof usePlayerStore.getState>>) {
  suppression = true;
  try { usePlayerStore.setState(update); } finally { suppression = false; }
}
function reportError(error: unknown) {
  if (loadTimeout) clearTimeout(loadTimeout);
  loadTimeout = null;
  failed = true;
  fromPlayer({ isPlaying: false, isAudioLoading: false, audioError: error instanceof Error ? error.message : 'Audio playback failed. Please retry.' });
}
function releasePlayer() {
  if (loadTimeout) clearTimeout(loadTimeout);
  loadTimeout = null;
  const previous = player;
  player = null;
  statusSubscription?.remove();
  statusSubscription = null;
  if (previous) {
    try {
      previous.pause();
      if (supportsBackgroundPlayback) previous.setActiveForLockScreen(false);
    } finally { previous.remove(); }
  }
  wasPlaying = false;
  loadedKey = '';
  loadedUri = '';
}
async function syncPlayer(version: number) {
  if (version !== revision) return;
  const state = usePlayerStore.getState();
  const track = state.currentTrack;
  if (timer) { clearTimeout(timer); timer = null; }
  if (!track) { releasePlayer(); fromPlayer({ isAudioLoading: false }); return; }
  const downloaded = state.downloadedTracks.find(item => sameTrack(item, track));
  let uri = audioUri({ ...track, localUri: downloaded?.localUri || track.localUri });
  if (track.source === 'youtube' && !downloaded?.localUri && !track.localUri) {
    uri = `${API_BASE}/youtube/stream/${encodeURIComponent(track.id)}`;
  }
  if (!uri) throw new Error('This track has no playable audio.');
  if (useSettingsStore.getState().offlineMode && !downloaded?.localUri && !track.localUri) throw new Error('Offline playback requires a downloaded song.');
  if (track.source === 'itunes' && !downloaded?.localUri && !track.localUri) uri = await previewFile(track);
  if (version !== revision) return;
  if (!player || failed || loadedKey !== trackKey(track) || loadedUri !== uri) {
    releasePlayer();
    fromPlayer({ isAudioLoading: true });
    check = new AbortController();
    await checkAudioSource(track.source, uri, check.signal);
    check = null;
    if (version !== revision) return;
    const instance = createAudioPlayer({ uri }, { updateInterval: 500 });
    player = instance;
    failed = false;
    loadedKey = trackKey(track);
    loadedUri = uri;
    loadedRevision = state.playbackRevision;
    loadTimeout = setTimeout(() => {
      if (player !== instance) return;
      instance.pause();
      reportError(new Error('Audio took too long to load. Check your connection and retry playback.'));
    }, 45000);
    statusSubscription = instance.addListener('playbackStatusUpdate', status => {
      if (player !== instance) return;
      const selected = usePlayerStore.getState();
      if (!sameTrack(selected.currentTrack, track) || selected.playbackRevision !== loadedRevision) return;
      if (status.error) { instance.pause(); reportError(new Error(status.error)); return; }
      fromPlayer({ isAudioLoading: !status.isLoaded || Boolean(status.isBuffering) });
      if (status.isLoaded) {
        if (loadTimeout) clearTimeout(loadTimeout);
        loadTimeout = null;
        const current = usePlayerStore.getState();
        current.updateProgress(status.currentTime * 1000, status.duration > 0 ? status.currentTime / status.duration : 0);
        if (current.sleepDeadline && Date.now() >= current.sleepDeadline) {
          instance.pause(); current.pause(); current.setSleepTimer(null); return;
        }
        if (status.didJustFinish && !status.loop) { wasPlaying = false; current.finishTrack(); return; }
        if (status.playing || (wasPlaying && !status.isBuffering)) fromPlayer({ isPlaying: status.playing });
        wasPlaying = status.playing;
      }
    });
    if (supportsBackgroundPlayback) instance.setActiveForLockScreen(true, {
      title: track.name, artist: track.artist_name, artworkUrl: track.image,
    }, { showSeekBackward: true, showSeekForward: true });
  } else if (loadedRevision !== state.playbackRevision) {
    await player.seekTo(0);
    loadedRevision = state.playbackRevision;
  }
  if (version !== revision || !player) return;
  const desired = usePlayerStore.getState();
  player.loop = desired.repeatMode === 'one';
  player.shouldCorrectPitch = true;
  player.setPlaybackRate(desired.playbackRate);
  if (desired.isPlaying) player.play(); else player.pause();
  if (desired.sleepDeadline) timer = setTimeout(() => {
    player?.pause();
    usePlayerStore.getState().pause();
    usePlayerStore.getState().setSleepTimer(null);
  }, Math.max(0, desired.sleepDeadline - Date.now()));
}
function schedule() {
  const version = ++revision;
  check?.abort();
  const state = usePlayerStore.getState();
  // Stop the old audio synchronously, before the new source's network check.
  if (player && (!state.currentTrack || loadedKey !== trackKey(state.currentTrack))) releasePlayer();
  else if (player && !state.isPlaying) { wasPlaying = false; player.pause(); }
  commands = commands.then(() => syncPlayer(version)).catch(error => {
    if (version === revision) reportError(error);
  });
}
export function ensurePlayer(): Promise<void> {
  if (!setup) {
    const generation = lifecycle;
    setup = (async () => {
    await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: supportsBackgroundPlayback, interruptionMode: 'doNotMix' });
    if (generation !== lifecycle) return;
    unsubscribePlayer = usePlayerStore.subscribe((state, previous) => {
      if (suppression) return;
      if (state.currentTrack !== previous.currentTrack || state.playbackRevision !== previous.playbackRevision ||
          state.isPlaying !== previous.isPlaying || state.repeatMode !== previous.repeatMode ||
          state.playbackRate !== previous.playbackRate || state.downloadedTracks !== previous.downloadedTracks ||
          state.sleepDeadline !== previous.sleepDeadline) schedule();
    });
    unsubscribeSettings = useSettingsStore.subscribe((state, previous) => { if (state.offlineMode !== previous.offlineMode) schedule(); });
    schedule();
    })().catch(error => { if (generation === lifecycle) { setup = null; reportError(error); } throw error; });
  }
  return setup;
}
export function disposePlayer() {
  ++lifecycle;
  ++revision;
  check?.abort();
  check = null;
  unsubscribePlayer?.();
  unsubscribeSettings?.();
  unsubscribePlayer = unsubscribeSettings = null;
  if (timer) clearTimeout(timer);
  timer = null;
  setup = null;
  releasePlayer();
  fromPlayer({ isAudioLoading: false });
}
export async function seekNative(fraction: number) {
  await ensurePlayer();
  const instance = player;
  if (!instance?.isLoaded || !instance.duration) return;
  const value = Math.min(1, Math.max(0, fraction));
  await instance.seekTo(value * instance.duration);
  if (player === instance) usePlayerStore.getState().updateProgress(value * instance.duration * 1000, value);
}
