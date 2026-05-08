import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateEncounterDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  treatmentIds?: string[];

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @IsString()
  scheduledDay?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}
