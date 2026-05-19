/**
 * Module:    Refills / Edge Cases
 * Workflow:  Reproduce REFILL_NOT_ELIGIBLE / bypassDaysOfSupply
 * File:      refill-orders/dto/create-refill.dto.ts
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-19
 */
import { IsArray, IsBoolean, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export class CreateRefillDto {
  @IsString()
  patientId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  encounterTreatmentIds: string[];

  @IsOptional()
  @IsBoolean()
  bypassDaysOfSupply?: boolean;
}
