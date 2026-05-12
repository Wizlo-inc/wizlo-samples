import { IsString, IsObject } from 'class-validator';

export class SubmitIntakeDto {
  @IsString()
  formId: string;

  @IsString()
  patientId: string;

  @IsObject()
  structure: Record<string, unknown>;
}
