import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  // ─── PLAYLISTS ───

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPlaylist(
    @Request() req: any,
    @Body() body: { title: string; cover_url?: string },
  ) {
    return this.playlistService.createPlaylist(
      req.user.id,
      body.title,
      body.cover_url,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyPlaylists(@Request() req: any) {
    return this.playlistService.getUserPlaylists(req.user.id);
  }

  @Get(':id')
  async getPlaylistById(@Param('id') id: string) {
    return this.playlistService.getPlaylistById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tracks')
  async addTrack(
    @Param('id') id: string,
    @Body() body: { track_id: string },
  ) {
    return this.playlistService.addTrackToPlaylist(id, body.track_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/tracks/:trackId')
  async removeTrack(
    @Param('id') id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlistService.removeTrackFromPlaylist(id, trackId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePlaylist(@Request() req: any, @Param('id') id: string) {
    return this.playlistService.deletePlaylist(id, req.user.id);
  }

  // ─── LIKED TRACKS ───

  @UseGuards(JwtAuthGuard)
  @Post('likes/:trackId')
  async likeTrack(@Request() req: any, @Param('trackId') trackId: string) {
    return this.playlistService.likeTrack(req.user.id, trackId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('likes/:trackId')
  async unlikeTrack(@Request() req: any, @Param('trackId') trackId: string) {
    return this.playlistService.unlikeTrack(req.user.id, trackId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('likes')
  async getLikedTracks(@Request() req: any) {
    return this.playlistService.getLikedTracks(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('likes/:trackId/check')
  async isLiked(@Request() req: any, @Param('trackId') trackId: string) {
    const liked = await this.playlistService.isTrackLiked(
      req.user.id,
      trackId,
    );
    return { liked };
  }
}
