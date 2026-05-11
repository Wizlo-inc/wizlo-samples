import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';

@Injectable()
export class EncountersService {
  constructor(private readonly wizlo: WizloService) {}

  async create(dto: CreateEncounterDto) {
    return this.wizlo.request('/encounters', {
      method: 'POST',
      body: JSON.stringify({
        clinicId: process.env.WIZLO_CLINIC_ID,
        patientId: dto.patientId,
        reviewType: 'asynchronous',
        serviceQueue: 'provider_network',
        providerNetworkTenantId: dto.providerNetworkTenantId || process.env.WIZLO_PROVIDER_NETWORK_TENANT_ID,
        pharmacyId: process.env.WIZLO_PHARMACY_ID,
        treatmentIds: dto.treatmentIds || [],
        additionalNotes: dto.additionalNotes || '',
        documentIds: [],
        formIds: dto.formIds,
        source: 'FORMS',
        isCommissionWaived: false,
        skipOrderCreation: false,
        isHrtTrtEncounter: false,
        allowUnassignedOnFailure: true,
        skipAppointmentCreation: true,
      }),
    });
  }
}
