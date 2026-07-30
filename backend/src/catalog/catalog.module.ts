import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogController } from './catalog.controller';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';
import { YoutubeController } from './youtube.controller';

@Module({
  imports: [ConfigModule],
  controllers: [CatalogController, YoutubeController],
  providers: [SpotifyService, YoutubeService],
})
export class CatalogModule {}
