import { useEffect } from 'react';
import { ensurePlayer, disposePlayer, seekNative } from '@/services/audioPlayback';
export const seekGlobalAudio = seekNative;
export function useAudioPlayer() {
  useEffect(() => {
    void ensurePlayer().catch(() => {});
    return disposePlayer;
  }, []);
}
