import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import { ListPharmaciesDto } from './dto/list-pharmacies.dto';
import { UpdatePharmacyStatusDto } from './dto/update-pharmacy-status.dto';
import { UpdatePharmacyLiveDto } from './dto/update-pharmacy-live.dto';

@Controller('pharmacies')
export class PharmaciesController {
  constructor(private readonly pharmaciesService: PharmaciesService) {}

  @Get()
  list(@Query() query: ListPharmaciesDto) {
    return this.pharmaciesService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.pharmaciesService.getById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePharmacyStatusDto) {
    return this.pharmaciesService.updateStatus(id, dto);
  }

  @Patch(':id/live')
  updateLive(@Param('id') id: string, @Body() dto: UpdatePharmacyLiveDto) {
    return this.pharmaciesService.updateLive(id, dto);
  }
}
