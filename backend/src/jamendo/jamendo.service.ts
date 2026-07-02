import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Jamendo API v3.0 service
 * Docs: https://developer.jamendo.com/v3.0/docs
 *
 * Provides access to 600,000+ tracks from independent artists.
 * Free tier: 35,000 API requests/month, entire catalog accessible.
 */

export interface JamendoTrack {
  id: string;
  name: string;
  duration: number; // seconds
  artist_id: string;
  artist_name: string;
  artist_idstr: string;
  album_name: string;
  album_id: string;
  album_image: string;
  image: string;
  audio: string; // full MP3 stream URL
  audiodownload: string;
  prourl: string;
  shorturl: string;
  shareurl: string;
  releasedate: string;
  position: number;
}

export interface JamendoAlbum {
  id: string;
  name: string;
  releasedate: string;
  artist_id: string;
  artist_name: string;
  image: string;
  zip: string;
}

export interface JamendoArtist {
  id: string;
  name: string;
  website: string;
  joindate: string;
  image: string;
  shorturl: string;
  shareurl: string;
}

export interface JamendoResponse<T> {
  headers: {
    status: string;
    code: number;
    error_message: string;
    warnings: string;
    results_count: number;
  };
  results: T[];
}

@Injectable()
export class JamendoService {
  private readonly logger = new Logger(JamendoService.name);
  private readonly client: AxiosInstance;
  private readonly clientId: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('JAMENDO_CLIENT_ID', '');
    const baseURL = this.configService.get<string>(
      'JAMENDO_API_BASE',
      'https://api.jamendo.com/v3.0',
    );

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      params: {
        client_id: this.clientId,
        format: 'json',
      },
    });

    if (!this.clientId) {
      this.logger.warn(
        '⚠️  JAMENDO_CLIENT_ID not set! Set it in .env to enable music catalog.',
      );
    } else {
      this.logger.log(`✅ Jamendo API initialized with client_id: ${this.clientId.substring(0, 8)}...`);
    }
  }

  /**
   * Search tracks by query
   */
  async searchTracks(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoTrack>> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/tracks/',
        {
          params: {
            search: query,
            limit: Math.min(limit, 200),
            offset,
            include: 'musicinfo',
            imagesize: 600,
            audioformat: 'mp32', // 320kbps MP3
          },
        },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('searchTracks', error);
      throw error;
    }
  }

  /**
   * Get popular/trending tracks
   */
  async getPopularTracks(
    limit = 20,
    offset = 0,
    order = 'popularity_week',
  ): Promise<JamendoResponse<JamendoTrack>> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/tracks/',
        {
          params: {
            limit: Math.min(limit, 200),
            offset,
            order,
            imagesize: 600,
            audioformat: 'mp32',
          },
        },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('getPopularTracks', error);
      throw error;
    }
  }

  /**
   * Get track by ID
   */
  async getTrackById(trackId: string): Promise<JamendoTrack | null> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/tracks/',
        {
          params: {
            id: trackId,
            imagesize: 600,
            audioformat: 'mp32',
          },
        },
      );
      this.checkResponse(data);
      return data.results[0] || null;
    } catch (error) {
      this.handleError('getTrackById', error);
      return null;
    }
  }

  /**
   * Get tracks by multiple IDs
   */
  async getTracksByIds(trackIds: string[]): Promise<JamendoTrack[]> {
    if (trackIds.length === 0) return [];
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/tracks/',
        {
          params: {
            id: trackIds.join('+'),
            imagesize: 600,
            audioformat: 'mp32',
            limit: Math.min(trackIds.length, 200),
          },
        },
      );
      this.checkResponse(data);
      return data.results;
    } catch (error) {
      this.handleError('getTracksByIds', error);
      return [];
    }
  }

  /**
   * Get similar tracks
   */
  async getSimilarTracks(
    trackId: string,
    limit = 10,
  ): Promise<JamendoResponse<JamendoTrack>> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/tracks/similar/',
        {
          params: {
            id: trackId,
            limit: Math.min(limit, 200),
            imagesize: 600,
            audioformat: 'mp32',
          },
        },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('getSimilarTracks', error);
      throw error;
    }
  }

  /**
   * Get stream URL for a track
   */
  async getStreamUrl(trackId: string): Promise<string | null> {
    const track = await this.getTrackById(trackId);
    return track?.audio || null;
  }

  /**
   * Search artists
   */
  async searchArtists(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoArtist>> {
    try {
      const params: any = {
        limit: Math.min(limit, 200),
        offset,
        imagesize: 600,
      };
      if (query && query.trim().length >= 2) {
        params.namesearch = query;
      } else {
        params.order = 'popularity_week';
      }
      const { data } = await this.client.get<JamendoResponse<JamendoArtist>>(
        '/artists/',
        { params },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('searchArtists', error);
      throw error;
    }
  }

  /**
   * Get artist by ID
   */
  async getArtistById(artistId: string): Promise<JamendoArtist | null> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoArtist>>(
        '/artists/',
        {
          params: {
            id: artistId,
            imagesize: 600,
          },
        },
      );
      this.checkResponse(data);
      return data.results[0] || null;
    } catch (error) {
      this.handleError('getArtistById', error);
      return null;
    }
  }

  /**
   * Get artist's tracks
   */
  async getArtistTracks(
    artistId: string,
    limit = 50,
  ): Promise<JamendoResponse<JamendoTrack>> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/artists/tracks/',
        {
          params: {
            id: artistId,
            limit: Math.min(limit, 200),
            imagesize: 600,
            audioformat: 'mp32',
          },
        },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('getArtistTracks', error);
      throw error;
    }
  }

  /**
   * Search albums
   */
  async searchAlbums(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoAlbum>> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoAlbum>>(
        '/albums/',
        {
          params: {
            namesearch: query,
            limit: Math.min(limit, 200),
            offset,
            imagesize: 600,
          },
        },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('searchAlbums', error);
      throw error;
    }
  }

  /**
   * Get album tracks
   */
  async getAlbumTracks(
    albumId: string,
  ): Promise<JamendoResponse<JamendoTrack>> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/albums/tracks/',
        {
          params: {
            id: albumId,
            imagesize: 600,
            audioformat: 'mp32',
          },
        },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('getAlbumTracks', error);
      throw error;
    }
  }

  /**
   * Autocomplete for search suggestions
   */
  async autocomplete(
    prefix: string,
    limit = 10,
  ): Promise<JamendoResponse<{ match: string }>> {
    try {
      const { data } = await this.client.get<JamendoResponse<{ match: string }>>(
        '/autocomplete/',
        {
          params: {
            prefix,
            limit: Math.min(limit, 200),
            entity: 'tracks',
          },
        },
      );
      return data;
    } catch (error) {
      this.handleError('autocomplete', error);
      throw error;
    }
  }

  /**
   * Get tracks by genre/tag
   */
  async getTracksByTag(
    tags: string[],
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoTrack>> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/tracks/',
        {
          params: {
            tags: tags.join('+'),
            limit: Math.min(limit, 200),
            offset,
            order: 'popularity_week',
            imagesize: 600,
            audioformat: 'mp32',
          },
        },
      );
      this.checkResponse(data);
      return data;
    } catch (error) {
      this.handleError('getTracksByTag', error);
      throw error;
    }
  }

  /**
   * Check total catalog count (for verification)
   */
  async getCatalogStats(): Promise<{ totalTracks: number; status: string }> {
    try {
      const { data } = await this.client.get<JamendoResponse<JamendoTrack>>(
        '/tracks/',
        {
          params: {
            limit: 1,
            offset: 0,
          },
        },
      );
      return {
        totalTracks: data.headers.results_count,
        status: data.headers.status,
      };
    } catch (error) {
      this.handleError('getCatalogStats', error);
      return { totalTracks: 0, status: 'error' };
    }
  }

  private checkResponse<T>(response: JamendoResponse<T>): void {
    if (response.headers.status === 'failed') {
      throw new HttpException(
        `Jamendo API error: ${response.headers.error_message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private handleError(method: string, error: any): void {
    if (axios.isAxiosError(error)) {
      this.logger.error(
        `Jamendo ${method} failed: ${error.response?.status} ${error.response?.data?.headers?.error_message || error.message}`,
      );
    } else {
      this.logger.error(`Jamendo ${method} failed: ${error.message}`);
    }
  }
}
