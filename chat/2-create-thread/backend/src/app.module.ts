import { Module } from '@nestjs/common';
import { ChatsModule } from './chats/chats.module';

@Module({ imports: [ChatsModule] })
export class AppModule {}
