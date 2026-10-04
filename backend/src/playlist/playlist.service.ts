import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist, PlaylistTrack, LikedTrack } from './playlist.entity';
import { JamendoService } from '../jamendo/jamendo.service';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepo: Repository<Playlist>,
    @InjectRepository(PlaylistTrack)
    private readonly playlistTrackRepo: Repository<PlaylistTrack>,
    @InjectRepository(LikedTrack)
    private readonly likedTrackRepo: Repository<LikedTrack>,
    private readonly jamendo: JamendoService,
  ) {}

  // ─── PLAYLISTS ───

  async createPlaylist(userId: string, title: string, coverUrl?: string) {
    const playlist = this.playlistRepo.create({
      user_id: userId,
      title,
      cover_url: coverUrl,
    });
    return this.playlistRepo.save(playlist);
  }

  async getUserPlaylists(userId: string) {
    return this.playlistRepo.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async getPlaylistById(playlistId: string, userId: string) {
    const playlist = await this.playlistRepo.findOne({
      where: { id: playlistId, user_id: userId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');

    // Get tracks in playlist
    const playlistTracks = await this.playlistTrackRepo.find({
      where: { playlist_id: playlistId },
      order: { position: 'ASC' },
    });

    // Enrich with Jamendo data
    const trackIds = playlistTracks
      .filter((pt) => pt.source === 'jamendo')
      .map((pt) => pt.provider_id || pt.track_id);
    const jamendoTracks = trackIds.length
      ? await this.jamendo.getTracksByIds(trackIds)
      : [];
    const resolved = new Map(jamendoTracks.map((track) => [track.id, track]));
    const tracks = playlistTracks
      .map((pt) =>
        pt.metadata
          ? (JSON.parse(pt.metadata) as Record<string, unknown>)
          : resolved.get(pt.provider_id || pt.track_id),
      )
      .filter(Boolean);

    return {
      ...playlist,
      tracks,
      track_count: playlistTracks.length,
    };
  }

  private async requireOwner(playlistId: string, userId: string) {
    const playlist = await this.playlistRepo.findOne({
      where: { id: playlistId, user_id: userId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    return playlist;
  }

  async updatePlaylist(
    playlistId: string,
    userId: string,
    dto: { title?: string; cover_url?: string },
  ) {
    const playlist = await this.requireOwner(playlistId, userId);
    if (dto.title !== undefined) playlist.title = dto.title.trim();
    if (dto.cover_url !== undefined) playlist.cover_url = dto.cover_url;
    return this.playlistRepo.save(playlist);
  }

  async addTrackToPlaylist(
    playlistId: string,
    trackId: string,
    userId: string,
    source = 'jamendo',
    track?: Record<string, unknown>,
  ) {
    await this.requireOwner(playlistId, userId);
    const key = source + ':' + trackId;
    const duplicate = await this.playlistTrackRepo.findOne({
      where: { playlist_id: playlistId, track_id: key },
    });
    if (duplicate) return duplicate;
    // Get current max position
    const existing = await this.playlistTrackRepo.find({
      where: { playlist_id: playlistId },
      order: { position: 'DESC' },
      take: 1,
    });
    const position = existing.length > 0 ? existing[0].position + 1 : 0;

    const pt = this.playlistTrackRepo.create({
      playlist_id: playlistId,
      track_id: key,
      provider_id: trackId,
      source,
      metadata: track
        ? JSON.stringify({
            id: trackId,
            source,
            name: (typeof track.name === 'string' ? track.name : '').slice(
              0,
              200,
            ),
            artist_name: (typeof track.artist_name === 'string'
              ? track.artist_name
              : ''
            ).slice(0, 200),
            album_name: (typeof track.album_name === 'string'
              ? track.album_name
              : ''
            ).slice(0, 200),
            image: (typeof track.image === 'string' ? track.image : '').slice(
              0,
              2048,
            ),
            audio: (typeof track.audio === 'string' ? track.audio : '').slice(
              0,
              4096,
            ),
            duration: Number(track.duration) || 0,
          })
        : null,
      position,
    });
    return this.playlistTrackRepo.save(pt);
  }

  async removeTrackFromPlaylist(
    playlistId: string,
    trackId: string,
    userId: string,
  ) {
    await this.requireOwner(playlistId, userId);
    await this.playlistTrackRepo.delete({
      playlist_id: playlistId,
      track_id: trackId,
    });
    return { success: true };
  }

  async deletePlaylist(playlistId: string, userId: string) {
    const playlist = await this.playlistRepo.findOne({
      where: { id: playlistId, user_id: userId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');

    await this.playlistTrackRepo.delete({ playlist_id: playlistId });
    await this.playlistRepo.delete(playlistId);
    return { success: true };
  }

  // ─── LIKED TRACKS ───

  async likeTrack(userId: string, trackId: string) {
    const existing = await this.likedTrackRepo.findOne({
      where: { user_id: userId, track_id: trackId },
    });
    if (existing) return existing;

    const liked = this.likedTrackRepo.create({
      user_id: userId,
      track_id: trackId,
    });
    return this.likedTrackRepo.save(liked);
  }

  async unlikeTrack(userId: string, trackId: string) {
    await this.likedTrackRepo.delete({
      user_id: userId,
      track_id: trackId,
    });
    return { success: true };
  }

  async getLikedTracks(userId: string) {
    const liked = await this.likedTrackRepo.find({
      where: { user_id: userId },
      order: { liked_at: 'DESC' },
    });

    if (liked.length === 0) return [];

    // Enrich with Jamendo data
    const trackIds = liked.map((l) => l.track_id);
    return this.jamendo.getTracksByIds(trackIds);
  }

  async isTrackLiked(userId: string, trackId: string): Promise<boolean> {
    const liked = await this.likedTrackRepo.findOne({
      where: { user_id: userId, track_id: trackId },
    });
    return !!liked;
  }
}
