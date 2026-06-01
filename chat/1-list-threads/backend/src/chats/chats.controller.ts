import { Controller, Get, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('threads')
  listThreads(@Query() query: ListThreadsQueryDto) {
    return this.chatsService.listThreads(query);
  }
}
