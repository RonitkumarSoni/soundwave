import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class DeezerService {
  private readonly logger = new Logger(DeezerService.name);
  private readonly DEEZER_API_URL = 'https://api.deezer.com';

  async searchTracks(query: string, limit = 10): Promise<any[]> {
    try {
      const response = await axios.get(`${this.DEEZER_API_URL}/search/track`, {
        params: { q: query, limit },
      });

      if (!response.data || !response.data.data) {
        return [];
      }

      return response.data.data.map((track: any) => this.formatTrack(track));
    } catch (error: any) {
      this.logger.error(`Deezer search failed: ${error.message}`);
      return [];
    }
  }

  async getTrending(limit = 10): Promise<any[]> {
    try {
      const response = await axios.get(`${this.DEEZER_API_URL}/chart/0/tracks`, {
        params: { limit },
      });

      if (!response.data || !response.data.data) {
        return [];
      }

      return response.data.data.map((track: any) => this.formatTrack(track));
    } catch (error: any) {
      this.logger.error(`Deezer trending failed: ${error.message}`);
      return [];
    }
  }

  private formatTrack(track: any) {
    return {
      id: `dz_${track.id}`,
      name: track.title,
      duration: track.duration,
      artist_name: track.artist?.name || 'Unknown Artist',
      album_name: track.album?.title || 'Unknown Album',
      image: track.album?.cover_xl || track.album?.cover_medium || '',
      audio: track.preview || '',
      source: 'deezer',
      audiodownload: track.link || '',
    };
  }
}
