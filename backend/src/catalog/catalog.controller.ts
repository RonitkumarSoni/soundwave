import { Controller, Get, Query, Param } from '@nestjs/common';
import { JamendoService } from '../jamendo/jamendo.service';
import { DeezerService } from './deezer.service';

@Controller('catalog')
export class CatalogController {
  constructor(
    private readonly jamendo: JamendoService,
    private readonly deezer: DeezerService,
  ) {}

  /**
   * GET /api/catalog/stats
   * Verify total catalog count (5 lakh+ songs check)
   */
  @Get('stats')
  async getStats() {
    return this.jamendo.getCatalogStats();
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
    const lim = Math.min(parseInt(limit || '20', 10), 200);
    const off = parseInt(offset || '0', 10);

    if (query) {
      return this.jamendo.searchTracks(query, lim, off);
    }

    return this.jamendo.getPopularTracks(lim, off, order || 'popularity_week');
  }

  /**
   * GET /api/catalog/tracks/:id
   * Get single track by ID
   */
  @Get('tracks/:id')
  async getTrackById(@Param('id') id: string) {
    const track = await this.jamendo.getTrackById(id);
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
    return this.jamendo.getSimilarTracks(id, parseInt(limit || '10', 10));
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
    const lim = Math.min(parseInt(limit || '20', 10), 200);
    const off = parseInt(offset || '0', 10);
    return this.jamendo.searchArtists(query || '', lim, off);
  }

  /**
   * GET /api/catalog/artists/:id
   * Get artist by ID
   */
  @Get('artists/:id')
  async getArtistById(@Param('id') id: string) {
    return this.jamendo.getArtistById(id);
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
    return this.jamendo.getArtistTracks(id, parseInt(limit || '50', 10));
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
    const lim = Math.min(parseInt(limit || '20', 10), 200);
    const off = parseInt(offset || '0', 10);
    return this.jamendo.searchAlbums(query || '', lim, off);
  }

  /**
   * GET /api/catalog/albums/:id/tracks
   * Get album's tracks
   */
  @Get('albums/:id/tracks')
  async getAlbumTracks(@Param('id') id: string) {
    return this.jamendo.getAlbumTracks(id);
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

    const [jamendoTracks, jamendoArtists, jamendoAlbums, deezerTracks] = await Promise.all([
      this.jamendo.searchTracks(query, lim),
      this.jamendo.searchArtists(query, lim),
      this.jamendo.searchAlbums(query, lim),
      this.deezer.searchTracks(query, lim),
    ]);

    // Format Jamendo tracks
    const formattedJamendo = jamendoTracks.results.map((jt: any) => ({
      ...jt,
      source: 'jamendo',
    }));

    // Combine
    const combinedTracks = [
      ...formattedJamendo,
      ...deezerTracks,
    ];

    return {
      tracks: combinedTracks,
      artists: jamendoArtists.results,
      albums: jamendoAlbums.results,
    };
  }

  /**
   * GET /api/catalog/autocomplete?q=
   * Search suggestions
   */
  @Get('autocomplete')
  async autocomplete(@Query('q') prefix: string) {
    return this.jamendo.autocomplete(prefix || '', 10);
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
    const lim = Math.min(parseInt(limit || '20', 10), 200);
    const off = parseInt(offset || '0', 10);
    return this.jamendo.getTracksByTag([tag], lim, off);
  }
}
