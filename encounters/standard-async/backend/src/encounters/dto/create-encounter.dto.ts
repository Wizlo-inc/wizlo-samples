import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateEncounterDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsArray()
  @IsString({ each: true })
  formIds!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  treatmentIds?: string[];

  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
