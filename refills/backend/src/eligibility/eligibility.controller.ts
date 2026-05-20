/**
 * Module:    Refills
 * Workflow:  1 — Eligibility check
 * File:      eligibility/eligibility.controller.ts
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 */
import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { EligibilityService } from './eligibility.service';

@Controller('eligibility')
export class EligibilityController {
  constructor(private readonly eligibility: EligibilityService) {}

  @Get('encounters')
  getEncounters(@Query('patientId') patientId: string) {
    if (!patientId) throw new BadRequestException('patientId query param is required');
    return this.eligibility.getEligibleEncounters(patientId);
  }

  @Get('encounter/:id/treatments')
  getEncounterTreatments(@Param('id') id: string) {
    return this.eligibility.getEncounterTreatments(id);
  }
}
