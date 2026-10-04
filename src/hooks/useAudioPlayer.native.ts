import { useEffect } from 'react';
import { ensurePlayer, seekNative } from '@/services/playbackService.native';
export const seekGlobalAudio = seekNative;
export function useAudioPlayer() {
  useEffect(() => { void ensurePlayer().catch(() => {}); }, []);
}
