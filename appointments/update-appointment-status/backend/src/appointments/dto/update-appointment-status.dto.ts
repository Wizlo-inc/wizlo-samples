import { IsEnum, IsNotEmpty } from 'class-validator';

// checked_out does not exist — use in_progress instead (wizlo-app FeToApiAppointmentStatusMap)
export enum AppointmentStatus {
  CHECKED_IN  = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED   = 'completed',
  CANCELLED   = 'cancelled',
  NO_SHOW     = 'no_show',
}

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatus)
  @IsNotEmpty()
  status: AppointmentStatus;
}
