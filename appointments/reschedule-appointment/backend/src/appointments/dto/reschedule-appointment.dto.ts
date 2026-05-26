import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsString()
  @IsNotEmpty()
  scheduledDay: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  scheduledTime: string; // HH:mm:ss

  @IsString()
  @IsNotEmpty()
  scheduledTimeZone: string; // IANA e.g. America/New_York

  // Required in wizlo-app RescheduleAppointmentDto (@IsNotEmpty @IsInt @Min(1))
  @IsInt()
  @Min(1)
  slotDurationMinutes: number;

  @IsOptional()
  @IsString()
  rescheduleReason?: string;
}
