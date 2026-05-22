import { IsString, IsOptional, IsArray, IsIn, IsNotEmpty } from 'class-validator';

export type EncounterScenario =
  | 'standard-sync'
  | 'standard-async'
  | 'hrt'
  | 'provider-network'
  | 'with-forms'
  | 'skip-order';

export class CreateEncounterDto {
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsIn(['standard-sync', 'standard-async', 'hrt', 'provider-network', 'with-forms', 'skip-order'])
  scenario: EncounterScenario;

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

  @IsOptional()
  @IsString()
  providerNetworkTenantId?: string;
}
