import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Optional tracking metadata you can attach to any programmatic submission.
 * Wizlo stores this alongside the submission for audit / correlation purposes.
 */
class SubmissionMetadataDto {
  /** Label for the external system sending the submission (e.g. "PatientPortal") */
  @IsOptional() @IsString()
  source?: string;

  /** Your own reference ID to cross-reference in your system (e.g. order ID) */
  @IsOptional() @IsString()
  externalReferenceId?: string;

  /** Human-readable name of the system submitting this form */
  @IsOptional() @IsString()
  submittedBySystem?: string;
}

/**
 * Payload for POST /submission/submit
 *
 * The `structure` field must follow the exact pages → rows → fields JSON shape
 * that Wizlo expects. The easiest way to build it is to:
 *  1. Fetch GET /forms/:id/schema  → grab `payloadTemplate`
 *  2. Deep-clone the template
 *  3. Walk through every field and set `field.value = <user-entered value>`
 *  4. Send the filled structure here
 */
export class SubmitFormDto {
  /** UUID of the published form being submitted */
  @IsString()
  formId: string;

  /** UUID of the patient this submission is for */
  @IsString()
  patientId: string;

  /**
   * Filled form structure.
   * Shape: { pages: [{ id, rows: [{ id, fields: [{ name, value, ... }] }] }] }
   */
  @IsObject()
  structure: Record<string, unknown>;

  /** Optional metadata for audit trail */
  @IsOptional()
  @ValidateNested()
  @Type(() => SubmissionMetadataDto)
  metadata?: SubmissionMetadataDto;
}
