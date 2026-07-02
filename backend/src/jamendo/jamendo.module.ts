import { Module } from '@nestjs/common';
import { JamendoService } from './jamendo.service';

@Module({
  providers: [JamendoService],
  exports: [JamendoService],
})
export class JamendoModule {}
