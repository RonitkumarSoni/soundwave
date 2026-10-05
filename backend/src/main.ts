import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import type { IncomingMessage } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const serviceName = process.env.SERVICE_NAME || 'monolith';

  // CORS
  if (serviceName === 'gateway' || serviceName === 'monolith') {
    // Enable CORS only on the edge service to prevent duplicate headers
    app.enableCors({
      origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : false,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: false,
    });
  }

  // When deployed, use the PORT env variable provided by the host (e.g. Render)
  let port = process.env.PORT ? Number(process.env.PORT) : 3001;
  if (!process.env.PORT) {
    if (serviceName === 'auth') port = 3002;
    else if (serviceName === 'catalog') port = 3003;
    else if (serviceName === 'stream') port = 3004;
    else if (serviceName === 'gateway') port = 3001;
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  if (serviceName !== 'gateway') {
    app.setGlobalPrefix('api');
  }

  if (serviceName === 'gateway') {
    const proxyOptions = (port: number): Options => ({
      target: `http://localhost:${port}`,
      changeOrigin: true,
      pathRewrite: (
        path: string,
        req: IncomingMessage & { originalUrl?: string },
      ) => req.originalUrl || path,
    });

    app.use('/api/auth', createProxyMiddleware(proxyOptions(3002)));
    app.use('/api/billing', createProxyMiddleware(proxyOptions(3002)));
    app.use('/api/users', createProxyMiddleware(proxyOptions(3002)));
    app.use('/api/youtube', createProxyMiddleware(proxyOptions(3003)));
    app.use('/api/catalog', createProxyMiddleware(proxyOptions(3003)));
    app.use('/api/playlists', createProxyMiddleware(proxyOptions(3003)));
    app.use('/api/stream', createProxyMiddleware(proxyOptions(3004)));
  }

  // Bind to 0.0.0.0 to ensure it's accessible externally (required by Render and Docker)
  console.log(`Starting HTTP listener on 0.0.0.0:${port}`);
  await app.listen(port, '0.0.0.0');
  console.log(
    `🚀 Soundwave ${serviceName.toUpperCase()} Service API running on http://0.0.0.0:${port}`,
  );
}
void bootstrap().catch((error: unknown) => {
  console.error('Backend startup failed:', error);
  process.exitCode = 1;
});
