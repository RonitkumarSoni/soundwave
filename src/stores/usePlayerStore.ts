import { create } from "zustand";

export interface Track {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name: string;
  image: string;
  audio: string;
  audiodownload?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number;
  currentTimeMs: number;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
  isLiked: boolean;

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
  toggleLike: () => void;
  setQueue: (tracks: Track[]) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  progress: 0,
  currentTimeMs: 0,
  isShuffled: false,
  repeatMode: "off",
  isLiked: false,

  setTrack: (track) =>
    set({ currentTrack: track, isPlaying: true, progress: 0, currentTimeMs: 0 }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (ms) => set({ currentTimeMs: ms }),

  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const next = queue[(idx + 1) % queue.length];
    set({ currentTrack: next, progress: 0, currentTimeMs: 0, isPlaying: true });
  },

  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    set({ currentTrack: prev, progress: 0, currentTimeMs: 0, isPlaying: true });
  },

  toggleShuffle: () => set((s) => ({ isShuffled: !s.isShuffled })),
  toggleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
    })),
  toggleLike: () => set((s) => ({ isLiked: !s.isLiked })),
  setQueue: (tracks) => set({ queue: tracks }),
}));
