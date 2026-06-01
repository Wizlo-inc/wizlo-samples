import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the Next.js frontend to call this backend without CORS errors
  app.enableCors();

  // Automatically validate all incoming request bodies using class-validator decorators
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = process.env.PORT || 3020;
  await app.listen(port);
  console.log(`Programmatic-forms backend running on http://localhost:${port}`);
}
bootstrap();
