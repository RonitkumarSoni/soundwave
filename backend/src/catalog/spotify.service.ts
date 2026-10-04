import type {
  SpotifyTrack,
  SpotifyArtist,
  SpotifyAlbum,
  SpotifySearch,
  ImportedPlaylist,
} from './provider-types';
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  JamendoTrack,
  JamendoArtist,
  JamendoAlbum,
  JamendoResponse,
} from '../jamendo/jamendo.service';

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
    this.clientSecret = this.configService.get<string>(
      'SPOTIFY_CLIENT_SECRET',
      '',
    );

    this.client = axios.create({
      baseURL: 'https://api.spotify.com/v1',
      timeout: 10000,
    });

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn(
        '⚠️  SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set!',
      );
    } else {
      this.logger.log('✅ Spotify API initialized.');
    }
  }

  /**
   * Retrieves an access token using Client Credentials flow
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');
      const response = await axios.post<{
        access_token: string;
        expires_in: number;
      }>(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          timeout: 10000,
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Expire 5 minutes early to be safe
      this.tokenExpiresAt =
        Date.now() + (response.data.expires_in - 300) * 1000;

      this.logger.log('✅ Obtained new Spotify access token.');
      return this.accessToken || '';
    } catch (error) {
      this.logger.error('Failed to get Spotify access token', error);
      throw new HttpException(
        'Spotify Authentication Failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Wrapper for making authenticated requests to Spotify API
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
  ): Promise<T> {
    const token = await this.getAccessToken();
    try {
      const { data } = await this.client.get<T>(endpoint, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    } catch (error) {
      this.logger.error('Spotify API unavailable', error);
      throw new HttpException(
        'Spotify API unavailable',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Formats a Spotify Track to match JamendoTrack interface
   */
  private formatTrack(track: SpotifyTrack): JamendoTrack {
    return {
      id: track.id,
      name: track.name,
      duration: Math.floor(track.duration_ms / 1000),
      artist_id: track.artists[0]?.id || '',
      artist_name: track.artists[0]?.name || 'Unknown Artist',
      artist_idstr: track.artists[0]?.name || 'Unknown Artist',
      album_name: track.album?.name || 'Unknown Album',
      album_id: track.album?.id || '',
      album_image:
        track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || '',
      image:
        track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || '',
      audio: track.preview_url || '',
      audiodownload: track.external_urls?.spotify || '',
      prourl: track.external_urls?.spotify || '',
      shorturl: track.external_urls?.spotify || '',
      shareurl: track.external_urls?.spotify || '',
      releasedate: track.album?.release_date || '',
      position: 0,
      source: 'spotify',
    } as JamendoTrack & { source: string };
  }

  /**
   * Formats a Spotify Artist to match JamendoArtist interface
   */
  private formatArtist(artist: SpotifyArtist): JamendoArtist {
    return {
      id: artist.id,
      name: artist.name,
      website: artist.external_urls?.spotify || '',
      joindate: '',
      image: artist.images?.[0]?.url || artist.images?.[1]?.url || '',
      shorturl: artist.external_urls?.spotify || '',
      shareurl: artist.external_urls?.spotify || '',
      source: 'spotify',
    } as JamendoArtist & { source: string };
  }

  /**
   * Formats a Spotify Album to match JamendoAlbum interface
   */
  private formatAlbum(album: SpotifyAlbum): JamendoAlbum {
    return {
      id: album.id,
      name: album.name,
      releasedate: album.release_date || '',
      artist_id: album.artists[0]?.id || '',
      artist_name: album.artists[0]?.name || 'Unknown Artist',
      image: album.images?.[0]?.url || album.images?.[1]?.url || '',
      zip: '',
      source: 'spotify',
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

  async searchTracks(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoTrack>> {
    const data = await this.request<SpotifySearch>('/search', {
      q: query,
      type: 'track',
      limit,
      offset,
    });
    const formatted = (data.tracks?.items || []).map((t: SpotifyTrack) =>
      this.formatTrack(t),
    );
    return this.wrapResponse(formatted, data.tracks?.total || 0);
  }

  async getPopularTracks(
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoTrack>> {
    // Spotify doesn't have a direct "popular tracks" endpoint without a user token.
    // Workaround: search for tracks released in the current year, sorted by popularity (default for search).
    const year = new Date().getFullYear();
    const data = await this.request<SpotifySearch>('/search', {
      q: `year:${year}`,
      type: 'track',
      limit,
      offset,
    });
    // Filter out tracks without preview_url for a better UX, though we might have fewer results
    let items = data.tracks?.items || [];
    items = items.filter((t: SpotifyTrack) => t.preview_url); // Optional: only return playable previews
    const formatted = items.map((t: SpotifyTrack) => this.formatTrack(t));
    return this.wrapResponse(formatted, data.tracks?.total || 0);
  }

  async getTrackById(trackId: string): Promise<JamendoTrack | null> {
    try {
      const track = await this.request<SpotifyTrack>(`/tracks/${trackId}`);
      return this.formatTrack(track);
    } catch {
      return null;
    }
  }

  async getSimilarTracks(
    trackId: string,
    limit = 10,
  ): Promise<JamendoResponse<JamendoTrack>> {
    const seed = await this.getTrackById(trackId);
    if (!seed) return this.wrapResponse([]);
    const results = await this.searchTracks(
      'artist:"' + seed.artist_name.replaceAll('"', '') + '"',
      limit + 1,
    );
    return this.wrapResponse(
      results.results.filter((track) => track.id !== trackId).slice(0, limit),
    );
  }

  async searchArtists(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoArtist>> {
    if (!query) return this.wrapResponse([]);
    const data = await this.request<SpotifySearch>('/search', {
      q: query,
      type: 'artist',
      limit,
      offset,
    });
    const formatted = (data.artists?.items || []).map((a: SpotifyArtist) =>
      this.formatArtist(a),
    );
    return this.wrapResponse(formatted, data.artists?.total || 0);
  }

  async getArtistById(artistId: string): Promise<JamendoArtist | null> {
    try {
      const artist = await this.request<SpotifyArtist>(`/artists/${artistId}`);
      return this.formatArtist(artist);
    } catch {
      return null;
    }
  }

  async getArtistTracks(
    artistId: string,
    limit = 50,
  ): Promise<JamendoResponse<JamendoTrack>> {
    const artist = await this.getArtistById(artistId);
    if (!artist) return this.wrapResponse([]);
    const response = await this.searchTracks(
      'artist:"' + artist.name.replaceAll('"', '') + '"',
      Math.min(limit, 10),
    );
    return this.wrapResponse(
      response.results.filter((track) => track.artist_id === artistId),
    );
  }

  async searchAlbums(
    query: string,
    limit = 20,
    offset = 0,
  ): Promise<JamendoResponse<JamendoAlbum>> {
    if (!query) return this.wrapResponse([]);
    const data = await this.request<SpotifySearch>('/search', {
      q: query,
      type: 'album',
      limit,
      offset,
    });
    const formatted = (data.albums?.items || []).map((a: SpotifyAlbum) =>
      this.formatAlbum(a),
    );
    return this.wrapResponse(formatted, data.albums?.total || 0);
  }

  async getAlbumTracks(
    albumId: string,
  ): Promise<JamendoResponse<JamendoTrack>> {
    const album = await this.request<SpotifyAlbum>(`/albums/${albumId}`);
    const formatted = (album.tracks?.items || []).map((t: SpotifyTrack) =>
      this.formatTrack({ ...t, album }),
    );
    return this.wrapResponse(formatted, album.tracks?.total || 0);
  }

  async getAlbumById(id: string) {
    return this.formatAlbum(await this.request<SpotifyAlbum>(`/albums/${id}`));
  }

  async importPlaylist(url: string) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new HttpException('Invalid Spotify URL', HttpStatus.BAD_REQUEST);
    }
    if (
      parsed.protocol !== 'https:' ||
      parsed.hostname !== 'open.spotify.com' ||
      parsed.username ||
      parsed.password ||
      !/^\/(playlist|album)\/[A-Za-z0-9]+$/.test(parsed.pathname)
    )
      throw new HttpException(
        'Use a public Spotify playlist or album URL',
        HttpStatus.BAD_REQUEST,
      );
    try {
      // This library exposes a CommonJS factory without bundled types.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const createInfo = require('spotify-url-info') as (
        fetcher: typeof fetch,
      ) => { getData(url: string): Promise<ImportedPlaylist> };
      const spotifyUrlInfo = createInfo(fetch);

      const data = await spotifyUrlInfo.getData(url);

      if (data?.type === 'playlist') {
        const tracks = data.trackList.map((track) => ({
          title: track.title,
          subtitle: track.subtitle,
        }));

        return {
          id: data.id,
          name: data.name,
          cover:
            data.coverArt?.sources?.[0]?.url ||
            data.coverArt?.sources?.[2]?.url,
          tracks: tracks,
        };
      } else if (data?.type === 'album') {
        const tracks = data.trackList.map((track) => ({
          title: track.title,
          subtitle: track.subtitle,
        }));

        return {
          id: data.id,
          name: data.name,
          cover: data.coverArt?.sources?.[0]?.url,
          tracks: tracks,
        };
      }

      throw new Error('Unsupported Spotify URL type');
    } catch (error) {
      this.logger.error('Spotify import error:', error);
      throw new HttpException(
        'Failed to parse Spotify URL',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
