import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import YTMusic from 'ytmusic-api';
import { JamendoTrack, JamendoArtist, JamendoResponse } from '../jamendo/jamendo.service';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private ytmusic: YTMusic;
  private isInitialized = false;

  constructor() {
    this.ytmusic = new YTMusic();
    this.init();
  }

  private async init() {
    try {
      await this.ytmusic.initialize();
      this.isInitialized = true;
      this.logger.log('✅ YouTube Music API initialized.');
    } catch (e: any) {
      this.logger.error(`Failed to initialize YTMusic: ${e.message}`);
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      await this.init();
    }
    if (!this.isInitialized) {
      throw new HttpException('YouTube Music API not ready', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  private formatTrack(track: any): JamendoTrack {
    return {
      id: track.videoId,
      name: track.name,
      duration: track.duration || 0,
      artist_id: track.artists?.[0]?.artistId || '',
      artist_name: track.artists?.[0]?.name || 'Unknown Artist',
      artist_idstr: track.artists?.[0]?.name || 'Unknown Artist',
      album_name: track.album?.name || 'YouTube Single',
      album_id: track.album?.albumId || '',
      album_image: track.thumbnails?.[track.thumbnails.length - 1]?.url || '',
      image: track.thumbnails?.[track.thumbnails.length - 1]?.url || '',
      audio: `http://localhost:3001/api/youtube/stream/${track.videoId}`, // Stream proxy
      audiodownload: `https://music.youtube.com/watch?v=${track.videoId}`,
      prourl: '',
      shorturl: `https://music.youtube.com/watch?v=${track.videoId}`,
      shareurl: `https://music.youtube.com/watch?v=${track.videoId}`,
      releasedate: '',
      position: 0,
      source: 'youtube'
    } as JamendoTrack & { source: string };
  }

  private wrapResponse<T>(items: T[], total = 0): JamendoResponse<T> {
    return {
      headers: {
        status: 'success',
        code: 200,
        error_message: '',
        warnings: '',
        results_count: total || items.length,
      },
      results: items,
    };
  }

  async searchTracks(query: string, limit = 20): Promise<JamendoResponse<JamendoTrack>> {
    await this.ensureInitialized();
    try {
      const results = await this.ytmusic.searchSongs(query);
      const sliced = results.slice(0, limit);
      const formatted = sliced.map(t => this.formatTrack(t));
      return this.wrapResponse(formatted, formatted.length);
    } catch (e: any) {
      this.logger.error(`YouTube search failed: ${e.message}`);
      return this.wrapResponse([]);
    }
  }

  async getTrendingTracks(limit = 20): Promise<JamendoResponse<JamendoTrack>> {
    await this.ensureInitialized();
    try {
      const results = await this.ytmusic.searchSongs('Pop Hits 2024');
      const sliced = results.slice(0, limit);
      const formatted = sliced.map(t => this.formatTrack(t));
      return this.wrapResponse(formatted, formatted.length);
    } catch (e: any) {
      this.logger.error(`YouTube trending failed: ${e.message}`);
      return this.wrapResponse([]);
    }
  }
}
