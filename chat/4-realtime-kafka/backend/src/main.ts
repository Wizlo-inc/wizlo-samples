import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3063;
  await app.listen(port);
  console.log(`[chat-realtime-kafka] Backend running on http://localhost:${port}`);
}
bootstrap();
