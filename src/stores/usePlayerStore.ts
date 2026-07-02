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

  setTrack: (track: Track) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (ms: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  initLikedTracks: () => Promise<void>;
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

  setTrack: (track) =>
    set({ currentTrack: track, isPlaying: true, progress: 0, currentTimeMs: 0 }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
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
}));
