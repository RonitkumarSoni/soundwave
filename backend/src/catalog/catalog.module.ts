import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogController } from './catalog.controller';
import { SpotifyService } from './spotify.service';

@Module({
  imports: [ConfigModule],
  controllers: [CatalogController],
  providers: [SpotifyService],
})
export class CatalogModule {}
