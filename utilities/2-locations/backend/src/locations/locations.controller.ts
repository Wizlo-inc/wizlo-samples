import { Controller, Get, Param, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CitiesQueryDto } from './dto/cities-query.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly service: LocationsService) {}

  // GET /locations/countries  → Wizlo GET /countries
  @Get('countries')
  getCountries() {
    return this.service.getCountries();
  }

  // GET /locations/states  → Wizlo GET /states
  @Get('states')
  getStates() {
    return this.service.getStates();
  }

  // GET /locations/cities/:stateId?search=  → Wizlo GET /cities/state/:stateId/search
  @Get('cities/:stateId')
  getCities(@Param('stateId') stateId: string, @Query() query: CitiesQueryDto) {
    return this.service.getCitiesByState(stateId, query);
  }
}
