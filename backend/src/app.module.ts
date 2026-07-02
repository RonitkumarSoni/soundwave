import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CatalogModule } from './catalog/catalog.module';
import { PlaylistModule } from './playlist/playlist.module';
import { StreamModule } from './stream/stream.module';
import { JamendoModule } from './jamendo/jamendo.module';

const useLocalDb = !process.env.DATABASE_URL || process.env.USE_LOCAL_DB === 'true';
const serviceName = process.env.SERVICE_NAME || 'monolith';

const coreModules = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: '.env',
  }),
  ThrottlerModule.forRoot([
    {
      ttl: 60000,
      limit: 100,
    },
  ]),
  TypeOrmModule.forRoot(
    useLocalDb
      ? {
          type: 'better-sqlite3' as any,
          database: 'soundwave-local.db',
          autoLoadEntities: true,
          synchronize: true,
        }
      : {
          type: 'postgres',
          url: process.env.DATABASE_URL,
          autoLoadEntities: true,
          synchronize: true,
          ssl: { rejectUnauthorized: false },
          retryAttempts: 2,
          retryDelay: 2000,
        },
  ),
];

const serviceModules: any[] = [];

if (serviceName === 'auth' || serviceName === 'monolith') {
  serviceModules.push(UserModule, AuthModule);
}
if (serviceName === 'catalog' || serviceName === 'monolith') {
  serviceModules.push(JamendoModule, CatalogModule, PlaylistModule);
}
if (serviceName === 'stream' || serviceName === 'monolith') {
  serviceModules.push(JamendoModule, StreamModule);
}

@Module({
  imports: [...coreModules, ...serviceModules],
  controllers: [],
  providers: [],
})
export class AppModule {}
