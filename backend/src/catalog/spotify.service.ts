import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { JamendoTrack, JamendoArtist, JamendoAlbum, JamendoResponse } from '../jamendo/jamendo.service';

/**
 * Spotify API service
 * Maps Spotify responses to the existing Jamendo interfaces to prevent frontend breakage.
 */

@Injectable()
export class SpotifyService {
  private readonly logger = new Logger(SpotifyService.name);
  private readonly client: AxiosInstance;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID', '');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET', '');

    this.client = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 10000,
    });

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn('⚠️  SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set!');
    } else {
      this.logger.log('✅ Spotify API initialized.');
    }
  }

  /**
   * Retrieves an access token using Client Credentials flow
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken as string;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Expire 5 minutes early to be safe
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;
      
      this.logger.log('✅ Obtained new Spotify access token.');
      return this.accessToken || '';
    } catch (error: any) {
      this.logger.error(`Failed to get Spotify access token: ${error.message}`);
      throw new HttpException('Spotify Authentication Failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Wrapper for making authenticated requests to Spotify API
   */
  private async request<T>(endpoint: string, params: any = {}): Promise<T> {
    const token = await this.getAccessToken();
    try {
      const { data } = await this.client.get<T>(endpoint, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    } catch (error: any) {
      this.logger.error(`Spotify API error on ${endpoint}: ${error.response?.data?.error?.message || error.message}`);
      throw new HttpException(
        error.response?.data?.error?.message || 'Spotify API Error',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Formats a Spotify Track to match JamendoTrack interface
   */
  private formatTrack(track: any): JamendoTrack {
    return {
      id: track.id,
      name: track.name,
      duration: Math.floor(track.duration_ms / 1000),
      artist_id: track.artists[0]?.id || '',
      artist_name: track.artists[0]?.name || 'Unknown Artist',
      artist_idstr: track.artists[0]?.name || 'Unknown Artist',
      album_name: track.album?.name || 'Unknown Album',
      album_id: track.album?.id || '',
      album_image: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || '',
      image: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || '',
      audio: track.preview_url || '',
      audiodownload: track.external_urls?.spotify || '',
      prourl: track.external_urls?.spotify || '',
      shorturl: track.external_urls?.spotify || '',
      shareurl: track.external_urls?.spotify || '',
      releasedate: track.album?.release_date || '',
      position: 0,
      source: 'spotify'
    } as JamendoTrack & { source: string };
  }

  /**
   * Formats a Spotify Artist to match JamendoArtist interface
   */
  private formatArtist(artist: any): JamendoArtist {
    return {
      id: artist.id,
      name: artist.name,
      website: artist.external_urls?.spotify || '',
      joindate: '',
      image: artist.images?.[0]?.url || artist.images?.[1]?.url || '',
      shorturl: artist.external_urls?.spotify || '',
      shareurl: artist.external_urls?.spotify || '',
      source: 'spotify'
    } as JamendoArtist & { source: string };
  }

  /**
   * Formats a Spotify Album to match JamendoAlbum interface
   */
  private formatAlbum(album: any): JamendoAlbum {
    return {
      id: album.id,
      name: album.name,
      releasedate: album.release_date || '',
      artist_id: album.artists[0]?.id || '',
      artist_name: album.artists[0]?.name || 'Unknown Artist',
      image: album.images?.[0]?.url || album.images?.[1]?.url || '',
      zip: '',
      source: 'spotify'
    } as JamendoAlbum & { source: string };
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

  async searchTracks(query: string, limit = 20, offset = 0): Promise<JamendoResponse<JamendoTrack>> {
    const data = await this.request<any>('/search', { q: query, type: 'track', limit, offset });
    const formatted = (data.tracks?.items || []).map((t: any) => this.formatTrack(t));
    return this.wrapResponse(formatted, data.tracks?.total || 0);
  }

  async getPopularTracks(limit = 20, offset = 0): Promise<JamendoResponse<JamendoTrack>> {
    // Spotify doesn't have a direct "popular tracks" endpoint without a user token.
    // Workaround: search for tracks released in the current year, sorted by popularity (default for search).
    const year = new Date().getFullYear();
    const data = await this.request<any>('/search', { q: `year:${year}`, type: 'track', limit, offset });
    // Filter out tracks without preview_url for a better UX, though we might have fewer results
    let items = (data.tracks?.items || []);
    items = items.filter((t: any) => t.preview_url); // Optional: only return playable previews
    const formatted = items.map((t: any) => this.formatTrack(t));
    return this.wrapResponse(formatted, data.tracks?.total || 0);
  }

  async getTrackById(trackId: string): Promise<JamendoTrack | null> {
    try {
      const track = await this.request<any>(`/tracks/${trackId}`);
      return this.formatTrack(track);
    } catch (e) {
      return null;
    }
  }

  async getSimilarTracks(trackId: string, limit = 10): Promise<JamendoResponse<JamendoTrack>> {
    try {
      const data = await this.request<any>('/recommendations', { seed_tracks: trackId, limit });
      const formatted = (data.tracks || []).map((t: any) => this.formatTrack(t));
      return this.wrapResponse(formatted, data.tracks?.length || 0);
    } catch (e) {
      return this.wrapResponse([]);
    }
  }

  async searchArtists(query: string, limit = 20, offset = 0): Promise<JamendoResponse<JamendoArtist>> {
    if (!query) return this.wrapResponse([]);
    const data = await this.request<any>('/search', { q: query, type: 'artist', limit, offset });
    const formatted = (data.artists?.items || []).map((a: any) => this.formatArtist(a));
    return this.wrapResponse(formatted, data.artists?.total || 0);
  }

  async getArtistById(artistId: string): Promise<JamendoArtist | null> {
    try {
      const artist = await this.request<any>(`/artists/${artistId}`);
      return this.formatArtist(artist);
    } catch (e) {
      return null;
    }
  }

  async getArtistTracks(artistId: string, limit = 50): Promise<JamendoResponse<JamendoTrack>> {
    // Top tracks for an artist require a market. We'll use 'US' as default.
    const data = await this.request<any>(`/artists/${artistId}/top-tracks`, { market: 'US' });
    const formatted = (data.tracks || []).slice(0, limit).map((t: any) => this.formatTrack(t));
    return this.wrapResponse(formatted, data.tracks?.length || 0);
  }

  async searchAlbums(query: string, limit = 20, offset = 0): Promise<JamendoResponse<JamendoAlbum>> {
    if (!query) return this.wrapResponse([]);
    const data = await this.request<any>('/search', { q: query, type: 'album', limit, offset });
    const formatted = (data.albums?.items || []).map((a: any) => this.formatAlbum(a));
    return this.wrapResponse(formatted, data.albums?.total || 0);
  }

  async getAlbumTracks(albumId: string): Promise<JamendoResponse<JamendoTrack>> {
    const data = await this.request<any>(`/albums/${albumId}/tracks`);
    const formatted = (data.items || []).map((t: any) => this.formatTrack(t));
    return this.wrapResponse(formatted, data.total || 0);
  }

  async importPlaylist(url: string) {
    try {
      const fetch = require('isomorphic-unfetch');
      const spotifyUrlInfo = require('spotify-url-info')(fetch);
      
      const data = await spotifyUrlInfo.getData(url);
      
      if (data?.type === 'playlist') {
        const tracks = data.trackList.map((track: any) => ({
          title: track.title,
          subtitle: track.subtitle,
        }));
        
        return {
          id: data.id,
          name: data.name,
          cover: data.coverArt?.sources?.[0]?.url || data.coverArt?.sources?.[2]?.url,
          tracks: tracks
        };
      } else if (data?.type === 'album') {
        const tracks = data.trackList.map((track: any) => ({
          title: track.title,
          subtitle: track.subtitle,
        }));
        
        return {
          id: data.id,
          name: data.name,
          cover: data.coverArt?.sources?.[0]?.url,
          tracks: tracks
        };
      }
      
      throw new Error('Unsupported Spotify URL type');
    } catch (error) {
      this.logger.error('Spotify import error:', error);
      throw new HttpException('Failed to parse Spotify URL', HttpStatus.BAD_REQUEST);
    }
  }
}
