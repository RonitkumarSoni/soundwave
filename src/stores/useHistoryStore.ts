import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from './usePlayerStore';

interface HistoryState {
  recentlyPlayed: Track[];
  addTrackToHistory: (track: Track) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      recentlyPlayed: [],
      addTrackToHistory: (track) => set((state) => {
        // Remove track if it already exists to avoid duplicates
        const filtered = state.recentlyPlayed.filter((t) => t.id !== track.id);
        // Add to beginning of array, keep max 20
        const updated = [track, ...filtered].slice(0, 20);
        return { recentlyPlayed: updated };
      }),
      clearHistory: () => set({ recentlyPlayed: [] }),
    }),
    {
      name: 'soundwave-history-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
