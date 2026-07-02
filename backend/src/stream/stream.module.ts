import { Module } from '@nestjs/common';
import { StreamController } from './stream.controller';
import { JamendoModule } from '../jamendo/jamendo.module';

@Module({
  imports: [JamendoModule],
  controllers: [StreamController],
})
export class StreamModule {}
