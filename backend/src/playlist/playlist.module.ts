import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist, PlaylistTrack, LikedTrack } from './playlist.entity';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { JamendoModule } from '../jamendo/jamendo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, PlaylistTrack, LikedTrack]),
    JamendoModule,
  ],
  providers: [PlaylistService],
  controllers: [PlaylistController],
  exports: [PlaylistService],
})
export class PlaylistModule {}
