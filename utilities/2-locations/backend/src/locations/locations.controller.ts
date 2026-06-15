import { Controller, Get } from '@nestjs/common';
import { LocationsService } from './locations.service';

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

  // NOTE: There is intentionally no "cities" route. The Wizlo City entity is
  // deprecated — city is now a free-text field. The legacy lookup endpoints
  // (GET /cities/..., GET /states/:id/cities) are kept only for backwards
  // compatibility and the latter returns 410 Gone. New integrations capture
  // city as plain text (see the frontend's free-text City input).
}
