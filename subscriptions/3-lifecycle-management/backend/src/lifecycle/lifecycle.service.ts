import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { ListSubscriptionsQueryDto } from './dto/list-subscriptions-query.dto';
import { PauseDto } from './dto/pause.dto';
import { CancelDto } from './dto/cancel.dto';
import { DelayDto } from './dto/delay.dto';

@Injectable()
export class LifecycleService {
  constructor(private readonly wizlo: WizloService) {}

  async getStats() {
    return this.wizlo.request('/tenants/client-subscriptions/stats');
  }

  async list(query: ListSubscriptionsQueryDto) {
    const params = new URLSearchParams();
    if (query.patientId) params.set('patientId', query.patientId);
    if (query.status) params.set('status', query.status);
    if (query.search) params.set('search', query.search);
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.wizlo.request(`/tenants/client-subscriptions${qs ? `?${qs}` : ''}`);
  }

  async getTimeline(id: string) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/timeline`);
  }

  async pause(id: string, dto: PauseDto) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/pause`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async resume(id: string) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/resume`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  }

  async cancel(id: string, dto: CancelDto) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async delay(id: string, dto: DelayDto) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/delay`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async resubscribe(id: string) {
    return this.wizlo.request(`/tenants/client-subscriptions/${id}/resubscribe`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  }
}
