import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Warn if using default JWT secret in production
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret && process.env.NODE_ENV === 'production') {
    logger.error(
      'JWT_SECRET environment variable is not set! This is a critical security risk in production.',
    );
    process.exit(1);
  }
  if (!jwtSecret) {
    logger.warn(
      'JWT_SECRET not set — using dev fallback. Set JWT_SECRET in production!',
    );
  }

  const app = await NestFactory.create(AppModule);

  // CORS: allow specific origins in production, permissive in dev
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : undefined;

  app.enableCors({
    origin: allowedOrigins || (process.env.NODE_ENV === 'production' ? false : true),
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
}
bootstrap();
