import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { createHash } from 'node:crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FirebaseIdentityService } from '../auth/firebase-identity.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { DeviceToken } from './device-token.entity';

class DeviceDto {
  @IsString() @MinLength(20) @MaxLength(4096) token: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(
    @InjectRepository(DeviceToken)
    private readonly devices: Repository<DeviceToken>,
    private readonly identity: FirebaseIdentityService,
  ) {}

  @Post('devices')
  async register(
    @Request() request: AuthenticatedRequest,
    @Body() body: DeviceDto,
  ) {
    await this.devices.upsert(
      {
        id: createHash('sha256').update(body.token).digest('hex'),
        token: body.token,
        user_id: request.user.id,
      },
      ['id'],
    );
    return { registered: true };
  }

  @Delete('devices')
  async unregister(
    @Request() request: AuthenticatedRequest,
    @Body() body: DeviceDto,
  ) {
    await this.devices.delete({
      id: createHash('sha256').update(body.token).digest('hex'),
      user_id: request.user.id,
    });
    return { registered: false };
  }

  @Post('test')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async test(@Request() request: AuthenticatedRequest) {
    const devices = await this.devices.find({
      where: { user_id: request.user.id },
      take: 5,
    });
    if (!devices.length)
      throw new ServiceUnavailableException(
        'Enable push notifications on this device first',
      );
    try {
      const result = await getMessaging(
        this.identity.adminAuth.app,
      ).sendEachForMulticast({
        tokens: devices.map((device) => device.token),
        notification: {
          title: 'Soundwave notifications',
          body: 'Notifications are connected on your device.',
        },
        data: { uid: request.user.uid },
        android: {
          priority: 'high',
          notification: { channelId: 'soundwave-alerts' },
        },
      });
      for (let index = 0; index < result.responses.length; index++) {
        if (
          result.responses[index].error?.code ===
          'messaging/registration-token-not-registered'
        )
          await this.devices.delete({
            id: devices[index].id,
            user_id: request.user.id,
          });
      }
      if (!result.successCount) throw new Error('No message accepted');
      return { accepted: result.successCount };
    } catch {
      throw new ServiceUnavailableException(
        'Push delivery is not configured. Check Firebase Cloud Messaging credentials.',
      );
    }
  }
}
