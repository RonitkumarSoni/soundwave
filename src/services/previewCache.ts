import { audioUri } from '@/lib/tracks';
import type { Track } from '@/stores/usePlayerStore';
export const previewFile = async (track: Track) => audioUri(track);
