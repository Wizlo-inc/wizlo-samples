import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { ListPharmaciesDto } from './dto/list-pharmacies.dto';
import { UpdatePharmacyStatusDto } from './dto/update-pharmacy-status.dto';
import { UpdatePharmacyLiveDto } from './dto/update-pharmacy-live.dto';

@Injectable()
export class PharmaciesService {
  constructor(private readonly wizlo: WizloService) {}

  list(query: ListPharmaciesDto) {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
    if (query.isLive !== undefined) params.set('isLive', String(query.isLive));
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString();
    return this.wizlo.request(`/tenants/pharmacies${qs ? `?${qs}` : ''}`);
  }

  getById(id: string) {
    return this.wizlo.request(`/tenants/pharmacies/${id}`);
  }

  updateStatus(id: string, dto: UpdatePharmacyStatusDto) {
    return this.wizlo.request(`/tenants/pharmacies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  updateLive(id: string, dto: UpdatePharmacyLiveDto) {
    return this.wizlo.request(`/tenants/pharmacies/${id}/live`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }
}
