import { Controller, Get, Patch, Body, Param, Query } from '@nestjs/common';
import { PortalService } from './portal.service';
import { ListQueryDto } from './dto/list-query.dto';
import { PscLocationsQueryDto } from './dto/psc-locations-query.dto';
import { PauseDto } from './dto/pause.dto';
import { CancelDto } from './dto/cancel.dto';
import { DelayDto } from './dto/delay.dto';
import { ScheduleLabDto } from './dto/schedule-lab.dto';

@Controller('portal')
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('psc-locations')
  getPscLocations(@Query() query: PscLocationsQueryDto) {
    return this.service.getPscLocations(query);
  }

  @Get()
  list(@Query() query: ListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.service.getById(id);
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

  @Patch(':id/schedule-lab')
  scheduleLab(@Param('id') id: string, @Body() dto: ScheduleLabDto) {
    return this.service.scheduleLab(id, dto);
  }
}
