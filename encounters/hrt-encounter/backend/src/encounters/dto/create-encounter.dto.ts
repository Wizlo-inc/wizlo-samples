import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateEncounterDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsArray()
  @IsString({ each: true })
  formIds!: string[];

  // treatmentIds is optional for HRT encounters
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
