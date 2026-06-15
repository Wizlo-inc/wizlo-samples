/**
 * Module:    Refills / Edge Cases
 * Workflow:  Backend root module
 * File:      app.module.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-19
 *
 * Mirrors the eligibility + refill-orders surface from refills/backend, because
 * both edge-case flows here (no_refills_remaining and next_refill_in_x_days) reuse
 * those same Wizlo endpoints to detect and exercise the failure mode.
 */
import { Module } from '@nestjs/common';
import { EligibilityModule } from './eligibility/eligibility.module';
import { RefillOrdersModule } from './refill-orders/refill-orders.module';

@Module({ imports: [EligibilityModule, RefillOrdersModule] })
export class AppModule {}
