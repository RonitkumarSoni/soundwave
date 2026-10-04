import type { AuthenticatedRequest } from '../auth/authenticated-request';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddTrackDto,
} from './playlist.dto';

@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlists: PlaylistService) {}
  @Post()
  createPlaylist(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreatePlaylistDto,
  ) {
    return this.playlists.createPlaylist(
      req.user.id,
      body.title.trim(),
      body.cover_url,
    );
  }
  @Get()
  getMyPlaylists(@Request() req: AuthenticatedRequest) {
    return this.playlists.getUserPlaylists(req.user.id);
  }
  @Get('likes')
  getLikedTracks(@Request() req: AuthenticatedRequest) {
    return this.playlists.getLikedTracks(req.user.id);
  }
  @Post('likes/:trackId')
  likeTrack(
    @Request() req: AuthenticatedRequest,
    @Param('trackId') id: string,
  ) {
    return this.playlists.likeTrack(req.user.id, id);
  }
  @Delete('likes/:trackId')
  unlikeTrack(
    @Request() req: AuthenticatedRequest,
    @Param('trackId') id: string,
  ) {
    return this.playlists.unlikeTrack(req.user.id, id);
  }
  @Get('likes/:trackId/check')
  async isLiked(
    @Request() req: AuthenticatedRequest,
    @Param('trackId') id: string,
  ) {
    return { liked: await this.playlists.isTrackLiked(req.user.id, id) };
  }
  @Get(':id')
  getPlaylistById(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.playlists.getPlaylistById(id, req.user.id);
  }
  @Patch(':id')
  updatePlaylist(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlists.updatePlaylist(id, req.user.id, dto);
  }
  @Post(':id/tracks')
  addTrack(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTrackDto,
  ) {
    return this.playlists.addTrackToPlaylist(
      id,
      dto.track_id,
      req.user.id,
      dto.source,
      dto.track,
    );
  }
  @Delete(':id/tracks/:trackId')
  removeTrack(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('trackId') trackId: string,
  ) {
    return this.playlists.removeTrackFromPlaylist(id, trackId, req.user.id);
  }
  @Delete(':id')
  deletePlaylist(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.playlists.deletePlaylist(id, req.user.id);
  }
}
