import { IsString, IsNotEmpty, IsOptional, IsUrl, IsUUID, IsIn } from 'class-validator';

/** Document categories accepted by Wizlo's clients-documents upload. */
export const DOCUMENT_TYPES = [
  'intake-forms',
  'lab-results',
  'lab-reports',
  'documents',
  'photos',
  'government-ids',
  'identity-documents',
  'medical-records',
  'imaging-scans',
  'prescriptions-medication',
  'insurance-billing',
  'legal-consent',
] as const;

export class UploadFromUrlDto {
  // Path param `id` on the Wizlo endpoint — the patient (client) UUID.
  @IsUUID()
  patientId: string;

  // Path param `documentType` on the Wizlo endpoint.
  @IsIn(DOCUMENT_TYPES)
  documentType: string;

  // Body field forwarded to Wizlo.
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
