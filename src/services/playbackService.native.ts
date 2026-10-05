import TrackPlayer, { Event, State, Capability, RepeatMode, AppKilledPlaybackBehavior } from 'react-native-track-player';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { audioUri, sameTrack, trackKey } from '@/lib/tracks';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { AppState } from 'react-native';
import { previewFile } from './previewCache.native';

let setup: Promise<void> | null = null;
let registered = false;
let listenersInstalled = false;
let commands = Promise.resolve();
let queueSignature = '';
let lastRevision = -1;
let suppression = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const reportError = (error: unknown) => {
  usePlayerStore.setState({ isPlaying: false, audioError: error instanceof Error ? error.message : 'Audio playback failed' });
};
export function ensurePlayer(): Promise<void> {
  if (!setup) setup = (async () => {
    if (AppState.currentState !== 'active') await new Promise<void>(resolve => {
      const subscription = AppState.addEventListener('change', state => { if (state === 'active') { subscription.remove(); resolve(); } });
    });
    try { await TrackPlayer.setupPlayer({ autoHandleInterruptions: true }); }
    catch (error) { if ((error as { code?: string }).code !== 'player_already_initialized') throw error; }
    await TrackPlayer.updateOptions({
      capabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious, Capability.SeekTo, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      progressUpdateEventInterval: 1,
      android: { appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification },
    });
    installListeners();
    usePlayerStore.subscribe((state, previous) => {
      if (suppression) return;
      if (state.currentTrack !== previous.currentTrack || state.queue !== previous.queue ||
          state.downloadedTracks !== previous.downloadedTracks || state.playbackRevision !== previous.playbackRevision ||
          state.isPlaying !== previous.isPlaying || state.playbackRate !== previous.playbackRate ||
          state.repeatMode !== previous.repeatMode || state.sleepTimer !== previous.sleepTimer) {
        commands = commands.then(syncPlayer).catch(reportError);
      }
    });
    useSettingsStore.subscribe((state, previous) => {
      if (state.offlineMode !== previous.offlineMode) commands = commands.then(syncPlayer).catch(reportError);
    });
    commands = commands.then(syncPlayer).catch(reportError);
  })().catch(error => { setup = null; reportError(error); throw error; });
  return setup;
}
function fromNative(update: Partial<ReturnType<typeof usePlayerStore.getState>>) {
  if (suppression) return;
  suppression = true;
  try { usePlayerStore.setState(update); } finally { suppression = false; }
}
function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, event => {
    if (!event.track) return;
    const state = usePlayerStore.getState();
    const match = [...state.queue, ...(state.currentTrack ? [state.currentTrack] : [])].find(t => trackKey(t) === event.track!.id);
    if (match && !sameTrack(state.currentTrack, match)) {
      fromNative({ currentTrack: match, currentTimeMs: 0, progress: 0 });
      state.addToRecentlyPlayed(match);
      if (match.source === 'itunes') commands = commands.then(syncPlayer).catch(reportError);
    }
  });
  TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, event => {
    const state = usePlayerStore.getState();
    state.updateProgress(event.position * 1000, event.duration > 0 ? event.position / event.duration : 0);
    if (state.sleepDeadline && Date.now() >= state.sleepDeadline) {
      void TrackPlayer.pause().then(() => state.setSleepTimer(null)).catch(reportError);
    }
  });
  TrackPlayer.addEventListener(Event.PlaybackPlayWhenReadyChanged, event => fromNative({ isPlaying: event.playWhenReady }));
  TrackPlayer.addEventListener(Event.PlaybackState, event => {
    if ([State.Ended, State.Error, State.Stopped].includes(event.state)) fromNative({ isPlaying: false });
  });
  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => fromNative({ isPlaying: false, progress: 1 }));
  TrackPlayer.addEventListener(Event.PlaybackError, event => reportError(new Error(event.message)));
}
async function syncPlayer() {
  const state = usePlayerStore.getState();
  const current = state.currentTrack;
  if (!current) { await TrackPlayer.reset(); queueSignature = ''; return; }
  const localCurrent = state.downloadedTracks.find(track => sameTrack(track, current))?.localUri || current.localUri;
  if (current.source === 'youtube' && !localCurrent) {
    if (queueSignature !== 'youtube-embed') {
      suppression = true;
      try { await TrackPlayer.reset(); queueSignature = 'youtube-embed'; } finally { suppression = false; }
    }
    return;
  }
  const previewUri = current.source === 'itunes' ? await previewFile(current) : undefined;
  if (!sameTrack(usePlayerStore.getState().currentTrack, current)) return;
  const base = state.queue.some(t => sameTrack(t, current)) ? state.queue : [current, ...state.queue];
  const seen = new Set<string>();
  const tracks = base.filter(t => {
    const key = trackKey(t);
    if (seen.has(key)) return false; seen.add(key); return true;
  }).map(t => {
    const local = state.downloadedTracks.find(d => sameTrack(d, t));
    return { ...t, localUri: local?.localUri || t.localUri || (sameTrack(t, current) ? previewUri : undefined) };
  }).filter(t => (t.source !== 'youtube' || t.localUri) && audioUri(t) && (!useSettingsStore.getState().offlineMode || t.localUri));
  const selected = tracks.findIndex(t => sameTrack(t, current));
  if (selected < 0) throw new Error('This track has no playable audio for the selected mode.');
  const signature = JSON.stringify(tracks.map(t => [trackKey(t), audioUri(t)]));
  const active = await TrackPlayer.getActiveTrack();
  const position = active?.id === trackKey(current) ? (await TrackPlayer.getProgress()).position : 0;
  if (signature !== queueSignature) {
    // Ignore transitional native events while rebuilding; desired Zustand state wins.
    suppression = true;
    try {
      await TrackPlayer.reset();
      await TrackPlayer.add(tracks.map(t => ({ id: trackKey(t), url: audioUri(t), title: t.name, artist: t.artist_name, artwork: t.image, duration: t.duration || undefined })));
      await TrackPlayer.skip(selected, state.playbackRevision === lastRevision ? position : 0);
      queueSignature = signature;
    } finally { suppression = false; }
  } else if (active?.id !== trackKey(current) || state.playbackRevision !== lastRevision) await TrackPlayer.skip(selected, 0);
  lastRevision = state.playbackRevision;
  const desired = usePlayerStore.getState();
  await TrackPlayer.setRepeatMode(desired.repeatMode === 'one' ? RepeatMode.Track : desired.repeatMode === 'all' ? RepeatMode.Queue : RepeatMode.Off);
  await TrackPlayer.setRate(desired.playbackRate);
  if (desired.isPlaying) await TrackPlayer.play(); else await TrackPlayer.pause();
  if (timer) clearTimeout(timer);
  if (desired.sleepDeadline) timer = setTimeout(() => { void TrackPlayer.pause().then(() => usePlayerStore.getState().setSleepTimer(null)).catch(reportError); }, Math.max(0, desired.sleepDeadline - Date.now()));
}
export async function seekNative(fraction: number) {
  await ensurePlayer();
  const { duration } = await TrackPlayer.getProgress();
  const value = Math.min(1, Math.max(0, fraction));
  await TrackPlayer.seekTo(value * duration);
  usePlayerStore.getState().updateProgress(value * duration * 1000, value);
}
export async function PlaybackService() {
  installListeners();
  const run = (fn: () => Promise<void>) => { commands = commands.then(fn).catch(reportError); };
  TrackPlayer.addEventListener(Event.RemotePlay, () => run(() => TrackPlayer.play()));
  TrackPlayer.addEventListener(Event.RemotePause, () => run(() => TrackPlayer.pause()));
  TrackPlayer.addEventListener(Event.RemoteStop, () => run(async () => {
    fromNative({ isPlaying: false, currentTrack: null, currentTimeMs: 0, progress: 0 });
    queueSignature = '';
    if (timer) { clearTimeout(timer); timer = null; }
    await TrackPlayer.stop();
    await TrackPlayer.reset();
  }));
  TrackPlayer.addEventListener(Event.RemoteNext, () => run(async () => {
    const queue = await TrackPlayer.getQueue(), index = await TrackPlayer.getActiveTrackIndex();
    if (!queue.length) return;
    await TrackPlayer.skip(((index ?? -1) + 1) % queue.length); await TrackPlayer.play();
  }));
  TrackPlayer.addEventListener(Event.RemotePrevious, () => run(async () => {
    const queue = await TrackPlayer.getQueue(), index = await TrackPlayer.getActiveTrackIndex();
    if (!queue.length) return;
    await TrackPlayer.skip(((index ?? 0) - 1 + queue.length) % queue.length); await TrackPlayer.play();
  }));
  TrackPlayer.addEventListener(Event.RemoteSeek, event => run(async () => {
    await TrackPlayer.seekTo(event.position);
    const progress = await TrackPlayer.getProgress();
    usePlayerStore.getState().updateProgress(event.position * 1000, progress.duration ? event.position / progress.duration : 0);
  }));
}
export function registerPlayback() {
  if (!registered) { TrackPlayer.registerPlaybackService(() => PlaybackService); registered = true; }
}
