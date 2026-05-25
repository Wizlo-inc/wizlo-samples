import { Controller, Get, Post, Param } from '@nestjs/common';
import { EncountersService } from './encounters.service';

@Controller('encounters')
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.encountersService.getEncounterStatus(parseInt(id, 10));
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.encountersService.cancelEncounter(parseInt(id, 10));
  }
}
