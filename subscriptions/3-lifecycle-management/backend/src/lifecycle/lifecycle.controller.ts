import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { PauseDto } from './dto/pause.dto';
import { CancelDto } from './dto/cancel.dto';
import { DelayDto } from './dto/delay.dto';

@Controller('subscriptions')
export class LifecycleController {
  constructor(private readonly service: LifecycleService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get()
  list(@Query() query: ListSubscriptionsQueryDto) {
    return this.service.list(query);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.service.getTimeline(id);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string, @Body() dto: PauseDto) {
    return this.service.pause(id, dto);
  }

  @Patch(':id/resume')
  resume(@Param('id') id: string) {
    return this.service.resume(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelDto) {
    return this.service.cancel(id, dto);
  }

  @Patch(':id/delay')
  delay(@Param('id') id: string, @Body() dto: DelayDto) {
    return this.service.delay(id, dto);
  }

  @Patch(':id/resubscribe')
  resubscribe(@Param('id') id: string) {
    return this.service.resubscribe(id);
  }
}
