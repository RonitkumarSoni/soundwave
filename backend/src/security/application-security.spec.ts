import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import type { Server } from 'node:http';
import type { AppModule as ApplicationModule } from '../app.module';
import { FirebaseIdentityService } from '../auth/firebase-identity.service';
import { YoutubeService } from '../catalog/youtube.service';

jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(() => []),
  initializeApp: jest.fn(),
  cert: jest.fn(),
  applicationDefault: jest.fn(),
}));

describe('authenticated application boundaries', () => {
  let app: INestApplication<Server>;
  let playlistId: string;
  beforeAll(async () => {
    process.env.DATABASE_PATH = ':memory:';
    process.env.USE_LOCAL_DB = 'true';
    process.env.SERVICE_NAME = 'monolith';
    process.env.NODE_ENV = 'test';
    // Load configuration only after setting the isolated test environment.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppModule } = require('../app.module') as {
      AppModule: typeof ApplicationModule;
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(YoutubeService)
      .useValue({})
      .overrideProvider(FirebaseIdentityService)
      .useValue({
        verify: (token: string) => {
          if (!['alice', 'bob'].includes(token))
            throw new UnauthorizedException();
          return {
            uid: token,
            email: token + '@example.test',
            email_verified: true,
            auth_time: Math.floor(Date.now() / 1000),
            firebase: { sign_in_provider: 'password' },
          };
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });
  it('rejects an unauthenticated profile read', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });
  it('rejects protected user field assignment and excludes password hash', async () => {
    await request(app.getHttpServer())
      .put('/api/users/me')
      .set('Authorization', 'Bearer alice')
      .send({ is_premium: true })
      .expect(400);
    const response = await request(app.getHttpServer())
      .put('/api/users/me')
      .set('Authorization', 'Bearer alice')
      .send({ display_name: 'Alice' })
      .expect(200);
    expect((response.body as { display_name: string }).display_name).toBe(
      'Alice',
    );
    expect((response.body as { is_premium: boolean }).is_premium).toBe(false);
    expect(response.body).not.toHaveProperty('password_hash');
    expect(response.body).not.toHaveProperty('firebase_uid');
  });
  it('creates and renames the owner playlist', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/playlists')
      .set('Authorization', 'Bearer alice')
      .send({ title: 'My mix' })
      .expect(201);
    playlistId = (created.body as { id: string }).id;
    const edited = await request(app.getHttpServer())
      .patch('/api/playlists/' + playlistId)
      .set('Authorization', 'Bearer alice')
      .send({ title: 'Renamed' })
      .expect(200);
    expect((edited.body as { title: string }).title).toBe('Renamed');
  });
  it('prevents another account from modifying a playlist', async () => {
    const url = '/api/playlists/' + playlistId;
    await request(app.getHttpServer())
      .post(url + '/tracks')
      .set('Authorization', 'Bearer bob')
      .send({ track_id: 'video1', source: 'youtube' })
      .expect(404);
    await request(app.getHttpServer())
      .delete(url + '/tracks/video1')
      .set('Authorization', 'Bearer bob')
      .expect(404);
    await request(app.getHttpServer())
      .patch(url)
      .set('Authorization', 'Bearer bob')
      .send({ title: 'Stolen' })
      .expect(404);
    await request(app.getHttpServer())
      .get(url)
      .set('Authorization', 'Bearer bob')
      .expect(404);
  });
  it('preserves provider identity in playlist data', async () => {
    await request(app.getHttpServer())
      .post('/api/playlists/' + playlistId + '/tracks')
      .set('Authorization', 'Bearer alice')
      .send({
        track_id: 'video1',
        source: 'youtube',
        track: {
          name: 'Example',
          artist_name: 'Artist',
          audio: 'https://example.test/audio',
          duration: 120,
        },
      })
      .expect(201);
    const response = await request(app.getHttpServer())
      .get('/api/playlists/' + playlistId)
      .set('Authorization', 'Bearer alice')
      .expect(200);
    expect((response.body as { tracks: unknown[] }).tracks[0]).toMatchObject({
      id: 'video1',
      source: 'youtube',
      name: 'Example',
    });
  });
  it('routes likes before dynamic IDs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/playlists/likes')
      .set('Authorization', 'Bearer alice')
      .expect(200);
    expect(response.body).toEqual([]);
  });
  it('denies downloads to nonpremium accounts', async () => {
    await request(app.getHttpServer())
      .get('/api/catalog/download?audioUrl=https://aac.saavncdn.com/file.mp4')
      .set('Authorization', 'Bearer alice')
      .expect(403);
  });
  it('enforces the configured rate limit', async () => {
    let status = 0;
    for (let index = 0; index < 101; index++) {
      status = (await request(app.getHttpServer()).get('/api/users/me')).status;
      if (status === 429) break;
    }
    expect(status).toBe(429);
  });
});
