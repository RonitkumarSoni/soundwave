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
  originalQueue: Track[];
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
  originalQueue: [],
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
    const { queue, currentTrack, repeatMode } = get();
    if (!currentTrack || queue.length === 0) return;
    
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const isLastTrack = idx === queue.length - 1;

    if (isLastTrack && repeatMode === "off") {
      // Stop playing if at the end of the queue and repeat is off
      set({ isPlaying: false, progress: 0, currentTimeMs: 0 });
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
      const otherTracks = s.originalQueue.filter(t => t.id !== current?.id);
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }
      return { 
        isShuffled: newShuffled, 
        queue: current ? [current, ...otherTracks] : otherTracks 
      };
    } else {
      // Restore original queue, but try to keep current track
      return { isShuffled: newShuffled, queue: s.originalQueue };
    }
  }),
  toggleRepeat: () =>
    set((s) => ({
      repeatMode:
        s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
    })),
  toggleLike: () => set((s) => ({ isLiked: !s.isLiked })),
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
