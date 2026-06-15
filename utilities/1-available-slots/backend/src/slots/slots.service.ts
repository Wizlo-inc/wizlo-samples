import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';

@Injectable()
export class SlotsService {
  constructor(private readonly wizlo: WizloService) {}

  /**
   * type=provider — telehealth/provider-network availability for an encounter.
   *
   * Wizlo: GET /appointments/encounter/:encounterId/available-slots?date=YYYY-MM-DD
   * Returns a 7-day window keyed by date:
   *   { encounterId, timezone, slots: { "2026-06-10": [{ start, end, timezone }] } }
   *
   * Used before scheduling a SYNC encounter — pick a slot here, then pass the
   * chosen day/time into POST /appointments/encounter/schedule (or the
   * scheduledDay/scheduledTime fields of POST /encounters).
   */
  async getProviderSlots(query: AvailableSlotsQueryDto) {
    // Wizlo requires `date` (YYYY-MM-DD). Default to today when the caller omits
    // it so the request is always valid; the API returns a 7-day window from it.
    const date = query.date || new Date().toISOString().split('T')[0];
    const endpoint =
      `/appointments/encounter/${encodeURIComponent(query.encounterId)}/available-slots` +
      `?date=${encodeURIComponent(date)}`;
    return this.wizlo.requestAsUser(query.patientEmail, endpoint);
  }

  /**
   * type=lab — PSC (patient service center) walk-in lab availability near a ZIP.
   *
   * Wizlo: GET /tenants/patient-subscriptions/psc-locations?zipCode=&lab=&radius=&startDate=
   * Returns availability grouped by date + location:
   *   { availability: [{ date, location: { code, name, address, ... },
   *       slots: [{ bookingKey, startTime, endTime, price, availableCount }] }], timezone }
   *
   * Used during subscription enrollment (lab variants) while the subscription
   * is in PENDING_LAB_SCHEDULING — pick a slot's bookingKey, then book via
   * PATCH /tenants/patient-subscriptions/:id/schedule-lab.
   */
  async getLabSlots(query: AvailableSlotsQueryDto) {
    const params = new URLSearchParams();
    params.set('zipCode', query.zipCode);
    if (query.lab) params.set('lab', query.lab);
    if (query.radius) params.set('radius', query.radius);
    if (query.startDate) params.set('startDate', query.startDate);
    return this.wizlo.requestAsUser(
      query.patientEmail,
      `/tenants/patient-subscriptions/psc-locations?${params.toString()}`,
    );
  }
}
