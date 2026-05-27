import { Controller, Post, Get, Delete, Body, Headers, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhook')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post('receive')
  @HttpCode(200)
  receive(@Body() body: any, @Headers() headers: Record<string, string>) {
    return this.service.handleEvent(body, headers);
  }

  @Get('events')
  getEvents() {
    return this.service.getEvents();
  }

  @Delete('events')
  clearEvents() {
    return this.service.clearEvents();
  }

  @Post('register')
  register(@Body() body: { url: string; secret?: string }) {
    return this.service.register(body.url, body.secret);
  }
}
