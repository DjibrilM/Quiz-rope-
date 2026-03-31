import { NestFactory } from '@nestjs/core';
import { AppModule } from './backend/src/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  // Get services and simulate the request
  console.log("App loaded");
  process.exit(0);
}
bootstrap();
