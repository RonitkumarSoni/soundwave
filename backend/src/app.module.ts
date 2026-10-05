import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { PlaylistModule } from './playlist/playlist.module';
import { StreamModule } from './stream/stream.module';
import { JamendoModule } from './jamendo/jamendo.module';
import { User } from './user/user.entity';
import {
  Playlist,
  PlaylistTrack,
  LikedTrack,
} from './playlist/playlist.entity';
import { ApplicationSchema1790812800000 } from './migrations/1790812800000-ApplicationSchema';
import { TestBilling1790812800001 } from './migrations/1790812800001-TestBilling';
import { PaymentOrder } from './billing/payment.entity';
import { BillingModule } from './billing/billing.module';
import { HealthController } from './health.controller';
import { DeviceToken } from './notifications/device-token.entity';
import { NotificationDevices1790812800002 } from './migrations/1790812800002-NotificationDevices';

const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});
// forRoot loads env synchronously before selecting service modules.
const serviceName = process.env.SERVICE_NAME || 'monolith';
if (!['monolith', 'gateway', 'auth', 'catalog', 'stream'].includes(serviceName))
  throw new Error('Invalid SERVICE_NAME');
const modules: any[] = [
  configModule,
  ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
];
if (serviceName !== 'gateway') {
  modules.push(
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const local =
          !config.get('DATABASE_URL') || config.get('USE_LOCAL_DB') === 'true';
        if (
          local &&
          config.get('NODE_ENV') === 'production' &&
          config.get('USE_LOCAL_DB') !== 'true'
        )
          throw new Error('DATABASE_URL is required in production');
        const common = {
          entities: [
            User,
            Playlist,
            PlaylistTrack,
            LikedTrack,
            PaymentOrder,
            DeviceToken,
          ],
          synchronize: false,
          migrations: [
            ApplicationSchema1790812800000,
            TestBilling1790812800001,
            NotificationDevices1790812800002,
          ],
          migrationsRun: true,
          retryAttempts: 2,
          retryDelay: 2000,
        };
        return local
          ? {
              ...common,
              type: 'better-sqlite3' as const,
              database: config.get<string>(
                'DATABASE_PATH',
                'soundwave-local.db',
              ),
            }
          : {
              ...common,
              type: 'postgres' as const,
              url: config.get<string>('DATABASE_URL'),
              extra: {
                max: 5,
                connectionTimeoutMillis: 10000,
                query_timeout: 10000,
              },
              ssl:
                config.get('DATABASE_SSL') === 'false'
                  ? false
                  : {
                      rejectUnauthorized: false,
                      ...(config.get('DATABASE_CA')
                        ? {
                            ca: config
                              .get<string>('DATABASE_CA')!
                              .replace(/\\n/g, '\n'),
                          }
                        : {}),
                    },
            };
      },
    }),
    AuthModule,
    BillingModule,
  );
}
if (serviceName === 'catalog' || serviceName === 'monolith')
  modules.push(JamendoModule, CatalogModule, PlaylistModule);
if (serviceName === 'stream' || serviceName === 'monolith')
  modules.push(JamendoModule, StreamModule);
@Module({
  imports: modules,
  controllers: serviceName === 'gateway' ? [] : [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
