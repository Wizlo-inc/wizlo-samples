/**
 * Module:    Refills
 * Workflow:  3 — Rx submission
 * File:      rx-submission/rx-submission.service.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 *
 * Wraps the two endpoints required to transmit a refill prescription to the
 * pharmacy:
 *
 *   1. POST /tenants/orders/bulk/mark-paid        ← required precondition
 *   2. POST /rx/orders/{orderId}/submit-refill-rx ← actual transmission
 *
 * In production, mark-paid is replaced by your real payment flow. We expose it
 * directly here so the sample is self-contained and shows the constraint
 * (the rx submission endpoint refuses to transmit unpaid orders).
 */
import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

@Injectable()
export class RxSubmissionService {
  constructor(private readonly wizlo: WizloService) {}

  markOrdersPaid(orderIds: string[]) {
    return this.wizlo.request('/tenants/orders/bulk/mark-paid', {
      method: 'POST',
      body: JSON.stringify({ orderIds }),
    });
  }

  submitRefillRx(orderId: string) {
    return this.wizlo.request(`/rx/orders/${encodeURIComponent(orderId)}/submit-refill-rx`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }
}
