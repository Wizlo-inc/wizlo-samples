import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CitiesQueryDto } from './dto/cities-query.dto';

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

  /**
   * Cities by state.
   * GET /cities/state/:stateId/search?search=&id=
   * Returns an array of { id, name, stateId, ... } (capped at 20 for performance).
   */
  getCitiesByState(stateId: string, query: CitiesQueryDto) {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.id) params.set('id', query.id);
    const qs = params.toString();
    return this.wizlo.request(
      `/cities/state/${encodeURIComponent(stateId)}/search${qs ? `?${qs}` : ''}`,
    );
  }
}
