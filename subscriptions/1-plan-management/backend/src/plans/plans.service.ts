import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpdatePlanStatusDto } from './dto/update-plan-status.dto';
import { ListPlansQueryDto } from './dto/list-plans-query.dto';

@Injectable()
export class PlansService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreatePlanDto) {
    return this.wizlo.request('/tenants/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async list(query: ListPlansQueryDto) {
    const params = new URLSearchParams();
    if (query.filter) params.set('filter', query.filter);
    if (query.search) params.set('search', query.search);
    if (query.planCreatedFor) params.set('planCreatedFor', query.planCreatedFor);
    if (query.fulfillmentCycle) params.set('fulfillmentCycle', query.fulfillmentCycle);
    if (query.fulfillmentInterval) params.set('fulfillmentInterval', String(query.fulfillmentInterval));
    if (query.sortBy) params.set('sortBy', query.sortBy);
    if (query.sortOrder) params.set('sortOrder', query.sortOrder);
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    const qs = params.toString();
    return this.wizlo.request(`/tenants/subscription-plans${qs ? `?${qs}` : ''}`);
  }

  async getStatusCounts() {
    return this.wizlo.request('/tenants/subscription-plans/status-counts');
  }

  async getById(id: string) {
    return this.wizlo.request(`/tenants/subscription-plans/${id}`);
  }

  async update(id: string, dto: UpdatePlanDto) {
    return this.wizlo.request(`/tenants/subscription-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async updateStatus(id: string, dto: UpdatePlanStatusDto) {
    return this.wizlo.request(`/tenants/subscription-plans/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }
}
