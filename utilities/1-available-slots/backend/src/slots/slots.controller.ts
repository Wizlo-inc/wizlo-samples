import { Controller, Get, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';

@Controller('available-slots')
export class SlotsController {
  constructor(private readonly service: SlotsService) {}

  /**
   * GET /available-slots?type=provider&patientEmail=&encounterId=&date=
   * GET /available-slots?type=lab&patientEmail=&zipCode=&lab=&radius=&startDate=
   *
   * One endpoint, two slot types — mirrors the ticket's
   * get-provider-slots / get-lab-slots split via the `type` discriminator.
   */
  @Get()
  get(@Query() query: AvailableSlotsQueryDto) {
    return query.type === 'provider'
      ? this.service.getProviderSlots(query)
      : this.service.getLabSlots(query);
  }
}
