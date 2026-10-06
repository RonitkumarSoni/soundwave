import { create } from "zustand";
import { accountStorage as AsyncStorage, getStorageAccount, setStorageAccount } from '@/lib/accountStorage';
import { downloadTrack, deleteDownload, verifyDownloads, cancelDownloads } from '@/services/downloadService';
import { trackKey, sameTrack } from '@/lib/tracks';
import Toast from 'react-native-toast-message';


export interface CustomPlaylist {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  tracks: Track[];
}

export interface Track {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name: string;
  image: string;
  audio: string;
  audiodownload?: string;
  localUri?: string;
  fileSize?: number;
  source?: string;
  artist_id?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  isPlaying: boolean;
  isAudioLoading: boolean;
  progress: number;
  currentTimeMs: number;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
  likedTracks: Track[];
  recentlyPlayed: Track[];
  downloadedTracks: Track[];
  followedArtists: any[];
  savedAlbums: any[];
  playbackRate: number;
  sleepTimer: number | null;
  sleepDeadline: number | null;
  sleepTimerTimeout: any | null;
  customPlaylists: CustomPlaylist[];
  audioError: string | null;
  playbackRevision: number;
  downloadProgress: Record<string, number>;
  switchAccount: (uid: string | null) => Promise<void>;
  finishTrack: () => void;

  setTrack: (track: Track) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (ms: number) => void;
  updateProgress: (time: number, progress: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  initLikedTracks: () => Promise<void>;
  toggleDownload: (track: Track) => Promise<void>;
  downloadTracks: (tracks: Track[]) => Promise<void>;
  initDownloadedTracks: () => Promise<void>;
  toggleFollowArtist: (artist: any) => void;
  toggleSaveAlbum: (album: any) => void;
  initFollowedAndSaved: () => Promise<void>;
  setPlaybackRate: (rate: number) => void;
  addToRecentlyPlayed: (track: Track) => void;
  initRecentlyPlayed: () => Promise<void>;
  setSleepTimer: (minutes: number | null) => void;

  // Custom Playlists actions
  createPlaylist: (name: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string, source?: string) => void;
  initCustomPlaylists: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  isPlaying: false,
  isAudioLoading: false,
  progress: 0,
  currentTimeMs: 0,
  isShuffled: false,
  repeatMode: "off",
  likedTracks: [],
  recentlyPlayed: [],
  downloadedTracks: [],
  followedArtists: [],
  savedAlbums: [],
  playbackRate: 1.0,
  sleepTimer: null, sleepDeadline: null,
  sleepTimerTimeout: null,
  customPlaylists: [],
  audioError: null, playbackRevision: 0, downloadProgress: {},
  switchAccount: async (uid) => {
    if (getStorageAccount() === uid) return;
    cancelDownloads();
    if (get().sleepTimerTimeout) clearTimeout(get().sleepTimerTimeout);
    setStorageAccount(uid);
    set({ isShuffled: false, repeatMode: "off", playbackRate: 1, currentTrack: null, queue: [], originalQueue: [], isPlaying: false, progress: 0, currentTimeMs: 0, likedTracks: [], downloadedTracks: [], followedArtists: [], savedAlbums: [], recentlyPlayed: [], customPlaylists: [], sleepTimer: null, sleepDeadline: null, sleepTimerTimeout: null, downloadProgress: {}, audioError: null });
    if (uid) await Promise.all([get().initLikedTracks(), get().initDownloadedTracks(), get().initFollowedAndSaved(), get().initRecentlyPlayed(), get().initCustomPlaylists()]);
  },
  finishTrack: () => {
    const { queue, currentTrack, repeatMode } = get();
    const index = queue.findIndex(t => sameTrack(t, currentTrack));
    if (repeatMode === "one" && currentTrack) get().setTrack(currentTrack);
    else if (index >= 0 && index < queue.length - 1) get().setTrack(queue[index + 1]);
    else if (repeatMode === "all" && queue.length) get().setTrack(queue[0]);
    else set({ isPlaying: false, progress: 1 });
  },

  setTrack: (track) => {
    set({ currentTrack: track, isPlaying: true, isAudioLoading: true, progress: 0, currentTimeMs: 0, audioError: null, playbackRevision: get().playbackRevision + 1 });
    get().addToRecentlyPlayed(track);
  },
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying, audioError: null })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ currentTrack: null, isPlaying: false, isAudioLoading: false, progress: 0, currentTimeMs: 0, audioError: null }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (ms) => set({ currentTimeMs: ms }),
  updateProgress: (time, progress) => set({ currentTimeMs: time, progress: progress }),

  nextTrack: () => {
    const { queue, currentTrack, repeatMode } = get();
    if (!currentTrack || queue.length === 0) return;

    const idx = queue.findIndex((t) => sameTrack(t, currentTrack));
    const isLastTrack = idx === queue.length - 1;

    if (isLastTrack && repeatMode === "off") {
      // Just loop back to the first track when manually pressing Next
      const next = queue[0];
      get().setTrack(next);
      return;
    }

    const next = queue[(idx + 1) % queue.length];

    // If the queue has only 1 track and repeat is 'all', we just set it again.
    // The useAudioPlayer hook will handle the seeking to 0.
    get().setTrack(next);
  },

  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;

    const idx = queue.findIndex((t) => sameTrack(t, currentTrack));
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    get().setTrack(prev);
  },

  toggleShuffle: () => set((s) => {
    const newShuffled = !s.isShuffled;
    if (newShuffled) {
      const current = s.currentTrack;
      // If originalQueue is empty, fallback to current queue
      const baseQueue = s.originalQueue.length > 0 ? s.originalQueue : s.queue;
      const otherTracks = baseQueue.filter(t => !sameTrack(t, current));
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }
      return {
        isShuffled: newShuffled,
        queue: current ? [current, ...otherTracks] : otherTracks
      };
    } else {
      // Restore original queue if exists
      return { isShuffled: newShuffled, queue: s.originalQueue.length > 0 ? s.originalQueue : s.queue };
    }
  }),
  toggleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
    })),
  toggleLike: (track) => {
    const { likedTracks } = get();
    const isLiked = likedTracks.some(t => sameTrack(t, track));
    const newLiked = isLiked
      ? likedTracks.filter(t => !sameTrack(t, track))
      : [track, ...likedTracks];
    set({ likedTracks: newLiked });
    AsyncStorage.setItem('liked_tracks_full', JSON.stringify(newLiked)).catch(console.error);
  },
  initLikedTracks: async () => {
    try {
      const stored = await AsyncStorage.getItem('liked_tracks_full');
      if (stored) {
        set({ likedTracks: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load liked tracks', e);
    }
  },
  addToRecentlyPlayed: (track) => {
    const { recentlyPlayed } = get();
    // Remove track if it's already in the list to avoid duplicates
    const filtered = recentlyPlayed.filter(t => !sameTrack(t, track));
    const newRecent = [track, ...filtered].slice(0, 20); // Keep last 20
    set({ recentlyPlayed: newRecent });
    AsyncStorage.setItem('recently_played_tracks', JSON.stringify(newRecent)).catch(console.error);
  },
  initRecentlyPlayed: async () => {
    try {
      const stored = await AsyncStorage.getItem('recently_played_tracks');
      if (stored) {
        set({ recentlyPlayed: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load recently played tracks', e);
    }
  },
  toggleDownload: async (track) => {
    const uid = getStorageAccount();
    const existing = get().downloadedTracks.find(t => sameTrack(t, track));
    if (trackKey(track) in get().downloadProgress) return;
    try {
      if (existing) {
        await deleteDownload(existing);
        if (uid !== getStorageAccount()) return;
        const remaining = get().downloadedTracks.filter(t => !sameTrack(t, track));
        set({ downloadedTracks: remaining });
        await AsyncStorage.setItem('downloaded_tracks', JSON.stringify(remaining));
        return;
      }
      const key = trackKey(track);
      set({ downloadProgress: { ...get().downloadProgress, [key]: 0 } });
      const downloaded = await downloadTrack(track, value => {
        if (uid === getStorageAccount()) set({ downloadProgress: { ...get().downloadProgress, [key]: value } });
      });
      if (uid !== getStorageAccount()) { await deleteDownload(downloaded); return; }
      const tracks = [downloaded, ...get().downloadedTracks.filter(t => !sameTrack(t, downloaded))];
      set({ downloadedTracks: tracks });
      await AsyncStorage.setItem('downloaded_tracks', JSON.stringify(tracks));
      Toast.show({ type: 'success', text1: 'Downloaded', text2: track.name });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Download unavailable', text2: error instanceof Error ? error.message : 'Please retry.' });
    } finally {
      if (uid === getStorageAccount()) {
        const pending = { ...get().downloadProgress }; delete pending[trackKey(track)]; set({ downloadProgress: pending });
      }
    }
  },
  downloadTracks: async (tracks) => {
    const uid = getStorageAccount();
    for (const track of tracks) {
      if (uid !== getStorageAccount()) return;
      if (!get().downloadedTracks.some(t => sameTrack(t, track))) await get().toggleDownload(track);
    }
  },
  initDownloadedTracks: async () => {
    try {
      const stored = await AsyncStorage.getItem('downloaded_tracks');
      if (stored) {
        const uid = getStorageAccount();
        const tracks = await verifyDownloads(JSON.parse(stored));
        if (uid === getStorageAccount()) set({ downloadedTracks: tracks });
      }
    } catch (e) {
      console.error('Failed to load downloaded tracks', e);
    }
  },
  toggleFollowArtist: (artist) => {
    const { followedArtists } = get();
    const isFollowed = followedArtists.some(a => a.id === artist.id);
    const newFollowed = isFollowed
      ? followedArtists.filter(a => a.id !== artist.id)
      : [artist, ...followedArtists];
    set({ followedArtists: newFollowed });
    AsyncStorage.setItem('followed_artists', JSON.stringify(newFollowed)).catch(console.error);
  },
  toggleSaveAlbum: (album) => {
    const { savedAlbums } = get();
    const isSaved = savedAlbums.some(a => a.id === album.id);
    const newSaved = isSaved
      ? savedAlbums.filter(a => a.id !== album.id)
      : [album, ...savedAlbums];
    set({ savedAlbums: newSaved });
    AsyncStorage.setItem('saved_albums', JSON.stringify(newSaved)).catch(console.error);
  },
  initFollowedAndSaved: async () => {
    try {
      const artistsStored = await AsyncStorage.getItem('followed_artists');
      if (artistsStored) set({ followedArtists: JSON.parse(artistsStored) });

      const albumsStored = await AsyncStorage.getItem('saved_albums');
      if (albumsStored) set({ savedAlbums: JSON.parse(albumsStored) });
    } catch (e) {
      console.error('Failed to load followed/saved', e);
    }
  },
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setQueue: (tracks) => {
    const { isShuffled } = get();
    if (isShuffled) {
      const otherTracks = [...tracks];
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }
      set({ queue: otherTracks, originalQueue: tracks });
    } else {
      set({ queue: tracks, originalQueue: tracks });
    }
  },
  setSleepTimer: (minutes) => {
    const { sleepTimerTimeout, pause } = get();
    if (sleepTimerTimeout) clearTimeout(sleepTimerTimeout);

    if (minutes === null) {
      set({ sleepTimer: null, sleepDeadline: null, sleepTimerTimeout: null });
      return;
    }

    const timeout = setTimeout(() => {
      pause();
      set({ sleepTimer: null, sleepDeadline: null, sleepTimerTimeout: null });
    }, minutes * 60 * 1000);

    set({ sleepTimer: minutes, sleepDeadline: Date.now() + minutes * 60000, sleepTimerTimeout: timeout });
  },

  createPlaylist: (name, description = "") => {
    const { customPlaylists } = get();
    const newPlaylist: CustomPlaylist = {
      id: "cp_" + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2),
      name,
      description,
      createdAt: Date.now(),
      tracks: []
    };
    const updated = [newPlaylist, ...customPlaylists];
    set({ customPlaylists: updated });
    AsyncStorage.setItem('custom_playlists', JSON.stringify(updated)).catch(console.error);
  },

  deletePlaylist: (id) => {
    const { customPlaylists } = get();
    const updated = customPlaylists.filter(p => p.id !== id);
    set({ customPlaylists: updated });
    AsyncStorage.setItem('custom_playlists', JSON.stringify(updated)).catch(console.error);
  },

  addTrackToPlaylist: (playlistId, track) => {
    const { customPlaylists } = get();
    const updated = customPlaylists.map(p => {
      if (p.id === playlistId) {
        // Only add if not already in playlist
        if (!p.tracks.some(t => sameTrack(t, track))) {
          return { ...p, tracks: [...p.tracks, track] };
        }
      }
      return p;
    });
    set({ customPlaylists: updated });
    AsyncStorage.setItem('custom_playlists', JSON.stringify(updated)).catch(console.error);
  },

  removeTrackFromPlaylist: (playlistId, trackId, source) => {
    const { customPlaylists } = get();
    const updated = customPlaylists.map(p => {
      if (p.id === playlistId) {
        return { ...p, tracks: p.tracks.filter(t => t.id !== trackId || (source !== undefined && t.source !== source)) };
      }
      return p;
    });
    set({ customPlaylists: updated });
    AsyncStorage.setItem('custom_playlists', JSON.stringify(updated)).catch(console.error);
  },

  initCustomPlaylists: async () => {
    try {
      const stored = await AsyncStorage.getItem('custom_playlists');
      if (stored) set({ customPlaylists: JSON.parse(stored) });
    } catch (e) {
      console.error('Failed to load custom playlists', e);
    }
  }
}));
