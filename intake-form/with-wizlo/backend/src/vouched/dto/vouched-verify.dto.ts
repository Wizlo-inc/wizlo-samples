import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CheckPriorVerificationDto {
  @IsString()
  patientId: string;
}

export class VouchedVerifyDto {
  @IsString()
  patientId: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  dob?: string;
}

export class VouchedIdvResultDto {
  @IsString()
  patientId: string;

  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  jobId?: string;
}

export interface VerificationResponse {
  verified: boolean;
  method?: 'crosscheck' | 'dob' | 'idv' | 'prior' | 'dev_bypass';
  matchRate?: number;
  requiresIdv?: boolean;
  skipped?: boolean;
  jobId?: string;
  result?: unknown;
}
