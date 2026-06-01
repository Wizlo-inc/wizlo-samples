import { Controller, Get, Query } from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ChatsService } from './chats.service';
import { ListThreadsQueryDto } from './dto/list-threads-query.dto';

class UserEmailQueryDto {
  @IsNotEmpty()
  @IsEmail()
  userEmail!: string;
}

@Controller('chats/provider-network')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get('chats-list')
  listChats(@Query() query: ListThreadsQueryDto) {
    return this.chatsService.listProviderNetworkChats(query);
  }

  @Get('unread-encounters')
  unreadEncounters(@Query() query: UserEmailQueryDto) {
    return this.chatsService.getProviderNetworkUnreadEncounters(query.userEmail);
  }
}
