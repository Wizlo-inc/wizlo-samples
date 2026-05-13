import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';

export class CreateEncounterDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  // formIds: UUIDs of form templates — API sends invitations to patient via email/SMS
  @IsArray()
  @IsString({ each: true })
  formIds: string[];

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
