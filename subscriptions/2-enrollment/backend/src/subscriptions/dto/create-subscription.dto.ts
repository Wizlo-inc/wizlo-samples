import { IsUUID, IsString, IsOptional, IsDateString, IsNumber, IsBoolean, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubscriptionDto {
  @IsUUID()
  patientId: string;

  @IsString()
  subscriptionPlanId: string;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  duration?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];

  @IsOptional()
  @IsUUID()
  formSubmissionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labUploadDocumentIds?: string[];

  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @IsOptional()
  @IsBoolean()
  deferEncounterCreation?: boolean;
}
