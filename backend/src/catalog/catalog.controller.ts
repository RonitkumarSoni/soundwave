import { Controller, Get, Query, Param } from '@nestjs/common';
import { SpotifyService } from './spotify.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly spotify: SpotifyService,
  ) {}

  /**
   * GET /api/catalog/proxy?url=
   * Simple proxy for local web development to bypass JioSaavn CORS
   */
  @Get('proxy')
  async proxy(@Query('url') url: string) {
    const axios = require('axios');
    const { data } = await axios.get(url);
    return data;
  }

  /**
   * GET /api/catalog/stats
   * Verify total catalog count
   */
  @Get('stats')
  async getStats() {
    return { totalTracks: 'Millions', status: 'success' };
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
    @Query('order') order?: string,
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
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.length < 2) {
      return { tracks: [], artists: [], albums: [] };
    }

    const lim = Math.min(parseInt(limit || '10', 10), 20);

    const [spotifyTracks, spotifyArtists, spotifyAlbums] = await Promise.all([
      this.spotify.searchTracks(query, lim),
      this.spotify.searchArtists(query, lim),
      this.spotify.searchAlbums(query, lim),
    ]);

    return {
      tracks: spotifyTracks.results,
      artists: spotifyArtists.results,
      albums: spotifyAlbums.results,
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
    return { results: res.results.map(t => ({ match: t.name })) };
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
}

