import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Controller,
  Get,
  Query,
  Param,
  Headers,
  Post,
  Body,
  Res,
  UseGuards,
  Request,
  ForbiddenException,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';
import { SpotifyService } from './spotify.service';
import * as NodeID3 from 'node-id3';
import { GaanaService } from './gaana.service';
import { fetchRemote } from '../security/remote-fetch';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { JamendoService } from '../jamendo/jamendo.service';

let activeDownloads = 0;

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly spotify: SpotifyService,
    private readonly gaana: GaanaService,
    private readonly jamendo: JamendoService,
  ) {}

  /**
   * GET /api/catalog/proxy?url=
   * Simple proxy for local web development to bypass JioSaavn CORS
   */
  @Get('proxy')
  async proxy(@Query('url') url: string) {
    const { data } = await fetchRemote(url);
    return data;
  }

  /**
   * GET /api/catalog/stats
   * Verify total catalog count
   */
  @Get('stats')
  getStats() {
    return {
      totalTracks: null,
      status: 'unavailable',
      message: 'A verified catalog count is not available',
    };
  }

  @Get('jamendo/:id')
  getJamendoTrack(@Param('id') id: string) {
    return this.jamendo.getTrackById(id);
  }

  @Get('albums/:id')
  getAlbum(@Param('id') id: string) {
    return this.spotify.getAlbumById(id);
  }

  /**
   * GET /api/catalog/tracks?q=&limit=&offset=&order=
   * Search or list tracks
   */
  @Get('tracks')
  async getTracks(
    @Query('q') query?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = Math.min(parseInt(limit || '20', 10), 50);
    const off = parseInt(offset || '0', 10);

    if (query) {
      return this.spotify.searchTracks(query, lim, off);
    }

    return this.spotify.getPopularTracks(lim, off);
  }

  /**
   * GET /api/catalog/tracks/:id
   * Get single track by ID
   */
  @Get('tracks/:id')
  async getTrackById(@Param('id') id: string) {
    const track = await this.spotify.getTrackById(id);
    if (!track) {
      return { error: 'Track not found' };
    }
    return track;
  }

  /**
   * GET /api/catalog/tracks/:id/similar
   * Get similar tracks
   */
  @Get('tracks/:id/similar')
  async getSimilarTracks(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.spotify.getSimilarTracks(id, parseInt(limit || '10', 10));
  }

  /**
   * GET /api/catalog/artists?q=&limit=&offset=
   * Search artists
   */
  @Get('artists')
  async getArtists(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = Math.min(parseInt(limit || '20', 10), 50);
    const off = parseInt(offset || '0', 10);

    // If no query, return some popular artists as fallback
    if (!query) {
      return this.spotify.searchArtists('pop', lim, off);
    }
    return this.spotify.searchArtists(query, lim, off);
  }

  /**
   * GET /api/catalog/artists/:id
   * Get artist by ID
   */
  @Get('artists/:id')
  async getArtistById(@Param('id') id: string) {
    return this.spotify.getArtistById(id);
  }

  /**
   * GET /api/catalog/artists/:id/tracks
   * Get artist's tracks
   */
  @Get('artists/:id/tracks')
  async getArtistTracks(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.spotify.getArtistTracks(id, parseInt(limit || '50', 10));
  }

  /**
   * GET /api/catalog/albums?q=&limit=&offset=
   * Search albums
   */
  @Get('albums')
  async getAlbums(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = Math.min(parseInt(limit || '20', 10), 50);
    const off = parseInt(offset || '0', 10);
    return this.spotify.searchAlbums(query || 'new', lim, off);
  }

  /**
   * GET /api/catalog/albums/:id/tracks
   * Get album's tracks
   */
  @Get('albums/:id/tracks')
  async getAlbumTracks(@Param('id') id: string) {
    return this.spotify.getAlbumTracks(id);
  }

  @Get('search')
  async search(@Query('q') query: string, @Query('limit') limit?: string) {
    if (!query || query.length < 2) {
      return { tracks: [], artists: [], albums: [] };
    }

    const lim = Math.min(parseInt(limit || '10', 10), 20);

    const [tracks, artists, albums, gaana] = await Promise.allSettled([
      this.spotify.searchTracks(query, lim),
      this.spotify.searchArtists(query, lim),
      this.spotify.searchAlbums(query, lim),
      this.gaana.searchTracks(query, lim),
    ]);

    // Merge Spotify and Gaana tracks. Put Gaana first since they have direct stream URLs and are great for Indian music
    const spotifyTracks =
      tracks.status === 'fulfilled' ? tracks.value.results : [];
    const gaanaTracks = gaana.status === 'fulfilled' ? gaana.value.results : [];
    const mergedTracks = [...gaanaTracks, ...spotifyTracks].slice(0, lim * 2);

    return {
      tracks: mergedTracks,
      artists: artists.status === 'fulfilled' ? artists.value.results : [],
      albums: albums.status === 'fulfilled' ? albums.value.results : [],
      partial: [tracks, artists, albums, gaana].some(
        (result) => result.status === 'rejected',
      ),
    };
  }

  /**
   * GET /api/catalog/autocomplete?q=
   * Search suggestions
   */
  @Get('autocomplete')
  async autocomplete(@Query('q') prefix: string) {
    if (!prefix) return { results: [] };
    const res = await this.spotify.searchTracks(prefix, 10);
    return { results: res.results.map((t) => ({ match: t.name })) };
  }

  /**
   * GET /api/catalog/genres/:tag
   * Get tracks by genre/tag
   */
  @Get('genres/:tag')
  async getByGenre(
    @Param('tag') tag: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = Math.min(parseInt(limit || '20', 10), 50);
    const off = parseInt(offset || '0', 10);
    // Use Spotify search with genre filter
    return this.spotify.searchTracks(`genre:${tag}`, lim, off);
  }

  /**
   * GET /api/catalog/import-spotify?url=
   * Parse a public Spotify playlist URL
   */
  @Get('import-spotify')
  async importSpotify(@Query('url') url: string) {
    if (!url) {
      return { error: 'URL is required' };
    }
    return this.spotify.importPlaylist(url);
  }

  /**
   * POST /api/catalog/translate-lyrics
   * Translate text using translate-google
   */
  @Post('translate-lyrics')
  translateLyrics() {
    throw new ServiceUnavailableException(
      'Lyrics translation is currently unavailable',
    );
  }

  /**
   * GET /api/catalog/download
   * Download audio and embed ID3 tags
   */
  @Get('download')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  async downloadTagged(
    @Request() req: AuthenticatedRequest,
    @Query('audioUrl') audioUrl: string,
    @Query('title') title: string,
    @Query('artist') artist: string,
    @Query('album') album: string,
    @Query('imageUrl') imageUrl: string,
    @Res() res: Response,
  ) {
    if (!audioUrl)
      return res.status(400).send({ error: 'Audio URL is required' });
    if (!req.user.is_premium)
      throw new ForbiddenException('An active subscription is required');
    if (activeDownloads >= 2)
      throw new ServiceUnavailableException(
        'Downloads are busy. Retry shortly.',
      );
    activeDownloads++;

    try {
      const audioResponse = await fetchRemote<Buffer>(
        audioUrl,
        30 * 1024 * 1024,
        'arraybuffer',
      );
      const audioBuffer = Buffer.from(audioResponse.data);
      const mime = String(audioResponse.headers['content-type'] || '').split(
        ';',
      )[0];
      const formats: Record<string, string> = {
        'audio/mp4': 'm4a',
        'video/mp4': 'm4a',
        'audio/aac': 'aac',
        'audio/ogg': 'ogg',
        'audio/webm': 'webm',
        'video/webm': 'webm',
      };
      if (formats[mime]) {
        res.set({
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(title || 'track')}.${formats[mime]}"`,
        });
        return res.send(audioBuffer);
      }
      if (!['audio/mpeg', 'audio/mp3'].includes(mime))
        return res.status(415).send({ error: 'Unsupported audio format' });

      const tags: NodeID3.Tags = {
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        album: album || 'Unknown Album',
      };

      if (imageUrl) {
        try {
          const imageResponse = await fetchRemote<Buffer>(
            imageUrl,
            2 * 1024 * 1024,
            'arraybuffer',
          );
          tags.image = {
            mime: 'image/jpeg',
            type: {
              id: 3,
              name: 'front cover',
            },
            description: 'Cover',
            imageBuffer: Buffer.from(imageResponse.data),
          };
        } catch (e) {
          console.error('Failed to fetch image for tags', e);
        }
      }

      const taggedBuffer = NodeID3.write(tags, audioBuffer);

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title || 'track')}.mp3"`,
      });

      return res.send(taggedBuffer);
    } catch (err) {
      console.error('Download error:', err);
      return res
        .status(err instanceof HttpException ? err.getStatus() : 500)
        .send({ error: 'Failed to process download' });
    } finally {
      activeDownloads--;
    }
  }
}
