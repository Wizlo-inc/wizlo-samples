/**
 * Module:    Refills
 * Workflow:  1 — Eligibility check
 * File:      eligibility/eligibility.module.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 */
import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { EligibilityController } from './eligibility.controller';
import { EligibilityService } from './eligibility.service';

@Module({
  imports: [WizloModule],
  controllers: [EligibilityController],
  providers: [EligibilityService],
})
export class EligibilityModule {}
