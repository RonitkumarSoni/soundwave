import { Injectable } from '@nestjs/common';
import axios from 'axios';
interface DeezerTrack {
  id: string | number;
  title: string;
  duration: number;
  artist?: { name: string };
  album?: { title: string; cover_xl?: string; cover_medium?: string };
  preview?: string;
  link?: string;
}
@Injectable()
export class DeezerService {
  private readonly baseURL = 'https://api.deezer.com';
  private formatTrack(track: DeezerTrack) {
    return {
      id: String(track.id),
      name: track.title,
      duration: track.duration,
      artist_name: track.artist?.name || 'Unknown Artist',
      album_name: track.album?.title || 'Unknown Album',
      image: track.album?.cover_xl || track.album?.cover_medium || '',
      audio: track.preview || '',
      source: 'deezer',
      audiodownload: '',
    };
  }
  async searchTracks(query: string, limit = 10) {
    const response = await axios.get<{ data?: DeezerTrack[] }>(
      this.baseURL + '/search/track',
      { timeout: 10000, params: { q: query, limit } },
    );
    return (response.data.data || []).map((track) => this.formatTrack(track));
  }
  async getTrending(limit = 10) {
    const response = await axios.get<{ data?: DeezerTrack[] }>(
      this.baseURL + '/chart/0/tracks',
      { timeout: 10000, params: { limit } },
    );
    return (response.data.data || []).map((track) => this.formatTrack(track));
  }
}
