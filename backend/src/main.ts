import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Warn if using default JWT secret in production
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret && process.env.NODE_ENV === "production") {
    logger.error(
      "JWT_SECRET environment variable is not set! This is a critical security risk in production.",
    );
    process.exit(1);
  }
  if (!jwtSecret) {
    logger.warn(
      "JWT_SECRET not set — using dev fallback. Set JWT_SECRET in production!",
    );
  }

  const app = await NestFactory.create(AppModule);

  // Allow large image payloads (base64 homework photos can be ~500 KB)
  app.use(require("express").json({ limit: "10mb" }));
  app.use(require("express").urlencoded({ limit: "10mb", extended: true }));

  // CORS: allow specific origins in production, permissive in dev
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : undefined;

  app.enableCors({
    origin: "*",
    credentials: true,
  });

  console.log(process.env.GEMINI_API_KEY);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 3000;
  console.log(port);
  await app.listen(port);
  logger.log(`Server running on http://localhost:${port}`);
}
bootstrap();
