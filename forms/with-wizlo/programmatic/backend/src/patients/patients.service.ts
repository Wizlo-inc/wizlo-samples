import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/create-patient.dto';

/**
 * PatientsService — thin proxy over the Wizlo /clients API.
 *
 * Wizlo stores patients as "clients". We wrap those endpoints here
 * and normalise the response so the frontend always gets a consistent `id` field
 * (Wizlo may return it as user_id, clientId, _id depending on the endpoint version).
 */
@Injectable()
export class PatientsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * Normalise different Wizlo ID field names to a single `id` key
   * so the frontend can always use `patient.id`.
   */
  private normalizeId(client: Record<string, unknown>): Record<string, unknown> {
    const id = client.user_id ?? client.id ?? client.clientId ?? client.patientId ?? client._id;
    return { ...client, id };
  }

  /**
   * GET /clients  — list patients, optionally filtered by email.
   *
   * When email is provided Wizlo performs an exact-match lookup.
   * Without email it returns the first page (up to 20) of all patients.
   */
  async findAll(email?: string) {
    const qs = email ? `?email=${encodeURIComponent(email)}` : '?page=1&limit=20';
    const response = await this.wizlo.request<unknown>(`/clients${qs}`);
    const clients = Array.isArray(response)
      ? response
      : ((response as Record<string, unknown>)?.data as unknown[]) ?? [];
    return (clients as Record<string, unknown>[]).map(c => this.normalizeId(c));
  }

  /**
   * POST /clients — create a new patient.
   *
   * Wizlo requires firstName, lastName, and email at minimum.
   */
  async create(dto: CreatePatientDto) {
    const response = await this.wizlo.request<Record<string, unknown>>('/clients', {
      method: 'POST',
      body: JSON.stringify({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      }),
    });
    return this.normalizeId(response);
  }

  /**
   * PUT /clients/:id — update an existing patient's fields.
   */
  async update(id: string, dto: UpdatePatientDto) {
    const response = await this.wizlo.request<Record<string, unknown>>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    return this.normalizeId(response);
  }
}
