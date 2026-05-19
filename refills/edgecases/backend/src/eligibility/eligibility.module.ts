/**
 * Module:    Refills / Edge Cases
 * Workflow:  Edge-case detection
 * File:      eligibility/eligibility.module.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-19
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
