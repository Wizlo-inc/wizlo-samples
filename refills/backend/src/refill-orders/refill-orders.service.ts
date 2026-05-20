/**
 * Module:    Refills
 * Workflow:  2 — Create refill order
 * File:      refill-orders/refill-orders.service.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 *
 * Wraps POST /tenants/refills/staff/create — the only write endpoint in the
 * refill workflow. The medication, drug strength, quantity, and directions are
 * inherited from the original encounter; the API accepts only treatment IDs.
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

  getOrder(orderId: string) {
    return this.wizlo.request(`/tenants/orders/${encodeURIComponent(orderId)}`);
  }
}
