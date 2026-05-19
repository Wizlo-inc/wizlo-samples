/**
 * Module:    Refills / Edge Cases
 * Workflow:  Edge-case detection
 * File:      eligibility/eligibility.service.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-19
 */
import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

@Injectable()
export class EligibilityService {
  constructor(private readonly wizlo: WizloService) {}

  getEligibleEncounters(patientId: string) {
    return this.wizlo.request(
      `/tenants/refills/staff/encounters?patientId=${encodeURIComponent(patientId)}`,
    );
  }

  getEncounterTreatments(encounterId: string) {
    return this.wizlo.request(
      `/tenants/refills/staff/encounter/${encodeURIComponent(encounterId)}/treatments`,
    );
  }
}
