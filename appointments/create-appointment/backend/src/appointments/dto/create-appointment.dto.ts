import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsIn(['card', 'cash', 'bank'])
  methodType: 'card' | 'cash' | 'bank';

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  userPaymentMethodId?: string;

  @IsOptional()
  @IsString()
  securityCode?: string;

  @IsOptional()
  @IsString()
  checkoutSessionId?: string;

  @IsOptional()
  @IsBoolean()
  shouldStore?: boolean;
}

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  clinicId: string;

  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsIn(['INPERSON', 'ENCOUNTER'])
  careType: 'INPERSON' | 'ENCOUNTER';

  @IsArray()
  @IsString({ each: true })
  treatmentIds: string[];

  @IsIn(['EMAIL', 'SMS', 'EMAILSMS'])
  shareVia: 'EMAIL' | 'SMS' | 'EMAILSMS';

  @IsString()
  @IsNotEmpty()
  scheduledDay: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  scheduledTime: string; // HH:mm:ss

  @IsString()
  @IsNotEmpty()
  scheduledTimeZone: string; // IANA e.g. America/New_York

  @IsOptional()
  @IsNumber()
  slotDurationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formsIds?: string[];

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsBoolean()
  shouldCreateEncounter?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsIn(['full_payment', 'split_payment', 'partial_payment'])
  paymentType?: 'full_payment' | 'split_payment' | 'partial_payment';

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTransactionDto)
  transaction?: CreateTransactionDto;
}
