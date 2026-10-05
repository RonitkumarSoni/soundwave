import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DeviceToken } from '../notifications/device-token.entity';
import { PushController } from '../notifications/push.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, DeviceToken])],
  providers: [UserService],
  controllers: [UserController, PushController],
  exports: [UserService],
})
export class UserModule {}
