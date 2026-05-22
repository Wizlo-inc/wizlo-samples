import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';

@Injectable()
export class EncountersService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreateEncounterDto) {
    const defaultDay = new Date();
    defaultDay.setDate(defaultDay.getDate() + 7);
    const scheduledDay = dto.scheduledDay || defaultDay.toISOString().split('T')[0];
    const scheduledTime = dto.scheduledTime || '09:00:00';

    return this.wizlo.request('/encounters', {
      method: 'POST',
      body: JSON.stringify({
        clinicId: process.env.WIZLO_CLINIC_ID,
        patientId: dto.patientId,
        reviewType: 'synchronous',
        serviceQueue: 'internal_staff',
        reviewerId: process.env.WIZLO_REVIEWER_ID,
        pharmacyId: process.env.WIZLO_PHARMACY_ID,
        treatmentIds: dto.treatmentIds || [],
        additionalNotes: dto.additionalNotes || '',
        documentIds: [],
        formIds: dto.formIds,
        scheduledDay,
        scheduledTime,
        scheduledTimeZone: 'America/Los_Angeles',
        slotDurationMinutes: 30,
        source: 'FORMS',
        isCommissionWaived: false,
        // Order will NOT be auto-created — create it manually via POST /encounters/:id/orders
        skipOrderCreation: true,
        isHrtTrtEncounter: false,
        allowUnassignedOnFailure: true,
        skipAppointmentCreation: false,
      }),
    });
  }
}
