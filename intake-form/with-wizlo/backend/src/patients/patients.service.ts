import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly wizlo: WizloService) {}

  private normalizeId(client: Record<string, unknown>): Record<string, unknown> {
    // Wizlo returns the patient ID as `user_id`
    const id = client.user_id ?? client.id ?? client.clientId ?? client.patientId ?? client._id;
    return { ...client, id };
  }

  async findAll(email?: string) {
    const qs = email ? `?email=${encodeURIComponent(email)}` : '?page=1&limit=20';
    const response = await this.wizlo.request<unknown>(`/clients${qs}`);
    console.log('[PatientsService.findAll] raw Wizlo response:', JSON.stringify(response));
    const clients = Array.isArray(response)
      ? response
      : ((response as Record<string, unknown>)?.data as unknown[]) ?? [];
    return (clients as Record<string, unknown>[]).map(c => this.normalizeId(c));
  }

  async create(dto: CreatePatientDto) {
    const response = await this.wizlo.request<Record<string, unknown>>('/clients', {
      method: 'POST',
      body: JSON.stringify({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      }),
    });
    console.log('[PatientsService.create] raw Wizlo response:', JSON.stringify(response));
    return this.normalizeId(response);
  }

  async update(id: string, dto: UpdatePatientDto) {
    const response = await this.wizlo.request<Record<string, unknown>>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    return this.normalizeId(response);
  }
}
