/**
 * Module:    Refills / Edge Cases
 * Workflow:  Reproduce REFILL_NOT_ELIGIBLE / bypassDaysOfSupply
 * File:      refill-orders/refill-orders.service.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-19
 */
import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';
import { CreateRefillDto } from './dto/create-refill.dto';

@Injectable()
export class RefillOrdersService {
  constructor(private readonly wizlo: WizloService) {}

  create(dto: CreateRefillDto) {
    const body: Record<string, unknown> = {
      patientId: dto.patientId,
      encounterTreatmentIds: dto.encounterTreatmentIds,
    };
    if (dto.bypassDaysOfSupply) body.bypassDaysOfSupply = true;

    return this.wizlo.request('/tenants/refills/staff/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}
