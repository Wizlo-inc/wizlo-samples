import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get(':encounterId/messages')
  getMessages(
    @Param('encounterId') encounterId: string,
    @Query('patientEmail') patientEmail: string,
  ) {
    return this.chatsService.getMessages(encounterId, patientEmail);
  }

  @Post(':encounterId/messages')
  sendMessage(
    @Param('encounterId') encounterId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(encounterId, dto);
  }
}
