import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { configureProxy } from './http-proxy';

@Controller('profile')
class ProfileController {
  @Get()
  get() {
    return { ok: true };
  }
}
describe('rate limiting behind the hosting proxy', () => {
  let app: NestExpressApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 2 }])],
      controllers: [ProfileController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureProxy(app, true);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  it('isolates clients and ignores forged addresses before the trusted hop', async () => {
    const server = app.getHttpServer() as import('node:http').Server;
    await request(server)
      .get('/profile')
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(200);
    await request(server)
      .get('/profile')
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(200);
    const blocked = await request(server)
      .get('/profile')
      .set('X-Forwarded-For', '198.51.100.99, 203.0.113.1')
      .expect(429);
    expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
    await request(server)
      .get('/profile')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(200);
  });
});
