import { create } from "zustand";
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Track {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name: string;
  image: string;
  audio: string;
  audiodownload?: string;
  source?: string;
  artist_id?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  isPlaying: boolean;
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
  sleepTimerTimeout: any | null;

  setTrack: (track: Track) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (ms: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  initLikedTracks: () => Promise<void>;
  toggleDownload: (track: Track) => void;
  downloadTracks: (tracks: Track[]) => void;
  initDownloadedTracks: () => Promise<void>;
  toggleFollowArtist: (artist: any) => void;
  toggleSaveAlbum: (album: any) => void;
  initFollowedAndSaved: () => Promise<void>;
  setPlaybackRate: (rate: number) => void;
  addToRecentlyPlayed: (track: Track) => void;
  initRecentlyPlayed: () => Promise<void>;
  setSleepTimer: (minutes: number | null) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  originalQueue: [],
  isPlaying: false,
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
  sleepTimer: null,
  sleepTimerTimeout: null,

  setTrack: (track) => {
    set({ currentTrack: track, isPlaying: true, progress: 0, currentTimeMs: 0 });
    get().addToRecentlyPlayed(track);
  },
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ currentTrack: null, isPlaying: false, progress: 0, currentTimeMs: 0 }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (ms) => set({ currentTimeMs: ms }),

  nextTrack: () => {
    const { queue, currentTrack, repeatMode } = get();
    if (!currentTrack || queue.length === 0) return;
    
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const isLastTrack = idx === queue.length - 1;

    if (isLastTrack && repeatMode === "off") {
      // Just loop back to the first track when manually pressing Next
      const next = queue[0];
      set({ currentTrack: next, progress: 0, currentTimeMs: 0, isPlaying: true });
      return;
    }

    const next = queue[(idx + 1) % queue.length];
    
    // If the queue has only 1 track and repeat is 'all', we just set it again.
    // The useAudioPlayer hook will handle the seeking to 0.
    set({ currentTrack: next, progress: 0, currentTimeMs: 0, isPlaying: true });
  },

  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;

    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    set({ currentTrack: prev, progress: 0, currentTimeMs: 0, isPlaying: true });
  },

  toggleShuffle: () => set((s) => {
    const newShuffled = !s.isShuffled;
    if (newShuffled) {
      const current = s.currentTrack;
      // If originalQueue is empty, fallback to current queue
      const baseQueue = s.originalQueue.length > 0 ? s.originalQueue : s.queue;
      const otherTracks = baseQueue.filter(t => t.id !== current?.id);
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
    const isLiked = likedTracks.some(t => t.id === track.id);
    const newLiked = isLiked
      ? likedTracks.filter(t => t.id !== track.id)
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
    const filtered = recentlyPlayed.filter(t => t.id !== track.id);
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
  toggleDownload: (track) => {
    const { downloadedTracks } = get();
    const isDownloaded = downloadedTracks.some(t => t.id === track.id);
    
    if (isDownloaded) {
      const newDownloaded = downloadedTracks.filter(t => t.id !== track.id);
      set({ downloadedTracks: newDownloaded });
      AsyncStorage.setItem('downloaded_tracks', JSON.stringify(newDownloaded)).catch(console.error);
    } else {
      const newDownloaded = [track, ...downloadedTracks];
      set({ downloadedTracks: newDownloaded });
      AsyncStorage.setItem('downloaded_tracks', JSON.stringify(newDownloaded)).catch(console.error);
      
      // Trigger actual file download with ID3 tags via backend
      if (Platform.OS !== 'web') {
        try {
          const FileSystem = require('expo-file-system');
          const CACHE_DIR = `${FileSystem.documentDirectory}downloads/`;
          FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true }).then(() => {
            const fileUri = `${CACHE_DIR}${track.id}_${track.source || 'default'}.mp3`;
            const rawAudio = track.source === 'deezer' ? track.audio : (track.audio || track.audiodownload);
            
            if (rawAudio) {
              const backendUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'}/catalog/download?audioUrl=${encodeURIComponent(rawAudio)}&title=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artist_name)}&album=${encodeURIComponent(track.album_name || '')}&imageUrl=${encodeURIComponent(track.image)}`;
              
              FileSystem.downloadAsync(backendUrl, fileUri)
                .then(({ uri }: any) => {
                  console.log('Successfully downloaded tagged file to:', uri);
                })
                .catch((e: any) => console.error('Failed to download tagged file', e));
            }
          });
        } catch (e) {
          console.error("Error setting up download", e);
        }
      }
    }
  },
  downloadTracks: (tracks) => {
    const { downloadedTracks } = get();
    const existingIds = new Set(downloadedTracks.map(t => t.id));
    const newTracks = tracks.filter(t => !existingIds.has(t.id));
    
    if (newTracks.length > 0) {
      const newDownloaded = [...newTracks, ...downloadedTracks];
      set({ downloadedTracks: newDownloaded });
      AsyncStorage.setItem('downloaded_tracks', JSON.stringify(newDownloaded)).catch(console.error);
    }
  },
  initDownloadedTracks: async () => {
    try {
      const stored = await AsyncStorage.getItem('downloaded_tracks');
      if (stored) {
        set({ downloadedTracks: JSON.parse(stored) });
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
      set({ sleepTimer: null, sleepTimerTimeout: null });
      return;
    }

    const timeout = setTimeout(() => {
      pause();
      set({ sleepTimer: null, sleepTimerTimeout: null });
    }, minutes * 60 * 1000);

    set({ sleepTimer: minutes, sleepTimerTimeout: timeout });
  }
}));
