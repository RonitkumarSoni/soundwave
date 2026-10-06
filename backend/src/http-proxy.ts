import type { NestExpressApplication } from '@nestjs/platform-express';

export function configureProxy(app: NestExpressApplication, render: boolean) {
  // Only the nearest hosting proxy can set the client address used by throttling.
  app.set('trust proxy', render ? 1 : 'loopback');
}
