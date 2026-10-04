import type { YoutubeSong } from './provider-types';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import YTMusic from 'ytmusic-api';
import { JamendoTrack, JamendoResponse } from '../jamendo/jamendo.service';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private ytmusic: YTMusic;
  private isInitialized = false;
  private initializing: Promise<void> | null = null;

  constructor() {
    this.ytmusic = new YTMusic();
  }

  private async init() {
    try {
      await this.ytmusic.initialize();
      this.isInitialized = true;
      this.logger.log('✅ YouTube Music API initialized.');
    } catch (e) {
      this.logger.error(
        `Failed to initialize YTMusic: ${e instanceof Error ? e.message : 'Provider unavailable'}`,
      );
    }
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      if (!this.initializing)
        this.initializing = this.init().finally(() => {
          this.initializing = null;
        });
      await this.initializing;
    }
    if (!this.isInitialized) {
      throw new HttpException(
        'YouTube Music API not ready',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getTrackById(id: string) {
    await this.ensureInitialized();
    return this.formatTrack(await this.ytmusic.getSong(id));
  }

  private formatTrack(track: YoutubeSong): JamendoTrack {
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
      audio: `/api/youtube/stream/${track.videoId}`,
      audiodownload: `https://music.youtube.com/watch?v=${track.videoId}`,
      prourl: '',
      shorturl: `https://music.youtube.com/watch?v=${track.videoId}`,
      shareurl: `https://music.youtube.com/watch?v=${track.videoId}`,
      releasedate: '',
      position: 0,
      source: 'youtube',
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

  async searchTracks(
    query: string,
    limit = 20,
  ): Promise<JamendoResponse<JamendoTrack>> {
    await this.ensureInitialized();
    try {
      const results = await this.ytmusic.searchSongs(query);
      const sliced = results.slice(0, limit);
      const formatted = sliced.map((t) => this.formatTrack(t));
      return this.wrapResponse(formatted, formatted.length);
    } catch (e) {
      this.logger.error(
        `YouTube search failed: ${e instanceof Error ? e.message : 'Provider unavailable'}`,
      );
      return this.wrapResponse([]);
    }
  }

  async getTrendingTracks(limit = 20): Promise<JamendoResponse<JamendoTrack>> {
    await this.ensureInitialized();
    try {
      const results = await this.ytmusic.searchSongs(
        'Pop Hits ' + new Date().getFullYear(),
      );
      const sliced = results.slice(0, limit);
      const formatted = sliced.map((t) => this.formatTrack(t));
      return this.wrapResponse(formatted, formatted.length);
    } catch (e) {
      this.logger.error(
        `YouTube trending failed: ${e instanceof Error ? e.message : 'Provider unavailable'}`,
      );
      return this.wrapResponse([]);
    }
  }
}
