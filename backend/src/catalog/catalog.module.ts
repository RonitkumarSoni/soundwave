import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { JamendoModule } from '../jamendo/jamendo.module';
import { DeezerService } from './deezer.service';

@Module({
  imports: [JamendoModule],
  controllers: [CatalogController],
  providers: [DeezerService],
})
export class CatalogModule {}
