import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  duration: string;
  durationSeconds: number;
  audioUrl?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Track[];
  isOverlayOpen: boolean;
  
  // Actions
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (val: number) => void;
  setProgress: (val: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleOverlay: () => void;
  setQueue: (tracks: Track[]) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 80,
  progress: 0,
  queue: [],
  isOverlayOpen: false,

  playTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  
  togglePlay: () => {
    const { currentTrack, isPlaying } = get();
    if (currentTrack) {
      set({ isPlaying: !isPlaying });
    }
  },

  setVolume: (val) => set({ volume: val }),
  
  setProgress: (val) => set({ progress: val }),
  
  nextTrack: () => {
    // Basic implementation: if queue has items, pop next (simplified for UI demonstration)
    const { queue } = get();
    if (queue.length > 0) {
      const next = queue[0];
      set({ currentTrack: next, queue: queue.slice(1), progress: 0, isPlaying: true });
    }
  },
  
  prevTrack: () => {
    set({ progress: 0, isPlaying: true });
  },

  toggleOverlay: () => set((state) => ({ isOverlayOpen: !state.isOverlayOpen })),
  
  setQueue: (tracks) => set({ queue: tracks })
}));
