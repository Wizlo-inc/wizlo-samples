/**
 * Module:    Refills
 * Workflow:  Backend root module
 * File:      app.module.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-18
 */
import { Module } from '@nestjs/common';
import { EligibilityModule } from './eligibility/eligibility.module';
import { RefillOrdersModule } from './refill-orders/refill-orders.module';
import { RxSubmissionModule } from './rx-submission/rx-submission.module';

@Module({ imports: [EligibilityModule, RefillOrdersModule, RxSubmissionModule] })
export class AppModule {}
