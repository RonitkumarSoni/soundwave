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
      origin: true,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  }

  let port = 3001;
  if (serviceName === 'auth') port = 3002;
  else if (serviceName === 'catalog') port = 3003;
  else if (serviceName === 'stream') port = 3004;
  else if (serviceName === 'gateway') port = 3001;

  if (serviceName !== 'gateway') {
    app.setGlobalPrefix('api');
  }

  if (serviceName === 'gateway') {
    const { createProxyMiddleware } = require('http-proxy-middleware');
    const proxyOptions = (port: number) => ({
      target: `http://localhost:${port}`,
      changeOrigin: true,
      pathRewrite: (path: string, req: any) => req.originalUrl,
    });
    
    app.use('/api/auth', createProxyMiddleware(proxyOptions(3002)));
    app.use('/api/users', createProxyMiddleware(proxyOptions(3002)));
    app.use('/api/catalog', createProxyMiddleware(proxyOptions(3003)));
    app.use('/api/playlists', createProxyMiddleware(proxyOptions(3003)));
    app.use('/api/stream', createProxyMiddleware(proxyOptions(3004)));
  }

  await app.listen(port);
  console.log(`🚀 Soundwave ${serviceName.toUpperCase()} Service API running on http://localhost:${port}`);
}
bootstrap();
