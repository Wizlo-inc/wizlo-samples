import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { ListQueryDto } from './dto/list-query.dto';
import { PscLocationsQueryDto } from './dto/psc-locations-query.dto';
import { PauseDto } from './dto/pause.dto';
import { CancelDto } from './dto/cancel.dto';
import { DelayDto } from './dto/delay.dto';
import { ScheduleLabDto } from './dto/schedule-lab.dto';

@Injectable()
export class PortalService {
  constructor(private readonly wizlo: WizloService) {}

  async getStats() {
    return this.wizlo.request('/tenants/patient-subscriptions/stats');
  }

  async getPscLocations(query: PscLocationsQueryDto) {
    const params = new URLSearchParams({ zipCode: query.zipCode });
    if (query.radius) params.set('radius', String(query.radius));
    return this.wizlo.request(`/tenants/patient-subscriptions/psc-locations?${params.toString()}`);
  }

  async list(query: ListQueryDto) {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.wizlo.request(`/tenants/patient-subscriptions${qs ? `?${qs}` : ''}`);
  }

  async getById(id: string) {
    return this.wizlo.request(`/tenants/patient-subscriptions/${id}`);
  }

  async pause(id: string, dto: PauseDto) {
    return this.wizlo.request(`/tenants/patient-subscriptions/${id}/pause`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async resume(id: string) {
    return this.wizlo.request(`/tenants/patient-subscriptions/${id}/resume`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  }

  async cancel(id: string, dto: CancelDto) {
    return this.wizlo.request(`/tenants/patient-subscriptions/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async delay(id: string, dto: DelayDto) {
    return this.wizlo.request(`/tenants/patient-subscriptions/${id}/delay`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async scheduleLab(id: string, dto: ScheduleLabDto) {
    return this.wizlo.request(`/tenants/patient-subscriptions/${id}/schedule-lab`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }
}
