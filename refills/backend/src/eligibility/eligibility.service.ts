/**
 * Module:    Refills
 * Workflow:  1 — Eligibility check
 * File:      eligibility/eligibility.service.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-18
 *
 * Wraps the two read-only refill eligibility endpoints:
 *   GET /tenants/refills/staff/encounters?patientId=…
 *   GET /tenants/refills/staff/encounter/{id}/treatments
 *
 * The frontend calls these to discover refillable encounters and to inspect
 * each treatment's refillInfo (remainingRefills + canRefillNow).
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
