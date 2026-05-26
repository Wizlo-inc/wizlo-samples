import { IsString, IsNotEmpty, IsOptional, IsArray, IsNumber, IsIn } from 'class-validator';

export class UpdateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  scheduledDay: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  scheduledTime: string; // HH:mm:ss

  @IsString()
  @IsNotEmpty()
  scheduledTimeZone: string; // IANA e.g. America/New_York

  @IsIn(['email', 'sms'])
  shareVia: 'email' | 'sms';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  formsIds?: string[];

  @IsOptional()
  @IsNumber()
  slotDurationMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}
