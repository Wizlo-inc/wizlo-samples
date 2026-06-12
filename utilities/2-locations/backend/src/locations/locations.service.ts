import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

@Injectable()
export class LocationsService {
  constructor(private readonly wizlo: WizloService) {}

  /** GET /countries → array of { id, name, shortName, phoneCode, ... } */
  getCountries() {
    return this.wizlo.request('/countries');
  }

  /** GET /states → array of { id, name, countryId, shortName, country: {...} } */
  getStates() {
    return this.wizlo.request('/states');
  }

  // City is intentionally not fetched: the Wizlo City entity is deprecated and
  // city is now a free-text field. The frontend captures it as plain text.
}
