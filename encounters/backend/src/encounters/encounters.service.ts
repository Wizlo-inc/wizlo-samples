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
        clinicId: process.env.WIZLO_CLINIC_ID || '1d836ade-bb7e-47a5-9f4a-d2c45ad8dad6',
        reviewType: 'synchronous',
        serviceQueue: 'internal_staff',
        patientId: dto.patientId,
        reviewerId: process.env.WIZLO_REVIEWER_ID || '3a620f69-fa01-4c3d-b963-f945a91acb3c',
        pharmacyId: process.env.WIZLO_PHARMACY_ID || '51ddaed0-69d2-4ad2-a474-19d2d90e8ac6',
        treatmentIds: dto.treatmentIds || [],
        additionalNotes: dto.additionalNotes || '',
        documentIds: [],
        formIds: dto.formIds || [],
        scheduledDay,
        scheduledTime,
        scheduledTimeZone: 'America/Los_Angeles',
        slotDurationMinutes: 30,
        source: 'FORMS',
        isCommissionWaived: false,
        skipOrderCreation: false,
        isHrtTrtEncounter: false,
        allowUnassignedOnFailure: true,
        skipAppointmentCreation: false,
      }),
    });
  }
}
