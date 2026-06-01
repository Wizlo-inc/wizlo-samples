import { Controller, Post, Body } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateThreadDto } from './dto/create-thread.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('threads')
  createThread(@Body() dto: CreateThreadDto) {
    return this.chatsService.createThread(dto);
  }
}
