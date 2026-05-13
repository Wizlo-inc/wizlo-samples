import { Controller, Get, Post, Put, Patch, Body, Param, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlanStatusDto } from './dto/update-plan-status.dto';
import { ListPlansQueryDto } from './dto/list-plans-query.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Get('status-counts')
  getStatusCounts() {
    return this.plansService.getStatusCounts();
  }

  @Get()
  list(@Query() query: ListPlansQueryDto) {
    return this.plansService.list(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.plansService.getById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePlanStatusDto) {
    return this.plansService.updateStatus(id, dto);
  }
}
