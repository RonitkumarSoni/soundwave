import { usePlayerStore } from '@/stores/usePlayerStore';

export function useBottomPadding() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  return currentTrack ? 160 : 88;
}
