import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  imports: [WizloModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
