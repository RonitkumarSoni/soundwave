import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogController } from './catalog.controller';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';
import { YoutubeController } from './youtube.controller';
import { GaanaService } from './gaana.service';
import { JamendoModule } from '../jamendo/jamendo.module';

@Module({
  imports: [ConfigModule, JamendoModule],
  controllers: [CatalogController, YoutubeController],
  providers: [SpotifyService, YoutubeService, GaanaService],
})
export class CatalogModule {}
